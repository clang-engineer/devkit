// Run the shared explorer and its view model, not the retired page renderers.
require('./model.test.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { resolve } = require('node:path');
const base = resolve(__dirname, '..');
const source = name => readFileSync(resolve(base, 'src', name), 'utf8');
const bundle = ['core/reference-data.js', 'core/catalog.js', 'graph/layout.js', 'integrations/tldr.js'].map(file => source(file).replace(/^export /gm, '')).join('\n') + '\nconst esc = escapeHtml;\n' + source('ui/explorer.js').replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + 
  '\nconst root = document.querySelector(\'[data-devkit]\'); if (root) mount(root);';
const remote = 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/';

// Small DOM doubles for network/error/escaping contracts; real-browser layout
// and interaction tests are separate. Never evaluate fetched Markdown or HTML.
function node() {
  let html = '';
  return {
    textContent: '', hidden: false, disabled: false, dataset: {}, listeners: {}, children: [],
    isConnected: true, scrollTop: 0, scrollLeft: 0, clientWidth: 800, clientHeight: 600,
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; this.children = []; },
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    querySelectorAll() { return []; },
    setAttribute() {}, focus() {}, scrollIntoView() {},
    append(child) { this.children.push(child); }, contains() { return true; },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
async function setup(fetch, hash = '', view = 'map') {
  const elements = new Map();
  const get = selector => { if (!elements.has(selector)) elements.set(selector, node()); return elements.get(selector); };
  const root = node(); root.querySelector = get; root.dataset.defaultView = view;
  const location = { hash };
  const context = vm.createContext({
    document: { querySelector: () => root, createElement: node, fullscreenEnabled: false },
    window: { addEventListener() {} }, location,
    history: { replaceState(_state, _title, hash) { location.hash = hash; } },
    matchMedia: () => ({ matches: false }), fetch, URL, URLSearchParams, AbortSignal,
  });
  vm.runInContext(bundle, context);
  await settle();
  return { get, root, context, location,
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
  await s.click({ view: 'sheet' }); // navigation cannot crash before the model exists
  fail = false;
  await s.click({ retry: '' });
  assert.equal(s.get('[data-retry]').hidden, true);
  assert.equal(s.get('[data-search]').disabled, false);
  assert.ok(s.get('[data-stage]').children.some(board => board.innerHTML.includes('bat')));
});
test('one-source failure keeps other content available and retry removes the warning', async () => {
  let fail = true;
  const s = await setup(async url => { if (fail && url.endsWith('/cheatsheets/catalog.json')) throw Error('offline'); return response(url); });
  assert.equal(s.get('[data-search]').disabled, false);
  assert.equal(s.get('[data-retry]').hidden, false);
  assert.ok(s.get('[data-stage]').children.length > 0);
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
test('the same selected tool survives map/sheet switching and deep links', async () => {
  const s = await setup(async url => response(url), '#cat');
  await s.click({ view: 'sheet' });
  assert.match(s.location.hash, /view=sheet/); assert.match(s.location.hash, /tool=cat/);
  assert.match(s.get('[data-detail]').innerHTML, /&lt;cat&gt;/);
  assert.match(s.get('[data-list]').innerHTML, /data-tool="bat"/);
  await s.click({ view: 'map' });
  assert.match(s.location.hash, /view=map/); assert.match(s.location.hash, /tool=cat/);
  assert.match(s.get('[data-detail]').innerHTML, /&lt;cat&gt;/);
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
