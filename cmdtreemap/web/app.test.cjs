const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup(relations = [{ from: 'cat', to: 'bat', why: '<script>bad</script>' }]) {
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
  const context = vm.createContext({
    window: {}, document: { querySelector: () => root }, fixtureRelations: relations,
    history: { replaceState() {} },
    fetch: async () => ({ ok: false }),
  });
  vm.runInContext(readFileSync(`${__dirname}/app.js`, 'utf8'), context);
  vm.runInContext(`state.data = { categories: [{ name: 'test', relations: fixtureRelations }] }; renderTree();`, context);
  return { context, elements };
}

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
