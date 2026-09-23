#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_BLOG_DIR="$(cd "$PROJECT_DIR/../.." && pwd)/clang-engineer.github.io"
BLOG_DIR="${1:-${BLOG_DIR:-$DEFAULT_BLOG_DIR}}"
WEB_DIR="$PROJECT_DIR/web"
TARGET_DIR="$BLOG_DIR/cmdtreemap"

if [[ ! -d "$BLOG_DIR" ]]; then
  printf '블로그 저장소를 찾을 수 없습니다: %s\n' "$BLOG_DIR" >&2
  printf '사용법: %s /path/to/clang-engineer.github.io\n' "$0" >&2
  exit 1
fi

node --check "$WEB_DIR/app.js"

files=(app.js app.css)
mkdir -p "$TARGET_DIR"
for file in "${files[@]}"; do
  cp "$WEB_DIR/$file" "$TARGET_DIR/$file"
done

for file in "${files[@]}"; do
  cmp "$WEB_DIR/$file" "$TARGET_DIR/$file"
done

cp "$PROJECT_DIR/commands.json" "$TARGET_DIR/commands.json"
cmp "$PROJECT_DIR/commands.json" "$TARGET_DIR/commands.json"

# Local development reads the root JSON; the flat deployment keeps it alongside HTML.
node - "$WEB_DIR/index.html" "$TARGET_DIR/index.html" <<'NODE'
const fs = require('node:fs');
const [source, target] = process.argv.slice(2);
const html = fs.readFileSync(source, 'utf8');
if (!html.includes('data-source="../commands.json"')) throw new Error('missing local data source');
fs.writeFileSync(target, html.replace('data-source="../commands.json"', 'data-source="./commands.json"'));
NODE

# Remove only the obsolete runtime assets managed by earlier deployments.
rm -f "$TARGET_DIR/wasm_exec.js" "$TARGET_DIR/cmdtreemap.wasm"

printf 'cmdtreemap Web 배포본 동기화 완료: %s\n' "$TARGET_DIR"
