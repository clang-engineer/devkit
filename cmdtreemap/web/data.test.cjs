const { test } = require('node:test');
const assert = require('node:assert/strict');
const data = require('../commands.json');
const relations = data.categories.flatMap(category => category.relations);

test('display names use executable names while retaining package installation names', () => {
  for (const [from, to, pkg] of [['grep', 'rg', 'ripgrep'], ['curl', 'http', 'httpie'], ['tail', 'tspin', 'tailspin']]) {
    const relation = relations.find(r => r.from === from && r.to === to);
    assert.ok(relation);
    assert.equal(relation.tldr, to);
    assert.equal(relation.install, `brew install ${pkg}`);
  }
});

test('ls alternatives share one category and task runner is not a build replacement', () => {
  const category = data.categories.find(c => c.name === 'File Operations');
  assert.deepEqual(category.relations.filter(r => r.from === 'ls').map(r => r.to), ['eza', 'lsd']);
  assert.equal(relations.filter(r => r.to === 'lsd').length, 1);
  const just = relations.find(r => r.to === 'just');
  assert.equal(just.relation, 'specialized');
  assert.ok(just.boundary.includes('빌드 시스템이 아니다'));
});

test('reviewed unsupported claims and mistranslations stay removed', () => {
  const text = JSON.stringify(data);
  for (const claim of ['10~100배', '2~10배', '모든 포맷 지원', '인터메시지', '펀치 단계', '병렬 압축/해제']) {
    assert.ok(!text.includes(claim), claim);
  }
});
