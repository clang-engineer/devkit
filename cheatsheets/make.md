# Make / Makefile Cheatsheet

> 빌드 자동화의 클래식. C 빌드부터 도커·테스트·배포 단축 명령까지. `make`는 어디나 깔려 있어서 "스크립트 묶음"으로도 쓰기 좋다.

## 30초만 본다면

| 상황 | 표현 |
|---|---|
| 가짜 타깃 (파일 아님) | `.PHONY: all clean test` |
| 자동 변수 — 타깃 | `$@` |
| 자동 변수 — 첫 번째 의존성 | `$<` |
| 자동 변수 — 모든 의존성 | `$^` |
| 변수 즉시 평가 (한 번) | `VAR := value` |
| 변수 지연 평가 (호출 시) | `VAR = value` |
| 미정의 시만 할당 | `VAR ?= default` |
| 패턴 룰 | `%.o: %.c` |
| 명령 자체 출력 끄기 | 명령 앞에 `@` |
| 에러 무시 | 명령 앞에 `-` |
| 셸 명령 호출 | `$(shell ...)` |
| 파일 목록 | `$(wildcard *.c)` |
| 첫 타깃이 기본 | 인자 없이 `make` → 첫 타깃 실행 |

## 기본 구조

```make
target: prerequisites
	recipe

# 예
hello: hello.c
	gcc -o hello hello.c
```

> **들여쓰기는 반드시 탭(Tab)**. 스페이스는 `*** missing separator` 에러.

## 자동 변수 (recipe 안에서만)

| 변수 | 의미 |
|---|---|
| `$@` | 타깃 이름 |
| `$<` | 첫 번째 의존성 |
| `$^` | 모든 의존성 (중복 제거) |
| `$+` | 모든 의존성 (중복 포함) |
| `$?` | 타깃보다 새로운 의존성만 |
| `$*` | 패턴 룰에서 `%` 매치 부분 |
| `$(@D)` / `$(@F)` | 타깃의 디렉터리 / 파일명 |

```make
build/%.o: src/%.c
	@mkdir -p $(@D)
	$(CC) -c $< -o $@
```

## 변수

```make
# := 즉시 평가 (선언 시점에 한 번)
CC := gcc
TIMESTAMP := $(shell date +%s)

# = 지연 평가 (참조될 때마다)
SRC = $(wildcard src/*.c)        # 매번 새로 글로빙

# ?= 미정의일 때만 할당 (빈 값이어도 정의됐으면 유지)
CFLAGS ?= -O2 -Wall

# += 추가
CFLAGS += -g

# 환경변수에서 받기 (없으면 기본값)
PREFIX ?= /usr/local
```

```make
# 외부에서 override
make CFLAGS=-O0
make install PREFIX=$HOME/.local
```

## `.PHONY` — 가짜 타깃

`clean`, `test`, `all` 같이 **실제 파일이 아닌** 타깃은 `.PHONY`로 선언. 안 하면 `clean`이라는 파일이 우연히 생기면 동작 멈춤.

```make
.PHONY: all clean test install

all: build test

clean:
	rm -rf build/

test:
	go test ./...
```

## 패턴 룰

`%`로 와일드카드. 한 룰로 모든 `.c → .o`:

```make
%.o: %.c
	$(CC) -c $< -o $@

# 디렉터리 분리
build/%.o: src/%.c
	@mkdir -p $(@D)
	$(CC) -c $< -o $@

# 정적 패턴 (대상 명확히 한정)
$(OBJS): build/%.o: src/%.c
	$(CC) -c $< -o $@
```

## 자주 쓰는 내장 함수

```make
$(wildcard src/*.c)              # 파일 목록 (글로빙)
$(patsubst %.c,%.o,$(SRCS))      # 패턴 치환 (= $(SRCS:.c=.o))
$(subst old,new,text)            # 단순 치환
$(filter %.c,$(FILES))           # 패턴 매치만
$(filter-out test_%,$(FILES))    # 패턴 매치 제외
$(notdir path/to/file.c)         # 파일명만 → file.c
$(basename file.c)               # 확장자 제거 → file
$(addprefix build/,$(FILES))     # 앞에 붙이기
$(addsuffix .o,$(NAMES))         # 뒤에 붙이기
$(shell ls *.c)                  # 셸 명령 실행 결과
$(foreach f,$(SRCS),build/$(f).o)
```

## 조건문

```make
ifeq ($(OS),Windows_NT)
    RM := del /Q
else
    RM := rm -f
endif

ifdef DEBUG
    CFLAGS += -O0 -g
else
    CFLAGS += -O2
endif

ifneq ($(strip $(FOO)),)
    # FOO가 비어있지 않을 때
endif
```

## 명령어 제어

| 접두 | 의미 |
|---|---|
| `@cmd` | 명령 자체를 출력하지 않음 (echo 끔) |
| `-cmd` | 실패해도 무시 (`exit code` 무시) |
| `+cmd` | dry-run(`-n`) 시에도 실행 |

```make
clean:
	@echo "cleaning..."
	-rm -rf build/
	@echo "done"
```

## 디렉터리 자동 생성

```make
BUILD_DIR := build

$(BUILD_DIR):
	@mkdir -p $@

# order-only prerequisite (|로 구분) — 변경 시간 체크 X, 존재만 보장
build/%.o: src/%.c | $(BUILD_DIR)
	$(CC) -c $< -o $@
```

## 흔한 패턴 — 도커·테스트 단축 명령

`make`를 "프로젝트 일관 진입점"으로 쓰는 패턴. 빌드 도구가 아니어도 유용.

```make
.PHONY: help up down logs sh test fmt lint

help:    ## 사용법
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up:      ## 개발 환경 띄우기
	docker compose up -d

down:    ## 정리
	docker compose down

logs:    ## 로그 (SVC=name 지정 가능)
	docker compose logs -f $(SVC)

sh:      ## 컨테이너 셸 (SVC=name 필수)
	docker compose exec $(SVC) bash

test:
	go test ./...

fmt:
	go fmt ./...

lint:
	golangci-lint run
```

호출: `make help`, `make up`, `make logs SVC=web`, `make sh SVC=db`.

## 디버그

```bash
make -n target          # dry-run (실행 안 하고 명령만 출력)
make -p                 # 모든 변수·룰·내장 룰 덤프 (긴 출력)
make --debug=v target   # verbose 디버그
make -j8                # 병렬 빌드 (8개 job)
make -B                 # 모두 새로 빌드 (mtime 무시)
make -C subdir/         # 다른 디렉터리로 가서 make
```

## 참고

- 공식 매뉴얼: https://www.gnu.org/software/make/manual/make.html
- 내장 룰 목록: `make -p | head -200`
- 더 현대적인 대안: `just`(셸 친화 한정), `task`(YAML 기반) — 단 `make`는 어디나 깔려있음
