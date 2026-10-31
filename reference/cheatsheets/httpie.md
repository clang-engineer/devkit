# HTTPie (http) — 요청을 문법으로 조립하기

> `http`는 HTTP 요청을 읽기 쉽게 작성하는 CLI다. `curl`과 같은 옵션 문법이나 프로토콜 범위를 가진 도구는 아니다.

## 요청의 구성

\`\`\`text
CLI 입력: http [METHOD] URL [ITEM ...]
                         │
               구분자로 ITEM 해석
               ├─ Name:Value → Header
               ├─ name==value → Query
               └─ name=value / := → JSON Body
                         │
                         ▼
                 HTTP Request ──> Server
                         │
                         ▼
             Status + Headers + Body
                         │
                 출력 형식 / 종료 상태
\`\`\`
```sh
http GET example.com
http GET example.com/search q==hello
http POST example.com/users name=Kim active:=true
http GET example.com Authorization:'Bearer TOKEN'
```

## 1. 요청 조립 — 구분자로 대상 구분

| 문법 | 의미 | 예 |
|---|---|---|
| `:` | 헤더 | `Accept:application/json` |
| `=` | JSON 문자열 필드 | `name=Kim` |
| `:=` | JSON 리터럴 값 | `active:=true`, `count:=3` |
| `==` | URL 쿼리 파라미터 | `page==2` |

**예시:** `http GET example.com/search q==hello`는 URL Query를 만들고, `http POST example.com/users name=Kim active:=true`는 문자열과 Boolean 값을 가진 JSON Body를 만든다. 같은 단어라도 구분자에 따라 전송 위치와 타입이 달라진다.

`name=value`는 기본 JSON 요청 데이터에 사용된다. 파일 업로드·폼 요청은 별도 옵션과 문법을 사용한다.

## 2. 응답 해석 — HTTP 동작과 표시 구분

```text
METHOD + URL + Header + Body → 서버 요청
                                   │
                              Status / Headers / Body
                                   │
                             HTTPie 출력 형식
```

출력 꾸미기와 실제 HTTP 요청은 다르다. API 스크립트에서 상태 코드와 실패 조건을 처리할 때는 `--check-status` 등의 옵션을 확인한다.

공식 문서: [HTTPie CLI](https://httpie.io/docs/cli) · `http --help`
