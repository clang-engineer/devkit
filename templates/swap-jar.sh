#!/usr/bin/env bash
# 사용: 현재 폴더에 JAR 두고 sudo bash swap-jar.sh
set -euo pipefail

JAR_NAME="app-1.0.0-SNAPSHOT.jar"
TARGET_DIR="/opt/app"
SERVICE_NAME="app"

[[ $EUID -ne 0 ]] && { echo "sudo로 실행하세요."; exit 1; }
[[ ! -f "./${JAR_NAME}" ]] && { echo "현재 폴더에 ${JAR_NAME} 없음"; exit 1; }

mkdir -p "${TARGET_DIR}/backup"
[[ -f "${TARGET_DIR}/${JAR_NAME}" ]] && \
  mv "${TARGET_DIR}/${JAR_NAME}" "${TARGET_DIR}/backup/${JAR_NAME%.jar}_$(date +%Y%m%d_%H%M%S).jar"

mv "./${JAR_NAME}" "${TARGET_DIR}/${JAR_NAME}"
systemctl restart "${SERVICE_NAME}"
sleep 3
systemctl is-active --quiet "${SERVICE_NAME}" || { systemctl status "${SERVICE_NAME}" --no-pager; exit 1; }

journalctl -u "${SERVICE_NAME}" -n 50 --no-pager
