# Tmux Cheatsheet

> **terminal multiplexer** — 하나의 터미널에서 여러 세션/윈도우/패널을 관리. SSH 끊겨도 세션 살아있음 — 서버 작업 표준.
>
> **Prefix Key**: `Ctrl+b` (기본 설정 기준)  
> 아래 명령어에서 `Prefix`는 `Ctrl+b`를 의미합니다.

## 문서 범위

이 문서는 **tmux 기본 명령의 대상·상태·키 조합**만 설명한다. smug·sesh·Oh My Tmux·플러그인의 설치 및 개인 설정은 [도구 발견 지도](tools-dictionary.md)와 각 공식 문서에서 확인한다.

## 명령을 읽는 법

```text
Server
└─ Session
   └─ Window
      └─ Pane

tmux <command> [command-specific options] [arguments]
  target을 받는 명령: session:window.pane
```

- `new-session` / `list-sessions` / `kill-session`: 같은 **session** 대상에 동사를 적용한다.
- `-s`와 `-t`의 의미는 명령마다 다르다. `new-session -s work`의 `-s`는 **session name**, `join-pane -s ...`의 `-s`는 **source**다.
- `-t`는 대체로 **target**이다. `work:2.1`은 work 세션의 2번 window, 1번 pane이다. 상세한 생략 규칙은 아래 **타겟 형식** 참고.
- `Prefix`는 기본 `Ctrl+b`다. `Prefix d`(detach)는 세션을 종료하지 않고 연결만 분리한다.

```sh
tmux new -s work       # 세션 생성 (new-session)
tmux ls                # 세션 목록 (list-sessions)
tmux attach -t work    # 세션 재연결 (attach-session)
```

윈도우·pane 조작과 복사 모드의 키 바인딩은 아래 대상별 표에서 확인한다.

## 세션 관리

| 명령어 | 설명 |
|--------|------|
| `tmux` | 새 세션 시작 |
| `tmux new -s <name>` | 이름 지정하여 세션 생성 |
| `tmux ls` | 세션 목록 |
| `tmux attach -t <name>` | 세션에 다시 연결 |
| `tmux attach` | 마지막 세션에 연결 |
| `tmux kill-session -t <name>` | 세션 종료 |
| `Prefix d` | 세션 detach (나가기) |
| `Prefix s` | 세션 목록 보기 (인터랙티브) |
| `Prefix $` | 현재 세션 이름 변경 |
| `Prefix : new-session -s <name>` | 세션 안에서 새 세션 생성 |
| `tmux new-session -d -s <name>` | detached로 새 세션 생성 |
| `tmux switch-client -t <name>` | 다른 세션으로 전환 |

## 윈도우 관리

| 명령어 | 설명 |
|--------|------|
| `Prefix c` | 새 윈도우 생성 |
| `Prefix ,` | 윈도우 이름 변경 |
| `Prefix .` | 윈도우를 지정한 인덱스로 이동 (프롬프트 입력) |
| `Prefix n` | 다음 윈도우 |
| `Prefix p` | 이전 윈도우 |
| `Prefix 0-9` | 번호로 윈도우 이동 |
| `Prefix '` | 윈도우 인덱스 직접 입력 |
| `Prefix w` | 윈도우 목록 (인터랙티브) |
| `Prefix f` | 윈도우/패널 이름으로 검색 |
| `Prefix &` | 윈도우 종료 (확인 필요) |
| `Prefix l` | 마지막 윈도우로 이동 |
| `Prefix i` | 윈도우 정보 표시 |

## 윈도우 상태 flag (status line)

status line에서 윈도우 이름/번호 뒤에 자동으로 붙는 한 글자 표식. "지금 이 윈도우가 어떤 상태인지"를 한눈에 알려준다.

### 사용자가 직접 만드는 flag

| flag | 의미 | 생기는 조작 |
|------|------|------------|
| `Z` | pane **zoom** 됨 (한 pane만 윈도우 꽉 채움) | `Prefix z` — 분할 유지한 채 임시 확대, 다시 `Prefix z`로 복귀 |
| `M` | **marked pane** 포함 | `Prefix m` (마킹) / `Prefix M` (전체 해제). swap-pane·join-pane의 기준점 |

marked pane은 "찜해둔 pane"이라 `-s`(source)를 생략해도 그게 자동으로 잡힌다. 커서를 옮겨다니며 조작할 때 편하다.

