const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
test('embedded catalog equals canonical reference data', () => {
  assert.deepEqual(readFileSync(resolve(__dirname, '../catalog.json')), readFileSync(resolve(__dirname, '../../reference/cli/catalog.json')));
});
