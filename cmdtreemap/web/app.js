const state = {
  data: null,
  query: '',
  selected: null
};

const tree = document.querySelector('#tree');
const detail = document.querySelector('#detail');
const search = document.querySelector('#search');
const status = document.querySelector('#status');

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
  const categories = state.data.categories
    .map((category, categoryIndex) => {
      const relations = category.relations.filter(matches);
      if (relations.length === 0) return '';

      const groups = new Map();
      relations.forEach((relation, relationIndex) => {
        const key = relation.group || '기타';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ relation, relationIndex });
      });

      const groupMarkup = [...groups.entries()].map(([group, items]) => `
        <details class="tree-group" open>
          <summary>${escapeHtml(group)} <span>${items.length}</span></summary>
          <ul>
            ${items.map(({ relation, relationIndex }) => {
              const id = `${categoryIndex}:${relationIndex}`;
              const selected = state.selected === id ? ' is-selected' : '';
              return `<li><button class="tree-item${selected}" data-relation="${id}" type="button">
                <strong>${escapeHtml(relation.from)} → ${escapeHtml(relation.to)}</strong>
                <small>${escapeHtml(relation.why || '')}</small>
              </button></li>`;
            }).join('')}
          </ul>
        </details>`).join('');

      return `<details class="tree-category" open>
        <summary>${escapeHtml(category.name)} <span>${relations.length}</span></summary>
        ${groupMarkup}
      </details>`;
    }).join('');

  tree.innerHTML = categories || '<p class="muted">검색 결과가 없습니다.</p>';
  tree.querySelectorAll('[data-relation]').forEach((button) => {
    button.addEventListener('click', () => selectRelation(button.dataset.relation));
  });
}

function link(label, url) {
  if (!url) return '';
  return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a></li>`;
}

async function loadTldr(command, container) {
  if (!command) {
    container.innerHTML = '<p class="muted">tldr 없음</p>';
    return;
  }

  container.innerHTML = '<p class="muted">tldr 불러오는 중...</p>';
  const url = `https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/common/${encodeURIComponent(command)}.md`;

  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error('not found');
    const text = await response.text();
    const commands = [...text.matchAll(/^\s*`([^`]+)`/gm)].slice(0, 5).map((match) => `<li><code>${escapeHtml(match[1])}</code></li>`);
    container.innerHTML = commands.length
      ? `<ol class="tldr-list">${commands.join('')}</ol>`
      : '<p class="muted">tldr 예시 없음</p>';
  } catch {
    container.innerHTML = '<p class="muted">tldr 없음</p>';
  }
}

function selectRelation(id) {
  const [categoryIndex, relationIndex] = id.split(':').map(Number);
  const relation = state.data.categories[categoryIndex]?.relations[relationIndex];
  if (!relation) return;

  state.selected = id;
  history.replaceState(null, '', `#${encodeURIComponent(relation.from)}-${encodeURIComponent(relation.to)}`);
  renderTree();

  detail.hidden = false;
  detail.innerHTML = `
    <p class="eyebrow">${escapeHtml(state.data.categories[categoryIndex].name)} / ${escapeHtml(relation.group || '기타')}</p>
    <h2>${escapeHtml(relation.from)} <span>→</span> ${escapeHtml(relation.to)}</h2>
    <dl class="facts">
      <div><dt>문제</dt><dd>${escapeHtml(relation.problem || relation.why || '—')}</dd></div>
      <div><dt>해결</dt><dd>${escapeHtml(relation.solution || '—')}</dd></div>
      ${relation.boundary ? `<div><dt>경계</dt><dd>${escapeHtml(relation.boundary)}</dd></div>` : ''}
      ${relation.install ? `<div><dt>설치</dt><dd><code>${escapeHtml(relation.install)}</code></dd></div>` : ''}
    </dl>
    <section class="detail-section"><h3>tldr</h3><div id="tldr-result"></div></section>
    <section class="detail-section"><h3>참고 링크</h3><ul>${link('공식 문서', relation.url)}</ul></section>`;

  loadTldr(relation.tldr || relation.to, document.querySelector('#tldr-result'));
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function start() {
  try {
    const response = await fetch('commands.json');
    state.data = await response.json();
    status.textContent = `${state.data.categories.length}개 카테고리 · 관계를 선택해 상세 내용을 확인하세요.`;
    renderTree();
  } catch (error) {
    status.textContent = 'commands.json을 불러오지 못했습니다.';
    tree.innerHTML = '<p class="error">데이터 로드 실패</p>';
  }
}

search.addEventListener('input', (event) => {
  state.query = event.target.value;
  state.selected = null;
  detail.hidden = true;
  renderTree();
});

start();
