const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
test('embedded catalog equals canonical reference data', () => {
  assert.deepEqual(readFileSync(resolve(__dirname, '../catalog.json')), readFileSync(resolve(__dirname, '../../reference/cli/catalog.json')));
});
test('blog sync only invokes the blog data importer', () => {
  const script = readFileSync(resolve(__dirname, 'sync-blog.sh'), 'utf8');
  assert.ok(script.includes('tools/sync-devkit.py'));
  assert.ok(!script.includes('app.js'));
});
