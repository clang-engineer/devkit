const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = path.resolve(__dirname, '..');
const reference = JSON.parse(fs.readFileSync(path.join(base, 'reference/catalog.json')));
const cli = reference.tool_map;
const sheets = reference.cheatsheets;

test('reference catalog keeps tool map and cheatsheet index', () => {
  assert.equal(reference.version, 1);
  assert.ok(Array.isArray(cli.categories));
  assert.ok(Array.isArray(sheets.groups));
  assert.ok(cli.categories.length > 0);
  assert.ok(sheets.groups.length > 0);
});

test('every CLI category has commands and relation arrays', () => {
  for (const category of cli.categories) {
    assert.equal(typeof category.name, 'string');
    assert.ok(Array.isArray(category.commands), category.name);
    assert.ok(Array.isArray(category.relations), category.name);
    for (const command of category.commands) assert.equal(typeof command.name, 'string');
    for (const relation of category.relations) {
      assert.equal(typeof relation.from, 'string');
      assert.equal(typeof relation.to, 'string');
    }
  }
});

test('every full cheatsheet file exists', () => {
  const slugs = new Set();
  for (const item of [...sheets.groups.flatMap(group => group.items), ...(sheets.guides || [])]) {
    assert.match(item.slug, /^[a-z0-9_-]+$/);
    assert.equal(slugs.has(item.slug), false, `duplicate slug: ${item.slug}`);
    slugs.add(item.slug);
    if (item.file) assert.ok(fs.existsSync(path.join(base, 'reference/cheatsheets', item.file)), item.file);
  }
});

test('Go embedded view resolves category references without changing relations', () => {
  const embedded = JSON.parse(fs.readFileSync(path.join(base, 'cmdtreemap/catalog.json')));
  const definitions = cli.categories.flatMap(category => category.commands).filter(command => command.description);
  assert.equal(embedded.title, cli.title);
  assert.equal(embedded.categories.length, cli.categories.length);
  for (const [index, category] of cli.categories.entries()) {
    const actual = embedded.categories[index];
    assert.equal(actual.name, category.name);
    assert.deepEqual(actual.relations, category.relations);
    assert.deepEqual(actual.commands.map(command => command.name), category.commands.map(command => command.name));
    for (const command of actual.commands) {
      const original = definitions.find(item => item.name.toLowerCase() === command.name.toLowerCase());
      if (original) assert.equal(command.description, original.description, command.name);
    }
  }
});
test('each tool description has one canonical category definition', () => {
  const seen = new Set();
  for (const command of cli.categories.flatMap(category => category.commands).filter(command => command.description)) {
    const key = command.name.toLowerCase();
    assert.ok(!seen.has(key), command.name);
    seen.add(key);
  }
});
test('current plugin and history scopes do not create editor replacement edges', () => {
  const history = cli.categories.find(category => category.name === 'Command History');
  assert.ok(history.commands.some(command => command.name === 'atuin'));
  assert.ok(!cli.categories.find(category => category.name === 'Shell').commands.some(command => command.name === 'history'));
  const relations = cli.categories.flatMap(category => category.relations);
  assert.ok(!relations.some(edge => edge.from === 'vim' && edge.to === 'vim-dadbod-ui'));
  const plugin = cli.categories.find(category => category.id === 'role:database').commands.find(command => command.name === 'vim-dadbod-ui');
  assert.deepEqual(plugin.hosts, ['neovim']);
  assert.ok(plugin.description.includes('플러그인'));
  assert.ok(plugin.links.some(link => link.label === '내 설정'));
  for (const guide of sheets.guides || []) {
    assert.equal(guide.kind, 'guide');
    assert.ok(fs.existsSync(path.join(base, 'reference/cheatsheets', guide.file)), guide.slug);
  }
});
