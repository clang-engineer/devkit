#!/usr/bin/env bash
# 사용: 상단 변수 수정 → bash pg-dump.sh
set -euo pipefail

DB="mydb"
HOST="localhost"
PORT="5432"
USER="postgres"
OUT="./backup"

# 현재 옵션:
#   --column-inserts  INSERT 문으로 출력 (COPY 대신 — 가독성/호환성↑, 속도↓)
#   --format=p        plain SQL (바이너리 압축은 -F c)
#   --if-exists       DROP 구문에 IF EXISTS 추가
#   --create          CREATE DATABASE 구문 포함
#   --clean           복원 시 기존 객체 DROP
#
# 자주 쓸 만한 추가 옵션 (필요 시 아래 라인에 추가):
#   -n <schema>           특정 스키마만
#   -t <table>            특정 테이블만
#   --exclude-table=<t>   특정 테이블 제외
#   --data-only           데이터만 (스키마 제외)
#   --schema-only         스키마만 (데이터 제외)

mkdir -p "$OUT"
FILE="$OUT/${DB}-$(date +%y%m%d%H%M%S)-dump.sql"
pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" \
  --column-inserts --format=p --if-exists --create --clean \
  --file="$FILE"
echo "→ $FILE"