```bash
# swap: 두 pane 위치 교환
#   1. A pane에서  Prefix m       → A에 M flag
#   2. B pane으로 커서 이동
#   3. B pane에서  :swap-pane     → A ↔ B 교환 (-s 없이 marked가 source)

# join: marked pane을 다른 윈도우로 끌어오기
#   1. 가져올 pane에서  Prefix m
#   2. 붙일 윈도우/pane으로 이동
#   3. :join-pane -h            → marked pane이 현재 자리 옆에 좌우 split
```

### tmux가 자동으로 띄우는 flag (알림성)

| flag | 의미 | 켜는 옵션 |
|------|------|----------|
| `#` | **activity** — 안 보는 윈도우에서 출력 발생 | `setw -g monitor-activity on` |
| `~` | **silence** — 일정 시간 조용함 (작업 끝/멈춤 신호) | `setw -g monitor-silence <초>` |
| `!` | **bell** — 프로그램이 bell(`\a`) 울림 | 기본 동작 |

### 위치 표시 flag

| flag | 의미 |
|------|------|
| `*` | 현재(active) 윈도우 |
| `-` | 직전(last) 윈도우 — `Prefix l`로 이 둘 사이 토글 |

> 실전 빈도: `Z`(집중용 확대)와 `#`/`~`(백그라운드 작업 알림)가 가장 자주 뜬다. 의도치 않게 한 pane만 크게 보이면 `Z` flag를 확인하고 `Prefix z`로 복귀.

## 패널 관리

| 명령어 | 설명 |
|--------|------|
| `Prefix %` | 세로로 패널 분할 |
| `Prefix "` | 가로로 패널 분할 |
| `Prefix o` | 다음 패널로 이동 |
| `Prefix ;` | 직전에 활성화했던 패널로 토글 (last-pane) |
| `Prefix ←↑→↓` | 방향키로 패널 이동 |
| `Prefix Ctrl+←↑→↓` | 패널 크기 조정 |
| `Prefix z` | 패널 확대/축소 토글 |
| `Prefix x` | 패널 종료 (확인 필요) |
| `Prefix !` | 패널을 새 윈도우로 분리 |
| `Prefix q` | 패널 번호 표시 (번호 입력으로 이동) |
| `Prefix {` | 현재 패널을 이전 패널과 위치 교환 (swap-pane) |
| `Prefix }` | 현재 패널을 다음 패널과 위치 교환 (swap-pane) |
| `Prefix Space` | 패널 레이아웃 순환 |
| `Prefix m` | 현재 패널 마크 토글 (한 번에 하나만 가능) |
| `Prefix M` | 설정된 마크 전체 해제 |
| `swap-pane` | 현재 패널과 마크된 패널 교환 |
| `join-pane` | 마크된 패널을 현재 윈도우로 가져오기 |
| `Prefix E` | 모든 패널을 균등하게 정렬 |
| `Prefix Alt+1` | even-horizontal 레이아웃 (좌우 균등) |
| `Prefix Alt+2` | even-vertical 레이아웃 (상하 균등) |
| `Prefix Alt+3` | main-horizontal (위 큰 패널 + 아래 작은 패널들) |
| `Prefix Alt+4` | main-vertical (왼쪽 큰 패널 + 오른쪽 작은 패널들) |
| `Prefix Alt+5` | tiled 레이아웃 (격자) |
| `Prefix Ctrl+o` | 패널을 순방향으로 회전 |
| `Prefix Alt+o` | 패널을 역방향으로 회전 |
| `Prefix Alt+←↑→↓` | 패널을 5칸씩 크기 조정 |

## 복사 모드 & 스크롤

| 명령어 | 설명 |
|--------|------|
| `Prefix [` | 복사 모드 진입 (스크롤 가능) |
| `Prefix PgUp` | 복사 모드 진입 및 위로 스크롤 |
| `q` | 복사 모드 종료 |
| `Space` | 선택 시작 (Vi 모드) |
| `Enter` | 선택 복사 (Vi 모드) |
| `Prefix ]` | 최근 버퍼 붙여넣기 |
| `Prefix #` | 모든 붙여넣기 버퍼 나열 |
| `Prefix =` | 버퍼 목록에서 선택하여 붙여넣기 |
| `Prefix -` | 가장 최근 버퍼 삭제 |
| `Ctrl+u` / `Ctrl+d` | 반 페이지 위/아래 스크롤 |
| `g` / `G` | 맨 위/아래로 이동 (Vi 모드) |

## choose-tree (세션/윈도우 트리)

### 열기

