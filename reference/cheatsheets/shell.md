# Shell — 명령 해석·실행·작업 제어 지도

> **Bash 기준.** 셸은 입력을 해석해 명령과 인자를 만들고, 실행 결과와 프로세스를 제어한다. 이 문서는 기능을 발견하고 문법을 유추하는 압축 지도다. 전체 구문과 예외는 `help`, `man bash`에서 확인한다.

Zsh는 배열 인덱스·확장·단어 분리 규칙이 다르다. Zsh 고유 기능은 [Zsh 치트시트](zsh.md)를 참고한다.

## 셸의 큰 흐름 — 입력에서 다음 명령까지

```text
사용자 입력 / Shell Script
           │
           ▼
     명령 구문 해석
     ├─ Quoting       : 무엇을 문자 그대로 둘까?
     ├─ Expansion     : 변수·명령 결과를 어떻게 펼칠까?
     └─ Globbing      : 어떤 파일명을 인자로 만들까?
           │
           ▼
     명령 실행 준비
     ├─ Builtin / Function / External Command
     ├─ Redirection / Pipeline : 입출력 연결
     └─ Foreground / Background: 작업 실행 방식
           │
           ▼
     실행 결과 (Exit Status)
           │
           └── if / && / || / Loop → 다음 실행 결정

     [실행 전반에 작용] Variable / Option / Environment
     [실행 중 제어]     Job / Signal / Trap / Wait
```

**핵심 질문은 세 가지다.** 어떤 **인자**가 만들어지는가? 명령의 **입출력과 실행 방식**은 무엇인가? 실행 **결과**에 따라 다음 동작은 어떻게 달라지는가?

이 그림은 이해를 위한 **개념적 흐름**이다. 실제 Bash의 구문 분석·확장·리다이렉션·실행에는 구체적인 순서와 예외가 있으며, `if`와 반복문은 실행이 끝난 뒤에만 작동하는 별도 단계가 아니라 명령 실행을 감싸고 제어하는 구문이다. 아래 기능 지도는 실행 순서가 아닌 **기능 분류**다.

## 전체 기능 지도

```text
Shell
├─ 입력·해석       Quoting / Expansion / Globbing
├─ 실행·연결       Builtin / Function / External / Pipe / Redirect
├─ 흐름 제어       Exit Status / if / case / loop / function
├─ 데이터 표현     Variable / Parameter Expansion / Array
├─ 작업·신호       Foreground / Background / Job / wait / trap
└─ 실행 환경       Option (set) / Environment / Script
```

위는 **기능 분류**다. 실제 파싱·확장의 정확한 실행 순서가 아니다. 셸의 두 질문은 **“어떤 인자가 만들어지는가?”**와 **“그 명령을 언제·어디서 실행하는가?”**다.

## 1. 입력을 명령과 인자로 바꾸기

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
| 다른 명령 출력을 파일처럼 전달 | `<(sort a.txt)` | process substitution (Bash·Zsh) |

`"$@"`는 전달받은 각 인자를 그대로 보존한다. 반대로 인용하지 않은 `$var`는 Bash에서 단어 분리와 파일명 확장의 영향을 받을 수 있다.

## 2. Parameter Expansion — 변수를 어떻게 가공하나?

```text
\${parameter...}
├─ 기본값·검증     :-  :=  :?  :+
├─ 길이·부분 추출  #   :offset:length
├─ 앞/뒤 패턴 제거 #   ##   %   %%
├─ 치환            /   //
└─ 대소문자        ^^  ,,  (Bash 4+)
```

| 문제 | 대표 표현 | 의미 |
|---|---|---|
| 값이 없으면 기본값 | `\${name:-guest}` | 미설정 또는 빈 값일 때 대체 |
| 필수 값 검사 | `\${name:?required}` | 값이 없으면 오류 |
| 문자열 길이 | `\${#name}` | 문자 수 |
| 경로에서 파일명 | `\${path##*/}` | 마지막 `/` 앞까지 제거 |
| 경로에서 디렉터리 | `\${path%/*}` | 마지막 `/` 뒤 제거 |
| 문자열 치환 | `\${name/old/new}` | 첫 일치 치환 |

`#`·`##`는 **앞에서**, `%`·`%%`는 **뒤에서** 패턴을 제거한다. 긴 형태(`##`, `%%`)는 가장 긴 일치를 제거한다. `:-`는 값을 읽을 때만 대체하고 `:=`는 변수에 대입한다.

## 3. 실행 결과를 연결하기

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
| `<(cmd)` / `>(cmd)` | 명령 출력을 파일 경로가 필요한 자리에 연결 |

```bash
cat <<'EOF'
$HOME은 확장되지 않는다.
EOF

diff <(sort old.txt) <(sort new.txt)
```

## 4. 흐름 제어와 데이터

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
| 인덱스 배열 | `arr=(a b)`, `"\${arr[@]}"` | Bash는 0부터 시작 |
| 연관 배열 | `declare -A map` | Bash 4+ |

`return`은 **종료 상태**를 반환한다. 함수의 데이터 결과는 stdout 등 별도 경로로 전달한다. 파일을 줄 단위로 읽을 때는 `while IFS= read -r line; do ...; done < file` 패턴을 알아두면 좋다.

## 5. Job Control — 실행 중인 작업은 누가 관리하나?

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

## 6. Shell Option — 실행 규칙을 바꾸기

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
