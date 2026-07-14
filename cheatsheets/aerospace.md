# Aerospace Cheatsheet

macOS용 i3 스타일 타일링 윈도우 매니저. SIP 비활성화 불필요.

## 설치

```bash
brew install --cask nikitabobko/tap/aerospace
```

- 설정 파일: `~/.aerospace.toml` (없으면 내장 기본값으로 동작)
- 설정 파일 없이도 실행 가능

## 워크스페이스 전환 (기본 단축키)

| 단축키 | 설명 |
|---|---|
| `Alt + 1~9` | 워크스페이스 1~9로 전환 |
| `Alt + A~Z` | 워크스페이스 A~Z로 전환 |
| `Alt + Shift + 1~9` | 현재 창을 워크스페이스 1~9로 이동 |
| `Alt + Shift + A~Z` | 현재 창을 워크스페이스 A~Z로 이동 |
| `Alt + Tab` | 이전 워크스페이스로 돌아가기 |
| `Alt + Shift + Tab` | 워크스페이스를 다른 모니터로 이동 |

## 포커스 이동

| 단축키 | 설명 |
|---|---|
| `Alt + H` | 왼쪽 창으로 포커스 |
| `Alt + J` | 아래 창으로 포커스 |
| `Alt + K` | 위 창으로 포커스 |
| `Alt + L` | 오른쪽 창으로 포커스 |

## 창 이동

| 단축키 | 설명 |
|---|---|
| `Alt + Shift + H/J/K/L` | 현재 창을 해당 방향으로 이동 |

## 레이아웃

| 단축키 | 설명 |
|---|---|
| `Alt + /` | 타일 레이아웃 토글 (수평/수직) |
| `Alt + ,` | 아코디언 레이아웃 토글 |

> 플로팅↔타일 토글은 메인 모드에 기본 단축키가 없다. 서비스 모드(`Alt + Shift + ;`)의 `F`로 전환한다.

## 창 크기 조절

| 단축키 | 설명 |
|---|---|
| `Alt + -` | 크기 축소 (-50) |
| `Alt + =` | 크기 확대 (+50) |

## 서비스 모드

`Alt + Shift + ;` 로 서비스 모드 진입 후:

| 키 | 설명 |
|---|---|
| `Esc` | 설정 리로드 + 메인 모드 복귀 |
| `R` | 레이아웃 초기화 (flatten) |
| `F` | 플로팅/타일링 토글 |
| `Backspace` | 현재 창 제외 모두 닫기 |

## CLI 명령어

```bash
open -a AeroSpace              # 앱 실행
aerospace list-workspaces      # 워크스페이스 목록
aerospace list-windows --all   # 모든 창 목록
aerospace list-apps            # 열린 앱 + bundle ID 확인
aerospace reload-config        # 설정 리로드
aerospace move-node-to-workspace 2  # 현재 창을 workspace 2로 이동
aerospace workspace 3          # workspace 3으로 전환
```

## 자동 창 배치 (on-window-detected)

앱이 뜰 때 워크스페이스 이동·레이아웃을 자동 적용한다. `if`는 **테이블**이어야 한다.

```toml
[[on-window-detected]]
if.app-id = 'com.google.Chrome'          # bundle ID (aerospace list-apps 로 확인)
run = ['move-node-to-workspace 1', 'layout floating']

[[on-window-detected]]
# if 생략 = 모든 창 매칭. 첫 매칭에서 멈추므로 catch-all은 맨 끝에.
run = ['layout floating']
```

- catch-all은 `if = 'true'` 같은 문자열이 아니라 **`if` 생략**으로 쓴다.
- 한 줄이라도 파싱 실패하면 config 전체가 거부되고 옛 설정이 유지된다 → `aerospace reload-config`로 검증.

## yabai vs Aerospace 비교

| 항목 | yabai | Aerospace |
|---|---|---|
| SIP 비활성화 | 전체 기능 시 필요 | 불필요 |
| 설정 난이도 | 복잡 (skhd 별도) | 단일 toml 파일 |
| macOS 업데이트 | 깨질 수 있음 | 안정적 |
| 스타일 | BSP 기본 | i3 스타일 |
| 커뮤니티 | 오래됨, 자료 많음 | 신생, 빠르게 성장 |

## 관련 도구

| 도구 | 용도 |
|---|---|
| Rectangle | 간단한 창 배치 (Aerospace와 병행 불필요) |
| yabai + skhd | 고급 타일링 (SIP 비활성화 필요) |
| Amethyst | 간단한 타일링 |
| Hammerspoon | Lua 기반 자유 커스터마이징 |
