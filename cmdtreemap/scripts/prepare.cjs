// Resolve category name references for the Go embedded view; JSON source stays canonical.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'reference/catalog.json'), 'utf8')).tool_map;
const definitions = new Map();
for (const category of map.categories) for (const command of category.commands) {
  if (command.description && !definitions.has(command.name.toLowerCase())) {
    // Membership metadata belongs to this category, not to the tool definition.
    const { hosts, tags, section, ...definition } = command;
    definitions.set(command.name.toLowerCase(), definition);
  }
}
for (const category of map.categories) {
  category.commands = category.commands.map(command => ({ ...definitions.get(command.name.toLowerCase()), ...command }));
}
fs.writeFileSync(path.join(root, 'cmdtreemap/catalog.json'), JSON.stringify(map, null, 2) + '\n');
