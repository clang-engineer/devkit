// Native module integration tests; the DOM double only supplies host APIs.
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const explorerModule = import('../src/ui/explorer.js');
const mounted = new Set();
afterEach(() => { for (const api of mounted) api.destroy(); mounted.clear(); });
const remote = 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/';

function node() {
  let html = '';
  return {
    textContent: '', hidden: false, disabled: false, dataset: {}, listeners: {}, children: [],
    isConnected: true, scrollTop: 0, scrollLeft: 0, clientWidth: 800, clientHeight: 600,
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; this.children = []; },
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn, { signal } = {}) {
      if (signal?.aborted) return;
      this.listeners[type] = fn;
      signal?.addEventListener('abort', () => {
        if (this.listeners[type] === fn) delete this.listeners[type];
      }, { once: true });
    },
    querySelectorAll() { return []; },
    querySelector() { return null; }, setAttribute() {}, focus() {}, scrollIntoView() {},
    append(child) { this.children.push(child); }, contains() { return true; },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
async function setup(fetch, hash = '', view = 'map') {
  const { mount } = await explorerModule;
  const elements = new Map();
  const location = { hash };
  const host = Object.assign(node(), {
    location, fetch, AbortController,
    matchMedia: () => ({ matches: false }),
    history: { replaceState(_state, _title, hash) { location.hash = hash; } },
  });
  const document = Object.assign(node(), { defaultView: host, fullscreenEnabled: false });
  const get = selector => {
    if (!elements.has(selector)) {
      const element = node(); element.ownerDocument = document;
      elements.set(selector, element);
    }
    return elements.get(selector);
  };
  document.createElement = () => Object.assign(node(), { ownerDocument: document });
  const root = node(); root.ownerDocument = document; root.querySelector = get;
  root.dataset.defaultView = view;
  get('[data-detail]').querySelector = get;
  const api = mount(root); mounted.add(api);
  await api.ready; await settle();
  return { get, root, host, api, location,
    async click(dataset) {
      const button = { dataset }; button.closest = () => button;
      root.listeners.click({ target: button, detail: 1 });
      await settle();
    },
  };
}
const map = { categories: [{ name: 'Files', commands: [{ name: 'cat' }], relations: [
  { from: 'cat', to: 'bat', relation: 'alternative', solution: 'colors', tldr: 'bat' },
] }] };
const sheets = { groups: [{ title: '도구', items: [{ slug: 'cat', name: '<cat>', desc: 'a & b',
  official: [{ url: 'javascript:alert(1)', label: 'bad' }, { url: 'https://example.com/?a=1&b=2', label: 'Docs' }],
  custom: { url: 'https://github.com/clang-engineer/devkit', label: '긴 원본' },
}] }] };
function response(url) { return { ok: true, json: async () => url.endsWith('/cli/catalog.json') ? map : sheets }; }

