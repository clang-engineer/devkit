# Reference

- `catalog.json`: 도구 관계 지도와 치트시트 목록·분류·참고 링크를 함께 담는 원본
- `cheatsheets/*.md`: 상세 사용법 원본
- `tool-map.md`: CLI 도구 관계 지도를 읽는 기준

블로그와 `cmdtreemap/`은 `catalog.json`을 공통 원본으로 사용한다. 긴 도구별 사용법은 `cheatsheets/` Markdown 문서에서 관리한다.

## 항목의 역할

도구 소개와 관계 설명은 분리한다. tool_map.categories.commands의 도구 정의는 한 곳에 두고 다른 분류에서는 name으로 참조한다. commands와 relations는 별개여서 관계가 없는 플러그인도 지도에서 선택할 수 있다.

개별 도구의 치트시트 링크는 cheatsheets.groups에, 여러 도구의 비교나 작업 절차를 다루는 문서는 cheatsheets.guides에 둔다. 두 자료의 Markdown 원본은 모두 cheatsheets/에 유지한다. 플러그인의 내 설정 링크는 dotfiles의 현재 공개 설정을 가리킨다.

cmdtreemap/catalog.json은 Go 빌드용 생성본이다. make prepare 또는 go generate가 분류별 이름 참조를 풀어 생성하며 직접 수정하지 않는다. 블로그는 원본 JSON을 직접 읽는다.
