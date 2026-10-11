# Templates

뼈대(skeleton). **복붙 후 수정**해서 사용하는 시작점.

```bash
cp templates/<name> ~/work/<somewhere>
# 환경/경로/변수 수정 후 사용
```

> 실행 전 필요한 도구와 대상 환경을 확인한다. `swap-jar.sh`는 systemd 서버용이며, `preview-loader.sh`는 브라우저를 여는 `open`(macOS) 또는 `xdg-open`(Linux)이 필요하다 (`--print`는 제외).

## 셸 스크립트

| 파일 | 수정 포인트 |
|------|------------|
| [swap-jar.sh](swap-jar.sh) | 상단 변수(`JAR_NAME`/`TARGET_DIR`/`SERVICE_NAME`) 수정 → 서버에 복사 → `sudo bash` 실행 |
| [pg-dump.sh](pg-dump.sh) | 상단 변수(`DB`/`HOST`/`PORT`/`USER`/`OUT`) 수정 → `bash` 실행 |
| [port.sh](port.sh) | 포트 점유 조회, `kill` 인자로 종료 |
| [preview-loader.sh](preview-loader.sh) | `bash preview-loader.sh <index.html> [--print]` — `<div id="root">` 부트 로더와 스타일시트 미리보기 |

## 설정 파일

| 파일 | 설명 |
|------|------|
| [docker-compose-spring-postgres.yml](docker-compose-spring-postgres.yml) | Spring Boot + PostgreSQL 로컬 개발 스택 |
| [Makefile-template](Makefile-template) | 프로젝트 공통 Makefile 시작점 |
