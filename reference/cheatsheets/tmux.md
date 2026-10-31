# Tmux Cheatsheet

> **terminal multiplexer** — 하나의 터미널에서 여러 세션/윈도우/패널을 관리. SSH 끊겨도 세션 살아있음 — 서버 작업 표준.
>
> **Prefix Key**: `Ctrl+b` (기본 설정 기준)  
> 아래 명령어에서 `Prefix`는 `Ctrl+b`를 의미합니다.

## 전체 구조 — 무엇을 관리하는가?

```text
tmux Server
├─ Client          : 세션에 접속 / 분리 (attach / detach)
├─ Session         : 작업을 유지하는 단위
│  └─ Window       : 화면 전환 단위
│     └─ Pane      : 명령·프로세스를 실행하는 분할 영역
├─ Layout          : Pane 배치·크기·확대
├─ Copy Mode       : 출력 이력 탐색·선택
│  └─ Buffer       : 복사한 텍스트 저장·붙여넣기
└─ 동작 확장
   ├─ Status Line  : 상태 표시
   ├─ Format       : #{...} 상태값 표현
   ├─ Hook         : 이벤트에 반응
   └─ Config       : Option·Key Binding
```

**핵심 구분:** Client를 detach해도 Server의 Session·Window·Pane은 유지될 수 있다. Pane 분할은 화면 배치이고, Session 유지와는 다른 기능이다. 위 그림은 실행 순서가 아닌 **관리 대상과 기능 관계**다.

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

### Pane·Layout — 분할·이동·배치

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

## 3. 출력 탐색 — Copy Mode와 Buffer

Copy Mode는 지나간 출력을 탐색하고 선택하는 상태이며, Buffer는 선택한 텍스트를 보관한다. 시스템 클립보드와의 연동은 별도 설정에 따라 달라진다.

### 대표 키

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

## 4. 관찰·설정·자동화

**Status Line**은 현재 상태를 표시하고 **Format**은 그 값을 표현한다. **Hook**은 이벤트에 tmux 명령으로 반응하고 **Config**는 옵션·키 바인딩을 정의한다. 세부 이벤트·표현식은 공식 문서를 참고한다.

| 기능 | 존재 이유 | 대표 진입점 |
|---|---|---|
| Status Line | Session·Window 상태 표시 | `status-left`, `status-right` |
| Format | 상태값 참조·표현 | `#{session_name}`, `#{pane_id}` |
| Hook | 이벤트 발생 시 명령 실행 | `set-hook`, `show-hooks` |
| Config | 동작·키맵 변경 | `set-option`, `bind-key` |

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

- **Pane·Window를 다른 Session으로 이동:** [target 지정과 join-pane / move-window](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md)
- **OSC52 클립보드:** [터미널과 tmux의 클립보드 경계](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md)
- **Hook의 이벤트와 대상:** [Hook의 함정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-07-11-hook-window-id-kill-pane.md)
- **설정·세션 재현:** [tmux 구성](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2021-11-30-tmux-config.md) · [세션 부트스트랩](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-02-21-tmux-bootstrap.md)
