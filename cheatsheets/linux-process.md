# Linux Process Cheatsheet

> 이름·포트·시그널로 프로세스를 찾고 종료하기. `pgrep` / `pkill` / `pidof` / `lsof` / `fuser` / `kill`.

## 빠른 참조

| 하고 싶은 것 | 명령 |
|---|---|
| 이름으로 PID 찾기 | `pgrep -fl <pattern>` |
| 이름으로 종료 | `pkill -f <pattern>` |
| 포트 누가 잡았나 | `lsof -iTCP:<port> -sTCP:LISTEN` |
| 포트 잡은 놈 한 번에 죽이기 | `fuser -k <port>/tcp` |
| 정확한 실행파일명으로 PID | `pidof <name>` |
| 설정 리로드 | `kill -HUP <pid>` 또는 `pkill -HUP <name>` |

> `p` 접두사 = **process**. `ps`/`pgrep`/`pkill`/`pidof`/`pmap`/`pstree`는 대부분 `procps-ng` 패키지 계열. `kill`(시그널)·`lsof`/`fuser`(파일·소켓)는 어원이 달라 예외. macOS는 BSD 계열이라 `pidof`/`fuser` 기본 미설치.

## 시그널 번호 표

`kill -<번호>` 와 `kill -<이름>` 동등. **자주 쓰는 순**:

