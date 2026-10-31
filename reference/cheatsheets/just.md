# just — 레시피와 작업 실행 문법

> `just`는 **이름 붙인 명령 묶음(Recipe)**을 실행한다. `make`의 파일 의존성·타임스탬프 기반 증분 빌드를 대체하는 도구는 아니다.

## 전체 작동 모델 — Recipe 선택부터 실행까지

```text
just [recipe] [arguments]
           │
           ▼
     justfile 해석
     ├─ Recipe·Parameter 선택
     ├─ Variable·Expression 평가
     └─ Dependency 먼저 실행
           │
           ▼
     Recipe 본문 명령 실행
     (기본: 각 줄은 별도 Shell)
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

## 1. Recipe·인자·의존 관계

```text
check: test
  │     └─ dependency (먼저 실행할 recipe)
  └─ recipe 이름

greet name="world":
      └─ 기본값이 있는 parameter

{{name}} → just 변수·인자 보간
```

**예시:** `just check`는 `check: test` 의존 관계에 따라 `test`를 먼저 실행한 뒤 `cargo fmt --check`를 실행한다. `just --dry-run check`로 실제 실행 전에 순서를 확인할 수 있다.

**중요:** 기본적으로 Recipe의 각 명령 줄은 별도 Shell에서 실행된다. `cd dir`을 다음 줄에도 유지하려면 같은 줄에서 연결하거나 `[script]` Recipe를 사용한다.

```just
where:
    cd src && pwd
```

공식 문서: [just 매뉴얼](https://just.systems/man/en/) · `just --help`
