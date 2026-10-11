const root = document.querySelector('#cmdtreemap-root');
if (root) {
  root.dataset.devkit = '';
  root.dataset.catalog = root.dataset.source || '../../reference/cli/catalog.json';
  root.dataset.cheatsheets = '../../reference/cheatsheets/catalog.json';
}
await import('../../src/index.js');
