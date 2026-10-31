# Aerospace Cheatsheet

macOS용 i3 스타일 타일링 윈도우 매니저. SIP 비활성화 없이 기본 타일링을 사용할 수 있다.

## 전체 구조 — 무엇을 배치하는가?

```text
AeroSpace
├─ Workspace  : 창을 묶고 전환하는 작업 공간
│  └─ Window  : 배치·이동할 GUI 창
├─ Focus      : 조작 대상 선택
├─ Layout     : Tiling / Accordion / Floating
├─ Mode       : Main / Service 등 키맵 전환
└─ Automation : on-window-detected / CLI / Config
```

AeroSpace는 **GUI 창의 공간 배치**를 관리한다. tmux의 Session·Pane 유지와는 별개다. 이 그림은 실행 순서가 아니라 기능 관계도다.

## 1. 탐색과 이동 — Focus · Window · Workspace

같은 방향키에 **Shift를 더하면 Focus 이동 대신 Window 이동**으로 바뀌는 키맵 패턴을 기억한다. 아래는 기본 설정 예시이며 실제 바인딩은 `~/.aerospace.toml`을 따른다.

```text
Alt + H/J/K/L          → Focus 이동
Alt + Shift + H/J/K/L  → Window 이동
Alt + 1..9             → Workspace 전환
Alt + Shift + 1..9     → Window를 Workspace로 이동
```

## 2. 배치 — Layout · Resize

| 단축키 | 설명 |
|---|---|
| `Alt + /` | 타일 레이아웃 토글 (수평/수직) |
| `Alt + ,` | 아코디언 레이아웃 토글 |

> 플로팅↔타일 토글은 메인 모드에 기본 단축키가 없다. 서비스 모드(`Alt + Shift + ;`)의 `F`로 전환한다.

### 창 크기 조절

| 단축키 | 설명 |
|---|---|
| `Alt + -` | 크기 축소 (-50) |
| `Alt + =` | 크기 확대 (+50) |

## 3. 모드 — 자주 쓰는 키와 관리 동작 분리

저빈도·위험(되돌리기 번거로운) 동작을 메인 키맵에서 격리한 서브모드. `Alt + Shift + ;` 로 진입하며, 각 키는 동작 후 **자동으로 메인 모드로 복귀**한다. 키는 **소문자 그대로**(Shift 불필요) 누른다. 설계 의도와 모드형 키맵 관점은 [AeroSpace 서비스 모드 글](https://clang-engineer.github.io/posts/macos/2026-07-14-aerospace-service-mode/)에서 따로 정리한다.

| 키 | 명령 | 설명 |
|---|---|---|
| `esc` | `reload-config` | 설정 리로드 + 메인 모드 복귀 |
| `r` | `flatten-workspace-tree` | 레이아웃 초기화 (분할 트리 평탄화) |
| `f` | `layout floating tiling` | 플로팅↔타일링 토글 |
| `backspace` | `close-all-windows-but-current` | 현재 창 제외 모두 닫기 |
| `alt-shift-h/j/k/l` | `join-with left/down/up/right` | 인접 창과 컨테이너로 묶기 |

> **바인딩은 병합이 아니라 대체다.** `[mode.main.binding]`을 하나라도 정의하면 나머지 기본 바인딩은 폴백되지 않고 **빈 테이블로 사라진다**(다른 설정 키는 기본값 폴백되는 것과 반대). 서비스 모드도 `[mode.service.binding]`을 직접 안 적으면 통째로 못 쓴다 → 원하는 stock 키는 config에 명시적으로 나열해야 한다.

## 4. 관찰과 자동화 — CLI · Config · Rules

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

### 자동 창 배치 (on-window-detected)

`[[on-window-detected]]` 블록으로 앱이 뜰 때 워크스페이스 이동·레이아웃을 자동 적용할 수 있다. `if`는 문자열이 아니라 **테이블**(`if.app-id = '...'`)이고, `if` 생략은 "모든 창 매칭"(catch-all)이다. 규칙은 위에서부터 검사해 첫 매칭에서 멈춘다. 앱별 배치 규칙 작성은 공식 config 문서 참조.

## 관련 글

- [Tiling Window Management — 창 배치와 작업 공간의 구조](https://clang-engineer.github.io/posts/developer-tools/2026-10-05-window-management-map/) — i3·Sway·AeroSpace·yabai의 계층과 관계, tmux와의 경계
- [AeroSpace 서비스 모드 — 저빈도·위험 동작을 별도 모드로 격리하는 설계](https://clang-engineer.github.io/posts/macos/2026-07-14-aerospace-service-mode/)

