# Shell — 명령 해석·실행·작업 제어 지도

> **Bash 기준.** 셸은 입력을 해석해 명령과 인자를 만들고, 실행 결과와 프로세스를 제어한다. 이 문서는 기능을 발견하고 문법을 유추하는 압축 지도다. 전체 구문과 예외는 `help`, `man bash`에서 확인한다.

Zsh는 배열 인덱스·확장·단어 분리 규칙이 다르다. Zsh 고유 기능은 [Zsh 치트시트](zsh.md)를 참고한다.

## 셸의 큰 그림 — 기능과 관계

```text
Shell
├─ 1. 명령 구성 (Interpret)
│  ├─ Quoting / Expansion / Globbing → 인자 생성
│  └─ Parameter Expansion           → 변수 값 가공
├─ 2. 명령 실행 (Execute)
│  ├─ Builtin / Function / External → 실행 대상
│  ├─ Redirection / Pipeline        → 입출력 연결
│  ├─ Exit Status                   → 성공·실패 판단
│  └─ if / case / for / while       → 실행 흐름 결정
└─ 3. 실행 환경과 작업 관리 (Control)
   ├─ Variable / Environment / Option → 실행 조건
   └─ Job / Signal / Trap / Wait      → 실행 중 작업 관리
```

이 그림은 **실행 순서가 아닌 기능 관계도**다. 명령을 구성하고 실행하는 동안 조건문·반복문이 흐름을 제어하며, 환경 설정과 작업 제어는 여러 단계에 걸쳐 작용한다. 아래 본문은 각 영역의 존재 이유와 대표 문법만 설명한다.

## 1. 명령 구성 (Interpret)

입력 문자열을 **실행할 명령과 인자**로 해석하는 영역이다. Quoting·Expansion·Globbing이 인자의 모양을 결정하고, Parameter Expansion은 변수 값을 가공한다.

### Quoting · Expansion · Globbing — 입력을 인자로 바꾸기

```text
입력 문자열
  ├─ Quoting           : 문자를 문자 그대로 둘까?
  ├─ Expansion         : 변수·명령 결과·패턴을 펼칠까?
  ├─ Word Splitting    : 확장 결과를 여러 인자로 나눌까?
  └─ Filename Globbing : 파일명 패턴을 경로로 바꿀까?
         ↓
    명령 + 인자들 → 실행
```

| 목적 | 대표 문법 | 구분 |
|---|---|---|
| 리터럴 보존 | `'$HOME'` | 확장하지 않음 |
| 변수 확장, 인자 보존 | `"$HOME"` | 공백이 있어도 한 인자 |
| 명령 결과 사용 | `"$(date)"` | 명령 치환 |
| 파일명 선택 | `*.log` | glob |
| 문자열 후보 생성 | `file{A,B}.txt` | brace expansion |

`"$@"`는 전달받은 각 인자를 그대로 보존한다. 반대로 인용하지 않은 `$var`는 Bash에서 단어 분리와 파일명 확장의 영향을 받을 수 있다.

### Parameter Expansion — 변수 값을 가공하기

```text
${parameter...}
├─ 기본값·검증     :-  :=  :?  :+
├─ 길이·부분 추출  #   :offset:length
├─ 앞/뒤 패턴 제거 #   ##   %   %%
├─ 치환            /   //
└─ 대소문자        ^^  ,,  (Bash 4+)
```

| 문제 | 대표 표현 | 의미 |
|---|---|---|
| 값이 없으면 기본값 | `${name:-guest}` | 미설정 또는 빈 값일 때 대체 |
| 필수 값 검사 | `${name:?required}` | 값이 없으면 오류 |
| 문자열 길이 | `${#name}` | 문자 수 |
| 경로에서 파일명 | `${path##*/}` | 마지막 `/` 앞까지 제거 |
| 경로에서 디렉터리 | `${path%/*}` | 마지막 `/` 뒤 제거 |
| 문자열 치환 | `${name/old/new}` | 첫 일치 치환 |

`#`·`##`는 **앞에서**, `%`·`%%`는 **뒤에서** 패턴을 제거한다. 긴 형태(`##`, `%%`)는 가장 긴 일치를 제거한다. `:-`는 값을 읽을 때만 대체하고 `:=`는 변수에 대입한다.

