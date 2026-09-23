const assetBase = window.CMDTREEMAP_BASE || './';
const root = document.querySelector('#cmdtreemap-root');

if (!root) {
  throw new Error('cmdtreemap mount point not found');
}

root.classList.add('cmdtreemap-app');
root.innerHTML = `
  <p class="cmdtreemap-status" data-status>데이터를 불러오는 중...</p>
  <input class="cmdtreemap-search" data-search type="search" placeholder="도구, 관계, 문제를 검색..." autocomplete="off">
  <div class="cmdtreemap-layout">
    <nav class="cmdtreemap-tree" data-tree aria-label="명령어 관계 tree"></nav>
    <article class="cmdtreemap-detail" data-detail aria-live="polite" hidden></article>
  </div>`;

const state = { data: null, query: '', selected: null };
const tree = root.querySelector('[data-tree]');
const detail = root.querySelector('[data-detail]');
const search = root.querySelector('[data-search]');
const status = root.querySelector('[data-status]');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function improvementSummary(solution = '') {
  const summary = [...solution.split(',').map(part => part.trim()).filter(Boolean).slice(0, 2).join(' · ')];
  return summary.length > 48 ? summary.slice(0, 48).join('') + '…' : summary.join('');
}

function matches(relation) {
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return [relation.from, relation.to, relation.group, relation.why, relation.problem, relation.solution]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
}

// Keep an edge's identity even when several tools lead to the same destination.
// Repeated tools terminate a path, so cycles remain visible without recursion loops.
function buildCategoryForest(category) {
  const outgoing = new Map();
  const incoming = new Set();
  category.relations.forEach((relation, index) => {
    if (!outgoing.has(relation.from)) outgoing.set(relation.from, []);
    outgoing.get(relation.from).push(index);
    incoming.add(relation.to);
  });
  const visited = new Set();
  function expand(name, path) {
    return (outgoing.get(name) || []).map((relationIndex) => {
      visited.add(relationIndex);
      const relation = category.relations[relationIndex];
      const cycle = path.has(relation.to);
      return {
        name: relation.to, relationIndex, cycle,
        children: cycle ? [] : expand(relation.to, new Set([...path, relation.to])),
      };
    });
  }
  const roots = [];
  function addRoot(name) {
    roots.push({ name, children: expand(name, new Set([name])) });
  }
  for (const name of outgoing.keys()) {
    if (!incoming.has(name)) addRoot(name);
  }
  // A disconnected cycle has no natural root; start at its first source.
  category.relations.forEach((relation, index) => {
    if (!visited.has(index)) addRoot(relation.from);
  });
  return roots;
}

function renderTree() {
  if (!state.data) return;

  const expanded = state.query.trim() ? ' open' : '';
  const categories = state.data.categories.map((category, categoryIndex) => {
    const visibleRelations = new Set();
    function renderNode(node) {
      const children = node.children.map(renderNode).filter(Boolean).join('');
      const relation = category.relations[node.relationIndex];
      if (!children && (!relation || !matches(relation))) return '';
      if (!relation) {
        return `<li><details class="cmdtreemap-branch"${expanded}>
          <summary>${escapeHtml(node.name)}</summary><ul>${children}</ul>
        </details></li>`;
      }
      visibleRelations.add(node.relationIndex);
      const id = `${categoryIndex}:${node.relationIndex}`;
      const selected = state.selected === id;
      const button = `<button class="cmdtreemap-item${selected ? ' is-selected' : ''}"
        data-relation="${id}" aria-pressed="${selected}" type="button"
        aria-label="${escapeHtml(`${relation.from} → ${relation.to}`)}">
        <strong>${escapeHtml(node.name)}${node.cycle ? ' ↩' : ''}</strong>${improvementSummary(relation.solution) ? `<span class="cmdtreemap-improvement"> — ${escapeHtml(improvementSummary(relation.solution))}</span>` : ''}
      </button>`;
      return `<li>${button}${children ? `<ul>${children}</ul>` : ''}</li>`;
    }
    const branches = buildCategoryForest(category).map(renderNode).filter(Boolean).join('');
    if (!branches) return '';
    return `<details class="cmdtreemap-category"${expanded}>
      <summary>${escapeHtml(category.name)} <span>${visibleRelations.size}</span></summary>
      <ul class="cmdtreemap-paths">${branches}</ul>
    </details>`;
  }).join('');

  tree.innerHTML = categories || '<p class="cmdtreemap-muted">검색 결과가 없습니다.</p>';
}

