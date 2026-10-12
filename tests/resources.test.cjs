const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const modules = Promise.all([
  import('../explorer/core/catalog.js'),
  import('../explorer/graph/layout.js'),
]).then(parts => Object.assign({}, ...parts));
const reference = JSON.parse(fs.readFileSync(path.join(base, 'reference/catalog.json')));
const cli = reference.tool_map;
const sheets = reference.cheatsheets;
test('real catalogs retain every CLI category, command and relation', async () => {
  const {buildModel,toolId} = await modules;
  const model = buildModel(cli,sheets);
  assert.equal(model.edges.length, cli.categories.reduce((n,c)=>n+c.relations.length,0));
  cli.categories.forEach((category,index) => {
    assert.equal(model.categories[index].name, category.name);
    for (const command of category.commands) assert.ok(model.tools.has(toolId(command.tool_id || command.id || command.name)), command.name);
    category.relations.forEach((edge) => {
      assert.ok(model.edges.some(e => e.category === 'map-'+index && e.from === toolId(edge.from) && e.to === toolId(edge.to)), edge.from+' -> '+edge.to);
    });
  });
});
test('every full cheatsheet and official link remains reachable from its tool', async () => {
  const {buildModel,toolId} = await modules;
  const model=buildModel(cli,sheets);
  for(const group of sheets.groups) for(const item of group.items) {
    const tool=model.tools.get(toolId(item.tool_id || item.slug));
    assert.ok(tool,item.slug);
    if(item.file) assert.ok(fs.existsSync(path.join(base,'reference/cheatsheets',item.file)),item.file);
    for(const link of [...(item.official||[]),...(item.custom?[item.custom]:[])]) {
      if(!/^https?:/.test(link.url||''))continue;
      assert.ok([...tool.official,...tool.custom].some(x=>x.url===new URL(link.url).href),item.slug+': '+link.url);
    }
  }
});
test('real catalog layout terminates with finite unique positions in every category', async () => {
  const {buildModel,layoutCategory}=await modules;
  const model=buildModel(cli,sheets);
  for(const category of model.categories) {
    const ids=[...model.tools.values()].filter(t=>t.categories.includes(category.id)).map(t=>t.id);
    const layout=layoutCategory(ids,model.edges.filter(e=>e.category===category.id));
    assert.equal(layout.positions.size,ids.length);
    assert.ok(Number.isFinite(layout.width)&&Number.isFinite(layout.height));
    assert.equal(new Set([...layout.positions.values()].map(p=>`${p.x},${p.y}`)).size,ids.length);
  }
});
test('manifest is closed over local module imports and contains no host-specific layout',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'explorer/manifest.json')));
  assert.equal(manifest.api_version,1);
  assert.ok(manifest.files.includes(manifest.entry));
  assert.ok(manifest.files.includes(manifest.style));
  for(const file of manifest.files){
    assert.ok(!file.includes('..')&&!path.isAbsolute(file));
    const src=fs.readFileSync(path.join(base,'explorer',file),'utf8');
    if(file.endsWith('.js')) for(const match of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
      assert.ok(manifest.files.includes(target),file+' -> '+target);
    }
  }
  assert.ok(!fs.readFileSync(path.join(base,'explorer/styles/explorer.css'),'utf8').includes('#panel-wrapper'));
});

test('Go embedded catalog remains equivalent to the tool map in the canonical source', () => {
  const embedded = JSON.parse(fs.readFileSync(path.join(base, 'cmdtreemap/catalog.json')));
  assert.deepEqual(embedded, cli);
});
