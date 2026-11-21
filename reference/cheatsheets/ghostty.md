# Ghostty Cheatsheet

> **Ghostty** (ghost + `tty`) — Mitchell Hashimoto가 만든 GPU 가속 터미널 에뮬레이터. 자체 탭·분할(split)을 가져 tmux 없이도 화면을 쪼갠다.
>
> 아래는 **macOS 기본 키맵** (`ghostty +list-keybinds` 실측). `⌘`=super, `⌥`=alt, `⌃`=ctrl, `⇧`=shift. 커스텀은 `⌘,`(open_config)로 연다.

## 전체 작동 모델 — 창에서 셸까지

```text
Ghostty Window (OS 창)
└─ Tab (화면 전환)
   └─ Split Layout (화면 배치)
      ├─ Surface ── PTY ── Shell / Program
      └─ Surface ── PTY ── Shell / Program

창·탭·분할 : 화면 구성 [1]
출력 이력·클립보드 : 화면 탐색 [2]
설정·키맵·진단 : 동작 제어 [3]
```

Ghostty의 분할은 **화면 배치**이며 tmux의 Server·Session 보존 기능과 다르다. SSH 연결이 끊긴 뒤 원격 작업을 유지하려면 tmux 등 별도 세션 관리가 필요하다.

키 표기: `⌘` Command, `⌥` Option, `⌃` Control, `⇧` Shift. 아래 키는 기본 macOS 설정 기준이며 `ghostty +list-keybinds`로 현재 바인딩을 확인한다.

## 1. 화면 구성 — Split · Tab · Window

**Split은 현재 Tab의 화면을 나누고, Tab·Window는 그보다 상위의 화면 전환 단위**다. 아래 키는 macOS 기본 바인딩이며 현재 설정은 `ghostty +list-keybinds`로 확인한다.

### 분할 (Split)

| 키 | 동작 |
|---|---|
| `⌘ D` | 오른쪽으로 분할 (new_split:right) |
| `⌘ ⇧ D` | 아래로 분할 (new_split:down) |
| `⌘ [` / `⌘ ]` | 이전/다음 분할로 이동 |
| `⌘ ⌥ ←↑↓→` | 방향으로 분할 포커스 이동 |
| `⌘ ⌃ ←↑↓→` | 분할 크기 조절 (10단위) |
| `⌘ ⌃ =` | 모든 분할 균등화 (equalize_splits) |
| `⌘ ⇧ Enter` | 현재 분할 전체화면 토글 (zoom) |
| `⌘ W` | 현재 분할(surface) 닫기 |

> 실수로 분할됐을 때 원복: 없앨 분할에 포커스 → `⌘ W`. **surface에서 프로세스(예: `tmux attach`)가 돌면 확인 프롬프트가 뜬다** — 확인하면 닫힘. tmux 세션은 안 죽고 클라이언트만 detach.

### Tab · Window — 상위 화면 전환

| 키 | 동작 |
|---|---|
| `⌘ T` / `⌘ N` | 새 탭 / 새 창 |
| `⌘ ⇧ [` / `⌘ ⇧ ]` | 이전/다음 탭 |
| `⌃ ⇧ Tab` / `⌃ Tab` | 이전/다음 탭 |
| `⌘ 1`..`⌘ 8` | N번 탭으로 |
| `⌘ 9` | 마지막 탭으로 (last_tab) |
| `⌘ ⌥ W` | 현재 탭 닫기 |
| `⌘ ⇧ W` | 현재 창 닫기 |
| `⌘ ⌥ ⇧ W` | 모든 창 닫기 |
| `⌘ Enter` | 전체화면 토글 |

## 2. 출력 탐색 — 클립보드와 스크롤

| 키 | 동작 |
|---|---|
| `⌘ C` / `⌘ V` | 복사 / 붙여넣기 |
| `⌘ ⇧ V` | 선택 영역(primary selection) 붙여넣기 |
| `⌘ A` | 전체 선택 |
| `⌘ K` | 화면 지우기 (clear_screen) |
| `⌘ Home` / `⌘ End` | 맨 위 / 맨 아래로 스크롤 |
| `⌘ PageUp` / `⌘ PageDown` | 페이지 위/아래 |
| `⌘ ↑` / `⌘ ↓` | 이전/다음 프롬프트로 점프 (jump_to_prompt, shell integration 필요) |
| `⌘ J` | 선택 위치로 스크롤 |

## 3. 설정과 진단

### 글꼴·설정·진단

| 키 | 동작 |
|---|---|
| `⌘ =` / `⌘ -` | 글꼴 크기 키우기 / 줄이기 |
| `⌘ 0` | 글꼴 크기 리셋 |
| `⌘ ,` / `⌘ ⇧ ,` | 설정 열기 / 리로드 |
| `⌘ ⌥ I` | 인스펙터 토글 (렌더링/키 디버깅) |

### CLI — 실효 설정과 키맵 조회

```sh
ghostty +list-keybinds     # 현재 유효 키맵 전부 (커스텀 반영)
ghostty +list-actions      # 바인딩 가능한 액션 목록
ghostty +show-config       # 병합된 설정 덤프
ghostty +list-themes       # 테마 목록 ((resources)=내장 / (user)=커스텀)
ghostty +list-keybinds --plain | rg -n "alt\\+arrow_left|alt\\+arrow_right"
```

> 설정 파일: `~/.config/ghostty/config`. `keybind = super+d=new_split:right` 형식으로 재정의, `keybind = super+d=unbind`로 해제.

### 설정 파일과 Option 키

설정은 `~/.config/ghostty/config` 또는 macOS Application Support 경로에서 읽을 수 있다. 실제 설정은 `ghostty +show-config`로 확인하고, 키맵은 `ghostty +list-keybinds`로 조회한다.

`macos-option-as-alt = left`는 왼쪽 Option을 Alt로 전달하는 설정 예시다. 설정 적용·키 충돌·tmux 색상 차이 등 환경별 문제는 [Ghostty 공식 설정 문서](https://ghostty.org/docs/config)에서 확인한다.
