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
ghostty +list-themes       # 내장 테마
```

> 설정 파일: `~/.config/ghostty/config`. `keybind = super+d=new_split:right` 형식으로 재정의, `keybind = super+d=unbind`로 해제.
