# Shell Cheatsheet

> Bash/Zsh 공통 — 스크립트 안정성, 연산자·확장 문법, 잡 관리. 매번 검색하는 heredoc·`${...}` 확장·`<(cmd)`·배열·반복 표 한 곳에.

## 스크립트 안전 헤더

```sh
#!/bin/bash
set -euo pipefail
IFS=$'\n\t'
```

- `-e` 오류 시 종료, `-u` 미정의 변수 차단, `-o pipefail` 파이프 중 어디서든 실패 감지.
- `IFS` 재정의로 공백 분리에서 오는 버그 차단.
- 디버그: `set -x` (실행 추적).

## `set` — 셸 동작 제어

`-`로 활성, `+`로 비활성.

| 옵션 | 이름 | 의미 |
|---|---|---|
| `-e` | errexit | 명령 실패 시 즉시 종료 |
| `-u` | nounset | 정의되지 않은 변수 접근 시 종료 |
| `-o pipefail` | pipefail | 파이프라인 중 하나라도 실패하면 전체 실패 |
| `-x` | xtrace | 실행되는 명령 출력 (디버그) |
| `-v` | verbose | 입력 라인 그대로 출력 |
| `-n` | noexec | 실행하지 않고 문법 검사만 |
| `-f` | noglob | glob 패턴 비활성화 |

```sh
set -o      # 활성/비활성 옵션 표시
echo $-     # 현재 활성화된 옵션 문자

# 임시 해제
set +e
risky_command
result=$?
set -e
```

## 연결 연산자

| 구문 | 실행 조건 |
|---|---|
| `a &` | `a` 백그라운드, 즉시 다음 명령 |
| `a ; b` | 순차 실행 (`a` 성공 여부 무관) |
| `a && b` | `a` 성공 시 `b` |
| `a \|\| b` | `a` 실패 시 `b` |
| `{ a; b; }` | 그룹 (현재 셸에서 실행) |
| `( a; b )` | 그룹 (서브셸에서 실행, 환경 격리) |

```sh
mkdir test && cd test
risky || echo "failed"
{ cd /tmp; pwd; }              # 현재 셸의 cwd 바뀜
( cd /tmp; pwd ); pwd          # 서브셸 → 원래 cwd 유지
```

## Heredoc — 여러 줄 입력

| 구문 | 의미 |
|---|---|
| `<<EOF` | 변수·명령 치환 **됨** |
| `<<'EOF'` | 변수·명령 치환 **안 됨** (리터럴) |
| `<<-EOF` | 줄 앞 **탭** 들여쓰기 제거 (스페이스는 X) |
| `<<<"문자열"` | here-string (한 줄만) |

```sh
cat <<EOF
홈: $HOME
시간: $(date +%H:%M)
EOF

cat <<'EOF'
$HOME은 그대로 출력 — 치환 안 됨
EOF

# 탭 들여쓰기는 살리고, 출력에선 제거
if true; then
    cat <<-EOF
	들여쓴 본문
	실제 출력엔 들여쓰기 없음
	EOF
fi

# here-string — 한 단어/문자열 입력
grep "pattern" <<<"$LINE"
```

## 파라미터 확장 (`${...}`)

자주 찾는 표 — `var=hello/world.txt` 기준.

| 패턴 | 결과 | 의미 |
|---|---|---|
| `${var:-default}` | `hello/world.txt` | 미정의/빈값이면 `default` |
| `${var:=default}` | `hello/world.txt` | 위 + var에 대입 |
| `${var:?msg}` | (에러) | 미정의/빈값이면 에러로 종료 |
| `${var:+x}` | `x` | 정의돼있을 때만 `x` |
| `${#var}` | `15` | 길이 |
| `${var:6}` | `world.txt` | offset 6부터 |
| `${var:6:5}` | `world` | offset 6부터 5글자 |
| `${var#*/}` | `world.txt` | 앞에서 짧은 매치 제거 |
| `${var##*/}` | `world.txt` | 앞에서 긴 매치 제거 → basename |
| `${var%/*}` | `hello` | 뒤에서 짧은 매치 제거 → dirname |
| `${var%%.*}` | `hello/world` | 뒤에서 긴 매치 제거 |
| `${var/l/L}` | `heLlo/world.txt` | 첫 번째만 치환 |
| `${var//l/L}` | `heLLo/worLd.txt` | 모든 매치 치환 |
| `${var/#hello/HI}` | `HI/world.txt` | 시작 매치만 |
| `${var/%txt/md}` | `hello/world.md` | 끝 매치만 |
| `${var^^}` | `HELLO/WORLD.TXT` | 대문자 |
| `${var,,}` | (소문자) | 소문자 |

```sh
file=/path/to/log.txt
echo "${file##*/}"       # log.txt
echo "${file%/*}"        # /path/to
echo "${file%.*}"        # /path/to/log
echo "${file##*.}"       # txt (확장자만)
```

