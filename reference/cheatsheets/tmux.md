# Tmux Cheatsheet

> **terminal multiplexer** — 하나의 터미널에서 여러 세션/윈도우/패널을 관리. 클라이언트를 분리해도 서버가 유지되는 동안 작업을 계속 실행할 수 있다.
>
> **Prefix Key**: `Ctrl+b` (기본 설정 기준)  
> 아래 `Prefix`는 기본 키인 `Ctrl+b`를 뜻한다. 실제 바인딩은 설정에 따라 달라진다.

## 전체 구조 — 무엇을 관리하는가?

```text
tmux Server
├─ Client          : 세션에 접속 / 분리 (attach / detach)
├─ Session         : 작업을 유지하는 단위
│  └─ Window       : 화면 전환 단위
│     └─ Pane      : 명령·프로세스를 실행하는 분할 영역
├─ Layout          : Pane 배치·크기·확대
├─ Copy Mode       : 출력 이력 탐색·선택
├─ Buffer          : 복사한 텍스트 저장·붙여넣기
└─ 동작 확장
   ├─ Status Line  : 상태 표시
   ├─ Format       : #{...} 상태값 표현
   ├─ Hook         : 이벤트에 반응
   └─ Config       : Option·Key Binding
```

**핵심 구분:** Client를 detach해도 Server가 살아 있는 동안 Session·Window·Pane은 유지된다. Pane 분할은 화면 배치이고, Session 유지와는 다른 기능이다. 위 그림은 실행 순서가 아닌 **관리 대상과 기능 관계**다.

## 명령을 읽는 법

```text
tmux <command> [options] [arguments]
                  │
       target: session:window.pane
```

`new-session` / `list-sessions` / `kill-session`처럼 **대상(Session) + 동작(생성·조회·종료)**을 조합한다. `-t`는 대체로 target, `-s`는 명령에 따라 session name 또는 source이므로 명령별로 확인한다. `Prefix`는 기본 `Ctrl+b`이며 실제 키는 설정에 따라 달라진다.

```sh
tmux new -s work     # Session 생성
tmux ls              # Session 조회
tmux attach -t work  # Client 재연결
```

## 1. 작업 유지 — Client와 Session

Session은 작업을 유지하고 Client는 접속·분리한다. **Detach는 종료가 아니다.**

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
| `tmux switch-client -t <name>` | 다른 세션으로 전환 |

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

Pane은 각자 실행 프로그램을 가지며, Window 안에서 나눠 보거나 다른 Window로 옮길 수 있다.

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
| 지정 레이아웃 | `Prefix Alt+1..5` | even-horizontal / even-vertical / main-horizontal / main-vertical / tiled |
| 크기 조절 | `Prefix Ctrl+←↑→↓` | Pane 크기 조절 |
| 5칸 단위 조절 | `Prefix Alt+←↑→↓` | 방향별 크기 조절 |
| Pane 회전 | `Prefix Ctrl+o` / `Prefix Alt+o` | 순방향 / 역방향 회전 |

Layout은 **Pane을 새로 만드는 기능이 아니라 기존 Pane들의 배치를 바꾸는 기능**이다. `Prefix Alt+1..5`는 각 Layout의 기본 바인딩이며 실제 키맵을 확인한다.

## 3. 출력 탐색 — Copy Mode와 Buffer

Copy Mode는 지나간 출력을 탐색·선택하는 상태이고, Buffer는 복사한 텍스트를 보관한다. **Copy Mode의 기본 키는 Emacs 방식이며, Vi 방식은 `mode-keys vi` 설정 등에 따라 사용된다.** 시스템 클립보드 연동은 별도다.

### 대표 키

| 명령어 | 설명 |
|--------|------|
| `Prefix [` | 복사 모드 진입 (스크롤 가능) |
| `Prefix PgUp` | 복사 모드 진입 및 위로 스크롤 |
| `q` | 복사 모드 종료 |
| `Space` (Vi) / `Ctrl+Space` (Emacs) | 선택 시작 |
| `Enter` (Vi) / `Alt+w` (Emacs) | 선택 복사 |
| `Prefix ]` | 최근 버퍼 붙여넣기 |
| `Prefix #` | 모든 붙여넣기 버퍼 나열 |
| `Prefix =` | 버퍼 목록에서 선택하여 붙여넣기 |
| `Prefix -` | 가장 최근 버퍼 삭제 |
| `Ctrl+u` / `Ctrl+d` (Vi) | 반 페이지 위/아래 스크롤 |
| `g` / `G` (Vi) | 이력 맨 위/아래로 이동 |

## 4. 관찰·설정·자동화

**Status Line**은 현재 상태를 표시하고 **Format**은 그 값을 표현한다. **Hook**은 이벤트에 tmux 명령으로 반응하고 **Config**는 옵션·키 바인딩을 정의한다. 세부 이벤트·표현식은 공식 문서를 참고한다.

| 기능 | 존재 이유 | 대표 진입점 |
|---|---|---|
| Status Line | Session·Window 상태 표시 | `status-left`, `status-right` |
| Format | 상태값 참조·표현 | `#{session_name}`, `#{pane_id}` |
| Hook | 이벤트 발생 시 명령 실행 | `set-hook`, `show-hooks` |
| Config | 동작·키맵 변경 | `set-option`, `bind-key` |

현재 바인딩은 `tmux list-keys`, Copy Mode의 Vi 키는 `tmux list-keys -T copy-mode-vi`로 확인한다.

### 공통 조작

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


## 필요한 경우 확장하기

- **기본 키와 옵션의 정확한 동작:** [tmux 공식 매뉴얼](https://man7.org/linux/man-pages/man1/tmux.1.html)

- **Pane·Window를 다른 Session으로 이동:** [target 지정과 join-pane / move-window](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md)
- **OSC52 클립보드:** [터미널과 tmux의 클립보드 경계](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md)
- **Hook의 이벤트와 대상:** [Hook의 함정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-07-11-hook-window-id-kill-pane.md)
- **설정·세션 재현:** [tmux 구성](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2021-11-30-tmux-config.md) · [세션 부트스트랩](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-02-21-tmux-bootstrap.md)
