const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup(relations = [{ from: 'cat', to: 'bat', solution: '<script>bad</script>' }], source) {
  const elements = new Map();
  function element() {
    return {
      innerHTML: '', hidden: true, dataset: {},
      classList: { add() {}, toggle() {} },
      listeners: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute() {}, scrollIntoView() {}, contains() { return true; },
      querySelectorAll() { return []; },
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, element());
        return elements.get(selector);
      },
    };
  }
  const root = element();
  if (source) root.dataset.source = source;
  const requests = [];
  const context = vm.createContext({
    window: {}, document: { querySelector: () => root }, fixtureRelations: relations,
    history: { replaceState() {} },
    fetch: async (url) => { requests.push(url); return { ok: false }; },
  });
  vm.runInContext(readFileSync(`${__dirname}/app.js`, 'utf8'), context);
  vm.runInContext(`state.data = { categories: [{ name: 'test', relations: fixtureRelations }] }; renderTree();`, context);
  return { context, elements, requests };
}

test('local and deployed pages load their configured shared data paths', () => {
  assert.equal(setup([], '../commands.json').requests[0], '../commands.json');
  assert.equal(setup([], './commands.json').requests[0], './commands.json');
  assert.equal(setup([]).requests[0], './commands.json');
});

test('tree escapes data and uses one delegated click listener', () => {
  const { context, elements } = setup();
  const tree = elements.get('[data-tree]');
  assert.ok(tree.innerHTML.includes('&lt;script&gt;'));
  assert.ok(!tree.innerHTML.includes('<script>'));
  const button = { dataset: { relation: '0:0' } };
  tree.listeners.click({ target: { closest: () => button } });
  assert.equal(vm.runInContext('state.selected', context), '0:0');
});

test('chains and branches retain source order', () => {
  const { context } = setup([
    { from: 'top', to: 'htop' }, { from: 'htop', to: 'btop' },
    { from: 'top', to: 'atop' },
  ]);
  const forest = JSON.parse(vm.runInContext('JSON.stringify(buildCategoryForest(state.data.categories[0]))', context));
  assert.equal(forest[0].name, 'top');
  assert.deepEqual(forest[0].children.map(n => n.name), ['htop', 'atop']);
  assert.equal(forest[0].children[0].children[0].name, 'btop');
});

test('folders start collapsed, expand for search, and collapse when cleared', () => {
  const { context, elements } = setup([{ from: 'cat', to: 'bat' }]);
  const tree = elements.get('[data-tree]');
  assert.ok(!tree.innerHTML.includes(' open>'));
  vm.runInContext("state.query = 'bat'; renderTree()", context);
  assert.match(tree.innerHTML, /class="cmdtreemap-category" open>/);
  assert.match(tree.innerHTML, /class="cmdtreemap-branch" open>/);
  vm.runInContext("state.query = ' '; renderTree()", context);
  assert.ok(!tree.innerHTML.includes(' open>'));
});

test('search retains ancestors but removes unrelated branches', () => {
  const { context, elements } = setup([
    { from: 'top', to: 'htop' }, { from: 'htop', to: 'btop' },
    { from: 'top', to: 'atop' },
  ]);
  vm.runInContext("state.query = 'btop'; renderTree()", context);
  const html = elements.get('[data-tree]').innerHTML;
  assert.ok(html.includes('<summary>top</summary>'));
  assert.ok(html.includes('data-relation="0:0"'));
  assert.ok(html.includes('data-relation="0:1"'));
  assert.ok(!html.includes('data-relation="0:2"'));
});

test('shared destinations keep distinct incoming relations', () => {
  const { context } = setup([{ from: 'a', to: 'c' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' }]);
  const forest = JSON.parse(vm.runInContext('JSON.stringify(buildCategoryForest(state.data.categories[0]))', context));
  assert.equal(forest[0].children[0].relationIndex, 0);
  assert.equal(forest[1].children[0].relationIndex, 1);
  assert.equal(forest[0].children[0].children[0].name, 'd');
  assert.equal(forest[1].children[0].children[0].name, 'd');
});

test('disconnected cycles and self loops terminate without losing edges', () => {
  const { context } = setup([
    { from: 'a', to: 'b' }, { from: 'b', to: 'a' }, { from: 'x', to: 'x' },
  ]);
  const forest = JSON.parse(vm.runInContext('JSON.stringify(buildCategoryForest(state.data.categories[0]))', context));
  assert.equal(forest.length, 2);
  assert.equal(forest[0].children[0].children[0].cycle, true);
  assert.deepEqual(forest[0].children[0].children[0].children, []);
  assert.equal(forest[1].children[0].cycle, true);
});

test('tree shows improvements and detail explains the original problem', () => {
  const { context, elements } = setup([{ from: 'cat', to: 'bat', why: '구문강조 없음', solution: '구문강조, 줄번호, Git 표시', boundary: '완전 대체 아님' }]);
  const html = elements.get('[data-tree]').innerHTML;
  assert.equal((html.match(/<li>/g) || []).length, 2);
  const button = html.match(/<button[\s\S]*?<\/button>/)[0];
  assert.ok(button.includes('bat'));
  assert.match(button, /<strong>bat<\/strong><span class="cmdtreemap-improvement"> — 구문강조 · 줄번호<\/span>/);
  assert.ok(!button.includes('구문강조 없음'));
  vm.runInContext("selectRelation('0:0')", context);
  const detail = elements.get('[data-detail]').innerHTML;
  for (const text of ['cat의 문제', '구문강조 없음', 'bat의 개선점', '구문강조, 줄번호, Git 표시', '남은 한계']) assert.ok(detail.includes(text));
  assert.equal(vm.runInContext("improvementSummary(' , a, b, c')", context), 'a · b');
  assert.equal(vm.runInContext("improvementSummary('가'.repeat(49)).length", context), 49);
});

test('missing solutions do not show empty summaries', () => {
  const { elements } = setup([{ from: 'cat', to: 'bat' }]);
  assert.ok(!elements.get('[data-tree]').innerHTML.includes('cmdtreemap-improvement'));
});

test('empty categories render no results', () => {
  const { elements } = setup([]);
  assert.ok(elements.get('[data-tree]').innerHTML.includes('검색 결과가 없습니다'));
});

test('selection preserves tree DOM and search hides details', () => {
  const { context, elements } = setup();
  const tree = elements.get('[data-tree]');
  tree.innerHTML = 'existing collapsed tree';
  vm.runInContext("selectRelation('0:0')", context);
  assert.equal(tree.innerHTML, 'existing collapsed tree');
  assert.equal(elements.get('[data-detail]').hidden, false);
  elements.get('[data-search]').listeners.input({ target: { value: 'missing' } });
  assert.equal(elements.get('[data-detail]').hidden, true);
  assert.ok(tree.innerHTML.includes('검색 결과가 없습니다'));
});
