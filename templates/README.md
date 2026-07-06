# Templates

뼈대(skeleton). **복붙 후 수정**해서 사용하는 시작점.

```bash
cp templates/<name> ~/work/<somewhere>
# 환경/경로/변수 수정 후 사용
```

> 그대로 실행하는 도구는 [`tools/`](../tools/)에.

## 셸 스크립트

| 파일 | 수정 포인트 |
|------|------------|
| [swap-jar.sh](swap-jar.sh) | 상단 변수(`JAR_NAME`/`TARGET_DIR`/`SERVICE_NAME`) 수정 → 서버에 복사 → `sudo bash` 실행 |
| [pg-dump.sh](pg-dump.sh) | 상단 변수(`DB`/`HOST`/`PORT`/`USER`/`OUT`) 수정 → `bash` 실행 |
| [port.sh](port.sh) | 포트 점유 조회, `kill` 인자로 종료 |

## 설정 파일

| 파일 | 설명 |
|------|------|
| [docker-compose-spring-postgres.yml](docker-compose-spring-postgres.yml) | Spring Boot + PostgreSQL 로컬 개발 스택 |
| [Makefile-template](Makefile-template) | 프로젝트 공통 Makefile 시작점 |
