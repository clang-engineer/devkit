import { fetchCatalog } from '../core/reference-data.js';
import { buildModel, validateCatalog } from '../core/catalog.js';
import { navigationGroups, explorerFilter, readExplorerHash } from '../core/navigation.js';
import { overviewHtml } from '../graph/overview.js';
import { shellHtml, renderNavigation, renderMap, renderList } from './views.js';
import { createDetailPanel } from './details.js';

const instances = new WeakMap();

export function mount(root) {
  if (!root) return;
  if (instances.has(root)) return instances.get(root);
  const document = root.ownerDocument;
  const window = document.defaultView;
  const { location, history } = window;
  const fetchImpl = window.fetch.bind(window);
  const matchMedia = window.matchMedia.bind(window);
  const lifetime = new window.AbortController();
  const listen = (target, type, callback) => target.addEventListener(type, callback, { signal: lifetime.signal });
  root.dataset.devkitMounted = 'true';
  const base = 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/';
  const defaults = root.dataset.defaultView === 'sheet' ? 'sheet' : 'map';
  const state = { model: null, groups: [], expanded: new Set(), tool: '', category: 'all', query: '', tab: 'about', zoom: 1, error: '', edge: '' };
  let loadRequest = 0;
  let catalogRequest;
  root.classList.add('dk-app');
  root.innerHTML = shellHtml;
  const $ = selector => root.querySelector(selector);
  const viewport = $('[data-viewport]'), stage = $('[data-stage]'), panel = $('[data-detail]');
  const details = createDetailPanel(panel, { fetchImpl, clipboard: window.navigator?.clipboard });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function remember() {
    const scope = state.model.categories.find(category => category.id === state.category)?.name || state.category;
    const hash = new URLSearchParams({ scope, tab: state.tab });
    if (state.expanded.size) hash.set('open', [...state.expanded].join(','));
    if (state.tool) hash.set('tool', state.tool);
    if (state.query) hash.set('q', state.query);
    history.replaceState(null, '', '#' + hash);
  }
  function render() {
    if (!state.model) return;
    const filtered = explorerFilter(state.model, state.groups, state.category, state.query);
    const overview = state.category === 'all' && !state.query.trim();
    root.dataset.currentView = 'explorer';
    renderNavigation($, state);
    $('[data-status]').textContent = state.error || (overview ? `${state.model.tools.size}개 도구 · ${state.model.edges.length}개 관계 · 분야를 펼치거나 검색하세요` : `${filtered.matches.size}개 도구 · ${filtered.edges.length}개 관계${state.query ? ' · 모든 분야 검색' : ''}`);
    $('[data-retry]').hidden = !state.error;
    $('[data-results]').hidden = !state.query.trim();
    $('[data-overview-actions]').hidden = !overview;
    if (state.query.trim()) renderList($('[data-list]'), state, filtered); else $('[data-list]').innerHTML = '';
    if (overview) stage.innerHTML = overviewHtml(state.groups, state.expanded, state.zoom, viewport.clientWidth < 560 ? 2 : 3);
    else renderMap(stage, state, filtered);
    $('[data-legend]').textContent = overview ? '전체 조망의 선은 분류를 뜻합니다. +로 세부 분류를 펼치고 관계도로 들어가세요.' : '실선: 대안·대체·특화 / 점선: 보완·래퍼. 관계는 학습 순서나 출시 연대가 아닙니다. 배경을 드래그하거나 스크롤해 이동하세요.';
    $('[data-scale]').textContent = Math.round(state.zoom * 100) + '%';
    highlight();
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
    details.show(state.model, state.tool, state.tab, state.edge);
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
    } else if ('tldrRetry' in data) details.retry();
    else if ('copy' in data) details.copy(element);
  }
  listen(root, 'click', activate);
  listen(root, 'keydown', event => {
    if (event.target.matches('[data-tool], [data-edge], [data-category], [data-expand]') && event.target.tagName.toLowerCase() === 'g' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); activate(event); }
  });
  listen($('[data-search]'), 'input', event => {
    state.query = event.target.value; render(); remember(); viewport.scrollTop = 0; viewport.scrollLeft = 0;
  });
  listen($('[data-search]'), 'keydown', event => {
    if (!state.model) return;
    if (event.key === 'Escape') { state.query = ''; event.target.value = ''; render(); remember(); }
    if (event.key === 'Enter') {
      const first = $('[data-list]').querySelector('[data-quick]');
      if (first) { event.preventDefault(); findTool(first.dataset.quick, 'usage'); }
    }
  });
  let drag = null;
  listen(viewport, 'pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('[data-tool], [data-edge], [data-category], [data-expand]')) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging'); event.preventDefault();
  });
  listen(viewport, 'pointermove', event => {
    if (!drag) return;
    viewport.scrollLeft = drag.left + drag.x - event.clientX; viewport.scrollTop = drag.top + drag.y - event.clientY;
  });
  const stopDrag = () => { drag = null; viewport.classList.remove('is-dragging'); };
  listen(viewport, 'pointerup', stopDrag); listen(viewport, 'pointercancel', stopDrag); listen(viewport, 'lostpointercapture', stopDrag);
  if (document.fullscreenEnabled && root.requestFullscreen) {
    $('[data-fullscreen]').hidden = false;
    listen($('[data-fullscreen]'), 'click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); } catch { /* Keep the normal responsive view available. */ }
    });
    listen(document, 'fullscreenchange', () => { $('[data-fullscreen]').textContent = document.fullscreenElement ? '전체 화면 닫기' : '전체 화면 ⛶'; });
  }
  function restore() {
    Object.assign(state, readExplorerHash(location.hash, state.model, state.groups, defaults));
    $('[data-search]').value = state.query; render(); if (state.tool) choose(state.tool, false); else renderDetail(); centerSelected(); fitOverview();
  }
  listen(window, 'resize', () => { if (state.model && state.category === 'all' && !state.query.trim()) { render(); fitOverview(); } });
  listen(window, 'hashchange', () => { if (state.model) restore(); });
  async function start() {
    const request = ++loadRequest;
    catalogRequest?.abort();
    catalogRequest = new window.AbortController();
    const options = { fetchImpl, signal: catalogRequest.signal };
    $('[data-retry]').hidden = true; $('[data-search]').disabled = true;
    $('[data-status]').textContent = 'Devkit 데이터를 불러오는 중…';
    const sources = await Promise.allSettled([
      fetchCatalog(root.dataset.catalog || base + 'cli/catalog.json', options).then(data => validateCatalog(data, 'categories')),
      fetchCatalog(root.dataset.cheatsheets || base + 'cheatsheets/catalog.json', options).then(data => validateCatalog(data, 'groups')),
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
  const api = {
    ready: null,
    destroy() {
      if (lifetime.signal.aborted) return;
      ++loadRequest;
      catalogRequest?.abort();
      lifetime.abort();
      details.destroy();
      instances.delete(root);
      delete root.dataset.devkitMounted;
      root.innerHTML = '';
    },
  };
  instances.set(root, api);
  api.ready = start();
  return api;
}
