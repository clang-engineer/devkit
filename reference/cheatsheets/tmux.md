# Tmux Cheatsheet

> **terminal multiplexer** — 하나의 터미널에서 여러 세션/윈도우/패널을 관리. 클라이언트를 분리해도 서버가 유지되는 동안 작업을 계속 실행할 수 있다.
>
> **Prefix**는 기본 `Ctrl+b`를 뜻한다. 키 바인딩과 Copy Mode 동작은 tmux 버전·설정에 따라 달라질 수 있다.

## 전체 구조 — 접속·작업·화면

```text
Terminal의 tmux Client
         │ attach / detach
         ▼
     tmux Server
         └─ Session       : 작업 유지          [1]
             └─ Window    : 화면 전환          [2]
                 └─ Pane  : 화면 분할          [2]
                     └─ PTY ── 실행 프로그램

주요 기능 (포함 계층이 아니라 위 대상에 작용)
├─ Layout              : Pane 배치·크기        [2]
├─ Copy Mode / Buffer  : 출력 탐색·텍스트 보관 [3]
└─ Status / Format / Hook / Config            [4]
   └─ 상태 표시·값 표현·이벤트·설정
```

**Client는 Server에 접속하는 주체**이며 Session의 하위 대상이 아니다. Pane은 PTY를 통해 Shell·프로그램을 실행한다. Client를 detach해도 Server가 유지되는 동안 작업은 계속될 수 있다. 대괄호 번호는 아래 본문 절을 가리키며, 위 그림은 **포함 관계와 기능 적용 관계를 구분**한다.

## 명령을 읽는 법

```text
tmux <command> [options] [arguments]
                  │
       target: session:window.pane
```

`new-session` / `list-sessions` / `kill-session`처럼 **대상(Session) + 동작(생성·조회·종료)**을 조합한다. `-t`는 대체로 target, `-s`는 명령에 따라 session name 또는 source이므로 명령별로 확인한다. 키 입력은 `Prefix` 뒤에 누르고, 셸에서 실행하는 `tmux ...` 명령과 구분한다.

## 1. 작업 유지 — Client와 Session

tmux Server는 Session·Window·Pane의 상태를 관리하고, Client는 Terminal에서 Server에 접속해 화면을 표시한다. **Detach는 연결 해제이지 Session 종료가 아니다.**

### 대표 명령

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
| `tmux switch-client -t <name>` | 연결된 Client를 다른 세션으로 전환 |

**작업 유지 예시:** `tmux new -s work` → 작업 실행 → `Prefix d` → `tmux attach -t work`. Detach는 프로세스를 종료하지 않지만 tmux Server나 호스트가 종료되면 작업 유지도 보장되지 않는다.

## 2. 화면 구성 — Window·Pane·Layout

Window는 화면 전환 단위, Pane은 화면 내부의 실행 영역, Layout은 Pane 배치 규칙이다.

### Window — 화면 전환

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

### Pane — 생성·선택·이동

Pane은 PTY(의사 터미널)를 통해 Shell·프로그램을 실행하는 영역이다. Window 안에서 나눠 보거나 다른 Window로 옮길 수 있다.

| 목적 | 대표 키·명령 | 동작 |
|---|---|---|
| 생성 | `Prefix %` / `Prefix "` | 좌우 / 상하 분할 |
| 선택 | `Prefix o` / `Prefix ;` | 다음 / 직전 Pane |
| 방향 이동 | `Prefix ←↑→↓` | 방향별 Pane 선택 |
| 번호 선택 | `Prefix q` | Pane 번호 표시 후 선택 |
| 확대 | `Prefix z` | 현재 Pane Zoom 토글 |
| 종료 | `Prefix x` | Pane 종료 (확인) |
| 분리 | `Prefix !` | Pane을 새 Window로 분리 |
| 위치 교환 | `Prefix {` / `Prefix }` | 앞 / 뒤 Pane과 교환 |
| 표시·마크 | `Prefix m` / `Prefix M` | Pane 마크 / 마크 해제 |
| 다른 Pane과 교환·합치기 | `swap-pane` / `join-pane` | Source·Target을 지정해 조작 |

`swap-pane`·`join-pane`은 키 하나로 외우기보다 **Source(`-s`) → Target(`-t`)** 관계로 이해한다. Session 간 이동은 [관련 글](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md)을 참고한다.

### Layout — 배치·크기 조절

