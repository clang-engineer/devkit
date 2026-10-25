# just — 레시피와 작업 실행 문법

> `just`는 **이름 붙인 명령 묶음(Recipe)**을 실행한다. `make`의 파일 의존성·타임스탬프 기반 증분 빌드를 대체하는 도구는 아니다.

## 파일과 명령의 관계

```text
justfile
 ├─ recipe: 이름 + 인자 + 명령
 ├─ variable: 공통 값
 └─ dependency: 다른 recipe 먼저 실행
         │
       just [recipe] [arguments]
```

```just
default:
    @just --list

greet name="world":
    echo "Hello, {{name}}"

test:
    cargo test

check: test
    cargo fmt --check
```

```sh
just --list         # recipe 목록
just greet Alice    # 인자 전달
just check          # 의존 recipe 실행 후 check
just --dry-run check # 실제 실행하지 않고 확인
```

## Recipe의 세 요소

```text
check: test
  │     └─ dependency (먼저 실행할 recipe)
  └─ recipe 이름

greet name="world":
      └─ 기본값이 있는 parameter

{{name}} → just 변수·인자 보간
```

**중요:** 기본적으로 Recipe의 각 명령 줄은 별도 Shell에서 실행된다. `cd dir`을 다음 줄에도 유지하려면 같은 줄에서 연결하거나 `[script]` Recipe를 사용한다.

```just
where:
    cd src && pwd
```

공식 문서: [just 매뉴얼](https://just.systems/man/en/) · `just --help`
