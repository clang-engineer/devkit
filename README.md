# devkit

Curated dev cheatsheets and templates I keep handy while working.

**31 cheatsheets** across 9 categories · **6 templates** — generic,
reusable references and starting points, not machine- or project-specific config.

## Shared explorer

도구 데이터와 웹 UI의 원본은 이 저장소가 소유한다. 블로그는 빌드할 때
이 저장소의 `src/manifest.json`에 명시된 파일을 가져와 정적 자산으로 배포한다.
블로그에 두 번째 렌더러나 수동 동기화용 복사본을 두지 않는다.
데이터는 지금처럼 브라우저에서 Devkit 원본 JSON을 직접 읽는다.
JSON 변경은 다음 조회에, UI 코드 변경은 블로그의 다음 빌드·배포에 반영된다.
Devkit 커밋만으로 블로그 배포를 자동 실행하지는 않는다.

```text
reference/catalog.json              관계·명령 데이터와 치트시트 목록을 담는 공통 원본
reference/tool-map.md               CLI 도구 관계 지도 해설
reference/cheatsheets/*.md          긴 문서 원본
src/core/                           로딩·검증·공통 도구 ID·검색
src/graph/                          관계도 배치
src/integrations/                   tldr 페이지·예시 처리
src/ui/                             탐색·상세 패널
src/styles/                         블로그 테마와 독립적인 UI 스타일
web/                                독립 웹 진입점
cmdtreemap/                         Go TUI
tests/                              공통 UI·데이터 보존 테스트
```

`make web` 후 `/web/`을 연다. 기존 `/cmdtreemap/web/`도 같은 UI를 사용한다.
`make test`는 `tests/*.test.cjs`를 한 번씩 실행한 뒤 Go 테스트를 실행한다.
웹만 확인할 때는 `make test-web`, TUI만 확인할 때는 `make test-cli`를 사용한다. 새 필드를 추가하기 전에는
공통 도구 모델과 `reference/catalog.json`의 호환성을 먼저 확인한다.

현재 JSON 원본은 `reference/catalog.json` 하나다. `tool_map`은 도구 관계 지도,
`cheatsheets`는 치트시트 목록과 문서 링크를 소유한다. 긴 사용법 본문은
`reference/cheatsheets/*.md`에 둔다.

### UI 수정 위치

- `src/ui/explorer.js`: 선택·검색·이벤트·화면 생명주기. `mount()`의 반환값에서
  `ready`로 초기 로딩을 기다리고 `destroy()`로 이벤트와 요청을 해제한다.
- `src/ui/views.js`: 검색·분류·관계도 마크업. 외부 요청이나 URL 상태를 변경하지 않는다.
- `src/ui/details.js`: 소개·사용법·자료 패널과 클립보드, 현재 선택의 요청 취소.
- `src/integrations/tldr.js`: tldr 조회·플랫폼 fallback·캐시. DOM에 접근하지 않는다.

테스트는 실제 ES module을 import한다. 소스의 import/export를 삭제해 평가하지 않는다.
`src/package.json`은 Node 테스트의 module 경계를 지정하며 브라우저 배포 자산은 아니다.

기존 `cmdtreemap/web/app.js`·`app.css`는 캐시된 옛 페이지의 URL을 위한 짧은 호환
진입점으로 유지한다. 새 화면 코드는 그곳에 추가하지 않는다. Go의 내장용
`cmdtreemap/catalog.json`도 빌드에 필요하므로 유지하고 `make prepare`로 갱신한다.

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
