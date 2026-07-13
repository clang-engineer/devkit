#!/usr/bin/env bash
# 사용: bash preview-loader.sh <index.html> [--print]
# JS 번들이 마운트되기 전 잠깐 뜨는 부트 로더(예: JHipster #root)를 브라우저로 띄운다.
# index.html에서 <div id="root"> 마크업과 <link rel="stylesheet">를 실제 파일 그대로
# 추출·링크하므로(복제 X) 원본과 어긋나지 않는다. --print 는 열지 않고 경로만 출력.
# 주의: CSS의 상대경로 배경이미지는 file://에서 깨질 수 있음(순수 CSS 로더면 무관).
set -euo pipefail

INDEX="${1:?index.html 경로를 넘겨줘: bash preview-loader.sh <index.html>}"
[[ -f "$INDEX" ]] || { echo "파일 없음: $INDEX" >&2; exit 1; }
BASE="file://$(cd "$(dirname "$INDEX")" && pwd)"

# <head>의 rel="stylesheet" 링크만 골라 상대 href를 절대 file:// 로 치환
styles="$(grep -oE '<link[^>]*rel="stylesheet"[^>]*>' "$INDEX" \
  | sed -E "s#href=\"(\./)?([^\"/][^\"]*)\"#href=\"$BASE/\2\"#")"

# <div id="root"> 부트 마크업만 div 균형으로 잘라냄
markup="$(awk '
  !cap && /<div id="root"/ { cap=1 }
  cap { print; d += gsub(/<div/,"&") - gsub(/<\/div>/,"&"); if (d==0) exit }
' "$INDEX")"

OUT="${TMPDIR:-/tmp}/loader-preview.html"
cat > "$OUT" <<HTML
<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
$styles
<style>body{margin:0}</style>
</head><body>
$markup
</body></html>
HTML

if [[ "${2:-}" == "--print" ]]; then echo "$OUT"; exit 0; fi
case "$OSTYPE" in
  darwin*) open "$OUT" ;;
  *) xdg-open "$OUT" ;;
esac
