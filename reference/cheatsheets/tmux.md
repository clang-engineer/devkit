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

## 설치와 설정 파일

```sh
brew install tmux            # macOS
sudo apt-get install tmux    # Debian / Ubuntu
sudo dnf install tmux        # Fedora / RHEL 계열
```

설정은 보통 `~/.tmux.conf` 또는 `$XDG_CONFIG_HOME/tmux/tmux.conf`에 둔다. `tmux new`·`tmux new-session`은 새 세션 생성, `tmux a`·`tmux attach-session`은 `tmux attach`의 별칭이다. **새 세션 생성과 기존 세션 재접속을 구분**한다.

## 명령을 읽는 법

```text
tmux <command> [options] [arguments]
                  │
       target: session:window.pane
```

`new-session` / `list-sessions` / `kill-session`처럼 **대상(Session) + 동작(생성·조회·종료)**을 조합한다. `-t`는 대체로 target, `-s`는 명령에 따라 session name 또는 source이므로 명령별로 확인한다. 키 입력은 `Prefix` 뒤에 누르고, 셸에서 실행하는 `tmux ...` 명령과 구분한다.

| 주소 | 대상 |
|---|---|
| `work` | `target-session`을 받는 명령의 세션 이름 |
| `work:2` | `work` 세션의 2번 윈도우 |
| `work:2.1` | 위 윈도우의 1번 Pane |
| `:2` / `:.1` | 현재 세션의 윈도우 2 / 현재 윈도우의 Pane 1 |
| `%12` | Pane 생존 동안 변하지 않는 고유 ID |

`-t 1` 같은 단일 숫자는 명령의 target 타입에 따라 해석이 달라진다. 자동화에서는 `:1`, `:.1` 또는 고유 ID로 명시한다. Window 이름도 쓸 수 있다. `work:editor`는 `editor` 창이며, `target-pane`을 받는 명령에서 pane을 생략하면 해당 창의 active Pane을 뜻한다.

<a id="plugin-usage"></a>

## 플러그인 사용 흐름 — 작업에서 출발하기

아래는 **해당 플러그인을 설치한 경우**의 안내다. tmux 기본 기능과 구분하고, 플러그인 선택·중복 판단은 [비교 글](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-07-11-tmux-plugins-beyond-essentials.md)에 맡긴다.

