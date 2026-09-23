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

"$SCRIPT_DIR/build-web.sh"

files=(index.html app.js app.css commands.json wasm_exec.js cmdtreemap.wasm)
mkdir -p "$TARGET_DIR"
for file in "${files[@]}"; do
  cp "$WEB_DIR/$file" "$TARGET_DIR/$file"
done

for file in "${files[@]}"; do
  cmp "$WEB_DIR/$file" "$TARGET_DIR/$file"
done

printf 'cmdtreemap Web 배포본 동기화 완료: %s\n' "$TARGET_DIR"
