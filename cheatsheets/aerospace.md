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

저빈도·위험(되돌리기 번거로운) 동작을 메인 키맵에서 격리한 서브모드. `Alt + Shift + ;` 로 진입하며, 각 키는 동작 후 **자동으로 메인 모드로 복귀**한다. 키는 **소문자 그대로**(Shift 불필요) 누른다.

| 키 | 명령 | 설명 |
|---|---|---|
| `esc` | `reload-config` | 설정 리로드 + 메인 모드 복귀 |
| `r` | `flatten-workspace-tree` | 레이아웃 초기화 (분할 트리 평탄화) |
| `f` | `layout floating tiling` | 플로팅↔타일링 토글 |
| `backspace` | `close-all-windows-but-current` | 현재 창 제외 모두 닫기 |
| `alt-shift-h/j/k/l` | `join-with left/down/up/right` | 인접 창과 컨테이너로 묶기 |

> **바인딩은 병합이 아니라 대체다.** `[mode.main.binding]`을 하나라도 정의하면 나머지 기본 바인딩은 폴백되지 않고 **빈 테이블로 사라진다**(다른 설정 키는 기본값 폴백되는 것과 반대). 서비스 모드도 `[mode.service.binding]`을 직접 안 적으면 통째로 못 쓴다 → 원하는 stock 키는 config에 명시적으로 나열해야 한다.

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

### 특정 창 지정 · 포맷 출력

포커스와 무관하게 **특정 창**을 옮기거나, 스크립트용으로 필드를 뽑을 때.

| 플래그 | 설명 |
|---|---|
| `move-node-to-workspace --window-id <id> <ws>` | 포커스된 창이 아니라 지정한 `window-id`를 이동 |
| `move-node-to-workspace --fail-if-noop <ws>` | 이미 그 워크스페이스면 아무 동작 안 함 (불필요한 포커스 변화 방지) |
| `list-windows --all --format '%{window-id}\|%{app-bundle-id}'` | 창 목록을 커스텀 포맷으로. `%{...}` 플레이스홀더로 필드 선택 |

## 자동 창 배치 (on-window-detected)

`[[on-window-detected]]` 블록으로 앱이 뜰 때 워크스페이스 이동·레이아웃을 자동 적용할 수 있다. `if`는 문자열이 아니라 **테이블**(`if.app-id = '...'`)이고, `if` 생략은 "모든 창 매칭"(catch-all)이다. 규칙은 위에서부터 검사해 첫 매칭에서 멈춘다. 앱별 배치 규칙 작성은 공식 config 문서 참조.

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
