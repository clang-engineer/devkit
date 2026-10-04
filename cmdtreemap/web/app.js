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

const relationTypes = {
  alternative: { label: '대안', description: '같은 문제를 다른 방식으로 해결하는 선택지' },
  replacement: { label: '대체', description: '기존 도구의 역할을 대부분 대신할 수 있는 선택지' },
  complement: { label: '보완', description: '기존 도구와 함께 써서 사용성을 확장하는 관계' },
  wrapper: { label: '래퍼', description: '기존 도구 위에 더 편한 인터페이스를 제공하는 관계' },
  specialized: { label: '특화', description: '특정 상황이나 작업에 더 집중한 도구' },
};

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

function commandByName(category, name) {
  return (category.commands || []).find((command) => command.name === name);
}

function relationMeta(type = 'alternative') {
  return relationTypes[type] || { label: type, description: '도구 사이의 관계' };
}

function relationBadge(type) {
  if (!type) return '';
  const meta = relationMeta(type);
  return '<span class="cmdtreemap-relation-badge cmdtreemap-relation-badge--' + escapeHtml(type) + '" title="' + escapeHtml(meta.description) + '">' + escapeHtml(meta.label) + '</span>';
}

function matches(relation, category) {
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  const from = commandByName(category, relation.from);
  const to = commandByName(category, relation.to);
  return [
    relation.from, relation.to, relation.group, relation.relation, relation.why, relation.problem, relation.solution,
    relationMeta(relation.relation).label, relationMeta(relation.relation).description,
    from?.description, to?.description,
  ]
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
      if (!children && (!relation || !matches(relation, category))) return '';
      if (!relation) {
        const id = `${categoryIndex}:${node.name}`;
        const selected = state.selected === `command:${id}`;
        return `<li><details class="cmdtreemap-branch"${expanded}>
          <summary class="cmdtreemap-command${selected ? ' is-selected' : ''}"
            data-command="${escapeHtml(id)}" aria-pressed="${selected}">${escapeHtml(node.name)}</summary><ul>${children}</ul>
        </details></li>`;
      }
      visibleRelations.add(node.relationIndex);
      const id = `${categoryIndex}:${node.relationIndex}`;
      const selected = state.selected === id;
      const button = `<button class="cmdtreemap-item${selected ? ' is-selected' : ''}"
        data-relation="${id}" aria-pressed="${selected}" type="button"
        aria-label="${escapeHtml(`${relation.from} → ${relation.to}`)}">
        <strong>${escapeHtml(node.name)}${node.cycle ? ' ↩' : ''}</strong>${relationBadge(relation.relation)}${improvementSummary(relation.solution) ? `<span class="cmdtreemap-improvement"> — ${escapeHtml(improvementSummary(relation.solution))}</span>` : ''}
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

function renderTldrCommand(command) {
  let html = '';
  let offset = 0;
  for (const match of command.matchAll(/\{\{(.*?)\}\}/g)) {
    html += escapeHtml(command.slice(offset, match.index));
    const value = match[1];
    const alias = /^\[([^|\]]+)\|([^\]]+)\]$/.exec(value);
    html += alias
      ? `<span title="${escapeHtml(alias[2])}">${escapeHtml(alias[1])}</span>`
      : `<var>${escapeHtml(value)}</var>`;
    offset = match.index + match[0].length;
  }
  return html + escapeHtml(command.slice(offset));
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
      .map((match) => `<li><code>${renderTldrCommand(match[1])}</code></li>`);
    container.innerHTML = commands.length
      ? `<ol class="cmdtreemap-tldr">${commands.join('')}</ol>`
      : '<p class="cmdtreemap-muted">tldr 예시 없음</p>';
  } catch {
    container.innerHTML = '<p class="cmdtreemap-muted">tldr 없음</p>';
  }
}

function updateSelection(selector, selectedId) {
  tree.querySelectorAll('[data-relation], [data-command]').forEach((button) => {
    const selected = button.matches(selector) && (button.dataset.relation || button.dataset.command) === selectedId;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function selectRelation(id) {
  const [categoryIndex, relationIndex] = id.split(':').map(Number);
  const category = state.data.categories[categoryIndex];
  const relation = category?.relations[relationIndex];
  if (!relation) return;

  state.selected = id;
  history.replaceState(null, '', `#${encodeURIComponent(relation.from)}-${encodeURIComponent(relation.to)}`);
  updateSelection('[data-relation]', id);

  detail.hidden = false;
  detail.innerHTML = `
    <p class="cmdtreemap-eyebrow">${escapeHtml(category.name)} / ${escapeHtml(relation.group || '기타')}</p>
    <h2>${escapeHtml(relation.from)} <span>→</span> ${escapeHtml(relation.to)}</h2>
    <dl class="cmdtreemap-facts">
      ${relation.relation ? `<div><dt>관계 유형</dt><dd>${relationBadge(relation.relation)} <span class="cmdtreemap-relation-description">${escapeHtml(relationMeta(relation.relation).description)}</span></dd></div>` : ''}
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

function selectCommand(id) {
  const separator = id.indexOf(':');
  const categoryIndex = Number(id.slice(0, separator));
  const name = id.slice(separator + 1);
  const category = state.data.categories[categoryIndex];
  if (!category) return;
  const command = commandByName(category, name);
  const outgoing = category.relations.filter((relation) => relation.from === name);
  const incoming = category.relations.filter((relation) => relation.to === name);
  if (!command && !outgoing.length && !incoming.length) return;

  state.selected = `command:${id}`;
  history.replaceState(null, '', `#${encodeURIComponent(name)}`);
  updateSelection('[data-command]', id);

  const relationItems = outgoing.map((relation) => `<li><strong>${escapeHtml(relation.to)}</strong> ${relationBadge(relation.relation)}${relation.solution ? ` — ${escapeHtml(improvementSummary(relation.solution))}` : ''}</li>`).join('');
  const incomingItems = incoming.map((relation) => `<li>${escapeHtml(relation.from)} <span>→</span> <strong>${escapeHtml(name)}</strong> ${relationBadge(relation.relation)}</li>`).join('');

  detail.hidden = false;
  detail.innerHTML = `
    <p class="cmdtreemap-eyebrow">${escapeHtml(category.name)} / 명령어</p>
    <h2>${escapeHtml(name)}</h2>
    <dl class="cmdtreemap-facts">
      ${command?.description ? `<div><dt>정의</dt><dd>${escapeHtml(command.description)}</dd></div>` : ''}
      ${command?.usage ? `<div><dt>사용법</dt><dd><code>${escapeHtml(command.usage)}</code></dd></div>` : ''}
      ${command?.examples?.length ? `<div><dt>예제</dt><dd><ul>${command.examples.map((example) => `<li><code>${escapeHtml(example)}</code></li>`).join('')}</ul></dd></div>` : ''}
      ${outgoing.length ? `<div><dt>이어지는 도구</dt><dd><ul>${relationItems}</ul></dd></div>` : ''}
      ${incoming.length ? `<div><dt>들어오는 관계</dt><dd><ul>${incomingItems}</ul></dd></div>` : ''}
    </dl>
    <section class="cmdtreemap-section"><h3>tldr</h3><div data-tldr-result></div></section>`;

  loadTldr(command?.tldr || name, detail.querySelector('[data-tldr-result]'));
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function start() {
  try {
    const response = await fetch(root.dataset.source || `${assetBase}commands.json`);
    if (!response.ok) throw new Error('commands request failed');
    state.data = await response.json();
    status.innerHTML = '<span>' + state.data.categories.length + '개 카테고리 · 도구의 관계 흐름을 펼쳐보세요.</span>' +
      '<span class="cmdtreemap-legend" aria-label="관계 유형 범례">' +
      Object.entries(relationTypes).map(([type, meta]) => '<span class="cmdtreemap-legend-item">' + relationBadge(type) + '<span>' + escapeHtml(meta.description) + '</span></span>').join('') +
      '</span>';
    renderTree();
  } catch {
    status.textContent = 'commands.json을 불러오지 못했습니다.';
    tree.innerHTML = '<p class="cmdtreemap-error">데이터 로드 실패</p>';
  }
}

tree.addEventListener('click', (event) => {
  const relationButton = event.target.closest('[data-relation]');
  if (relationButton && tree.contains(relationButton)) {
    selectRelation(relationButton.dataset.relation);
    return;
  }
  const commandButton = event.target.closest('[data-command]');
  if (commandButton && tree.contains(commandButton)) {
    selectCommand(commandButton.dataset.command);
  }
});

search.addEventListener('input', (event) => {
  state.query = event.target.value;
  state.selected = null;
  detail.hidden = true;
  renderTree();
});

start();