## 프로세스 치환 `<(cmd)` / `>(cmd)`

명령의 입출력을 파일처럼 다루는 자리. Bash·Zsh 전용 (POSIX sh 아님).

```sh
# 두 명령의 출력을 비교
diff <(sort a.txt) <(sort b.txt)

# rg 결과를 grep 형식이 아닌 vim의 quickfix로
nvim -q <(rg --vimgrep "TODO")

# tee로 두 곳에 동시 기록
echo "log" | tee >(gzip > out.gz) >(wc -l > count.txt)
```

## Brace 확장

```sh
echo {1..5}              # 1 2 3 4 5
echo {01..10}            # 01 02 ... 10 (zero-pad)
echo {a..e}              # a b c d e
echo {1..10..2}          # 1 3 5 7 9 (step)
echo file{A,B,C}.txt     # fileA.txt fileB.txt fileC.txt
cp file.txt{,.bak}       # file.txt → file.txt.bak (복사)
mv file.txt{.bak,}       # 반대 (.bak 떼기)
mkdir -p project/{src,tests,docs}
```

## 배열

```sh
# 정의
arr=(apple banana cherry)
arr[3]="date"

# 접근
echo "${arr[0]}"           # apple
echo "${arr[@]}"           # 전체 (단어별 분리)
echo "${arr[*]}"           # 전체 (한 문자열, IFS로 결합)
echo "${#arr[@]}"          # 길이
echo "${!arr[@]}"          # 인덱스 목록

# 슬라이스
echo "${arr[@]:1:2}"       # banana cherry

# 추가 / 제거
arr+=("elderberry")
unset 'arr[1]'             # 인덱스 1 제거 (희소 배열 됨)

# 반복
for item in "${arr[@]}"; do
    echo "$item"
done
```

연관 배열 (Bash 4+, Zsh):

```sh
declare -A user
user[name]="alice"
user[age]=30
echo "${user[name]}"
for k in "${!user[@]}"; do
    echo "$k = ${user[$k]}"
done
```

## 반복문

```sh
# C 스타일
for ((i=0; i<10; i++)); do echo $i; done

# 범위
for i in {1..5}; do echo $i; done

# 파일 글로빙
for f in *.log; do
    echo "$f → ${f%.log}.gz"
done

# 명령 출력
for user in $(awk -F: '{print $1}' /etc/passwd); do
    echo "$user"
done

# while로 한 줄씩 (큰 파일)
while IFS= read -r line; do
    echo "[$line]"
done < input.txt

# until
until ping -c1 host >/dev/null; do sleep 1; done
```

## 조건문

```sh
# if + 종료 코드
if grep -q pattern file; then
    echo "found"
elif [[ -n "$VAR" ]]; then
    echo "var set"
else
    echo "not found"
fi

# case
case "$1" in
    start|up)   echo "starting" ;;
    stop|down)  echo "stopping" ;;
    *)          echo "usage: $0 {start|stop}" ;;
esac
```

### `[[ ... ]]` 테스트 (Bash·Zsh, **POSIX `[ ... ]`보다 안전**)

| 표현 | 의미 |
|---|---|
| `[[ -e f ]]` | 파일/디렉터리 존재 |
| `[[ -f f ]]` | 일반 파일 존재 |
| `[[ -d d ]]` | 디렉터리 존재 |
| `[[ -s f ]]` | 비어있지 않음 |
| `[[ -r/-w/-x f ]]` | 읽기/쓰기/실행 권한 |
| `[[ -z $s ]]` | 빈 문자열 |
| `[[ -n $s ]]` | 비어있지 않은 문자열 |
| `[[ $a = $b ]]` | 문자열 동등 |
| `[[ $a != $b ]]` | 문자열 다름 |
| `[[ $a < $b ]]` | 사전식 비교 |
| `[[ $s =~ ^[0-9]+$ ]]` | 정규식 매치 |
| `[[ $a -eq 0 ]]` | 정수 비교 (`-ne -lt -le -gt -ge`) |
| `(( a > b ))` | 산술 비교 (C스타일) |

```sh
# 정규식 매치 + 캡처
if [[ "user42" =~ ^([a-z]+)([0-9]+)$ ]]; then
    echo "${BASH_REMATCH[1]} / ${BASH_REMATCH[2]}"
fi
```

## 함수

```sh
greet() {
    local name="${1:-world}"
    echo "hello, $name"
}

greet              # hello, world
greet alice        # hello, alice

# 반환값은 echo로, 종료 코드는 return
parse_port() {
    local val="$1"
    [[ "$val" =~ ^[0-9]+$ ]] || return 1
    (( val > 0 && val < 65536 )) || return 2
    echo "$val"
}

if port=$(parse_port "$1"); then
    echo "using $port"
else
    echo "invalid port: $1" >&2
    exit 1
fi
```

## 쿼팅 / 변수 인용

