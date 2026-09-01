# TUI 도구 추천/후보

> 아직 설치·검토 전인 도구들. 설치 확정되면 `terminal-tooling.md`로 승격.

## 추천 우선순위

```text
posting > dive > sshs/lazyssh > fx > trippy
```

## Posting / ATAC — HTTP API 테스트

Postman 같은 HTTP client를 터미널에서 쓰고 싶을 때 보는 TUI 계열이다. request,
headers, body, response를 한 화면에서 다룬다.

```text
HTTP API -> Posting or ATAC
```

둘을 동시에 둘 필요는 없다. curl/httpie 또는 editor의 REST client가 충분하다면
추가하지 않고, terminal-first API testing이 반복될 때 하나를 선택한다.
Posting은 Vim 키 바인딩을 지원한다.

## dive — Docker 이미지 분석

Docker 이미지의 레이어별 용량과 낭비를 보여주는 TUI다. `lazydocker`가 실행 중인
컨테이너 관리라면, `dive`는 이미지 내부 분석이라 역할이 안 겹친다.

```text
Docker container 관리 -> lazydocker
Docker image 분석     -> dive
```

이미지 빌드 최적화, 불필요한 레이어 확인, 크기 점검에 사용한다.

## sshs / lazyssh — SSH 서버 선택

`~/.ssh/config`의 서버를 탐색하고 접속·파일 전송하는 TUI다. 여러 서버에 자주
SSH한다면 쓸 만하다.

```text
SSH 서버 선택 -> sshs 또는 lazyssh
```

`sshs`가 더 검증됐고, `lazyssh`는 아직 `lazygit`급으로 검증되지는 않았다. 이미
`sesh + tmux + ~/.ssh/config` 흐름이 편하면 굳이 없어도 된다.

## fx — JSON 탐색

JSON 파일을 터미널에서 탐색하는 도구다. 파일 경로를 넘기면 구조를 보면서 쿼리할
수 있다.

```text
JSON 탐색 -> fx
```

`jq`가 파이프 라인에 강하다면, `fx`는 파일 단위 탐색에 강하다.

## trippy — 네트워크 연결 확인

네트워크 경로와 연결 상태를 시각적으로 보여주는 TUI다. 서버 운영 시 연결 문제를
진단할 때 유용하다.

```text
네트워크 진단 -> trippy
```

## glow — Markdown 보기

Markdown 파일을 터미널에서 렌더링해서 보여주는 도구다.

```text
Markdown 보기 -> glow
```

가끔 유용하지만 필수는 아니다.

## 관망 대상 (신생 lazy* 도구)

`lazygit`의 UX와 이름을 차용한 별개 프로젝트들이다. 공식 제품군이 아니며, 지금
설치를 추천할 정도의 완성도는 아니다.

| 도구 | 역할 | 상태 |
|---|---|---|
| lazysql | DB 관리 TUI | rainfrog/Harlequin이 더 나음 |
| lazyfetch | HTTP 요청 TUI | 신생, 관망 |
| lazycsv | 대용량 CSV SQL 조회 | 아이디어 좋으나 별 5개 수준 |
| lazyide | IDE TUI | 관망 |
