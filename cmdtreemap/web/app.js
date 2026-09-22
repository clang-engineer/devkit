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

function matches(relation) {
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return [relation.from, relation.to, relation.group, relation.why, relation.problem, relation.solution]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
}

function renderTree() {
  if (!state.data) return;

  const categories = state.data.categories.map((category, categoryIndex) => {
    const relations = category.relations
      .map((relation, relationIndex) => ({ relation, relationIndex }))
      .filter(({ relation }) => matches(relation));
    if (relations.length === 0) return '';

    const groups = new Map();
    relations.forEach(({ relation, relationIndex }) => {
      const key = relation.group || '기타';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ relation, relationIndex });
    });

    const groupMarkup = [...groups.entries()].map(([group, items]) => `
      <details class="cmdtreemap-group" open>
        <summary>${escapeHtml(group)} <span>${items.length}</span></summary>
        <ul>
          ${items.map(({ relation, relationIndex }) => {
            const id = `${categoryIndex}:${relationIndex}`;
            const selected = state.selected === id ? ' is-selected' : '';
            return `<li><button class="cmdtreemap-item${selected}" data-relation="${id}" type="button">
              <strong>${escapeHtml(relation.from)} → ${escapeHtml(relation.to)}</strong>
              <small>${escapeHtml(relation.why || '')}</small>
            </button></li>`;
          }).join('')}
        </ul>
      </details>`).join('');

    return `<details class="cmdtreemap-category" open>
      <summary>${escapeHtml(category.name)} <span>${relations.length}</span></summary>
      ${groupMarkup}
    </details>`;
  }).join('');

  tree.innerHTML = categories || '<p class="cmdtreemap-muted">검색 결과가 없습니다.</p>';
  tree.querySelectorAll('[data-relation]').forEach((button) => {
    button.addEventListener('click', () => selectRelation(button.dataset.relation));
  });
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
  renderTree();

  detail.hidden = false;
  detail.innerHTML = `
    <p class="cmdtreemap-eyebrow">${escapeHtml(category.name)} / ${escapeHtml(relation.group || '기타')}</p>
    <h2>${escapeHtml(relation.from)} <span>→</span> ${escapeHtml(relation.to)}</h2>
    <dl class="cmdtreemap-facts">
      <div><dt>문제</dt><dd>${escapeHtml(relation.problem || relation.why || '—')}</dd></div>
      <div><dt>해결</dt><dd>${escapeHtml(relation.solution || '—')}</dd></div>
      ${relation.boundary ? `<div><dt>경계</dt><dd>${escapeHtml(relation.boundary)}</dd></div>` : ''}
      ${relation.install ? `<div><dt>설치</dt><dd><code>${escapeHtml(relation.install)}</code></dd></div>` : ''}
    </dl>
    <section class="cmdtreemap-section"><h3>tldr</h3><div data-tldr-result></div></section>
    <section class="cmdtreemap-section"><h3>참고 링크</h3><ul>${relation.url ? `<li><a href="${escapeHtml(relation.url)}" target="_blank" rel="noreferrer">공식 문서</a></li>` : ''}</ul></section>`;

  loadTldr(relation.tldr || relation.to, detail.querySelector('[data-tldr-result]'));
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function start() {
  try {
    const response = await fetch(`${assetBase}commands.json`);
    if (!response.ok) throw new Error('commands request failed');
    state.data = await response.json();
    status.textContent = `${state.data.categories.length}개 카테고리 · 관계를 선택해 상세 내용을 확인하세요.`;
    renderTree();
  } catch {
    status.textContent = 'commands.json을 불러오지 못했습니다.';
    tree.innerHTML = '<p class="cmdtreemap-error">데이터 로드 실패</p>';
  }
}

search.addEventListener('input', (event) => {
  state.query = event.target.value;
  state.selected = null;
  detail.hidden = true;
  renderTree();
});

start();