| 명령어 | 설명 |
|--------|------|
| `Prefix s` | 세션 트리 |
| `Prefix w` | 윈도우 트리 |

### 트리 내 조작

| 키 | 설명 |
|----|------|
| `→` | 세션 펼치기 (윈도우 목록 표시) |
| `←` | 세션 접기 |
| `/` | 검색 |
| `O` | 정렬 기준 변경 |
| `0-9` | 해당 인덱스 항목으로 점프 |
| `Enter` | 선택한 항목으로 전환 |

### 정렬 옵션 (`-O`)

| 옵션 | 설명 |
|------|------|
| `index` | 생성 순서 (기본값) |
| `name` | 이름순 |
| `time` | 생성 시간순 |
| `size` | 윈도우/패인 수 기준 |

```bash
# tmux.conf 설정 예시 — s와 w 모두 이름순 정렬
bind s choose-tree -Zs -O name
bind w choose-tree -Zw -O name
```

### 윈도우 순서 변경

```bash
swap-window -s 2 -t 0    # 윈도우 위치 교환
move-window -s 3 -t 1    # 윈도우를 특정 인덱스로 이동
```

> 세션은 순서를 직접 변경하는 명령이 없다. 이름 기반 정렬(`-O name`)로 제어.

## 세션 점프: `s` vs `w`

둘 다 "다른 세션/윈도우로 이동"이라 헷갈리지만, 갈리는 축은 **점프 깊이**다.

| 키 | 대상 범위 | 새 세션 생성 | UI |
|----|-----------|:---:|----|
| `Prefix s` | **살아있는 세션**만 | ❌ | choose-tree (내장) |
| `Prefix w` | 세션 + 그 안 **윈도우**까지 펼침 | ❌ | choose-tree (내장) |