| 표현 | 처리 |
|---|---|
| `'literal'` | 어떤 확장도 없음 |
| `"$var"` | 변수·명령 확장, **단어 분리 차단** |
| `$var` | 변수 확장 + 단어 분리 (위험) |
| `"$@"` | 인자 그대로 (각 단어 보존) |
| `"$*"` | 인자를 IFS로 합친 한 문자열 |

```sh
# 거의 항상 "$var" — 공백 들어간 경로/인자 안 깨짐
cp "$src" "$dst"

# "$@" — 함수에 인자 전달
log() { logger -t myapp -- "$@"; }
```

## 입출력 리다이렉션

| 구문 | 의미 |
|---|---|
| `> file` | stdout → 파일 (덮어쓰기) |
| `>> file` | stdout → 파일 (이어쓰기) |
| `2> file` | stderr → 파일 |
| `2>&1` | stderr → stdout (순서 중요) |
| `&> file` | stdout+stderr → 파일 (Bash 단축) |
| `&>> file` | stdout+stderr → 파일 (이어쓰기) |
| `< file` | stdin ← 파일 |
| `> /dev/null` | 버리기 |
| `\|&` | stdout+stderr 파이프 (`2>&1 \|`와 동일) |

```sh
# stderr만 따로 보기
cmd 2>/tmp/err >/dev/null

# 출력 + 에러 모두 로그로 + 화면에도
cmd 2>&1 | tee app.log
```

> `cmd > log 2>&1`과 `cmd 2>&1 > log`는 다르다 — 순서대로 처리되기 때문. 후자는 stderr가 화면으로 간다.

## Job 관리

| 명령 | 의미 |
|---|---|
| `cmd &` | 백그라운드 실행 |
| `Ctrl+Z` | foreground 일시 중지 |
| `jobs` / `jobs -l` | 현재 셸 job 목록 |
| `fg %n` | n번 job foreground로 |
| `bg %n` | n번 job background에서 재개 |
| `kill %n` | n번 job 종료 (`%` 없으면 PID — 주의) |
| `disown %n` | 셸 종료 시 죽지 않게 detach |
| `nohup cmd &` | hangup 무시 + 백그라운드 |
| `wait` | 모든 백그라운드 job 종료 대기 |
| `wait $!` | 직전 백그라운드 job 종료 대기 |

```sh
# 병렬 실행 후 모두 끝날 때까지 대기
for url in "${urls[@]}"; do
    curl -O "$url" &
done
wait
```

### 백그라운드로 띄우고 바로 로그 보기

```sh
# nohup + 백그라운드 + 로그 따라가기 한 줄. `&`가 명령 구분자라 `;` 불필요
nohup ./run.sh > /tmp/job.log 2>&1 & tail -F /tmp/job.log
```

- `tail -F`(대문자): 파일이 아직 없어도 기다리고, 로테이션돼도 다시 붙음(`--follow=name --retry`). 백그라운드 직후엔 리다이렉트 파일이 아직 안 생겼을 수 있어 **항상 `-F`**.
- `tail -f`(소문자): 파일이 있어야만 따라감. 없으면 에러, inode 바뀌면 끊김.
- **Ctrl+C는 포그라운드 `tail`만 죽인다.** 백그라운드 job은 다른 프로세스 그룹이라 SIGINT를 안 받아 계속 떠 있음.

### 셸 종료 시 백그라운드 job 운명 (셸마다 다름)

| 셸 | 기본 | 바꾸기 |
|---|---|---|
| zsh | 종료 시 job에 `SIGHUP` → **죽음** | `setopt NO_HUP` |
| bash | `huponexit` off → **살아남음** | `shopt -s huponexit` |

확실히 살리려면 `nohup`, `disown`, 또는 `tmux new -d -s name 'cmd'`.

### 함정: `sudo cmd &`

`sudo`를 백그라운드로 보내면 비밀번호 프롬프트가 tty에 못 닿아 `suspended (tty output)`(SIGTTOU)으로 멈춘다. 대부분의 dev 서버는 1024 미만 포트를 안 써 sudo 자체가 불필요.

## trap — 종료 시 정리

```sh
tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT
trap 'echo interrupted; exit 130' INT TERM
```

자주 쓰는 시그널: `EXIT`(스크립트 종료), `INT`(Ctrl+C), `TERM`(kill), `HUP`(터미널 끊김), `ERR`(`set -e`와 함께 명령 실패 시).

## 자주 쓰는 한 줄

```sh
# 인자가 없으면 사용법
[[ $# -eq 0 ]] && { echo "usage: $0 <arg>"; exit 1; }

# 명령 존재 확인
command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

# 스크립트 자신의 경로
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
```

## 참고

- `man bash`, `help <builtin>` (예: `help if`)
- [Bash Hackers Wiki](https://wiki.bash-hackers.org/) — 깊은 레퍼런스
- [ShellCheck](https://www.shellcheck.net/) — 스크립트 정적 분석 (필수)
