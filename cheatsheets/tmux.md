# Tmux Cheatsheet

> **terminal multiplexer** — 하나의 터미널에서 여러 세션/윈도우/패널을 관리. SSH 끊겨도 세션 살아있음 — 서버 작업 표준.
>
> **Prefix Key**: `Ctrl+b` (기본 설정 기준)  
> 아래 명령어에서 `Prefix`는 `Ctrl+b`를 의미합니다.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 새 세션 시작 | `tmux new -s work` |
| 세션에서 나오기 (남겨두기) | `Prefix d` (detach) |
| 살아있는 세션 목록 | `tmux ls` |
| 세션 다시 붙기 | `tmux a -t work` (없으면 `tmux a`) |
| 새 윈도우 | `Prefix c` |
| 다음/이전 윈도우 | `Prefix n` / `Prefix p` |
| 가로/세로 분할 | `Prefix "` / `Prefix %` |
| 패널 이동 | `Prefix 방향키` |
| 복사 모드 | `Prefix [` (vi 키로 선택, `y`로 yank) |
| 세션 죽이기 | `tmux kill-session -t work` |

## 계층 구조

```
Session → Window → Pane
(세션)    (윈도우)   (패널)
```

- **Session**: 최상위 단위. 여러 window를 묶음
- **Window**: 탭 같은 개념. 하나의 전체 화면
- **Pane**: window를 분할한 각 영역

> 세션 중첩(nested session)은 불가. 세션은 같은 tmux 서버 내에서 **병렬로** 존재하며 **전환**하는 구조.

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
| `Prefix .` | 윈도우 순서 이동 |
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

## 패널/윈도우 세션 간 이동

| 명령어 | 설명 |
|--------|------|
| `Prefix !` | 현재 패널을 별도 윈도우로 분리 (`break-pane`) |
| `join-pane -s <src> -t <dst>` | 패널을 다른 윈도우로 합치기 |
| `move-window -t <session>:` | 현재 윈도우를 다른 세션으로 이동 |

### 타겟 형식 (`-s`, `-t` 공통)

```
[session:][window.]pane    ← [ ]는 선택
```

구분자(`:`, `.`)는 **"앞 레벨이 존재한다"는 신호**. 생략하면 현재 컨텍스트가 채워짐.

**생략 규칙**: 왼쪽(상위)부터 순서대로 떨어진다. 중간만 빼는 건 불가.

| 생략 | 결과 표기 |
|------|-----------|
| 없음 | `session:window.pane` |
| session 생략 | `window.pane` |
| session + window 생략 | `pane` |

| 표기 | 의미 | 비고 |
|------|------|------|
| `1` | 현재 윈도우의 페인 1 | 가장 짧은 형태 |
| `2.1` | 현재 세션, 윈도우 2의 페인 1 | `.`이 있으니 앞 숫자는 윈도우 |
| `:2.1` | 〃 | `:`을 명시한 형태 — `2.1`과 동일 |
| `:2` | 현재 세션의 윈도우 2 (활성 페인) | 윈도우만 지정 |
| `mysess:2.1` | 다른 세션 `mysess`의 윈도우 2, 페인 1 | 풀 경로 |
| `mysess:` | 세션 자체 | 뒤가 빈 형태 |

> 단일 숫자 `2`는 명령어에 따라 페인/윈도우/세션 중 어디로 해석될지 모호함(`select-pane` vs `select-window`). 의도를 명확히 하려면 `.`이나 `:`을 붙여 레벨을 명시.

### join-pane 옵션

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

### 세션 간 이동 예시

