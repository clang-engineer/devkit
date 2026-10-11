import { escapeHtml as esc, fetchCatalog } from '../core/reference-data.js';
import { RELATIONS, buildModel, safeUrl, validateCatalog } from '../core/catalog.js';
import { navigationGroups, explorerFilter, readExplorerHash } from '../core/navigation.js';
import { overviewHtml } from '../graph/overview.js';
import { layoutCategory } from '../graph/layout.js';
import { parseTldr, tldrPaths } from '../integrations/tldr.js';

export function mount(root) {
  if (!root || root.dataset.devkitMounted === 'true') return;
  root.dataset.devkitMounted = 'true';
  const base = 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/';
  const defaults = root.dataset.defaultView === 'sheet' ? 'sheet' : 'map';
  const state = { model: null, groups: [], expanded: new Set(), tool: '', category: 'all', query: '', tab: 'about', zoom: 1, error: '', edge: '' };
  const tldrCache = new Map();
  let tldrRequest = 0, loadRequest = 0;
  root.classList.add('dk-app');
  root.innerHTML = `
    <div class="dk-heading"><div><p class="dk-eyebrow">DEVKIT / TOOL EXPLORER</p><p class="dk-intro">도구의 관계를 살펴보고, 필요한 사용법으로 이어집니다.</p></div>
      <button type="button" data-fullscreen hidden aria-label="Devkit 전체 화면">전체 화면 ⛶</button></div>
    <div class="dk-statusbar"><p data-status role="status">Devkit 데이터를 불러오는 중…</p><button type="button" data-retry hidden>다시 시도</button></div>
    <p class="dk-sr" data-announcement role="status"></p>
    <div class="dk-layout"><aside class="dk-sidebar" aria-label="도구 검색과 분야">
      <label class="dk-search"><span>도구 검색</span><input type="search" data-search placeholder="fd, tmux, Helix…" autocomplete="off" aria-controls="devkit-search-results" disabled></label>
      <section class="dk-search-results" data-results hidden><p class="dk-search-hint">전체 분야에서 검색 · Enter로 사용법 열기</p><div id="devkit-search-results" data-list></div></section>
      <nav class="dk-navigation" data-categories aria-label="전체와 세부 분류"></nav>
    </aside><section class="dk-explorer" aria-label="도구 탐색">
      <nav class="dk-breadcrumb" data-breadcrumb aria-label="지도 위치"></nav>
      <div class="dk-maptools" data-maptools><span data-overview-actions><button type="button" data-expand-all>모두 펼치기</button><button type="button" data-collapse-all>모두 접기</button></span><div>
        <button type="button" data-zoom="out" aria-label="지도 축소">−</button><output data-scale>100%</output>
        <button type="button" data-zoom="in" aria-label="지도 확대">+</button><button type="button" data-zoom="fit">맞춤</button><button type="button" data-zoom="reset">초기화</button></div></div>
      <div class="dk-viewport" data-viewport tabindex="0" aria-label="도구 지도. 방향키로 이동하고 Tab으로 도구를 선택합니다."><div class="dk-stage" data-stage></div></div>
      <p class="dk-legend" data-legend>실선: 대안·대체·특화 / 점선: 보완·래퍼. 연결선은 학습 순서나 출시 연대를 뜻하지 않습니다.</p>
    </section><aside class="dk-detail" data-detail aria-label="선택한 도구 상세"><div class="dk-placeholder"><span>↖</span><h2>궁금한 도구를 골라보세요</h2><p>소개와 관계, tldr 빠른 예시, 긴 치트시트와 공식 문서를 한곳에서 찾습니다.</p></div></aside></div>`;
  const $ = selector => root.querySelector(selector);
  const viewport = $('[data-viewport]'), stage = $('[data-stage]'), panel = $('[data-detail]');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function remember() {
    const scope = state.model.categories.find(category => category.id === state.category)?.name || state.category;
    const hash = new URLSearchParams({ scope, tab: state.tab });
    if (state.expanded.size) hash.set('open', [...state.expanded].join(','));
    if (state.tool) hash.set('tool', state.tool);
    if (state.query) hash.set('q', state.query);
    history.replaceState(null, '', '#' + hash);
  }
  function linkHtml(link) {
    const url = safeUrl(link?.url);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(link.label || '문서')} <span aria-hidden="true">↗</span></a>` : '';
  }
  function linksHtml(links, empty) {
    return links.length ? `<ul class="dk-links">${links.map(link => `<li>${linkHtml(link)}</li>`).join('')}</ul>` : `<p class="dk-muted">${esc(empty)}</p>`;
  }
  function renderNavigation() {
    const active = state.groups.find(group => group.id === state.category || group.categories.some(category => category.id === state.category));
    $('[data-categories]').innerHTML = `<button type="button" class="dk-nav-all" data-category="all" aria-pressed="${state.category === 'all' && !state.query}">◎ 전체 조망 <small>${state.model.tools.size}</small></button>` + state.groups.map(group => {
      const open = state.expanded.has(group.id);
      return `<section class="dk-nav-group"><div class="dk-nav-heading"><button type="button" data-category="${group.id}" aria-pressed="${group.id === state.category}">${group.name}<small>${group.tools.size}</small></button><button type="button" data-expand="${group.id}" aria-expanded="${open}" aria-label="${group.name} 세부 분류 ${open ? '접기' : '펼치기'}">${open ? '−' : '+'}</button></div><div class="dk-nav-children"${open ? '' : ' hidden'}>${group.categories.map(category => `<button type="button" data-category="${esc(category.id)}" aria-pressed="${category.id === state.category}">${esc(category.name)}<small>${category.count}</small></button>`).join('')}</div></section>`;
    }).join('');
    const category = state.model.categories.find(category => category.id === state.category);
    $('[data-breadcrumb]').innerHTML = `<button type="button" data-category="all">전체 조망</button>` + (state.query ? '<span> / 전체 검색 결과</span>' : active ? `<span> / </span><button type="button" data-category="${active.id}">${active.name}</button>${category ? `<span> / ${esc(category.name)}</span>` : ''}` : '<span> / 분야를 펼쳐보세요</span>');
  }
  function render() {
    if (!state.model) return;
    const filtered = explorerFilter(state.model, state.groups, state.category, state.query);
    const overview = state.category === 'all' && !state.query.trim();
    root.dataset.currentView = 'explorer';
    renderNavigation();
    $('[data-status]').textContent = state.error || (overview ? `${state.model.tools.size}개 도구 · ${state.model.edges.length}개 관계 · 분야를 펼치거나 검색하세요` : `${filtered.matches.size}개 도구 · ${filtered.edges.length}개 관계${state.query ? ' · 모든 분야 검색' : ''}`);
    $('[data-retry]').hidden = !state.error;
    $('[data-results]').hidden = !state.query.trim();
    $('[data-overview-actions]').hidden = !overview;
    if (state.query.trim()) renderList(filtered); else $('[data-list]').innerHTML = '';
    if (overview) stage.innerHTML = overviewHtml(state.groups, state.expanded, state.zoom, viewport.clientWidth < 560 ? 2 : 3);
    else renderMap(filtered);
    $('[data-legend]').textContent = overview ? '전체 조망의 선은 분류를 뜻합니다. +로 세부 분류를 펼치고 관계도로 들어가세요.' : '실선: 대안·대체·특화 / 점선: 보완·래퍼. 관계는 학습 순서나 출시 연대가 아닙니다. 배경을 드래그하거나 스크롤해 이동하세요.';
    $('[data-scale]').textContent = Math.round(state.zoom * 100) + '%';
    highlight();
  }
  function renderMap(filtered) {
    stage.innerHTML = '';
    for (const category of state.model.categories) {
      const group = state.groups.find(group => group.id === state.category);
      if (!state.query.trim() && state.category !== 'all' && (group ? !group.categories.some(item => item.id === category.id) : category.id !== state.category)) continue;
      const ids = [...filtered.visible].filter(id => state.model.tools.get(id).categories.includes(category.id));
      if (!ids.length) continue;
      const edges = filtered.edges.filter(edge => edge.category === category.id);
      const layout = layoutCategory(ids, edges);
      const edgeHtml = edges.map(edge => {
        const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
        if (!from || !to) return '';
        const x1 = from.x + 168, y1 = from.y + 29, x2 = to.x, y2 = to.y + 29;
        const bend = Math.max(32, Math.abs(x2 - x1) / 2);
        const path = x2 > x1 ? `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
          : `M${from.x + 84},${from.y} C${from.x + 84},${from.y - 22} ${to.x + 84},${to.y - 22} ${to.x + 84},${to.y}`;
        const label = `${state.model.tools.get(edge.from).name} → ${state.model.tools.get(edge.to).name}: ${RELATIONS[edge.relation] || edge.relation || '관계'}`;
        return `<g class="dk-edge${['complement', 'wrapper'].includes(edge.relation) ? ' is-complement' : ''}" data-edge="${edge.id}" role="button" tabindex="0" aria-label="${esc(label)}"><title>${esc(label)}</title><path class="dk-edge-hit" d="${path}"/><path class="dk-edge-line" d="${path}" marker-end="url(#arrow-${category.id})"/></g>`;
      }).join('');
      const nodes = ids.map(id => {
        const tool = state.model.tools.get(id), pos = layout.positions.get(id);
        const incoming = edges.find(edge => edge.to === id);
        const hint = incoming ? (RELATIONS[incoming.relation] || '관계') : (tool.custom.length ? '치트시트 있음' : '도구 선택');
        return `<g class="dk-node${filtered.matches.has(id) ? '' : ' is-context'}" data-tool="${esc(id)}" role="button" tabindex="0" aria-label="${esc(tool.name + ' 상세 보기')}" aria-pressed="false" transform="translate(${pos.x},${pos.y})"><title>${esc(tool.description || tool.name)}</title><rect width="168" height="58" rx="9"/><text x="14" y="25" class="dk-node-title">${esc(tool.name.length > 20 ? tool.name.slice(0, 19) + '…' : tool.name)}</text><text x="14" y="44" class="dk-node-hint">${esc(hint)}</text></g>`;
      }).join('');
      const board = document.createElement('section');
      board.className = 'dk-board';
      board.innerHTML = `<h3>${esc(category.name)} <small>${ids.length}</small></h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width * state.zoom}" height="${layout.height * state.zoom}" data-width="${layout.width}" data-height="${layout.height}" role="group" aria-label="${esc(category.name)} 관계 지도"><defs><marker id="arrow-${category.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${edgeHtml}${nodes}</svg>`;
      stage.append(board);
    }
    if (!stage.children.length) stage.innerHTML = '<p class="dk-empty">검색 결과가 없습니다. 검색어 또는 분야를 바꿔보세요.</p>';
  }
  function renderList(filtered) {
    const query = state.query.trim().toLowerCase();
    const ids = [...filtered.matches].sort((a, b) => Number(state.model.tools.get(b).aliases.has(query)) - Number(state.model.tools.get(a).aliases.has(query)));
    $('[data-list]').innerHTML = ids.map(id => {
      const tool = state.model.tools.get(id);
      return `<div class="dk-search-row"><button type="button" class="dk-tool-row" data-search-tool="${esc(id)}"><strong>${esc(tool.name)}</strong><span>${esc(tool.description || '소개와 자료 보기')}</span></button><button type="button" data-quick="${esc(id)}" aria-label="${esc(tool.name)} 사용법 바로 보기">사용법 ↗</button></div>`;
    }).join('') || '<p class="dk-empty">검색 결과가 없습니다.</p>';
  }
  function highlight() {
    const neighbors = new Set([state.tool]);
    for (const edge of state.model.edges) if (edge.from === state.tool || edge.to === state.tool) { neighbors.add(edge.from); neighbors.add(edge.to); }
    root.querySelectorAll('[data-tool]').forEach(node => {
      node.classList.toggle('is-selected', node.dataset.tool === state.tool);
      node.classList.toggle('is-related', !!state.tool && node.dataset.tool !== state.tool && neighbors.has(node.dataset.tool));
      node.setAttribute('aria-pressed', String(node.dataset.tool === state.tool));
    });
    stage.querySelectorAll('[data-edge]').forEach(node => {
      const edge = state.model.edges.find(item => item.id === node.dataset.edge);
      node.classList.toggle('is-selected', edge?.from === state.tool || edge?.to === state.tool);
    });
  }
  function centerSelected() {
    const node = [...stage.querySelectorAll('[data-tool]')].find(item => item.dataset.tool === state.tool);
    if (!node) return;
    const box = node.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
    viewport.scrollLeft += box.left - frame.left - (viewport.clientWidth - box.width) / 2;
    viewport.scrollTop += box.top - frame.top - (viewport.clientHeight - box.height) / 2;
  }
  function choose(id, reveal = true) {
    if (!state.model.tools.has(id)) return;
    state.tool = id; state.edge = '';
    $('[data-announcement]').textContent = state.model.tools.get(id).name + ' 선택됨';
    highlight(); remember(); renderDetail();
    if (reveal && matchMedia('(max-width: 850px)').matches) panel.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  function renderDetail() {
    tldrRequest++;
    const tool = state.model.tools.get(state.tool);
    if (!tool) { panel.innerHTML = '<div class="dk-placeholder"><h2>도구를 선택하세요</h2><p>분야를 펼치거나 검색하면 소개·사용법·문서 링크를 확인할 수 있습니다.</p></div>'; return; }
    const edges = state.model.edges.filter(edge => edge.from === tool.id || edge.to === tool.id);
    const tab = state.tab;
    panel.innerHTML = `<header class="dk-detail-head"><p class="dk-eyebrow">${esc(tool.categories.map(id => state.model.categories.find(category => category.id === id)?.name).join(' / '))}</p><h2>${esc(tool.name)}</h2><p>${esc(tool.description || '연결된 관계와 참고 자료에서 도구의 역할을 확인하세요.')}</p></header>
      <div class="dk-detail-tabs" role="group" aria-label="도구 상세 보기">${[['about', '소개·비교'], ['usage', '사용법'], ['resources', '자료']].map(([id, label]) => `<button type="button" data-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</div><div class="dk-detail-body" data-body></div>`;
    const body = $('[data-body]');
    if (tab === 'about') {
      body.innerHTML = `<h3>연결된 도구 <small>${edges.length}</small></h3>` + (edges.length ? edges.map(edge => {
        const other = edge.from === tool.id ? edge.to : edge.from;
        return `<details class="dk-relation" ${edge.id === state.edge ? 'open' : ''}><summary><span>${esc(state.model.tools.get(edge.from).name)} → ${esc(state.model.tools.get(edge.to).name)}</span><span class="dk-badge">${esc(RELATIONS[edge.relation] || edge.relation || '관계')}</span></summary><dl>${[['기존 문제', edge.problem || edge.why], ['개선점', edge.solution], ['선택할 때 주의할 점', edge.boundary]].filter(([, value]) => value).map(([label, value]) => `<dt>${label}</dt><dd>${esc(value)}</dd>`).join('')}</dl><button type="button" data-related="${esc(other)}">${esc(state.model.tools.get(other).name)} 살펴보기 →</button></details>`;
      }).join('') : '<p class="dk-muted">아직 등록된 관계가 없습니다. 사용법과 자료는 계속 볼 수 있습니다.</p>');
      if (tool.install) body.innerHTML += `<h3>설치 예시</h3><pre><code>${esc(tool.install)}</code></pre>`;
    } else if (tab === 'usage') {
      body.innerHTML = `<h3>빠른 사용법 <small>tldr</small></h3><div data-tldr></div>${tool.usage ? `<h3>사용 구문</h3><pre><code>${esc(tool.usage)}</code></pre>` : ''}${tool.examples.length ? `<h3>카탈로그 예시</h3>${tool.examples.map(example => `<pre><code>${esc(example)}</code></pre>`).join('')}` : ''}<h3>내 치트시트 · 전체 문서</h3>${linksHtml(tool.custom, '등록된 자체 치트시트가 없습니다. 자료 탭의 공식 문서를 참고하세요.')}<p class="dk-muted">긴 문서는 원문 전체를 새 탭에서 엽니다.</p>`;
      loadTldr(tool, $('[data-tldr]'), tldrRequest);
    } else {
      body.innerHTML = `<h3>내 치트시트 · 전체 문서</h3>${linksHtml(tool.custom, '등록된 자체 치트시트가 없습니다.')}<h3>공식 문서</h3>${linksHtml(tool.official, '등록된 공식 문서 링크가 없습니다.')}${tool.links.length ? `<h3>관련 글과 자료</h3>${linksHtml(tool.links, '')}` : ''}<p class="dk-muted">문서를 요약하거나 복제하지 않고 원본으로 연결합니다.</p>`;
    }
    if (tab === 'about' && tool.custom.length) body.innerHTML += `<div class="dk-resource-shortcut"><h3>내 치트시트 · 전체 문서</h3>${linksHtml(tool.custom, '')}</div>`;
  }
  async function loadTldr(tool, target, request) {
    const paths = tldrPaths(tool.tldr);
    if (!paths.length) { target.innerHTML = '<p class="dk-muted">등록된 tldr 페이지가 없습니다. 아래 치트시트 또는 자료 탭을 이용하세요.</p>'; return; }
    target.innerHTML = '<p class="dk-muted">tldr-pages에서 예시를 불러오는 중…</p>';
    try {
      let result = tldrCache.get(tool.tldr);
      if (!result) {
        for (const path of paths) {
          const url = 'https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/' + path + '.md';
          const response = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
          if (response.status === 404) continue;
          if (!response.ok) throw new Error('tldr request failed');
          result = { examples: parseTldr(await response.text()), path }; break;
        }
        if (result) tldrCache.set(tool.tldr, result);
      }
      if (request !== tldrRequest || !target.isConnected) return;
      if (!result) { target.innerHTML = '<p class="dk-muted">이 명령의 tldr 페이지를 찾지 못했습니다. 치트시트와 공식 문서는 계속 이용할 수 있습니다.</p>'; return; }
      target.innerHTML = result.examples.length ? `<ol class="dk-examples">${result.examples.map((example, index) => `<li><p>${esc(example.description)}</p><pre><code>${esc(example.command)}</code></pre><button type="button" data-copy="${index}">명령 복사</button></li>`).join('')}</ol><p class="dk-muted">{{…}} 자리표시자는 실제 값으로 바꿔 사용하세요.</p>` : '<p class="dk-muted">표시할 tldr 예시가 없습니다.</p>';
      target.innerHTML += `<p class="dk-attribution">${linkHtml({ label: 'tldr-pages 원문 · 기여자', url: 'https://github.com/tldr-pages/tldr/blob/main/pages/' + result.path + '.md' })} · ${linkHtml({ label: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' })}<br>최대 6개 예시를 발췌해 표시합니다.</p>`;
      target.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(result.examples[Number(button.dataset.copy)].command); button.textContent = '복사됨'; }
        catch { button.textContent = '코드를 직접 선택해 복사하세요'; }
      }));
    } catch {
      if (request === tldrRequest && target.isConnected) target.innerHTML = '<p class="dk-muted">네트워크 오류로 tldr를 불러오지 못했습니다.</p><button type="button" data-tldr-retry>tldr 다시 시도</button>';
    }
  }
  function setZoom(value) {
    const before = state.zoom;
    state.zoom = Math.max(.3, Math.min(2, value));
    stage.querySelectorAll('svg').forEach(svg => { svg.setAttribute('width', svg.dataset.width * state.zoom); svg.setAttribute('height', svg.dataset.height * state.zoom); });
    viewport.scrollLeft = (viewport.scrollLeft + viewport.clientWidth / 2) * state.zoom / before - viewport.clientWidth / 2;
    $('[data-scale]').textContent = Math.round(state.zoom * 100) + '%';
  }
  function goToScope(scope) {
    state.category = scope; state.query = ''; $('[data-search]').value = ''; state.zoom = 1;
    const parent = state.groups.find(group => group.id === scope || group.categories.some(category => category.id === scope));
    if (parent) state.expanded.add(parent.id);
    render(); remember(); viewport.scrollTop = 0; viewport.scrollLeft = 0;
    if (scope === 'all') fitOverview();
  }
  function findTool(id, tab = state.tab) {
    const tool = state.model.tools.get(id);
    if (!tool) return;
    state.tab = tab;
    goToScope(tool.categories[0] || 'all');
    choose(id); centerSelected();
  }
  function fitOverview() {
    const svg = stage.querySelector('svg');
    if (svg && state.category === 'all' && !state.query.trim()) {
      setZoom(Math.min(1, Math.max(.6, (viewport.clientWidth - 32) / Number(svg.dataset.width))));
      viewport.scrollLeft = 0;
    }
  }
  function activate(event) {
    const element = event.target.closest('button, [data-tool], [data-edge], [data-category], [data-expand]');
    if (!element || !root.contains(element)) return;
    const data = element.dataset;
    if ('retry' in data) { start(); return; }
    if (!state.model) return;
    if (data.category) {
      goToScope(data.category);
      if (event.detail === 0) $('[data-categories]').querySelector(`[data-category="${data.category}"]`)?.focus();
    } else if (data.expand || 'expandAll' in data || 'collapseAll' in data) {
      if ('expandAll' in data) state.expanded = new Set(state.groups.map(group => group.id));
      else if ('collapseAll' in data) state.expanded.clear();
      else if (!state.expanded.delete(data.expand)) state.expanded.add(data.expand);
      render(); remember();
      if (data.expand) {
        const area = element.closest('svg') ? stage : $('[data-categories]');
        area.querySelector(`[data-expand="${data.expand}"]`)?.focus({ preventScroll: true });
      }
    } else if (data.quick || data.searchTool) findTool(data.quick || data.searchTool, data.quick ? 'usage' : 'about');
    else if (data.tool) choose(data.tool);
    else if (data.edge) {
      const edge = state.model.edges.find(item => item.id === data.edge);
      if (edge) { state.tab = 'about'; choose(edge.to); state.edge = edge.id; renderDetail(); }
    } else if (data.related) findTool(data.related, 'about');
    else if (data.tab) { state.tab = data.tab; remember(); renderDetail(); if (event.detail === 0) $('[data-tab="' + data.tab + '"]').focus(); }
    else if (data.zoom) {
      if (data.zoom === 'fit') {
        const width = Math.max(1, ...[...stage.querySelectorAll('svg')].map(svg => Number(svg.dataset.width)));
        setZoom(Math.min(1, (viewport.clientWidth - 36) / width)); viewport.scrollLeft = 0;
      } else setZoom(data.zoom === 'reset' ? 1 : state.zoom + (data.zoom === 'in' ? .15 : -.15));
    } else if ('tldrRetry' in data && state.tool) loadTldr(state.model.tools.get(state.tool), $('[data-tldr]'), ++tldrRequest);
  }
  root.addEventListener('click', activate);
  root.addEventListener('keydown', event => {
    if (event.target.matches('[data-tool], [data-edge], [data-category], [data-expand]') && event.target.tagName.toLowerCase() === 'g' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); activate(event); }
  });
  $('[data-search]').addEventListener('input', event => {
    state.query = event.target.value; render(); remember(); viewport.scrollTop = 0; viewport.scrollLeft = 0;
  });
  $('[data-search]').addEventListener('keydown', event => {
    if (!state.model) return;
    if (event.key === 'Escape') { state.query = ''; event.target.value = ''; render(); remember(); }
    if (event.key === 'Enter') {
      const first = $('[data-list]').querySelector('[data-quick]');
      if (first) { event.preventDefault(); findTool(first.dataset.quick, 'usage'); }
    }
  });
  let drag = null;
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('[data-tool], [data-edge], [data-category], [data-expand]')) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging'); event.preventDefault();
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    viewport.scrollLeft = drag.left + drag.x - event.clientX; viewport.scrollTop = drag.top + drag.y - event.clientY;
  });
  const stopDrag = () => { drag = null; viewport.classList.remove('is-dragging'); };
  viewport.addEventListener('pointerup', stopDrag); viewport.addEventListener('pointercancel', stopDrag); viewport.addEventListener('lostpointercapture', stopDrag);
  if (document.fullscreenEnabled && root.requestFullscreen) {
    $('[data-fullscreen]').hidden = false;
    $('[data-fullscreen]').addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); } catch { /* Keep the normal responsive view available. */ }
    });
    document.addEventListener('fullscreenchange', () => { $('[data-fullscreen]').textContent = document.fullscreenElement ? '전체 화면 닫기' : '전체 화면 ⛶'; });
  }
  function restore() {
    Object.assign(state, readExplorerHash(location.hash, state.model, state.groups, defaults));
    $('[data-search]').value = state.query; render(); if (state.tool) choose(state.tool, false); else renderDetail(); centerSelected(); fitOverview();
  }
  window.addEventListener('resize', () => { if (state.model && state.category === 'all' && !state.query.trim()) { render(); fitOverview(); } });
  window.addEventListener('hashchange', () => { if (state.model) restore(); });
  async function start() {
    const request = ++loadRequest;
    $('[data-retry]').hidden = true; $('[data-search]').disabled = true;
    $('[data-status]').textContent = 'Devkit 데이터를 불러오는 중…';
    const sources = await Promise.allSettled([
      fetchCatalog(root.dataset.catalog || base + 'cli/catalog.json').then(data => validateCatalog(data, 'categories')),
      fetchCatalog(root.dataset.cheatsheets || base + 'cheatsheets/catalog.json').then(data => validateCatalog(data, 'groups')),
    ]);
    if (request !== loadRequest) return;
    const [map, sheets] = sources;
    if (sources.every(source => source.status === 'rejected')) {
      $('[data-status]').textContent = 'Devkit 데이터를 불러오지 못했습니다. 네트워크 연결을 확인하고 다시 시도하세요.';
      $('[data-retry]').hidden = false; return;
    }
    try {
      state.model = buildModel(map.status === 'fulfilled' ? map.value : undefined, sheets.status === 'fulfilled' ? sheets.value : undefined);
      state.groups = navigationGroups(state.model);
      state.error = map.status === 'rejected' ? '관계 데이터를 불러오지 못했습니다. 치트시트 목록은 이용할 수 있습니다.' : sheets.status === 'rejected' ? '치트시트 데이터를 불러오지 못했습니다. 지도와 tldr는 이용할 수 있습니다.' : '';
      $('[data-search]').disabled = false; restore();
    } catch {
      $('[data-status]').textContent = '카탈로그 형식을 확인하지 못했습니다. 다시 시도하세요.'; $('[data-retry]').hidden = false;
    }
  }
  start();
}
