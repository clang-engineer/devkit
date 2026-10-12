const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const modules = Promise.all([
  import('../explorer/core/catalog.js'),
  import('../explorer/core/navigation.js'),
  import('../explorer/graph/overview.js'),
]).then(parts => Object.assign({}, ...parts));
const reference = JSON.parse(fs.readFileSync(path.join(base, 'reference/catalog.json')));
const cli = reference.tool_map;
const sheets = reference.cheatsheets;

test('every original category belongs to exactly one navigation group; all tools remain reachable', async () => {
  const { buildModel, navigationGroups } = await modules;
  const model = buildModel(cli, sheets), groups = navigationGroups(model);
  assert.deepEqual(groups.flatMap(g => g.categories.map(c => c.id)).sort(), model.categories.map(c => c.id).sort());
  assert.equal(new Set(groups.flatMap(g => [...g.tools])).size, model.tools.size);
  for (const name of ['File Operations', 'Text Search', 'Text Processing', 'System Monitoring']) {
    assert.ok(groups.find(g => g.id === 'domain:cli').categories.some(c => c.name === name));
  }
});
test('domain filter is a union while searches ignore the current domain', async () => {
  const { buildModel, navigationGroups, explorerFilter } = await modules;
  const model = buildModel(cli, sheets), groups = navigationGroups(model);
  const terminal = explorerFilter(model, groups, 'domain:terminal');
  assert.ok(terminal.visible.has('tmux')); assert.ok(!terminal.visible.has('fd'));
  const search = explorerFilter(model, groups, 'domain:terminal', 'fd');
  assert.ok(search.matches.has('fd')); assert.ok(search.visible.has('find'));
});
test('new categories fall back to References instead of being discarded', async () => {
  const { buildModel, navigationGroups } = await modules;
  const model = buildModel({ categories: [{ name: 'New field', commands: [{ name: 'new-tool' }], relations: [] }] });
  assert.equal(navigationGroups(model)[0].id, 'domain:reference');
  assert.ok(navigationGroups(model)[0].tools.has('new-tool'));
});
test('new hashes survive category reorder and legacy sheet hashes open usage', async () => {
  const { buildModel, navigationGroups, readExplorerHash } = await modules;
  const model = buildModel(cli, sheets), groups = navigationGroups(model);
  const legacy = readExplorerHash('#view=sheet&tool=fd', model, groups);
  assert.equal(legacy.tool, 'fd'); assert.equal(legacy.tab, 'usage'); assert.notEqual(legacy.category, 'all');
  const original = readExplorerHash('#scope=File+Operations&tool=fd&tab=resources', model, groups);
  assert.equal(model.categories.find(c => c.id === original.category).name, 'File Operations');
  const reordered = buildModel({ ...cli, categories: [...cli.categories].reverse() }, sheets);
  const restored = readExplorerHash('#scope=File+Operations&tool=fd&tab=resources', reordered, navigationGroups(reordered));
  assert.equal(reordered.categories.find(c => c.id === restored.category).name, 'File Operations');
  assert.equal(restored.tab, 'resources');
  const whole = readExplorerHash('#scope=all&tool=fd&tab=usage', model, groups);
  assert.equal(whole.category, 'all'); assert.equal(whole.tool, 'fd');
});
test('overview only renders expanded categories, escapes catalog labels, and has no fabricated tool edges', async () => {
  const { buildModel, navigationGroups, overviewHtml } = await modules;
  const groups = navigationGroups(buildModel({ categories: [{ name: '<unsafe>', commands: [{ name: 'cat' }], relations: [] }] }));
  assert.ok(!overviewHtml(groups, new Set()).includes('data-category="map-0"'));
  const html = overviewHtml(groups, new Set(['domain:reference']));
  assert.match(html, /data-category="map-0"/); assert.match(html, /&lt;unsafe&gt;/);
  assert.ok(!html.includes('<unsafe>')); assert.ok(!html.includes('data-edge='));
  assert.match(html, /aria-expanded="true"/);
});