## 2. 명령 실행 (Execute)

만들어진 명령을 실행하고 **입출력을 연결**하며, 종료 상태와 조건에 따라 다음 명령을 선택한다. 조건문·반복문은 실행 이후의 별도 단계가 아니라 명령 실행을 제어하는 구문이다.

### 실행 대상 — Builtin · Function · External

| 대상 | 존재 이유 | 예 |
|---|---|---|
| Builtin | 셸 자신의 상태를 직접 변경하거나 제어 | `cd`, `export`, `set` |
| Function | 반복할 셸 명령을 이름으로 묶음 | `f() { ...; }` |
| External Command | 별도 프로그램 실행 | `rg`, `git`, `python` |

`cd`처럼 현재 셸의 작업 디렉터리를 바꾸는 명령과 외부 프로세스 실행은 효과 범위가 다르다. 함수도 셸의 실행 대상이며, 아래 흐름 제어 절에서는 함수의 **인자·종료 상태**를 다시 다룬다.

### Pipeline · Redirection · Exit Status

**Redirection은 한 명령의 입출력 대상을 바꾸고, Pipeline은 여러 명령의 출력을 연결한다.** 종료 상태는 그 실행 결과를 조건 분기에 활용하는 값이다.

```text
명령 A ── stdout ── | ── stdin ── 명령 B
          │
          ├─ > file   : stdout을 파일로
          └─ 2> file  : stderr를 파일로

명령의 Exit Status → && / || / if 에서 판단
```

| 의도 | 대표 문법 | 핵심 |
|---|---|---|
| 순차 실행 | `a; b` | 앞의 성공 여부와 무관 |
| 성공 시 다음 실행 | `a && b` | 종료 상태 0 |
| 실패 시 다음 실행 | `a || b` | 종료 상태 0이 아님 |
| 출력 연결 | `a | b` | stdout → stdin |
| 출력 덮어쓰기 / 추가 | `> file` / `>> file` | stdout |
| 오류 출력 분리 | `2> err.log` | stderr |
| 출력과 오류 합치기 | `> log 2>&1` | 리다이렉션 순서 중요 |
| 현재 셸에서 그룹 실행 | `{ a; b; }` | 현재 셸 환경 |
| 서브셸에서 그룹 실행 | `( a; b )` | 환경 분리 |

`cmd > log 2>&1`과 `cmd 2>&1 > log`는 다르다. **리다이렉션은 왼쪽에서 오른쪽 순서대로 적용**한다.

### 여러 줄·파일 같은 입력

| 문법 | 존재 이유 |
|---|---|
| `<<EOF` | 여러 줄을 표준 입력으로 전달 (확장 가능) |
| `<<'EOF'` | 확장하지 않고 원문 전달 |
| `<<-EOF` | 앞쪽 탭 들여쓰기 제거 |
| `<<<"$value"` | 한 문자열을 표준 입력으로 전달 (here-string) |
| `<(cmd)` / `>(cmd)` | 명령의 입출력을 파일 경로가 필요한 자리에 연결 |

```bash
cat <<'EOF'
$HOME은 확장되지 않는다.
EOF

diff <(sort old.txt) <(sort new.txt)
```

### Condition · Loop · Function — 다음 실행 결정

`if`·`case`는 조건에 따라 실행 대상을 선택하고, `for`·`while`은 반복을 제어한다. 함수는 재사용할 명령 묶음으로, 조건·반복과 조합할 수 있다.

```text
Exit Status ──> if / && / ||
값·패턴     ──> [[ ... ]] / case
반복 대상   ──> for / while / until
반복 로직   ──> function
여러 값     ──> indexed / associative array
```

| 목적 | 대표 문법 | 기억할 점 |
|---|---|---|
| 상태 조건 | `if cmd; then ...; fi` | 명령 종료 상태 검사 |
| 문자열·파일 검사 | `[[ -n $s ]]`, `[[ -f $f ]]` | Bash·Zsh 구문 |
| 여러 패턴 분기 | `case "$x" in ... esac` | 패턴별 분기 |
| 값 목록 반복 | `for x in ...; do ...; done` | 항목마다 실행 |
| 조건 반복 | `while cmd; do ...; done` | 성공하는 동안 반복 |
| 함수 | `f() { ...; }` | 인자 `$1`, `"$@"`; 상태는 `return` |
| 인덱스 배열 | `arr=(a b)`, `"${arr[@]}"` | Bash는 0부터 시작 |
| 연관 배열 | `declare -A map` | Bash 4+ |

