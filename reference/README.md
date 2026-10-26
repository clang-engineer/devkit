# Reference

- `catalog.json`: 도구 관계 지도와 치트시트 목록·분류·참고 링크를 함께 담는 원본
- `cheatsheets/*.md`: 상세 사용법 원본
- `tool-map.md`: CLI 도구 관계 지도를 읽는 기준

블로그와 `cmdtreemap/`은 `catalog.json`을 공통 원본으로 사용한다. 긴 도구별 사용법은 `cheatsheets/` Markdown 문서에서 관리한다.

## 항목의 역할

도구 소개와 관계 설명은 분리한다. tool_map.categories.commands의 도구 정의는 한 곳에 두고 다른 분류에서는 name으로 참조한다. commands와 relations는 별개여서 관계가 없는 플러그인도 지도에서 선택할 수 있다.

개별 도구의 치트시트 링크는 cheatsheets.groups에, 여러 도구의 비교나 작업 절차를 다루는 문서는 cheatsheets.guides에 둔다. 두 자료의 Markdown 원본은 모두 cheatsheets/에 유지한다. 플러그인의 내 설정 링크는 dotfiles의 현재 공개 설정을 가리킨다.

## 분류 원본

분류는 작업 목적을 기준으로 catalog에서 관리한다. 웹 컴포넌트가 도구 이름이나 문서 묶음 이름으로 분류를 추측하거나 다시 지정하지 않는다.

- `tool_map.domains`: 상위 탐색 그룹의 ID·이름·순서.
- `categories[].id`, `domain`: 안정적인 분류 ID와 상위 그룹. `aliases`는 이전 분류 이름·링크를 보존한다.
- `commands[].tool_id`: 표시 이름·실행 명령과 다른 도구 식별자. 예를 들어 `name: "http"`, `tool_id: "httpie"`로 관계도와 HTTPie 치트시트를 연결한다.
- `commands[].hosts`, `section`, `tags`: 해당 분류 안에서의 호스트·확장 묶음·태그. 같은 도구가 여러 분류에 속해도 각 소속의 메타데이터는 따로 유지한다.
- `commands[].kind`, `role`, `platforms`: 도구 종류·짧은 역할·사용 환경. 실행 환경을 작업 목적 분류와 섞지 않는다.
- `guides[].related_tools`: 가이드를 참고 자료로 연결할 도구 ID.

모든 개별 치트시트 도구는 `tool_map.categories`에도 등록한다. `cheatsheets.groups`는 문서 목록을 정리하는 별도 묶음이며, 도구 분류를 대신하지 않는다. 같은 도구가 실제로 여러 작업에 쓰이면 여러 분류에서 이름으로 참조할 수 있다.

cmdtreemap/catalog.json은 Go 빌드용 생성본이다. make prepare 또는 go generate가 분류별 이름 참조를 풀어 생성하며 직접 수정하지 않는다. 블로그는 원본 JSON을 직접 읽는다.
