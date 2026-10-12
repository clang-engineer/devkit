import { mount } from './ui/explorer.js';
export { mount };
const root = document.querySelector('[data-devkit]');
if (root) mount(root);