| 지금 하려는 일 | 사용할 도구·상세 흐름 |
|---|---|
| 출력된 경로·URL·해시를 찾아 복사·삽입 | [extrakto](#plugin-extrakto) |
| 세션·윈도우·Pane을 찾아 이동·관리 | [tmux-fzf](#plugin-fzf) |
| Copy Mode에서 괄호·따옴표 안쪽을 정확히 선택 | [tmux-vim-copy](#plugin-vim-copy) |
| 선택한 파일·URL을 열거나 문구를 검색 | [tmux-open](#plugin-open) |
| 앞으로 나올 출력 또는 남아 있는 이력을 파일로 보관 | [tmux-logging](#plugin-logging) |

**키를 누르는 위치가 다르다.** `Prefix F`는 Prefix를 누르고 뗀 뒤 대문자 `F`를 입력한다는 뜻이다. 팝업을 연 뒤의 검색·확정 키와 Copy Mode 안의 선택·열기 키에는 Prefix를 다시 붙이지 않는다. 아래 기본 키가 동작하지 않으면 `tmux list-keys -T prefix`와 `tmux list-keys -T copy-mode-vi`로 실제 바인딩을 확인한다. OMT 등 설정 배포판은 tmux 기본 키를 바꿀 수 있다.

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
| `Prefix (` / `Prefix )` | 이전 / 다음 세션으로 전환 |
| `tmux kill-server` | 서버 전체 종료 — 모든 세션의 작업이 종료될 수 있음 |

**작업 유지 예시:** `tmux new -s work` → 작업 실행 → `Prefix d` → `tmux attach -t work`. Detach는 프로세스를 종료하지 않지만 tmux Server나 호스트가 종료되면 작업 유지도 보장되지 않는다.

### sessionx — 세션·윈도우 검색 (플러그인)

[tmux-sessionx](https://github.com/omerxx/tmux-sessionx)는 세션·윈도우를 검색·미리보기로 선택한다. 상태 저장·복원 도구는 아니다.

- **시작:** `Prefix O`(대문자) → 검색 → `Enter`로 전환·생성.
- **팝업 내부:** `Ctrl+w` 윈도우 목록 · `Ctrl+t` 트리 미리보기 · `Ctrl+r` 이름 변경 · `Esc` 닫기. 팝업 키에는 Prefix를 다시 붙이지 않는다.
- **설치·옵션:** TPM에 `set -g @plugin 'omerxx/tmux-sessionx'` 추가. `fzf` 등 의존성 및 전체 키·옵션은 [공식 README](https://github.com/omerxx/tmux-sessionx) 확인.

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

```sh
tmux join-pane -s source:editor -t work:logs -h # source의 Pane을 work의 창으로 이동
tmux break-pane -d -s work:logs.1              # 지정 Pane을 새 창으로 분리
tmux swap-pane -s work:editor.0 -t work:logs.0 # 두 Pane의 위치 교환
tmux swap-window -s work:1 -t work:2           # 두 Window의 위치 교환
tmux move-window -s source:2 -t work:5         # 빈 Window index로 이동
tmux move-window -r -t work:                  # Window index의 빈칸 재정렬
```

`join-pane -h`는 좌우, `-v`는 상하 배치이며 `-b`를 더하면 왼쪽/위로 붙인다. 프로세스를 합치는 것이 아니라 기존 Pane의 배치를 바꾼다.

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

명령 프롬프트나 셸에서 `resize-pane -D 10` / `-U 10` / `-L 10` / `-R 10`으로 아래/위/왼쪽/오른쪽 방향으로 크기를 조절할 수 있다. 셸에서는 앞에 `tmux`를 붙인다.

<a id="plugin-fzf"></a>

### tmux-fzf — tmux 객체 선택 (플러그인)

[tmux-fzf](https://github.com/sainnhe/tmux-fzf)는 **객체 종류 → 동작 → 대상** 순서로 세션·윈도우·Pane·키바인딩·버퍼를 검색한다. 출력 텍스트 추출용 extrakto와 구분한다.

- **시작:** `Prefix F` → 예: `pane` → `switch` → 대상 선택. 복수 선택은 지원되는 메뉴에서 `Tab`.
- **주의:** OMT PathPicker도 `Prefix F`를 사용할 수 있으므로 바인딩을 확인한다. `kill`은 작업 종료를 유발할 수 있다.
- **설치:** `fzf` 및 TPM 선언 `set -g @plugin 'sainnhe/tmux-fzf'`. [전체 동작](https://github.com/sainnhe/tmux-fzf).

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
| `h` / `j` / `k` / `l` (Vi) | 왼쪽 / 아래 / 위 / 오른쪽 이동 |
| `/` (Vi) | 출력 이력 검색 |
| `Escape` (Vi) | 선택 취소 |

**복사 흐름:** `Prefix [` → 이동·선택 → 복사 → `Prefix ]`로 붙여넣기. 복사한 내용은 tmux Buffer에 저장되며 OS 클립보드와는 별개다.

<a id="plugin-vim-copy"></a>

### 텍스트 오브젝트 — 커스텀 키 테이블

[tmux-vim-copy](https://github.com/clang-engineer/tmux-vim-copy)는 **기본 tmux Copy Mode에 없는** Vim식 텍스트 오브젝트 선택을 추가한다.

`Prefix [` → 대상 근처로 이동 → `v` → `i`(안쪽) 또는 `a`(구분자 포함) → 대상 키 → `y` 복사.

| 대상 | 안쪽 | 포함 |
|---|---|---|
| 단어·WORD | `iw` · `iW` | `aw` · `aW` |
| 괄호 | `i(` · `i{` · `i[` | `a(` · `a{` · `a[` |
| 따옴표 | `i"` · `i'` | `a"` · `a'` |

예: `"src/main.py"`에서 `vi"y` → 따옴표를 제외한 경로 복사. `v/V/Ctrl+v`는 문자·줄·블록 선택, `O`는 선택 끝 교환이다. 요구 버전·키 충돌·예외 동작은 [플러그인 문서](https://github.com/clang-engineer/tmux-vim-copy) 참고.

<a id="plugin-extrakto"></a>

### extrakto — 출력 텍스트 추출 (플러그인)

[extrakto](https://github.com/laktak/extrakto)는 Pane 출력에서 경로·URL·해시·문구를 **검색해 삽입하거나 복사**한다.

| 키 | 의미 |
|---|---|
| `Prefix Tab` | 후보 검색 시작 |
| `Ctrl+f` | Filter: 단어·패턴·줄 선택 |
| `Ctrl+g` | Grab: 현재 Pane/Window와 최근 출력/이력 범위 |
| `Tab` / `Enter` | 원래 Pane에 삽입 / 복사 |
| `Ctrl+t` | 클립보드 대상 변경 |

예: 셸에 `git show ` 입력 → `Prefix Tab` → 출력 해시 검색 → `Tab`으로 삽입. 삽입 대상이 셸인지 먼저 확인한다. 필터 기본값·줄 제한은 [공식 도움말](https://github.com/laktak/extrakto/blob/master/HELP.md) 참고.

<a id="plugin-open"></a>

### tmux-open — 선택한 텍스트 열기 (플러그인)

[tmux-open](https://github.com/tmux-plugins/tmux-open)은 **Copy Mode에서 직접 선택한 텍스트**에 동작한다. 후보를 검색하는 extrakto와 구분한다.

| Copy Mode 키 | 동작 |
|---|---|
| `o` | 파일·URL을 기본 앱으로 열기 |
| `Ctrl+o` | 파일을 편집기로 열기 |
| `S` | 선택 문구로 웹 검색 |

`Prefix [` → 텍스트 선택 → 동작 키. `Ctrl+o`는 원래 Pane에 명령을 입력할 수 있으므로 셸 프롬프트에서 사용한다. `o`는 기본 Copy Mode 키와 충돌할 수 있다. [설정·키 변경](https://github.com/tmux-plugins/tmux-open).

<a id="plugin-logging"></a>

### tmux-logging — 출력 기록·화면 저장 (플러그인)

[tmux-logging](https://github.com/tmux-plugins/tmux-logging)은 **이후 출력의 연속 기록**과 **이미 남은 출력의 일회성 저장**을 구분한다.

| Prefix 키 | 저장 범위 |
|---|---|
| `P` | 이후 출력 기록 시작·중지 |
| `Alt+p` | 현재 보이는 화면 저장 |
| `Alt+Shift+p` | 화면과 남은 스크롤백 저장 |

이미 사라진 이력은 복구하지 못하며 로그에 토큰·개인정보가 포함될 수 있다. `Prefix P`는 기본 바인딩과 충돌할 수 있다. [설정·저장 경로](https://github.com/tmux-plugins/tmux-logging).

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

### 자주 조정하는 옵션

옵션은 TPM 유무와 관계없이 적용된다. 아래는 **선택 예제**이며 모두 기본값이라는 뜻이 아니다.

```tmux
set -g mouse on
setw -g mode-keys vi
set -sg escape-time 0
bind '"' split-window -v -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"
set -g pane-border-status bottom
set -g pane-border-format " #P #{pane_current_command} "
bind s choose-tree -Zs -O name
```

- `mouse`: Pane 선택·크기 조절·스크롤에 마우스를 사용한다.
- `mode-keys`: Copy Mode의 Vi 키 테이블을 사용한다. Prefix 키맵과는 별개다.
- `escape-time`: ESC와 Alt/Meta 조합을 판별하는 대기를 줄인다. `0`에서 키 해석 문제가 있으면 작은 값으로 조정한다.
- `split-window -c`: 새 Pane을 현재 Pane의 작업 디렉터리에서 시작한다.
- `pane-border-format`: Pane 번호와 현재 명령을 테두리에 표시한다.
- `choose-tree -O name`: 트리를 이름순으로 정렬한다. 버전별 지원 옵션은 `tmux list-commands`와 공식 매뉴얼로 확인한다.

### 내부 TERM과 외부 RGB 지원

먼저 `infocmp -x tmux-256color`로 해당 terminfo가 설치돼 있는지 확인한 뒤 내부 터미널 종류를 설정한다.

```tmux
set -g default-terminal "tmux-256color"
```

이것은 **tmux 안의 프로그램에 보여 줄 터미널 종류**다. terminfo가 없는 시스템에서는 설치하거나 사용 가능한 `screen-256color` 등으로 맞춘다. 색이 깨지는 원인이 항상 terminfo 부재인 것은 아니므로 바깥 터미널의 기능도 따로 확인한다.

tmux 3.2+에서 바깥 터미널의 RGB 지원을 선언할 때는 `terminal-features`를 쓴다. **tmux 밖의** `echo "$TERM"`에 맞는 패턴을 선택하고, 해당 터미널이 실제로 24비트 색을 지원할 때만 적용한다.

```tmux
set -as terminal-features ",xterm*:RGB"
```

구버전까지 고려하는 대안은 `set -as terminal-overrides ",xterm*:Tc"`다. `RGB`는 공식 terminfo capability, `Tc`는 tmux 확장이다. 위 `xterm*`은 예시이지 모든 환경의 기본값이 아니다. 내부 `TERM=tmux-256color`만으로 외부 RGB 지원이 보장되거나 `RGB` 항목이 모든 시스템의 해당 terminfo에 내장된 것은 아니다. 근거는 [tmux 공식 FAQ](https://github.com/tmux/tmux/wiki/FAQ#how-do-i-use-rgb-colour), OMT 자동 감지의 분석은 [설정 상속 글](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-07-12-oh-my-tmux.md)을 참고한다.

### TPM 설치와 플러그인 관리

[TPM](https://github.com/tmux-plugins/tpm)은 플러그인을 설치·업데이트·로드한다. tmux 자체의 필수 구성요소는 아니며 플러그인을 직접 실행할 수도 있다. 필요한 도구는 tmux·Git·Bash다.

```sh
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

아래는 **수제 `.tmux.conf`에서 선택해 쓸 기본 구성**이다. Oh My Tmux는 TPM을 자체 연동하므로 `.tmux.conf.local`에 필요한 플러그인만 선언하고 **TPM 선언·초기화를 중복 추가하지 않는다.**

```tmux
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'christoomey/vim-tmux-navigator'
set -g @plugin 'tmux-plugins/tmux-resurrect'
# 테마 등 status-right를 설정하는 플러그인보다 뒤에 둔다.
set -g @plugin 'tmux-plugins/tmux-continuum'

set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

# 플러그인 선언·설정 다음, 파일 맨 아래에서 초기화
run '~/.tmux/plugins/tpm/tpm'
```

`tmux source-file ~/.tmux.conf`로 TPM을 로드한 뒤 `Prefix I`로 설치한다.

| 조작 | 동작 |
|---|---|
| `Prefix I` (대문자) | 선언한 미설치 플러그인 설치·로드 |
| `Prefix U` (대문자) | 플러그인 업데이트 |
| 선언 제거 후 `Prefix Alt+u` | 목록에서 빠진 플러그인 삭제 |
| `Prefix Ctrl+s` / `Prefix Ctrl+r` | resurrect 상태 저장 / 복원 |

| 플러그인·설정 | 역할·경계 |
|---|---|
| [sensible](https://github.com/tmux-plugins/tmux-sensible) | 여러 기본 옵션을 함께 조정. 이미 직접 관리하는 옵션과 겹치는지 확인 |
| [resurrect](https://github.com/tmux-plugins/tmux-resurrect) | 세션·창·Pane 배치, 작업 디렉터리와 지원 프로그램을 저장·재실행. 임의 프로세스의 메모리 상태를 체크포인트하는 것은 아님 |
| `@resurrect-capture-pane-contents on` | Pane 내용도 보관. 화면의 토큰·개인정보 저장 여부에 주의 |
| [continuum](https://github.com/tmux-plugins/tmux-continuum) | resurrect 기반 자동 저장(공식 기본 간격 15분). `@continuum-restore on`의 자동 복원은 **서버 시작 시** 실행되며 설정 리로드만으로 실행되지 않음 |
| [vim-tmux-navigator](https://github.com/christoomey/vim-tmux-navigator) | `Ctrl+h/j/k/l`로 Vim 창·tmux Pane 간 이동. Vim/Neovim 측 플러그인도 설치해야 양쪽에서 연동 |

continuum 자동 저장은 상태줄을 통해 실행된다. 상태줄을 끄거나 다른 테마가 `status-right`를 덮어쓰면 중단될 수 있어, 공식 안내대로 테마 뒤에 continuum을 로드한다. 재부팅 시 tmux 자체를 자동 시작하는 것은 [별도 설정](https://github.com/tmux-plugins/tmux-continuum/blob/master/docs/automatic_start.md)이다. 저장·복원과 YAML로 새 레이아웃을 선언·생성하는 부트스트랩을 혼동하지 않는다.

기존 themepack 구성을 유지한다면 아래 선언을 **continuum 앞**에 둔다. 상태바·테마는 여러 개를 동시에 적용하기보다 하나를 선택한다.

```tmux
set -g @plugin 'jimeh/tmux-themepack'
set -g @themepack 'powerline/default/cyan'
```

추가 기능은 필요한 선언만 같은 플러그인 목록에 더한다. 화면 추출에는 `set -g @plugin 'laktak/extrakto'`, 시스템 클립보드 브리지가 별도로 필요할 때는 `set -g @plugin 'tmux-plugins/tmux-yank'`를 쓸 수 있다. catppuccin은 [버전별 테마 설정](https://github.com/catppuccin/tmux)을 확인하며, OMT 상태바와 동시에 소유하게 두지 않는다. 각 도구를 더하거나 제외하는 이유는 [플러그인 선택 글](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-07-11-tmux-plugins-beyond-essentials.md)에 모았다.


### 실제 기본값과 실행 중 서버의 키맵 비교

`source-file`은 설정에서 삭제한 바인딩을 실행 중 서버에서 자동 해제하지 않는다. 현재 `list-keys` 결과를 stock 키맵으로 착각하지 말고 **임시 소켓 + 빈 설정 + 살아 있는 세션**을 하나의 tmux 명령으로 조회한다:

```sh
tmux -L "stock-$$" -f /dev/null new-session -d \; \
  list-keys -T copy-mode-vi \; kill-server
```

`-L` 없이 `-f /dev/null`만 주면 이미 실행 중인 기본 소켓 서버에 접속할 수 있고, 세션 없는 `start-server`를 후속 별도 명령으로 조회하면 서버가 재시작하면서 실제 config를 읽을 수 있다. 옵션 기본값도 같은 방식으로 `list-keys ...` 대신 `show -gv <option>`을 사용한다. `copy-mode-vi`와 `copy-mode`는 별도 키 테이블이다. 특정 키가 기본으로 묶였는지와 **동작이 같은지**(예: 복사 후 copy mode 유지 여부)를 각각 비교한다. 설정 리로드 후에도 옛 바인딩이 남으면 `unbind-key -T <table> <key>`로 명시적으로 해제한다.

## 필요한 경우 확장하기

- **기본 키와 옵션의 정확한 동작:** [tmux 공식 매뉴얼](https://man7.org/linux/man-pages/man1/tmux.1.html)
- **Pane·Window를 다른 Session으로 이동:** [target 지정과 join-pane / move-window](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md)
- **OSC52 클립보드:** [터미널과 tmux의 클립보드 경계](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/terminal/2026-06-10-terminal-clipboard.md)
- **플러그인 비교·선택:** [추출·관리·기록 플러그인 비교](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-07-11-tmux-plugins-beyond-essentials.md)
- **Hook의 이벤트와 대상:** [Hook의 함정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-07-11-hook-window-id-kill-pane.md)
- **작업공간 구조와 자동화:** [Session·Window·Pane과 대상 지정](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-10-25-tmux-pane-window-cross-session.md) · [세션 부트스트랩](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/tmux/2026-02-21-tmux-bootstrap.md)
