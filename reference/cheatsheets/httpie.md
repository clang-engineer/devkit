# HTTPie (http) — 요청을 문법으로 조립하기

> `http`는 HTTP 요청을 읽기 쉽게 작성하는 CLI다. `curl`과 같은 옵션 문법이나 프로토콜 범위를 가진 도구는 아니다.

## 요청의 구성

```text
http [METHOD] URL [ITEM ...]
      │       │       │
      │       │       ├─ Header       Name:Value
      │       │       ├─ JSON field   name=value
      │       │       ├─ Raw field    name:=JSON
      │       │       └─ Query param  name==value
      │       └─ 요청 주소
      └─ 생략하면 데이터 유무에 따라 GET/POST 선택
```

```sh
http GET example.com
http GET example.com/search q==hello
http POST example.com/users name=Kim active:=true
http GET example.com Authorization:'Bearer TOKEN'
```

## 구분자를 이해하면 외울 것이 줄어든다

| 문법 | 의미 | 예 |
|---|---|---|
| `:` | 헤더 | `Accept:application/json` |
| `=` | JSON 문자열 필드 | `name=Kim` |
| `:=` | JSON 리터럴 값 | `active:=true`, `count:=3` |
| `==` | URL 쿼리 파라미터 | `page==2` |

`name=value`는 기본 JSON 요청 데이터에 사용된다. 파일 업로드·폼 요청은 별도 옵션과 문법을 사용한다.

## HTTP 동작과 표시를 분리

```text
METHOD + URL + Header + Body → 서버 요청
                                   │
                              Status / Headers / Body
                                   │
                             HTTPie 출력 형식
```

출력 꾸미기와 실제 HTTP 요청은 다르다. API 스크립트에서 상태 코드와 실패 조건을 처리할 때는 `--check-status` 등의 옵션을 확인한다.

공식 문서: [HTTPie CLI](https://httpie.io/docs/cli) · `http --help`
