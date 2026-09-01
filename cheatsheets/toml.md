# TOML Cheatsheet

> **Tom's Obvious, Minimal Language** — 사람이 읽고 수정하기 쉬운 설정 파일 형식.

## 개념 흐름

```text
키 = 값 (기본)
  ↓
[테이블] (그룹)
  ↓
[[배열]] (복수 항목)
  ↓
[a.b] (중첩)
```

핵심 문법:

| 문법 | 의미 |
|---|---|
| `key = value` | 키에 값 할당 |
| `[table]` | 하나의 설정 묶음(테이블) |
| `[[items]]` | 테이블 배열에 새 항목 추가 |
| `[a.b]` | 중첩 테이블 |
| `# comment` | 주석 |

## 연결 도구

| 도구 | 관계 |
|------|------|
| cargo | Rust 프로젝트에서 TOML 사용 |
| pyproject.toml | Python 프로젝트 설정 |
| mise | .tool-versions 대신 TOML 사용 |

## 30초만 본다면

| 문법 | 의미 |
|---|---|
| `key = value` | 키에 값 할당 |
| `[table]` | 하나의 설정 묶음(테이블) |
| `[[items]]` | 테이블 배열에 새 항목 추가 |
| `[a.b]` | 중첩 테이블 |
| `[1, 2, 3]` | 배열 |
| `{ x = 1, y = 2 }` | 인라인 테이블 |
| `# comment` | 주석 |

핵심은 `key = value`이고, `[ ]`와 `[[ ]]`는 값이 들어갈 구조를 선언한다.

## 기본 값

```toml
title = "TOML example"       # 문자열
port = 8080                  # 정수
ratio = 0.75                 # 실수
enabled = true               # 불리언
created_at = 2026-08-29T12:30:00Z  # 날짜·시간
```

키 이름에 공백이나 특수문자가 없다면 따옴표를 생략할 수 있다.

```toml
simple_key = "value"
"key with spaces" = "value"
```

## 문자열

```toml
basic = "줄바꿈: \n"          # 이스케이프 처리
literal = 'C:\Users\zero'    # 이스케이프하지 않음

multiline = """
여러 줄 문자열
"""

multiline_literal = '''
여러 줄을 그대로 유지
'''
```

## 배열

```toml
ports = [8080, 8081, 8082]
roles = ["admin", "user"]
matrix = [[1, 2], [3, 4]]
```

## 테이블 `[ ]`

테이블 하나, 즉 객체 하나를 선언한다.

```toml
[database]
host = "localhost"
port = 5432

[database.pool]
minimum = 2
maximum = 10
```

위 설정은 다음과 같은 구조다.

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "pool": {
      "minimum": 2,
      "maximum": 10
    }
  }
}
```

같은 테이블을 두 번 선언할 수 없다.

```toml
[database]
host = "localhost"

# 오류: database는 이미 선언됨
[database]
port = 5432
```

## 테이블 배열 `[[ ]]`

같은 형태의 객체를 여러 개 담는다. `[[items]]`가 나올 때마다 배열에 새 항목이 추가된다.

```toml
[[servers]]
name = "api-1"
port = 8080

[[servers]]
name = "api-2"
port = 9090
```

위 설정은 다음과 같은 구조다.

```json
{
  "servers": [
    { "name": "api-1", "port": 8080 },
    { "name": "api-2", "port": 9090 }
  ]
}
```

### 배열 항목 아래에 하위 테이블 두기

```toml
[[servers]]
name = "api-1"

[servers.health]
path = "/health"
interval = 30

[[servers]]
name = "api-2"

[servers.health]
path = "/ready"
interval = 60
```

각 `[servers.health]`는 바로 앞에서 선언한 `[[servers]]` 항목에 속한다.

## 점 표기 키

간단한 중첩 구조는 점으로 표현할 수 있다.

```toml
database.host = "localhost"
database.port = 5432
```

이는 다음 선언과 같은 구조다.

```toml
[database]
host = "localhost"
port = 5432
```

## 인라인 테이블

작은 객체는 한 줄로 작성할 수 있다.

```toml
database = { host = "localhost", port = 5432 }
```

복잡해지면 일반 테이블 `[database]`로 분리하는 편이 읽기 쉽다.

## 날짜와 시간

```toml
utc_time = 2026-08-29T12:30:00Z
offset_time = 2026-08-29T21:30:00+09:00
local_time = 2026-08-29T21:30:00
local_date = 2026-08-29
time_only = 21:30:00
```

날짜·시간 값은 문자열이 아니므로 따옴표를 붙이지 않는다.

## 자주 하는 실수

### 문자열에 따옴표 누락

```toml
# 오류
theme = dark

# 정상
theme = "dark"
```

### JSON처럼 쉼표 사용

```toml
# 오류
host = "localhost",
port = 5432

# 정상
host = "localhost"
port = 5432
```

### `[ ]`와 `[[ ]]` 혼동

```toml
[user]       # 사용자 객체 하나
name = "zero"

[[users]]    # 사용자 객체 배열에 항목 하나 추가
name = "zero"

[[users]]    # 두 번째 항목 추가
name = "admin"
```

## 한 줄 요약

- `key = value`: 값을 설정한다.
- `[name]`: 객체 하나를 만든다.
- `[[name]]`: 객체 배열에 새 항목을 추가한다.
- `[a.b]`: 중첩 객체를 만든다.
- `[...]`: 값 배열, `{ ... }`: 한 줄짜리 객체다.

## 더 보기

- 공식 문법: https://toml.io/en/
- 공식 저장소: https://github.com/toml-lang/toml
