const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const web = resolve(__dirname, '../web');
const script = join(__dirname, 'sync-blog.sh');
const files = ['index.html', 'app.js', 'app.css', 'commands.json'];

function temporaryBlog(t) {
  const dir = mkdtempSync(join(tmpdir(), 'cmdtreemap-sync-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('deploys four static files from another working directory', (t) => {
  const blog = temporaryBlog(t);
  execFileSync('bash', [script, blog], { cwd: tmpdir() });
  const target = join(blog, 'cmdtreemap');
  assert.deepEqual(readdirSync(target).sort(), [...files].sort());
  for (const file of files) {
    assert.deepEqual(readFileSync(join(target, file)), readFileSync(join(web, file)));
  }
  const html = readFileSync(join(target, 'index.html'), 'utf8');
  assert.match(html, /src="app\.js"/);
  assert.doesNotMatch(html, /WebAssembly|wasm_exec|cmdtreemap\.wasm/);
});

test('removes only obsolete runtime files on repeat deployment', (t) => {
  const blog = temporaryBlog(t);
  const target = join(blog, 'cmdtreemap');
  mkdirSync(target);
  for (const file of ['wasm_exec.js', 'cmdtreemap.wasm', 'keep.txt']) {
    writeFileSync(join(target, file), 'existing file');
  }
  execFileSync('bash', [script, blog]);
  execFileSync('bash', [script, blog]);
  assert.deepEqual(readdirSync(target).sort(), [...files, 'keep.txt'].sort());
  assert.equal(readFileSync(join(target, 'keep.txt'), 'utf8'), 'existing file');
});

test('rejects nonexistent blog directory', (t) => {
  const blog = temporaryBlog(t);
  const result = spawnSync('bash', [script, join(blog, 'missing')], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /블로그 저장소를 찾을 수 없습니다/);
  assert.deepEqual(readdirSync(blog), []);
});
