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
  for (const group of sheets.groups) for (const item of group.items) {
    assert.match(item.slug, /^[a-z0-9_-]+$/);
    assert.equal(slugs.has(item.slug), false, `duplicate slug: ${item.slug}`);
    slugs.add(item.slug);
    if (item.file) assert.ok(fs.existsSync(path.join(base, 'reference/cheatsheets', item.file)), item.file);
  }
});

test('Go embedded catalog remains equivalent to the tool map in the canonical source', () => {
  const embedded = JSON.parse(fs.readFileSync(path.join(base, 'cmdtreemap/catalog.json')));
  assert.deepEqual(embedded, cli);
});
