#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVKIT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BLOG_DIR="${1:-${BLOG_DIR:-$(dirname "$DEVKIT_DIR")/clang-engineer.github.io}}"
python3 "$BLOG_DIR/tools/sync-devkit.py" --source "$DEVKIT_DIR"
