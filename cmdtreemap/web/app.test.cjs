const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup() {
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
    window: {}, document: { querySelector: () => root },
    history: { replaceState() {} },
    fetch: async () => ({ ok: false }),
  });
  vm.runInContext(readFileSync(`${__dirname}/app.js`, 'utf8'), context);
  vm.runInContext(`state.data = { categories: [{ name: 'test', relations: [
    { from: 'cat', to: 'bat', why: '<script>bad</script>' }
  ] }] }; renderTree();`, context);
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
