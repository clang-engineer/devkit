const { test } = require('node:test');
const assert = require('node:assert/strict');
const modules = Promise.all([
  import('../explorer/ui/inspector.js'),
  import('../explorer/graph/overview.js'),
  import('../explorer/ui/views.js'),
]).then(parts => Object.assign({}, ...parts));

function presentation(width) {
  const document = { body: { style: { overflow: 'auto' } }, defaultView: {} };
  const element = () => ({
    hidden: true, open: false, listeners: {},
    append(child) { child.parentElement = this; },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    focus() { this.focused = true; },
  });
  const host = element(), dialog = element(), selected = element(), panel = element();
  panel.parentElement = host;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  const root = { ownerDocument: document, clientWidth: width, dataset: {},
    querySelector: selector => ({ '[data-panel-host]': host, '[data-detail-dialog]': dialog, '[data-tool].is-selected': selected })[selector],
  };
  return { root, document, host, panel, dialog, selected };
}

test('overview retains all domains and categories on wide and narrow canvases', async () => {
  const { overviewHtml } = await modules;
  const groups = Array.from({ length: 8 }, (_, i) => ({
    id: `domain:${i}`, name: `<Group ${i}>`, tools: new Set(['a']),
    categories: [{ id: `category-${i}`, name: '<Category>', count: 1 }],
  }));
  for (const columns of [1, 2]) {
    const html = overviewHtml(groups, new Set(groups.map(g => g.id)), 1, columns);
    for (const group of groups) assert.ok(html.includes(`data-category="${group.categories[0].id}"`));
    assert.equal((html.match(/class="dk-overview-card"/g) || []).length, 8);
    assert.ok(!html.includes('<Group')); assert.ok(!html.includes('data-edge='));
    assert.ok(!html.includes('NaN')); assert.ok(!html.includes('Infinity'));
  }
});
test('initial shell has no empty inspector taking canvas space and no duplicate view tabs', async () => {
  const { shellHtml } = await modules;
  assert.match(shellHtml, /data-panel-host hidden/);
  assert.ok(!shellHtml.includes('data-view='));
  assert.equal((shellHtml.match(/data-detail\s/g) || []).length, 1);
  assert.match(shellHtml, /<dialog[^>]+data-detail-dialog/);
});
test('wide inspector docks and closing returns focus to the selected node', async () => {
  const { createInspector } = await modules;
  const s = presentation(1200);
  const inspector = createInspector(s.root, s.panel, { onClose() {} });
  inspector.show();
  assert.equal(s.root.dataset.detailOpen, 'true'); assert.equal(s.host.hidden, false);
  assert.equal(s.dialog.open, false);
  inspector.hide();
  assert.equal(s.host.hidden, true); assert.equal(s.selected.focused, true);
});
test('narrow inspector reuses the same panel and restores the host scroll policy', async () => {
  const { createInspector } = await modules;
  const s = presentation(390);
  const inspector = createInspector(s.root, s.panel, { onClose() {} });
  inspector.show(); inspector.show();
  assert.equal(s.panel.parentElement, s.dialog); assert.equal(s.dialog.open, true);
  assert.equal(s.document.body.style.overflow, 'hidden');
  inspector.hide();
  assert.equal(s.panel.parentElement, s.host); assert.equal(s.dialog.open, false);
  assert.equal(s.document.body.style.overflow, 'auto');
});
test('resizing an open inspector changes presentation without duplicating content', async () => {
  const { createInspector } = await modules;
  const s = presentation(390);
  const inspector = createInspector(s.root, s.panel, { onClose() {} });
  inspector.show(); s.root.clientWidth = 1200; inspector.sync();
  assert.equal(s.panel.parentElement, s.host); assert.equal(s.dialog.open, false);
  assert.equal(s.root.dataset.detailOpen, 'true');
  s.root.clientWidth = 390; inspector.sync();
  assert.equal(s.panel.parentElement, s.dialog); assert.equal(s.dialog.open, true);
  inspector.destroy();
  assert.equal(s.dialog.open, false); assert.equal(s.document.body.style.overflow, 'auto');
});
test('Escape cancellation is delegated to the controller rather than silently losing selection state', async () => {
  const { createInspector } = await modules;
  const s = presentation(390); let closed = 0, prevented = 0;
  const inspector = createInspector(s.root, s.panel, { onClose() { closed++; inspector.hide(); } });
  inspector.show(); s.dialog.listeners.cancel({ preventDefault() { prevented++; } });
  assert.equal(closed, 1); assert.equal(prevented, 1); assert.equal(s.dialog.open, false);
});
