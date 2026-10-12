const root = document.querySelector('#cmdtreemap-root');
if (root) {
  root.dataset.devkit = '';
  root.dataset.catalog = root.dataset.source || '../../reference/catalog.json';
}
await import('../../src/index.js');