```bash
# 같은 세션 내: 윈도우 3의 pane을 윈도우 1로 합치기
tmux join-pane -s 3 -t 1 -h

# 다른 세션: 세션명:윈도우번호 형식 사용
tmux join-pane -s 0-default:1 -t 1-workspace:1 -h

# 현재 윈도우를 다른 세션으로 통째로 이동
tmux move-window -t 0-default:

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
# 새 세션 "work" 만들고 3개 윈도우 준비
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

## 추천 플러그인

- **tmux-resurrect**: 세션 저장/복원
- **tmux-continuum**: 자동 세션 저장
- **tmux-yank**: 클립보드 통합

```bash
# TPM (Tmux Plugin Manager) 설치 후 .tmux.conf에 추가
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# Prefix + I 로 플러그인 설치
```

## AI 에이전트 사이드바 (`hiroppy/tmux-agent-sidebar`)

전 세션·윈도우의 AI 에이전트(Claude Code/Codex 등)를 **별도 세로 패널**에서 실시간 모니터.
상태는 폴링·출력 파싱이 아니라 **Claude Code 훅**으로 직접 받아 정확. 요구: tmux 3.0+, TPM.

```bash
set -g @plugin 'hiroppy/tmux-agent-sidebar'
# Prefix + I → 첫 실행 시 install wizard에서 "pre-built binary" 선택 (Rust/cargo 불필요)
# Claude Code 연동: Claude Code 안에서
#   /plugin marketplace add ~/.tmux/plugins/tmux-agent-sidebar
#   /plugin install tmux-agent-sidebar@hiroppy
```

전역 키 (사이드바 열기/닫기 = toggle):

| 키 | 동작 | 설정 변수(기본) |
|---|---|---|
| `Prefix e` | 사이드바 토글 — **현재 윈도우만** | `@sidebar_key` (`e`) |
| `Prefix E` | 사이드바 토글 — **모든 윈도우** | `@sidebar_key_all` (`E`) |

사이드바 패널 안 로컬 키 (prefix 없이, 포커스 있을 때만 → 전역 키맵과 안 겹침):

| 키 | 동작 |
|---|---|
| `j` / `k` | 목록 위/아래 |
| `h` / `l`, `Tab` | 상태 필터 순환 (all/running/waiting…) |
| `r` | repo 필터 |
| `Enter` | 선택 에이전트 패널로 점프 |
| `Shift+Tab` | Activity ↔ Git 탭 전환 |
| `n` / `x` | worktree+에이전트 스폰 / 스폰 패널 제거 |
| `Esc` | 뒤로 / 닫기 |

주요 옵션 (`set -g`, 플러그인 로드 전):

```tmux
set -g @sidebar_key 'e'                 # 현재-윈도우 토글 키
set -g @sidebar_key_all 'E'             # 전체-윈도우 토글 키
set -g @sidebar_width '15%'             # 사이드바 너비
set -g @sidebar_position 'left'         # left | right
set -g @sidebar_auto_create 'on'        # 새 윈도우 생성 시 사이드바 자동 (off로 끄기)
set -g @sidebar_notifications 'on'      # 데스크톱 알림
set -g @sidebar_notifications_events 'stop,notification'  # 알림 이벤트 선택
set -g @agent-sidebar-default-agent 'claude'   # 스폰 기본 에이전트 (claude|codex)
```

- **하단 Activity/Git 패널은 목록에서 선택된(focused) pane *하나* 기준** — `j`/`k`로 선택을 옮기면 두 탭 내용도 그 pane으로 같이 바뀐다(전체 종합 아님). Activity=그 pane의 tool-call 히스토리, Git=그 pane cwd의 branch·diff·PR. 반대로 상단 목록은 전 세션·윈도우 전체.
- `e`(현재 윈도우) vs `E`(전체 윈도우) 차이는 체감상 **다른 윈도우로 이동했을 때 사이드바가 따라오느냐** — `E`=따라옴, `e`=안 따라옴. **단일 윈도우만 열려 있으면 둘이 똑같아 보인다**(윈도우 2개 이상에서만 차이).
- `@sidebar_auto_create`는 **새 윈도우 생성 시(after-new-window)에만** 자동으로 붙음 — 윈도우 *전환* 시엔 안 붙음. `E`(전체토글)는 "지금 열린 모든 윈도우에 한 방에 깔기"용.
- **토글 키(`@sidebar_key`/`@sidebar_key_all`)는 끄기 불가 — 리바인드만 가능.** 빈 값은 기본(`e`/`E`)으로 복원됨. 기본 `prefix E`(select-layout -E)를 지키려면 `@sidebar_key_all`을 빈 다른 키로 옮길 것.

> 함정: Claude Code에서 permission 승인 직후 다음 훅 발화 전까지 상태가 `waiting`으로 남음 — Claude Code 훅 시스템의 문서화된 한계(플러그인 버그 아님).

## 발견성 메뉴 (`jaclu/tmux-menus`)

tmux **내장 기능**(세션/윈도우/패널 관리)을 팝업 메뉴로 발견·실행. 제로config로 바로 작동.
which-key처럼 "내 키맵을 미러링"하는 게 아니라 기성 관리 메뉴다. 순수 셸(의존성 0), tmux 3.0+ 네이티브 `display-menu`.

```tmux
set -g @plugin 'jaclu/tmux-menus'
set -g @menus_trigger '\'          # 메뉴 열기 (기본 prefix + \)
set -g @menus_without_prefix 'No'  # Yes면 prefix 없이 트리거
```

- 트리거: 기본 **`prefix + \`**. `@menus_trigger`로 변경.
- 커스텀 항목: `custom_items/`에 `templates/custom_item_template.sh` 복사 → `menu_key`/`menu_name` 설정 →
  플러그인이 자동 감지해 Main 메뉴에 "Custom items"로 주입. 항목은 셸 DSL(`priority type key "label" action`). YAML 아님.
- tmux <3.0에서만 `whiptail`/`dialog` 폴백(macOS는 `brew install newt`) — 모던 tmux면 불필요.
- 순수 셸이라 chezmoi apply + TPM clone만으로 끝(바이너리 wizard·별도 연동 없음).

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
`#{window_id}` / `#{pane_id}`는 훅 컨텍스트에선 "현재 클라이언트가 보는 것"으로 풀려 이벤트
대상과 다를 수 있다.

**내 훅만 안전하게 제거**(리로드 시 중복 방지). `-gu`는 통째로 지우므로, 남과 공유하는
이벤트면 인덱스로 골라 제거:

```bash
tmux show-hooks -g <event> | awk '/내마커문자열/ { print $1 }' | xargs -rn1 tmux set-hook -gu
```
