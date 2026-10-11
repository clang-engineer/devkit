const { test } = require('node:test');
const assert = require('node:assert/strict');
const modelModule = Promise.all([
  import('../src/core/catalog.js'),
  import('../src/graph/layout.js'),
  import('../src/integrations/tldr.js'),
]).then(parts => Object.assign({}, ...parts));
const map = { categories: [
  { name: 'File Operations', commands: [{ name: 'ls', tldr: 'ls' }, { name: 'lonely', description: '관계 없는 도구' }], relations: [
    { from: 'ls', to: 'eza', relation: 'alternative', solution: '색상 출력', url: 'https://example.org/eza', tldr: 'eza' },
    { from: 'grep', to: 'ripgrep', relation: 'alternative', tldr: 'rg' },
  ] },
  { name: 'Editors', commands: [{ name: 'nvim', description: '편집기' }], relations: [] },
] };
const cheats = { groups: [{ title: '에디터 & TUI', items: [
  { slug: 'neovim', name: 'Neovim', custom: { label: '긴 원문', url: 'https://example.org/neovim.md' } },
  { slug: 'rg', name: 'ripgrep', official: [{ label: '검색', url: 'https://example.org/rg' }] },
  { slug: 'custom-only', name: 'Custom only', desc: '치트시트에만 있는 항목', tldr: 'linux/custom-only' },
] }] };
test('merges matching IDs and known aliases without duplicating tools or losing long-document links', async () => {
  const { buildModel } = await modelModule;
  const model = buildModel(map, cheats);
  assert.equal(model.tools.size, 7);
  assert.equal(model.tools.get('neovim').name, 'Neovim');
  assert.equal(model.tools.get('neovim').custom[0].url, 'https://example.org/neovim.md');
  assert.equal(model.tools.get('ripgrep').official.length, 1);
  assert.ok(model.tools.has('lonely')); assert.ok(model.tools.has('custom-only'));
});
test('map and cheatsheet consume one list; map keeps one-hop context during search', async () => {
  const { buildModel, filterModel } = await modelModule;
  const model = buildModel(map, cheats);
  const result = filterModel(model, 'all', 'rg');
  assert.deepEqual([...result.matches], ['ripgrep']);
  assert.ok(result.visible.has('grep'));
  assert.equal(filterModel(model, 'map-1').matches.size, 1);
  assert.equal(filterModel(model, 'all', '색상').edges[0].to, 'eza');
});
test('finite layout for cycles, shared destinations, and isolated commands, with no lost nodes', async () => {
  const { layoutCategory } = await modelModule;
  const ids = ['a', 'b', 'c', 'd', 'isolated'];
  const graph = [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }, { from: 'b', to: 'c' }, { from: 'd', to: 'c' }];
  const layout = layoutCategory(ids, graph);
  assert.equal(layout.positions.size, ids.length);
  assert.equal(new Set([...layout.positions.values()].map(p => `${p.x},${p.y}`)).size, ids.length);
  for (const p of layout.positions.values()) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
});
test('tldr respects platform-qualified pages and rejects traversal or executable URLs', async () => {
  const { tldrPaths, safeUrl } = await modelModule;
  assert.deepEqual(tldrPaths('linux/ls'), ['linux/ls']);
  assert.deepEqual(tldrPaths('fd'), ['common/fd', 'linux/fd', 'osx/fd', 'windows/fd']);
  for (const value of ['../../evil', 'https://evil.test/x', 'javascript:alert(1)', 'common/foo/bar']) assert.deepEqual(tldrPaths(value), []);
  assert.equal(safeUrl('javascript:alert(1)'), ''); assert.equal(safeUrl('/relative'), '');
  assert.equal(safeUrl('https://example.org/path'), 'https://example.org/path');
});
test('parses commands without executing Markdown, and preserves placeholders', async () => {
  const { parseTldr } = await modelModule;
  const examples = parseTldr('# fd\n> description\n\n- Search files:\n\n`fd {{pattern}}`\n\n- Show hidden:\n\n`fd --hidden`');
  assert.equal(examples.length, 2); assert.equal(examples[0].command, 'fd {{pattern}}');
  assert.equal(examples[1].description, 'Show hidden:');
});
test('restores selected tools and view, including legacy tool/relation hashes', async () => {
  const { buildModel, readHash } = await modelModule;
  const model = buildModel(map, cheats);
  assert.equal(readHash('#nvim', model).tool, 'neovim');
  assert.equal(readHash('#ls-eza', model).tool, 'eza');
  const result = readHash('#view=sheet&tool=rg&category=map-0&q=test', model);
  assert.equal(result.tool, 'ripgrep'); assert.equal(result.view, 'sheet'); assert.equal(result.query, 'test');
  assert.equal(readHash('#%E0%A4%A', model).tool, '');
});
test('one failed catalog can be omitted without losing the other source', async () => {
  const { buildModel } = await modelModule;
  assert.equal(buildModel(undefined, cheats).tools.size, 3);
  assert.equal(buildModel(map, undefined).tools.size, 6);
  assert.throws(() => buildModel({ categories: [{}] }), /Invalid category/);
});

test('unregistered tool names cannot resolve through Object.prototype aliases', async () => {
  const { toolId, buildModel } = await modelModule;
  for (const name of ['__proto__', 'constructor', 'tostring']) assert.equal(toolId(name), name);
  const model = buildModel({ categories: [{ name: 'Tools', commands: [{ name: 'constructor' }], relations: [] }] });
  assert.ok(model.tools.has('constructor'));
});
