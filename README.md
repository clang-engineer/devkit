# devkit

Curated dev cheatsheets and templates I keep handy while working.

**32 cheatsheets** across 9 categories · **6 templates** — generic,
reusable references and starting points, not machine- or project-specific config.

## Reference catalog

도구 데이터와 문서 원본은 이 저장소가 소유한다. 블로그나 다른 host는
`reference/catalog.json`을 직접 읽고, 화면 렌더링은 npm 패키지
[`@clang.engineer/reference-explorer`](https://www.npmjs.com/package/@clang.engineer/reference-explorer)가 담당한다.
이 저장소에 웹 UI 소스나 블로그 배포용 runtime 복사본을 두지 않는다.

```text
reference/catalog.json              관계·명령 데이터와 치트시트 목록을 담는 공통 원본
reference/tool-map.md               CLI 도구 관계 지도 해설
reference/cheatsheets/*.md          긴 문서 원본
cmdtreemap/                         Go TUI
tests/                              reference 데이터 보존 테스트
```

`make test`는 `tests/*.test.cjs`를 한 번씩 실행한 뒤 Go 테스트를 실행한다.
TUI만 확인할 때는 `make test-cli`를 사용한다. 새 필드를 추가하기 전에는
`reference/catalog.json`의 구조와 `cmdtreemap` 호환성을 먼저 확인한다.

현재 JSON 원본은 `reference/catalog.json` 하나다. `tool_map`은 도구 관계 지도,
`cheatsheets`는 치트시트 목록과 문서 링크를 소유한다. 긴 사용법 본문은
`reference/cheatsheets/*.md`에 둔다. Go의 내장용 `cmdtreemap/catalog.json`은
`make prepare`로 갱신한다.

## Cheatsheets

Tool introductions and operational references. Full index with descriptions:
[reference/cheatsheets/README.md](reference/cheatsheets/README.md).

## cmdtreemap

CLI 도구의 대안·보완 관계를 터미널 TUI와 공통 웹 지도로 탐색합니다. 구조, 개발, 실행, 빌드와 데이터 배포 방법은 [cmdtreemap/README.md](cmdtreemap/README.md)를 참고하세요.

## Templates

Boilerplate starting points — copy and adapt. Prerequisites and usage:
[templates/README.md](templates/README.md).

| File | What |
|---|---|
| [docker-compose-spring-postgres.yml](templates/docker-compose-spring-postgres.yml) | Docker Compose: Spring Boot + PostgreSQL |
| [Makefile-template](templates/Makefile-template) | Makefile starter (phony targets, help) |
| [pg-dump.sh](templates/pg-dump.sh) | PostgreSQL dump helper |
| [port.sh](templates/port.sh) | Find / free a process by port |
| [preview-loader.sh](templates/preview-loader.sh) | Preview an HTML boot loader before JavaScript mounts |
| [swap-jar.sh](templates/swap-jar.sh) | Swap a running JAR in place |
