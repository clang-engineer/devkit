import { escapeHtml as esc, fetchCatalog } from '../core/reference-data.js';
import { RELATIONS, buildModel, filterModel, readHash, safeUrl, validateCatalog } from '../core/catalog.js';
import { layoutCategory } from '../graph/layout.js';
import { parseTldr, tldrPaths } from '../integrations/tldr.js';

export function mount(root) {
  if (!root || root.dataset.devkitMounted === 'true') return;
  root.dataset.devkitMounted = 'true';
  const base = 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/';
  const defaults = root.dataset.defaultView === 'sheet' ? 'sheet' : 'map';
  const state = { model: null, view: defaults, tool: '', category: 'all', query: '', tab: 'about', zoom: 1, error: '', edge: '' };
  const tldrCache = new Map();
  let tldrRequest = 0, loadRequest = 0;
  root.classList.add('dk-app');
  root.innerHTML = `
    <div class="dk-heading"><div><p class="dk-eyebrow">DEVKIT / TOOL EXPLORER</p><p class="dk-intro">도구의 관계를 살펴보고, 필요한 사용법으로 이어집니다.</p></div>
      <button type="button" data-fullscreen hidden aria-label="Devkit 전체 화면">전체 화면 ⛶</button></div>
    <div class="dk-topbar"><div class="dk-views" role="group" aria-label="보기 방식">
      <button type="button" data-view="map">도구 지도</button><button type="button" data-view="sheet">치트시트</button></div>
      <label class="dk-search"><span class="dk-sr">도구 검색</span><input type="search" data-search placeholder="도구 검색 · fd, tmux, Helix…" autocomplete="off" disabled></label></div>
    <div class="dk-categories" data-categories role="group" aria-label="분야 선택"></div>
    <div class="dk-statusbar"><p data-status role="status">Devkit 데이터를 불러오는 중…</p><button type="button" data-retry hidden>다시 시도</button></div>
    <p class="dk-sr" data-announcement role="status"></p>
    <div class="dk-layout"><section class="dk-explorer" aria-label="도구 탐색">
      <div class="dk-maptools" data-maptools><span>배경을 드래그해 이동 · 도구와 연결선 선택</span><div>
        <button type="button" data-zoom="out" aria-label="지도 축소">−</button><output data-scale>100%</output>
        <button type="button" data-zoom="in" aria-label="지도 확대">+</button><button type="button" data-zoom="fit">맞춤</button><button type="button" data-zoom="reset">초기화</button></div></div>
      <div class="dk-viewport" data-viewport tabindex="0" aria-label="도구 지도. 방향키로 이동하고 Tab으로 도구를 선택합니다."><div class="dk-stage" data-stage></div></div>
      <div class="dk-list" data-list hidden aria-label="치트시트 도구 목록"></div>
      <p class="dk-legend" data-legend>실선: 대안·대체·특화 / 점선: 보완·래퍼. 연결선은 학습 순서나 출시 연대를 뜻하지 않습니다.</p>
    </section><aside class="dk-detail" data-detail aria-label="선택한 도구 상세"><div class="dk-placeholder"><span>↖</span><h2>궁금한 도구를 골라보세요</h2><p>소개와 관계, tldr 빠른 예시, 긴 치트시트와 공식 문서를 한곳에서 찾습니다.</p></div></aside></div>`;
  const $ = selector => root.querySelector(selector);
  const viewport = $('[data-viewport]'), stage = $('[data-stage]'), panel = $('[data-detail]');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function remember() {
    const hash = new URLSearchParams({ view: state.view });
    if (state.tool) hash.set('tool', state.tool);
    if (state.category !== 'all') hash.set('category', state.category);
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
  function render() {
    if (!state.model) return;
    const { model } = state, filtered = filterModel(model, state.category, state.query);
    root.dataset.currentView = state.view;
    root.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
    $('[data-categories]').innerHTML = [{ id: 'all', name: '전체' }, ...model.categories].map(category =>
      `<button type="button" data-category="${esc(category.id)}" aria-pressed="${category.id === state.category}">${esc(category.name)}</button>`).join('');
    const count = filtered.matches.size;
    $('[data-status]').textContent = state.error || `${count}개 항목${state.view === 'map' ? ` · ${filtered.edges.length}개 관계` : ' · 같은 목록을 사용법 중심으로 보기'}`;
    $('[data-retry]').hidden = !state.error;
    viewport.hidden = state.view !== 'map';
    $('[data-maptools]').hidden = state.view !== 'map';
    $('[data-legend]').hidden = state.view !== 'map';
    $('[data-list]').hidden = state.view !== 'sheet';
    if (state.view === 'map') renderMap(filtered); else renderList(filtered);
    highlight();
  }
  function renderMap(filtered) {
    stage.innerHTML = '';
    for (const category of state.model.categories) {
      if (state.category !== 'all' && category.id !== state.category) continue;
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
    $('[data-list]').innerHTML = [...filtered.matches].map(id => {
      const tool = state.model.tools.get(id);
      return `<button type="button" class="dk-tool-row" data-tool="${esc(id)}" aria-pressed="false"><span class="dk-row-title">${esc(tool.name)}</span><span class="dk-row-desc">${esc(tool.description || '도구 설명과 참고 자료 보기')}</span><span class="dk-row-resources">${[tool.tldr && 'tldr', tool.custom.length && '내 치트시트', tool.official.length && '공식 문서'].filter(Boolean).join(' · ') || '소개·관계'}</span></button>`;
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
    if (state.view !== 'map') return;
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
    if (!tool) { panel.innerHTML = '<div class="dk-placeholder"><h2>도구를 선택하세요</h2><p>지도와 치트시트는 같은 도구 목록을 사용합니다.</p></div>'; return; }
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
  function activate(event) {
    const element = event.target.closest('button, [data-tool], [data-edge]');
    if (!element || !root.contains(element)) return;
    const data = element.dataset;
    if ('retry' in data) { start(); return; }
    if (!state.model) return;
    if (data.view) {
      state.view = data.view; state.tab = data.view === 'sheet' ? 'usage' : 'about';
      render(); renderDetail(); centerSelected(); remember();
    } else if (data.category) {
      state.category = data.category; state.zoom = 1;
      render(); setZoom(1); viewport.scrollTop = 0; viewport.scrollLeft = 0; remember();
      if (event.detail === 0) $('[data-category="' + data.category + '"]').focus();
    } else if (data.tool) choose(data.tool);
    else if (data.edge) {
      const edge = state.model.edges.find(item => item.id === data.edge);
      if (edge) { state.tab = 'about'; choose(edge.to); state.edge = edge.id; renderDetail(); }
    } else if (data.related) {
      state.category = 'all'; state.query = ''; $('[data-search]').value = '';
      render(); choose(data.related, false);
      const node = [...stage.querySelectorAll('[data-tool]')].find(item => item.dataset.tool === data.related);
      node?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    } else if (data.tab) { state.tab = data.tab; renderDetail(); if (event.detail === 0) $('[data-tab="' + data.tab + '"]').focus(); }
    else if (data.zoom) {
      if (data.zoom === 'fit') {
        const width = Math.max(1, ...[...stage.querySelectorAll('svg')].map(svg => Number(svg.dataset.width)));
        setZoom(Math.min(1, (viewport.clientWidth - 36) / width)); viewport.scrollLeft = 0;
      } else setZoom(data.zoom === 'reset' ? 1 : state.zoom + (data.zoom === 'in' ? .15 : -.15));
    } else if ('retry' in data) start();
    else if ('tldrRetry' in data) loadTldr(state.model.tools.get(state.tool), $('[data-tldr]'), ++tldrRequest);
  }
  root.addEventListener('click', activate);
  root.addEventListener('keydown', event => {
    if (event.target.matches('[data-tool], [data-edge]') && event.target.tagName.toLowerCase() === 'g' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); activate(event); }
  });
  $('[data-search]').addEventListener('input', event => {
    state.query = event.target.value; render(); remember(); viewport.scrollTop = 0; viewport.scrollLeft = 0;
  });
  let drag = null;
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('[data-tool], [data-edge]')) return;
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
    Object.assign(state, readHash(location.hash, state.model, defaults));
    state.tab = state.view === 'sheet' ? 'usage' : 'about';
    $('[data-search]').value = state.query; render(); if (state.tool) choose(state.tool, false); else renderDetail(); centerSelected();
  }
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
      state.error = map.status === 'rejected' ? '관계 데이터를 불러오지 못했습니다. 치트시트 목록은 이용할 수 있습니다.' : sheets.status === 'rejected' ? '치트시트 데이터를 불러오지 못했습니다. 지도와 tldr는 이용할 수 있습니다.' : '';
      $('[data-search]').disabled = false; restore();
    } catch {
      $('[data-status]').textContent = '카탈로그 형식을 확인하지 못했습니다. 다시 시도하세요.'; $('[data-retry]').hidden = false;
    }
  }
  start();
}