test('shared explorer fetches both originals without cache and safely renders document links', async () => {
  const requests = [];
  const s = await setup(async (url, options) => { requests.push([url, options.cache]); return response(url); }, '#cat', 'sheet');
  assert.deepEqual(requests, [[remote + 'cli/catalog.json', 'no-store'], [remote + 'cheatsheets/catalog.json', 'no-store']]);
  assert.equal(s.get('[data-search]').disabled, false);
  assert.match(s.get('[data-detail]').innerHTML, /&lt;cat&gt;/);
  assert.match(s.get('[data-detail]').innerHTML, /a &amp; b/);
  await s.click({ tab: 'resources' });
  const html = s.get('[data-body]').innerHTML;
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('https://example.com/?a=1&amp;b=2'));
  assert.ok(html.includes('https://github.com/clang-engineer/devkit'));
  assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
});
test('both-source failure exposes retry and successful retry restores the map', async () => {
  let fail = true;
  const s = await setup(async url => { if (fail) throw Error('offline'); return response(url); });
  assert.equal(s.get('[data-retry]').hidden, false);
  assert.equal(s.get('[data-search]').disabled, true);
  await s.click({ category: 'all' }); // navigation cannot crash before the model exists
  fail = false;
  await s.click({ retry: '' });
  assert.equal(s.get('[data-retry]').hidden, true);
  assert.equal(s.get('[data-search]').disabled, false);
  assert.match(s.get('[data-stage]').innerHTML, /Developer Tools/);
  await s.click({ category: 'map-0' });
  assert.ok(s.get('[data-stage]').children.some(board => board.innerHTML.includes('bat')));
});
test('one-source failure keeps other content available and retry removes the warning', async () => {
  let fail = true;
  const s = await setup(async url => { if (fail && url.endsWith('/cheatsheets/catalog.json')) throw Error('offline'); return response(url); });
  assert.equal(s.get('[data-search]').disabled, false);
  assert.equal(s.get('[data-retry]').hidden, false);
  assert.match(s.get('[data-stage]').innerHTML, /Developer Tools/);
  fail = false; await s.click({ retry: '' });
  assert.equal(s.get('[data-retry]').hidden, true);
});
test('invalid and duplicate source entries report errors rather than a blank success', async () => {
  const invalid = await setup(async () => ({ ok: true, json: async () => ({ categories: [{}] }) }));
  assert.equal(invalid.get('[data-retry]').hidden, false);
  assert.equal(invalid.get('[data-search]').disabled, true);
  const duplicate = structuredClone(sheets);
  duplicate.groups[0].items.push(duplicate.groups[0].items[0]);
  const s = await setup(async url => ({ ok: true, json: async () => url.endsWith('/cli/catalog.json') ? map : duplicate }));
  assert.equal(s.get('[data-retry]').hidden, false);
  assert.match(s.get('[data-status]').textContent, /치트시트 데이터를 불러오지 못/);
  assert.equal(s.get('[data-search]').disabled, false); // valid map is still useful
});
test('legacy sheet links open usage in the unified graph; selection survives returning to overview', async () => {
  const s = await setup(async url => response(url), '#view=sheet&tool=cat');
  assert.ok(!s.root.innerHTML.includes('data-view='));
  assert.match(s.get('[data-detail]').innerHTML, /&lt;cat&gt;/);
  assert.match(s.location.hash, /tab=usage/);
  assert.match(s.location.hash, /tool=cat/);
  await s.click({ category: 'all' });
  assert.match(s.location.hash, /scope=all/);
  assert.match(s.get('[data-stage]').innerHTML, /Developer Tools/);
  assert.match(s.get('[data-detail]').innerHTML, /&lt;cat&gt;/);
});
test('global search works from any category and offers direct usage', async () => {
  const s = await setup(async url => response(url));
  await s.click({ category: 'map-0' });
  s.get('[data-search]').listeners.input({ target: { value: 'bat' } });
  assert.equal(s.get('[data-results]').hidden, false);
  assert.match(s.get('[data-list]').innerHTML, /data-quick="bat"/);
  assert.match(s.get('[data-status]').textContent, /모든 분야 검색/);
});
test('overview expansion and collapse preserve all existing subcategories', async () => {
  const s = await setup(async url => response(url));
  assert.ok(!s.get('[data-stage]').innerHTML.includes('data-category="map-0"'));
  await s.click({ expandAll: '' });
  assert.match(s.get('[data-stage]').innerHTML, /data-category="map-0"/);
  await s.click({ collapseAll: '' });
  assert.ok(!s.get('[data-stage]').innerHTML.includes('data-category="map-0"'));
});
test('tldr retains placeholders, escapes content and falls back from common to platform pages', async () => {
  const requests = [];
  const s = await setup(async (url, options) => {
    requests.push([url, options.cache]);
    if (url.includes('/tldr/')) return url.includes('/common/') ? { status: 404, ok: false } :
      { ok: true, text: async () => '# bat\n- Read <script>:\n`bat {{file}}`' };
    return response(url);
  }, '#view=sheet&tool=bat');
  const html = s.get('[data-tldr]').innerHTML;
  assert.match(html, /bat \{\{file\}\}/); assert.match(html, /&lt;script&gt;/);
  assert.match(html, /CC BY 4.0/);
  assert.ok(requests.some(([url]) => url.includes('/common/bat.md')));
  assert.ok(requests.some(([url]) => url.includes('/linux/bat.md')));
});

test('mount is idempotent; destroy removes subscriptions and allows a fresh mount', async () => {
  const { mount } = await explorerModule;
  const s = await setup(async url => response(url));
  assert.equal(mount(s.root), s.api);
  assert.equal(typeof s.host.listeners.resize, 'function');
  s.api.destroy(); mounted.delete(s.api);
  assert.equal(s.host.listeners.resize, undefined);
  assert.equal(s.host.listeners.hashchange, undefined);
  assert.equal(s.root.listeners.click, undefined);
  const fresh = mount(s.root); mounted.add(fresh);
  assert.notEqual(fresh, s.api); await fresh.ready;
  s.api.destroy(); // a stale handle must not unmount the fresh instance
  assert.equal(mount(s.root), fresh);
  assert.equal(s.root.dataset.devkitMounted, 'true');
});
test('switching away from usage aborts the old request and cannot overwrite new details', async () => {
  let signal, finish;
  const s = await setup(async (url, options) => {
    if (url.includes('/tldr/')) {
      signal = options.signal;
      return new Promise(resolve => { finish = resolve; });
    }
    return response(url);
  }, '#view=sheet&tool=bat');
  assert.equal(signal.aborted, false);
  await s.click({ tab: 'resources' });
  assert.equal(signal.aborted, true);
  finish({ ok: true, text: async () => '# old\n- OLD:\n`old-command`' });
  await settle();
  assert.ok(!s.get('[data-body]').innerHTML.includes('old-command'));
});
