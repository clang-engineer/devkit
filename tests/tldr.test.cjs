const { test } = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../explorer/integrations/tldr.js');
const page = { ok: true, text: async () => '# fd\n- Search:\n`fd {{pattern}}`' };

test('successful and missing tldr responses are cached per client', async () => {
  const { createTldrClient } = await modulePromise;
  let calls = 0;
  const client = createTldrClient(async () => { calls++; return page; });
  const first = await client.load('fd');
  assert.equal(await client.load('fd'), first);
  assert.equal(calls, 1);
  client.clear(); await client.load('fd'); assert.equal(calls, 2);
  let misses = 0;
  const missing = createTldrClient(async () => { misses++; return { status: 404, ok: false }; });
  assert.equal(await missing.load('common/missing'), null);
  assert.equal(await missing.load('common/missing'), null);
  assert.equal(misses, 1);
});
test('transient tldr errors can be retried and never poison the cache', async () => {
  const { createTldrClient } = await modulePromise;
  let fail = true;
  const client = createTldrClient(async () => { if (fail) throw Error('offline'); return page; });
  await assert.rejects(client.load('fd'), /offline/);
  fail = false;
  assert.equal((await client.load('fd')).examples[0].command, 'fd {{pattern}}');
});
test('cancelled requests are not cached even when transport ignores cancellation', async () => {
  const { createTldrClient } = await modulePromise;
  const controller = new AbortController();
  let calls = 0;
  const client = createTldrClient(async () => {
    if (++calls === 1) controller.abort();
    return page;
  });
  await assert.rejects(client.load('fd', { signal: controller.signal }), { name: 'AbortError' });
  assert.ok(await client.load('fd'));
  assert.equal(calls, 2);
});
test('unsafe and unregistered tldr paths do not make a network request', async () => {
  const { createTldrClient } = await modulePromise;
  const client = createTldrClient(async () => { throw Error('must not fetch'); });
  for (const name of ['', '../../file', 'https://example.test/script']) {
    assert.equal(await client.load(name), null);
  }
});
