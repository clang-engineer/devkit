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