- **둘 다 전환기.** 지금 tmux에 이미 떠 있는 것 중에서만 고른다. 차이는 깊이 — `s`는 세션 레벨, `w`는 모든 세션의 윈도우를 트리로 펼쳐 특정 윈도우로 정밀 점프(`s`의 상위호환이지만 목록이 길다).
- **stock 범위 밖**: 아직 세션이 아닌 디렉토리(zoxide 등)를 골라 그 자리에서 세션을 새로 만드는 "생성기 겸 전환기"는 tmux 기본에 없다 — [sesh](https://github.com/joshmedeski/sesh)(session의 축약) 같은 서드파티 fzf 피커가 그 역할.

## 패널/윈도우 세션 간 이동

| 명령어 | 설명 |
|--------|------|
| `Prefix !` | 현재 패널을 별도 윈도우로 분리 (`break-pane`) |
| `join-pane -s <src> -t <dst>` | 패널을 다른 윈도우로 합치기 |
| `move-window -t <session>:` | 현재 윈도우를 다른 세션의 빈 슬롯으로 이동 |
| `move-window -s <src> -t <target>` | 특정 창을 특정 세션/위치로 이동 |

### 타겟 형식 (`-s`, `-t` 공통)

기본 모양은 `session:window.pane`이다. 단, tmux 명령마다 필요한 target 타입이 다르다.

| 명령이 요구하는 타입 | 기본 형식 | 예 |
|---|---|---|
| `target-session` | `session` | `attach -t work` |
| `target-window` | `session:window` | `select-window -t work:2` |
| `target-pane` | `session:window.pane` | `select-pane -t work:2.1` |

#### 생략과 구분자

- session을 생략하면 현재 세션, 없으면 최근 세션을 사용한다.
- window를 생략하면 해당 세션의 현재 윈도우를 사용한다.
- pane을 생략하면 해당 윈도우의 active pane을 사용한다.
- `:`는 session/window 경계, `.`은 window/pane 경계다.

| 표기 | 의미 |
|------|------|
| `mysess:2.1` | `mysess` 세션의 2번 윈도우, 1번 pane |
| `:2.1` | 현재 세션의 2번 윈도우, 1번 pane |
| `:.1` | 현재 세션/현재 윈도우의 1번 pane |
| `:2` | 현재 세션의 2번 윈도우 또는 그 윈도우의 active pane |
| `mysess:` | `mysess` 세션의 현재 윈도우 또는 빈 윈도우 슬롯이 필요한 명령에서는 다음 빈 index |

#### 단일 값 `-t 1`의 함정

`-t 1`처럼 `:`, `.`, `%`로 명시하지 않으면 **명령이 요구하는 target 타입**과 현재 상태에 따라 tmux가 가장 그럴듯한 대상을 고른다.

```bash
tmux select-pane -t 1    # 보통 현재 window의 pane 1. 없으면 window/session 쪽으로도 해석 시도
tmux select-window -t 1  # window 1
tmux attach -t 1         # session 1 또는 이름/접두어가 1인 session
```

스크립트나 자동화에서는 모호한 단일 숫자를 피한다.

```bash
tmux select-pane -t :.1  # 현재 window의 pane 1로 명시
tmux select-window -t :1 # 현재 session의 window 1로 명시
tmux send-keys -t %12    # pane ID 12로 명시
```

> **index vs id**: `window.pane` 번호(`pane_index`)는 위치 기반이라 pane 추가/삭제 시 재정렬된다. 반면 `pane_id`(`%0`, `%12` — `$TMUX_PANE`에 들어있는 값)는 pane 생존 동안 불변이다. 스크립트로 특정 pane을 조준할 땐 index보다 `%id`가 안전하다. 매핑은 `tmux list-panes -F '#{pane_id} #{window_index}.#{pane_index}'`.

### join-pane 옵션

**`-h` / `-v`는 경계선이 아니라 pane을 쌓는 방향 기준**으로 기억한다.
- `-h` (horizontal): **옆으로 쌓기** → 좌우 배치, 경계선은 세로 `│`
- `-v` (vertical): **아래로 쌓기** → 위아래 배치, 경계선은 가로 `─`

| 옵션 | 설명 |
|------|------|
| `-s` | source (가져올 페인). 생략 시 **마지막 marked 페인 / 직전 활성 페인** |
| `-t` | target (붙일 위치 = 옆에 split됨). 생략 시 현재 페인 |
| `-h` | 좌우 분할 (horizontal하게 늘어섬) — `Prefix %` 와 같음 |
| `-v` | 상하 분할 (vertical하게 쌓임, 기본값) — `Prefix "` 와 같음 |

```
-h (좌우)         -v (상하, 기본)
┌────┬────┐      ┌─────────┐
│ A  │ B  │      │    A    │
│    │    │      ├─────────┤
└────┴────┘      │    B    │
                 └─────────┘
```

> `join-pane -t 1`처럼 `-t`만 쓰면 source가 암묵적으로 잡혀서 의도와 다르게 동작할 수 있음. 보통 `-s`를 명시.

> pane은 독립 셸/PTY라 두 pane 융합은 불가 — "병합"은 `join-pane`으로 하나씩 모으는 것.
> 원리 상세: blog "tmux엔 왜 pane '병합(merge)'이 없을까 — pane은 살아있는 프로세스다".

### 세션 간 이동 예시

```bash
# 같은 세션 내: 윈도우 3의 pane을 윈도우 1로 합치기
tmux join-pane -s 3 -t 1 -h

# 다른 세션: 세션명:윈도우번호 형식 사용
tmux join-pane -s 0-default:1 -t 1-workspace:1 -h

# 현재 윈도우를 다른 세션으로 통째로 이동
tmux move-window -t 0-default:

# 특정 창을 세션의 지정 위치로 이동
tmux move-window -s 2 -t 1-workspace:1

# 커스텀 바인딩: Prefix M으로 세션 간 윈도우 이동
# bind-key M command-prompt -p "move to session:" "move-window -t '%%:'"
```

> **주의**: `join-pane`에서 윈도우 **이름**이 아닌 **번호**를 사용. 현재 윈도우를 source로 지정하면 에러.

## 기타

| 명령어 | 설명 |
|--------|------|
| `Prefix ?` | 키 바인딩 목록 |
| `Prefix /` | 특정 키 바인딩 설명 보기 |
| `Prefix t` | 시계 표시 |
| `Prefix ~` | 최근 메시지 확인 |
| `Prefix :` | 명령어 프롬프트 |
| `Prefix r` | 현재 클라이언트 리프레시 |
| `Prefix Ctrl+z` | tmux 클라이언트 일시 중지 |
| `tmux source-file ~/.tmux.conf` | 설정 파일 리로드 |

## 자주 쓰는 패턴

### 세션 + 윈도우 빠르게 시작
```bash
# 새 세션 "work" 만들고 3개 윈도우 준비 (selectw -t 0은 base-index 0=기본값 기준)
tmux new -s work \; neww \; neww \; selectw -t 0
```

### 패널 4분할 레이아웃
```bash
# 현재 윈도우를 4개 패널로 분할
Prefix %    # 세로 분할
Prefix "    # 가로 분할
Prefix o    # 다음 패널 이동
Prefix "    # 다시 가로 분할
```

### 3단 스택 → 위 2개 좌우 + 아래 1개로 재배치
```
┌─────┐      ┌──┬──┐
│  0  │      │0 │1 │
├─────┤  →   ├──┴──┤
│  1  │      │  2  │
├─────┤      └─────┘
│  2  │
└─────┘
```
```bash
# Prefix q 로 페인 번호 확인 후
:join-pane -h -s 1 -t 0    # 1번을 0번 옆에 좌우로 붙임

# 또는 프리셋 순환: 3 패널에서 tiled가 보통 같은 모양
Prefix Space   # 레이아웃 순환
:select-layout tiled
```

### 설정 파일 예시 (`~/.tmux.conf`)
```bash
# Prefix를 Ctrl+a로 변경
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# 패널 분할 단축키 직관적으로 변경
bind | split-window -h
bind - split-window -v

# Vi 모드 활성화
#   ($EDITOR/$VISUAL에 "vi"가 있으면 tmux가 자동으로 vi로 잡음 — nvim도 "vi" 포함.
#    즉 $EDITOR=nvim이면 이 줄은 중복. 명시는 env 비의존 보험용.)
setw -g mode-keys vi

# 마우스 지원
set -g mouse on

# 설정 리로드
bind r source-file ~/.tmux.conf \; display "Config reloaded!"

# 윈도우/패널 번호를 1부터 시작
set -g base-index 1
setw -g pane-base-index 1
```

## 시스템 클립보드 자동 동기화 (OSC52)

`set -g set-clipboard on` 한 줄이면 copy(Enter/마우스) → 시스템 클립보드 자동 전달. `pbcopy` 바인딩 우회 불필요.

```tmux
setw -g mode-keys vi
set -g set-clipboard on    # 기본 external은 passthrough만 → on이 발사 활성
```

발사 3대 조건:
1. `set -g set-clipboard on` (기본 `external`은 발사 X)
2. 터미널 Ms capability — `tmux info | grep Ms`로 확인
3. `terminal-features`에 `clipboard` — `xterm*:clipboard` 기본 포함

검증:
```bash
tmux set-buffer -w "한글─테스트"  # OSC52 직접 발사 (set-clipboard 무관)
sleep 0.5 && pbpaste              # 회로 정상이면 출력됨
tmux show-options -gv set-clipboard
```

> 함정: `tmux send-keys -X copy-selection-and-cancel`로 detached 윈도우 copy를 자동 trigger하면 OSC52 발사 안 됨. 자동 테스트는 `tmux set-buffer -w`로.

## 훅 (hooks)

특정 이벤트에 명령을 자동 실행. 플러그인이 tmux에 기능을 얹는 주된 수단.

```tmux
set-hook -g  <event> '<command>'   # -g  서버 전역(모든 세션·윈도우)
set-hook -ga <event> '<command>'   # -a  기존 훅에 append(안 쓰면 교체)
set-hook -gu <event>               # -u  unset — 인덱스 없으면 그 이벤트 훅 전부 삭제
set-hook -t <session> <event> ...  # -t  특정 세션에만
show-hooks -g                      # 전역 훅 전부 나열
show-hooks -g <event>              # 그 이벤트 훅만 (인덱스 포함: event[0], event[1] ...)
```

**흔한 이벤트**

| 이벤트 | 언제 |
|--------|------|
| `after-new-window` | 새 윈도우 생성 후 |
| `after-select-pane` / `after-select-window` | 포커스 이동 후 |
| `pane-exited` | 패널 안 **프로세스가 exit**할 때 (kill-pane엔 **안** 뜸) |
| `window-layout-changed` | 패널 add/remove/resize 등 레이아웃 변경 (kill-pane 포함 **모든** 패널 제거에 발화) |
| `client-attached` / `client-detached` | 클라이언트 attach/detach |

**훅 안에서의 대상**: 이벤트가 난 윈도우/패널은 `#{hook_window}` / `#{hook_pane}`.
`#{window_id}` / `#{pane_id}`는 훅 컨텍스트에선 "현재 클라이언트가 보는 것"으로 풀려 이벤트 대상과 다를 수 있다.

> `#{window_id}` 함정·`pane-exited`가 kill-pane를 안 잡는 함정·내 훅만 골라 제거하는 법 상세: blog "tmux 훅의 두 함정 — #{window_id}와 pane-exited가 안 잡는 kill-pane".
