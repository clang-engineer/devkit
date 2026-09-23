#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_DIR/web"

node --check "$WEB_DIR/app.js"
(cd "$PROJECT_DIR" && GOOS=js GOARCH=wasm go build -o "$WEB_DIR/cmdtreemap.wasm" ./web)
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" "$WEB_DIR/wasm_exec.js"

printf 'cmdtreemap Web 빌드 완료: %s\n' "$WEB_DIR"