async function loadTldr(command, container) {
  if (!command) {
    container.innerHTML = '<p class="cmdtreemap-muted">tldr 없음</p>';
    return;
  }

  container.innerHTML = '<p class="cmdtreemap-muted">tldr 불러오는 중...</p>';
  const url = `https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/common/${encodeURIComponent(command)}.md`;

  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error('not found');
    const text = await response.text();
    const commands = [...text.matchAll(/^\s*`([^`]+)`/gm)]
      .slice(0, 5)
      .map((match) => `<li><code>${escapeHtml(match[1])}</code></li>`);
    container.innerHTML = commands.length
      ? `<ol class="cmdtreemap-tldr">${commands.join('')}</ol>`
      : '<p class="cmdtreemap-muted">tldr 예시 없음</p>';
  } catch {
    container.innerHTML = '<p class="cmdtreemap-muted">tldr 없음</p>';
  }
}

function selectRelation(id) {
  const [categoryIndex, relationIndex] = id.split(':').map(Number);
  const category = state.data.categories[categoryIndex];
  const relation = category?.relations[relationIndex];
  if (!relation) return;

  state.selected = id;
  history.replaceState(null, '', `#${encodeURIComponent(relation.from)}-${encodeURIComponent(relation.to)}`);
  tree.querySelectorAll('[data-relation]').forEach((button) => {
    const selected = button.dataset.relation === id;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  detail.hidden = false;
  detail.innerHTML = `
    <p class="cmdtreemap-eyebrow">${escapeHtml(category.name)} / ${escapeHtml(relation.group || '기타')}</p>
    <h2>${escapeHtml(relation.from)} <span>→</span> ${escapeHtml(relation.to)}</h2>
    <dl class="cmdtreemap-facts">
      ${relation.relation ? `<div><dt>관계 유형</dt><dd>${escapeHtml(relation.relation)}</dd></div>` : ''}
      <div><dt>${escapeHtml(relation.from)}의 문제</dt><dd>${escapeHtml(relation.problem || relation.why || '—')}</dd></div>
      <div><dt>${escapeHtml(relation.to)}의 개선점</dt><dd>${escapeHtml(relation.solution || '—')}</dd></div>
      ${relation.boundary ? `<div><dt>남은 한계</dt><dd>${escapeHtml(relation.boundary)}</dd></div>` : ''}
      ${relation.install ? `<div><dt>설치</dt><dd><code>${escapeHtml(relation.install)}</code></dd></div>` : ''}
    </dl>
    <section class="cmdtreemap-section"><h3>tldr</h3><div data-tldr-result></div></section>
    <section class="cmdtreemap-section"><h3>참고 링크</h3><ul>${relation.url ? `<li><a href="${escapeHtml(relation.url)}" target="_blank" rel="noreferrer">공식 문서</a></li>` : ''}</ul></section>`;

  loadTldr(relation.tldr || relation.to, detail.querySelector('[data-tldr-result]'));
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function start() {
  try {
    const response = await fetch(root.dataset.source || `${assetBase}commands.json`);
    if (!response.ok) throw new Error('commands request failed');
    state.data = await response.json();
    status.textContent = `${state.data.categories.length}개 카테고리 · 도구의 관계 흐름을 펼쳐보세요. 출시 연대순이 아닌 대안·보완 관계입니다.`;
    renderTree();
  } catch {
    status.textContent = 'commands.json을 불러오지 못했습니다.';
    tree.innerHTML = '<p class="cmdtreemap-error">데이터 로드 실패</p>';
  }
}

tree.addEventListener('click', (event) => {
  const button = event.target.closest('[data-relation]');
  if (button && tree.contains(button)) selectRelation(button.dataset.relation);
});

search.addEventListener('input', (event) => {
  state.query = event.target.value;
  state.selected = null;
  detail.hidden = true;
  renderTree();
});

start();
