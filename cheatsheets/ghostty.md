# Ghostty Cheatsheet

> **Ghostty** (ghost + `tty`) — Mitchell Hashimoto가 만든 GPU 가속 터미널 에뮬레이터. 자체 탭·분할(split)을 가져 tmux 없이도 화면을 쪼갠다.
>
> 아래는 **macOS 기본 키맵** (`ghostty +list-keybinds` 실측). `⌘`=super, `⌥`=alt, `⌃`=ctrl, `⇧`=shift. 커스텀은 `⌘,`(open_config)로 연다.

## 30초만 본다면

| 상황 | 키 |
|---|---|
| 좌우 분할 | `⌘ D` |
| 상하 분할 | `⌘ ⇧ D` |
| 분할 닫기 (되돌리기) | `⌘ W` (close_surface) |
| 분할 간 이동 | `⌘ [` / `⌘ ]` (이전/다음) |
| 분할 전체화면 토글 | `⌘ ⇧ Enter` (닫지 않고 크게만) |
| 새 탭 / 새 창 | `⌘ T` / `⌘ N` |
| 설정 열기 / 리로드 | `⌘ ,` / `⌘ ⇧ ,` |

## 분할 (split)

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

## 탭 & 창

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

## 클립보드 & 스크롤

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

## 글꼴 & 설정 & 진단

| 키 | 동작 |
|---|---|
| `⌘ =` / `⌘ -` | 글꼴 크기 키우기 / 줄이기 |
| `⌘ 0` | 글꼴 크기 리셋 |
| `⌘ ,` / `⌘ ⇧ ,` | 설정 열기 / 리로드 |
| `⌘ ⌥ I` | 인스펙터 토글 (렌더링/키 디버깅) |

## CLI

```sh
ghostty +list-keybinds     # 현재 유효 키맵 전부 (커스텀 반영)
ghostty +list-actions      # 바인딩 가능한 액션 목록
ghostty +show-config       # 병합된 설정 덤프
ghostty +list-themes       # 테마 목록 ((resources)=내장 / (user)=커스텀)
```

> 설정 파일: `~/.config/ghostty/config`. `keybind = super+d=new_split:right` 형식으로 재정의, `keybind = super+d=unbind`로 해제.

## 설정 파일 위치 & Option 키

macOS에서 Ghostty는 **두 경로의 config를 모두 읽어 병합**한다 — 충돌 키는 뒤에 로드되는 **App Support 쪽이 이긴다**:

| 경로 | 비고 |
|---|---|
| `~/.config/ghostty/config` | XDG 표준. dotfiles로 관리하기 좋음 |
| `~/Library/Application Support/com.mitchellh.ghostty/config` | 첫 실행 시 config 없으면 자동 생성하는 템플릿 |

```sh
ghostty +show-config | grep <key>   # 병합된 실효값 (어느 파일이 이겼는지 판별)
```

> 함정: 한 파일을 고쳤는데 안 먹으면 다른 파일이 같은 키를 덮고 있을 수 있다. 실설정은 한 곳(XDG)으로 통합하는 게 안전.

**`macos-option-as-alt`** — 기본 꺼짐이라 Option 키가 Alt로 안 가고 macOS 특수문자(´, ¬…)를 낸다. tmux `M-` 바인딩이나 셸 단어 이동(`Alt-b`/`f`/`d`)을 쓰려면 켜야 한다:

```conf
macos-option-as-alt = left   # 왼쪽 Option만 Alt, 오른쪽은 특수문자 입력 보존
# = true  → 양쪽 다 Alt / = right → 오른쪽만
```

> 적용은 config 리로드(`⌘ ⇧ ,`)로 부족할 수 있고 **완전 재시작(`⌘ Q`)이 필요한 경우가 많다**.

## 테마

```sh
ghostty +list-themes       # (resources)=번들 내장 / (user)=~/.config/ghostty/themes/ 커스텀
```

```conf
# ~/.config/ghostty/config
theme = cyberdream         # 내장 이름 또는 user 테마 이름
```

커스텀 테마는 `~/.config/ghostty/themes/<name>` 파일로 넣으면 `(user)`로 잡힌다:

```conf
# ~/.config/ghostty/themes/<name>
palette = 0=#16181a        # ANSI 0~15
palette = 15=#ffffff
background = #16181a
foreground = #ffffff
```

> 내장 테마(`(resources)`)는 `mbadolato/iTerm2-Color-Schemes`에서 온다. 거기 없는 테마는 위처럼 `themes/`에 직접 넣어야 이름으로 선언 가능. 리로드: `⌘ ⇧ ,`.

> **색이 안 바뀔 때:** ① `+show-config`/`+list-themes`로 파일 유효성 먼저 증명 → ② 유효하면 `⌘ ⇧ ,` 리로드(Ghostty는 시작 시 1회만 읽음, 자동 감지 X) → ③ 그래도면 tmux가 자체 팔레트로 덮는 것일 수 있으니 tmux 밖 새 창(`⌘ N`)에서 확인. 진단 상세: vault `note-ghostty-config-not-applying`.
