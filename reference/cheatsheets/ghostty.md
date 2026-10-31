# Ghostty Cheatsheet

> **Ghostty** (ghost + `tty`) — Mitchell Hashimoto가 만든 GPU 가속 터미널 에뮬레이터. 자체 탭·분할(split)을 가져 tmux 없이도 화면을 쪼갠다.
>
> 아래는 **macOS 기본 키맵** (`ghostty +list-keybinds` 실측). `⌘`=super, `⌥`=alt, `⌃`=ctrl, `⇧`=shift. 커스텀은 `⌘,`(open_config)로 연다.

## 화면 배치와 세션의 경계

```text
Ghostty Window
   ├─ Tab
   │   └─ Split / Surface → Terminal / Shell
   └─ Tab

Window  : OS 창       (기본 macOS ⌘N)
Tab     : 창 안의 탭   (⌘T)
Split   : 탭 내 화면 분할 (⌘D / ⌘⇧D)
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

### 설정 파일 위치 · Option 키

macOS에서 Ghostty는 **두 경로의 config를 모두 읽어 병합**한다 — 충돌 키는 뒤에 로드되는 **App Support 쪽이 이긴다**:

| 경로 | 비고 |
|---|---|
| `~/.config/ghostty/config` | XDG 표준. dotfiles로 관리하기 좋음 |
| `~/Library/Application Support/com.mitchellh.ghostty/config` | 첫 실행 시 config 없으면 자동 생성하는 템플릿 |

```sh
ghostty +show-config | grep <key>   # 병합된 실효값 (어느 파일이 이겼는지 판별)
```

> `+show-config`는 실행 중인 창의 라이브 상태가 아니라 **디스크 config를 다시 파싱**해 보여준다. 파일이 유효한데도 화면이 그대로면 원인은 파일이 아니라 리로드(창이 옛 설정 사용 중).

> 함정: 한 파일을 고쳤는데 안 먹으면 다른 파일이 같은 키를 덮고 있을 수 있다. 실설정은 한 곳(XDG)으로 통합하는 게 안전.

### 키바인드 충돌 체크

```sh
ghostty +show-config | rg -n "macos-option-as-alt|theme"
ghostty +list-keybinds --plain | rg -n "alt\\+arrow_left|alt\\+arrow_right"
```

- `alt+arrow_left=esc:b`, `alt+arrow_right=esc:f`가 보이면 Option+화살표 단어 이동이 유효.
- 안 보이면 `~/Library/Application Support/com.mitchellh.ghostty/config` 경로의 충돌 라인을 우선 점검.

**`macos-option-as-alt`** — 기본 꺼짐이라 Option 키가 Alt로 안 가고 macOS 특수문자(´, ¬…)를 낸다. tmux `M-` 바인딩이나 셸 단어 이동(`Alt-b`/`f`/`d`)을 쓰려면 켜야 한다:

```conf
macos-option-as-alt = left   # 왼쪽 Option만 Alt, 오른쪽은 특수문자 입력 보존
# = true  → 양쪽 다 Alt / = right → 오른쪽만
```

> 적용은 config 리로드(`⌘ ⇧ ,`)로 부족할 수 있고 **완전 재시작(`⌘ Q`)이 필요한 경우가 많다**.