`return`은 **종료 상태**를 반환한다. 함수의 데이터 결과는 stdout 등 별도 경로로 전달한다. 파일을 줄 단위로 읽을 때는 `while IFS= read -r line; do ...; done < file` 패턴을 알아두면 좋다.

## 3. 실행 환경과 작업 관리 (Control)

셸 옵션과 환경은 명령 해석·실행에 **지속적으로 영향**을 주고, Job·Signal·Trap은 실행 중인 작업을 관리한다. 따라서 이 영역은 앞의 두 영역 뒤에 순서대로 실행되는 단계가 아니다.

### Job Control · Signal · Trap

**Job Control은 작업의 전경·배경·정지 상태를 관리한다.** Signal은 프로세스에 전달되는 제어 신호이고, `trap`은 셸이 처리할 신호나 종료 시점에 실행할 동작을 등록한다.

```text
Shell
├─ Foreground Job ── Ctrl+Z ──> Stopped
│                                  │
│                             fg / bg
└─ Background Job <── cmd & ── 실행
       ├─ jobs : 현재 셸의 작업 조회
       ├─ wait : 완료 대기
       └─ disown : 셸의 job 테이블에서 제거
```

| 명령 | 존재 이유 |
|---|---|
| `cmd &` | 백그라운드 실행 |
| `jobs` | 현재 셸의 작업 확인 |
| `fg %1` / `bg %1` | 작업을 전경으로 / 배경에서 재개 |
| `wait` / `wait $!` | 작업 완료 대기 |
| `disown %1` | 셸의 작업 관리 목록에서 분리 |
| `nohup cmd ... &` | SIGHUP 무시하고 실행 |
| `trap 'cleanup' EXIT` | 종료·시그널 시 정리 작업 |

**Job ≠ Process ≠ Service.** `disown`은 생존을 보장하지 않고, `nohup`도 자동 재시작을 제공하지 않는다. `tmux`는 터미널 세션을, `systemd`는 서비스 수명주기를 관리한다. 실제 장애 사례는 [nohup 백그라운드 작업 정지 진단](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-07-28-nohup-dev-server-suspended.md)을 참고한다.

### Variable · Environment — 값의 전달 범위

```text
Shell Variable ── export ──> Environment Variable
                                   │
                                   └─ 자식 프로세스에 전달
```

`name=value`는 셸 변수 설정, `export name`은 자식 프로세스가 받을 환경에 포함한다. `name=value command`는 해당 명령 실행에 환경 값을 지정한다. 자식 프로세스가 부모 셸의 변수를 직접 수정하는 것은 아니다.

### Shell Option — 실행 규칙 설정

```text
set -옵션  → 켜기
set +옵션  → 끄기
set -o     → 옵션 상태 조회
```

| 옵션 | 역할 |
|---|---|
| `-e` (errexit) | 일부 명령 실패 시 종료 (조건문 등 예외 있음) |
| `-u` (nounset) | 미설정 변수 접근 오류 |
| `-o pipefail` | 파이프라인 내부 실패를 종료 상태에 반영 |
| `-x` (xtrace) | 실행 명령 추적 |
| `-n` (noexec) | 명령 실행 없이 문법 검사 |

`#!/usr/bin/env bash`는 Bash 실행기를 선택하는 shebang이다. `set -euo pipefail`은 흔한 안전 설정이지만 **모든 오류를 잡는 보증이 아니다**. `set -e`를 임시로 끄고 켜는 대신 실패를 명시적으로 처리해야 하는 곳은 `if`나 `||`로 표현하는 편이 의도가 명확하다.

## 더 알아보기

- `help` / `help set` / `man bash` — Bash 내장 명령·전체 문법
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html) — 확장 순서, 조건문, 예외와 옵션의 정확한 정의
- [ShellCheck](https://www.shellcheck.net/) — 셸 스크립트 정적 분석
- [Zsh 치트시트](zsh.md) — ZLE·History·Glob·Completion 등 Zsh 고유 기능
