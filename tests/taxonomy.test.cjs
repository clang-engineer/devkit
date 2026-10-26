const { test } = require('node:test');
const assert = require('node:assert/strict');
const reference = require('../reference/catalog.json');
const { categories, domains } = reference.tool_map;
const normalize = value => value.trim().toLowerCase().replace(/\s+/g, '-');
const toolId = command => command.tool_id || normalize(command.name);
const commands = categories.flatMap(category => category.commands);
const ids = new Set(commands.map(toolId));
const sheets = reference.cheatsheets.groups.flatMap(group => group.items);

test('every tool category declares a stable unique id and a catalog-owned domain', () => {
  const domainIds = new Set(domains.map(domain => domain.id));
  assert.equal(domainIds.size, domains.length);
  assert.equal(new Set(categories.map(category => category.id)).size, categories.length);
  for (const category of categories) {
    assert.ok(category.id && domainIds.has(category.domain), category.name);
    assert.ok(!category.name.startsWith('Neovim Plugins ·'));
    assert.ok(!['Development', 'Terminal Applications', 'macOS'].includes(category.name));
    const names = new Set(category.commands.map(command => command.name));
    for (const edge of category.relations) assert.ok(names.has(edge.from) && names.has(edge.to), `${edge.from} -> ${edge.to}`);
  }
});

test('every cheatsheet tool already has a purpose category, independent of document shelves', () => {
  for (const item of sheets) assert.ok(ids.has(item.tool_id || item.slug), item.slug);
  const http = categories.find(category => category.id === 'http');
  const command = http.commands.find(command => command.name === 'http');
  assert.equal(command.tool_id, 'httpie');
  assert.equal(sheets.find(item => item.slug === 'httpie').slug, command.tool_id);
  assert.ok(http.relations.some(edge => edge.from === 'curl' && edge.to === 'http'));
});

test('purpose categories separate task runners, build tools, runtime tooling and languages', () => {
  const names = id => categories.find(category => category.id === id).commands.map(command => command.name);
  assert.ok(names('task-runners').includes('just'));
  assert.ok(names('build-tools').includes('make'));
  assert.ok(names('debugging').includes('gdb'));
  assert.ok(names('code-quality').includes('pre-commit'));
  assert.ok(names('runtime-management').includes('uv'));
  assert.ok(names('programming-languages').includes('python'));
  assert.ok(names('ai-coding').includes('Claude Code'));
  for (const command of categories.find(category => category.id === 'programming-languages').commands) assert.equal(command.kind, 'language');
});

test('host, tag and guide references are explicit and resolve to catalog records', () => {
  for (const category of categories) {
    const tags = new Set((category.tags || []).map(tag => tag.id));
    for (const command of category.commands) {
      for (const host of command.hosts || []) assert.ok(ids.has(host) && host !== toolId(command), `${command.name}: ${host}`);
      for (const tag of command.tags || []) assert.ok(tags.has(tag), `${command.name}: ${tag}`);
    }
    for (const edge of category.relations) if (edge.tag) assert.ok(tags.has(edge.tag));
  }
  for (const guide of reference.cheatsheets.guides) for (const id of guide.related_tools) assert.ok(ids.has(id), `${guide.slug}: ${id}`);
  const navigation = categories.filter(category => category.commands.some(command => command.name === 'vim-tmux-navigator'));
  assert.deepEqual(new Set(navigation.flatMap(category => category.commands.find(command => command.name === 'vim-tmux-navigator').hosts)), new Set(['neovim', 'tmux']));
});

test('Go generated categories preserve membership metadata without leaking it across references', () => {
  const embedded = require('../cmdtreemap/catalog.json');
  assert.deepEqual(embedded.domains, domains);
  for (const category of categories) {
    const generated = embedded.categories.find(item => item.id === category.id);
    assert.equal(generated.domain, category.domain);
    for (const command of category.commands) {
      const actual = generated.commands.find(item => item.name === command.name);
      for (const key of ['hosts', 'tags', 'section']) assert.deepEqual(actual[key], command[key], `${category.id}/${command.name}/${key}`);
    }
  }
});