| 번호 | 이름 | 기본 동작 | 쓰는 곳 |
|---|---|---|---|
| 15 | `SIGTERM` | 종료 (정리 후) | **기본값**. 그냥 `kill <pid>` |
| 9 | `SIGKILL` | 강제 종료 (정리 X, 차단 불가) | TERM이 안 먹힐 때만 |
| 1 | `SIGHUP` | 종료 / 설정 리로드 | 데몬 설정 reload 관행 (nginx, sshd) |
| 2 | `SIGINT` | 종료 | `Ctrl+C` |
| 3 | `SIGQUIT` | 종료 + core dump | `Ctrl+\` |
| 18 | `SIGCONT` | 일시정지 해제 | `bg`/`fg`가 내부적으로 사용 |
| 19 | `SIGSTOP` | 일시정지 (차단 불가) | `Ctrl+Z`는 `SIGTSTP`(20) |
| 20 | `SIGTSTP` | 일시정지 (차단 가능) | `Ctrl+Z` |

> 차단 불가능한 시그널: `SIGKILL`(9), `SIGSTOP`(19). 나머지는 프로세스가 trap으로 잡거나 무시할 수 있다.

```bash
kill -l                       # 전체 시그널 목록
kill -l TERM                  # 이름 → 번호
kill -l 15                    # 번호 → 이름
```

## `pgrep` — 이름/커맨드라인으로 PID 찾기

```bash
pgrep nginx                    # 이름 부분 매칭
pgrep -fl jekyll               # -f 전체 커맨드라인 + -l 커맨드 표시
pgrep -u zero                  # 특정 유저
pgrep -P 1234                  # PID 1234의 자식
pgrep -n nginx                 # 가장 최근 시작
pgrep -o nginx                 # 가장 오래된 것
pgrep -x bash                  # 정확히 일치
```

| 옵션 | 의미 |
|---|---|
| `-f` | 전체 커맨드라인 매칭 (인자 안 문자열 매칭 시 **필수**) |
| `-l` | PID + 커맨드라인 출력 |
| `-a` | (Linux) 전체 커맨드라인 표시. macOS·BSD에선 의미 다름(조상 매칭) → `-fl` 사용 |
| `-u USER` | 소유자 필터 |
| `-x` | exact match |
| `-n` / `-o` | newest / oldest |

> `sudo ./tools/run.sh`는 실행파일이 `sudo`라 `pgrep run.sh` 안 잡힘 → `-f` 필요.

## `pkill` — `pgrep` 문법 + 시그널

```bash
pkill -f "jekyll s"            # SIGTERM (기본)
pkill -9 -f "jekyll s"         # SIGKILL — 진짜 안 죽을 때만
pkill -HUP nginx               # 설정 리로드
pkill -u zero -f "node "       # 특정 유저의 node만
```

> 광범위 패턴(`pkill -f bash`)은 본인 셸까지 죽인다. 먼저 `pgrep -fl <pattern>`로 무엇이 잡히는지 확인.

## `pidof` — 정확한 실행파일명으로

```bash
pidof nginx                    # 12345 12346 12347
kill $(pidof nginx)            # 스크립트 친화적 (공백 구분 한 줄)
```

- 부분 일치 안 됨 (정확한 실행파일명만)
- macOS 기본 없음 → `pgrep -x <name>` 사용 (Homebrew에 `pidof` 코어 포뮬러 없음)

## `killall` — 이름으로 일괄 종료

```bash
killall nginx                  # SIGTERM
killall -9 chrome              # SIGKILL
killall -u zero node           # 특정 유저
```

> ⚠️ Solaris의 `killall`은 **시스템 셧다운**용. 낯선 시스템에서 함부로 치지 말 것. 가능하면 `pkill` 사용 권장.

## `lsof` — 포트·파일로 역추적

```bash
lsof -iTCP:4000 -sTCP:LISTEN   # 4000 포트 LISTEN 중인 프로세스
lsof -iTCP -sTCP:LISTEN        # 모든 TCP LISTEN
lsof -i :4000                  # TCP/UDP 모두
lsof -p 36785                  # 특정 PID가 연 파일/소켓 전부
lsof /var/log/syslog           # 특정 파일을 연 프로세스
lsof -u zero                   # 특정 유저
```

> `-sTCP:LISTEN` 빼면 ESTABLISHED까지 다 나와 시끄럽다. **"포트 누가 잡았어?"는 항상 `-sTCP:LISTEN`**.

## `fuser` — 포트/파일 점유자 (리눅스)

```bash
fuser 4000/tcp                 # 4000 포트 점유 PID
fuser -k 4000/tcp              # 점유 프로세스 즉시 종료
fuser -v 4000/tcp              # 상세 출력
fuser /var/log/syslog          # 파일 연 프로세스
```

> `lsof`보다 가볍지만 출력 빈약. macOS 기본 없음.

## `kill` — 시그널

```bash
kill <pid>                     # SIGTERM (15) — 기본, "정상 종료해줘"
kill -TERM <pid>               # 동일
kill -KILL <pid>               # SIGKILL (9) — 강제, 핸들러 못 잡음
kill -HUP <pid>                # SIGHUP (1) — 설정 리로드 관행
kill -INT <pid>                # SIGINT (2) — Ctrl+C와 동일
kill -USR1 <pid>               # 앱별 커스텀 (nginx 로그 reopen 등)
kill -l                        # 시그널 목록 전체
```

| 시그널 | 번호 | 용도 |
|---|---|---|
| `TERM` | 15 | 정상 종료 (기본) — 정리 작업 수행 |
| `KILL` | 9 | 강제 종료 — 핸들러 무시, 마지막 수단 |
| `HUP` | 1 | 설정 리로드 (nginx, sshd 관행) |
| `INT` | 2 | Ctrl+C와 동일 |
| `QUIT` | 3 | 종료 + core dump |
| `STOP` / `CONT` | 19 / 18 | 일시정지 / 재개 |

> 처음부터 `-9`로 가지 말 것. TERM → 5–10초 대기 → KILL 순서가 관행.

## `top` %CPU가 100%를 넘는 이유

프로세스별 `%CPU`는 **코어 1개 = 100%** 기준. 멀티스레드 프로세스는 여러 코어를 동시에 점유하므로 합이 100%를 넘어 코어 수 × 100%까지 간다 (8코어 = 최대 800%). 254%면 코어 약 2.5개 분량.

| 표시 | 기준 | 100% 초과 |
|---|---|---|
| 프로세스별 `%CPU` | 코어 1개 = 100% | 가능 (코어 수 × 100%까지) |
| 상단 `%Cpu(s)` (us/sy/id) | 전체를 100%로 정규화 | 불가 |

| `top` 키 | 동작 |
|---|---|
| `1` | 코어별 사용률 개별 표시 (합이 코어 수 × 100%임이 직관적으로 보임) |
| `I` | Irix mode 토글 — 끄면 코어 수로 나눈 값(0~100% 정규화)으로 표시 |

## 셸 잡 vs PID

```bash
kill %1                        # 잡 번호 1 (앞에 % 필수)
kill 12345                     # PID 12345
fg %1                          # 잡을 foreground로
bg %1                          # 잡을 background로
jobs -l                        # 잡 + PID 함께 표시
disown %1                      # 셸 종료해도 안 죽게 detach
```

> `%` 빼면 같은 숫자가 PID로 해석된다. 잡 제어는 [shell.md](shell.md) 참조.

## 실전 흐름 — 포트 잡힌 서버 재시작

```bash
lsof -iTCP:4000 -sTCP:LISTEN   # 1. 포트 점유자
pgrep -fl jekyll               # 2. 무엇으로 떴는지
pkill -f "jekyll s"            # 3. 정상 종료
sleep 5; pgrep -fl jekyll      # 4. 잔여 확인
pkill -9 -f "jekyll s"         # 5. 안 죽으면 강제
```

## `ps aux | grep` 함정

```bash
ps aux | grep jekyll
# zero  36785  ... bundle exec jekyll s
# zero  41210  ... grep jekyll          ← grep 자신이 잡힘
```

- `grep` 프로세스가 결과에 섞임 → `pgrep` 쓰면 해결
- 굳이 써야 한다면 `grep [j]ekyll` 트릭 (`[j]`는 문자 클래스라 `grep` 명령 자체엔 안 나옴)
