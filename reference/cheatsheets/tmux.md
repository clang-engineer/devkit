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


## 필요한 경우 확장하기

- **Pane·Window를 다른 Session으로 이동:** [target 지정과 join-pane / move-window](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md)
- **OSC52 클립보드:** [터미널과 tmux의 클립보드 경계](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md)
- **Hook의 이벤트와 대상:** [Hook의 함정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-07-11-hook-window-id-kill-pane.md)
- **설정·세션 재현:** [tmux 구성](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2021-11-30-tmux-config.md) · [세션 부트스트랩](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-02-21-tmux-bootstrap.md)
