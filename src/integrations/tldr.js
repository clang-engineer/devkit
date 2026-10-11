export function tldrPaths(value) {
  const name = String(value || '').replace(/\.md$/, '');
  if (!/^(?:(?:common|linux|osx|windows|freebsd|openbsd|netbsd|android|sunos)\/)?[a-zA-Z0-9_.+-]+$/.test(name)) return [];
  return name.includes('/') ? [name] : ['common/', 'linux/', 'osx/', 'windows/'].map(platform => platform + name);
}
export function parseTldr(text) {
  const examples = []; let description = '';
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('- ')) description = line.slice(2).trim();
    const match = /^\s*`([^`]+)`\s*$/.exec(line);
    if (match) { examples.push({ description, command: match[1] }); description = ''; }
    if (examples.length === 6) break;
  }
  return examples;
}