| 목적 | 대표 키 | 동작 |
|---|---|---|
| 레이아웃 순환 | `Prefix Space` | 사전 정의된 Layout 순환 |
| 균등 배치 | `Prefix E` | Pane을 고르게 분배 |
| 지정 레이아웃 | `Prefix Alt+1..5` | even-horizontal / even-vertical / main-horizontal / main-vertical / tiled (추가 레이아웃은 버전별 확인) |
| 크기 조절 | `Prefix Ctrl+←↑→↓` | Pane 크기 조절 |
| 5칸 단위 조절 | `Prefix Alt+←↑→↓` | 방향별 크기 조절 |
| Pane 회전 | `Prefix Ctrl+o` / `Prefix Alt+o` | 순방향 / 역방향 회전 |

Layout은 **Pane을 새로 만드는 기능이 아니라 기존 Pane들의 배치를 바꾸는 기능**이다. `Prefix Alt+1..5`는 대표 Layout의 기본 바인딩이다. 일부 최신 버전은 추가 Layout도 지원하므로 실제 키맵을 확인한다.

## 3. 출력 탐색 — Copy Mode와 Buffer

Copy Mode는 지나간 출력을 탐색·선택하는 상태이고, Buffer는 복사한 텍스트를 보관한다. **Copy Mode는 Emacs·Vi 키 테이블이 다르다.** `mode-keys vi` 설정이나 환경에 따라 선택되므로 현재 설정을 확인한다. 시스템 클립보드 연동은 별도다.

### 대표 키

| 명령어 | 설명 |
|--------|------|
| `Prefix [` | 복사 모드 진입 (스크롤 가능) |
| `Prefix PgUp` | 복사 모드 진입 및 위로 스크롤 |
| `q` (Vi) / `Escape` (Emacs) | 복사 모드 종료 |
| `Space` (Vi) / `Ctrl+Space` (Emacs) | 선택 시작 |
| `Enter` (Vi) / `Ctrl+w` (Emacs) | 선택 복사 후 종료 |
| `Prefix ]` | 최근 버퍼 붙여넣기 |
| `Prefix #` | 모든 붙여넣기 버퍼 나열 |
| `Prefix =` | 버퍼 목록에서 선택하여 붙여넣기 |
| `Prefix -` | 가장 최근 버퍼 삭제 |
| `Ctrl+u` / `Ctrl+d` (Vi) | 반 페이지 위/아래 스크롤 |
| `g` / `G` (Vi) | 이력 맨 위/아래로 이동 |

**복사 흐름:** `Prefix [` → 이동·선택 → 복사 → `Prefix ]`로 붙여넣기. 복사한 내용은 tmux Buffer에 저장되며 OS 클립보드와는 별개다.

## 4. 관찰·설정·자동화

**Status Line**은 현재 상태를 표시하고 **Format**은 그 값을 표현한다. **Hook**은 이벤트에 tmux 명령으로 반응하고 **Config**는 옵션·키 바인딩을 정의한다. 세부 이벤트·표현식은 공식 문서를 참고한다.

| 기능 | 존재 이유 | 대표 진입점 |
|---|---|---|
| Status Line | Session·Window 상태 표시 | `status-left`, `status-right` |
| Format | 상태값 참조·표현 | `#{session_name}`, `#{pane_id}` |
| Hook | 이벤트 발생 시 명령 실행 | `set-hook`, `show-hooks` |
| Config | 동작·키맵 변경 | `set-option`, `bind-key` |

**설정 확인 예시:** `tmux list-keys`로 현재 바인딩을 확인하고, `tmux list-keys -T copy-mode-vi`로 Vi Copy Mode를 확인한다. `tmux display-message -p '#{session_name}:#{window_index}.#{pane_index}'`는 현재 대상을 Format으로 표시한다.

### 공통 조작

| 명령어 | 설명 |
|--------|------|
| `Prefix ?` | 키 바인딩 목록 |
| `Prefix t` | 시계 표시 |
| `Prefix ~` | 최근 메시지 확인 |
| `Prefix :` | 명령어 프롬프트 |
| `Prefix Ctrl+z` | tmux 클라이언트 일시 중지 |
| `tmux source-file ~/.tmux.conf` | 설정 파일 리로드 |


## 필요한 경우 확장하기

- **기본 키와 옵션의 정확한 동작:** [tmux 공식 매뉴얼](https://man7.org/linux/man-pages/man1/tmux.1.html)
- **Pane·Window를 다른 Session으로 이동:** [target 지정과 join-pane / move-window](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md)
- **OSC52 클립보드:** [터미널과 tmux의 클립보드 경계](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md)
- **Hook의 이벤트와 대상:** [Hook의 함정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-07-11-hook-window-id-kill-pane.md)
- **설정·세션 재현:** [tmux 구성](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2021-11-30-tmux-config.md) · [세션 부트스트랩](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-02-21-tmux-bootstrap.md)
