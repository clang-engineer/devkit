# Aerospace Cheatsheet

macOS용 i3 스타일 타일링 윈도우 매니저. SIP 비활성화 없이 기본 타일링을 사용할 수 있다.

## 전체 구조 — 무엇을 배치하는가?

```text
사용자 키 입력 / CLI / 창 감지 규칙
              │
              ▼
        AeroSpace 명령
              │
     ┌────────┼──────────┐
     ▼        ▼          ▼
   Focus    Move       Layout
     │        │          │
     └────────┴──────────┘
              ▼
Workspace (작업 공간)
    └─ Window (배치 대상)
        └─ Layout Tree (분할·정렬 구조)

Mode   : 입력 키의 명령 매핑을 전환 [3]
Config : 키·규칙·기본 동작을 정의 [4]
```

AeroSpace는 **GUI 창의 공간 배치**를 관리한다. Focus는 조작할 창을 고르고, Move는 창의 위치·Workspace를 바꾸며, Layout은 배치 구조를 바꾼다. tmux의 Session·Pane 유지와는 별개다. 위 그림은 **명령 흐름과 관리 대상의 관계**를 구분해 보여준다.

## 1. 탐색과 이동 — Focus · Window · Workspace

같은 방향키에 **Shift를 더하면 Focus 이동 대신 Window 이동**으로 바뀌는 키맵 패턴을 기억한다. 아래는 기본 설정 예시이며 실제 바인딩은 `~/.aerospace.toml`을 따른다.

```text
Alt + H/J/K/L          → Focus 이동
Alt + Shift + H/J/K/L  → Window 이동
Alt + 1..9             → Workspace 전환
Alt + Shift + 1..9     → Window를 Workspace로 이동
```

## 2. 배치 — Layout · Move · Join · Resize

AeroSpace는 Workspace 안의 **트리 구조**로 창을 배치한다. 창 선택(Focus), 위치 이동(Move), 컨테이너 구성(Join), 배치 방식(Layout)은 서로 다른 조작이다.

```text
배치 트리
├─ Layout   : Tiles / Accordion, 수평 / 수직
├─ Move     : 현재 창의 배치 위치 변경
├─ Join     : 이웃 창과 같은 컨테이너로 묶기
├─ Resize   : 현재 창 크기 조정
├─ Balance  : 크기 균등화
└─ Flatten  : 중첩 컨테이너 평탄화
```

| 목적 | AeroSpace 명령 | 대표 키·진입점 |
|---|---|---|
| 분할 방향·방식 | `layout tiles horizontal vertical` / `layout accordion horizontal vertical` | `Alt+/` / `Alt+,` |
| 창 위치 변경 | `move left/right/up/down` | `Alt+Shift+H/J/K/L` |
| 이웃과 묶기 | `join-with left/right/up/down` | 사용자 정의 service 모드 |
| 크기 조절 | `resize smart -50` / `resize smart +50` | `Alt+-` / `Alt+=` |
| 크기 균등화 | `balance-sizes` | CLI 또는 사용자 키맵 |
| 트리 평탄화 | `flatten-workspace-tree` | service 모드 `r` |
| 플로팅 전환 | `layout floating tiling` | service 모드 `f` |

**Join은 단순한 창 이동이 아니다.** 현재 창과 지정 방향의 이웃 창을 같은 컨테이너로 묶어 배치 트리를 변경한다. `flatten-workspace-tree`는 중첩을 평탄화하지만 Join의 정확한 역연산이나 Undo는 아니다.

```text
기존: Workspace
      ├─ A
      ├─ B
      └─ C

A에서 join-with right
      ├─ Container
      │  ├─ A
      │  └─ B
      └─ C
```

위 그림은 **구조 변화의 개념도**이며 실제 화면 배치와 트리 재구성은 기존 레이아웃에 따라 달라진다. 단축키는 기본 설정 예시와 사용자 service 모드 설정이 섞여 있으므로 `~/.aerospace.toml`을 기준으로 확인한다.

## 3. 명령어 모드 — Mode · Binding

**Mode는 키 입력에 적용할 명령 바인딩 집합**이다. `main`이 기본 모드이며, `service`는 설정으로 정의하는 사용자 모드다. 모드를 전환하면 같은 키도 다른 명령을 실행할 수 있다.

```text
main (일상적인 창 조작)
  └─ Alt+Shift+; → mode service
                       ├─ f   → layout floating tiling
                       ├─ r   → flatten-workspace-tree
                       └─ Esc → mode main
```

```toml
# ~/.aerospace.toml — 사용자 모드 정의 예시
[mode.main.binding]
alt-shift-semicolon = 'mode service'

[mode.service.binding]
f = ['layout floating tiling', 'mode main']
r = ['flatten-workspace-tree', 'mode main']
esc = 'mode main'
```

- `mode <name>`: 지정한 모드로 전환하는 **AeroSpace 명령**. 새 모드는 `[mode.<name>.binding]`으로 정의한다.
- 모드 전환 후 **자동 복귀하는 것이 아니다**. 예시처럼 각 명령 뒤에 `mode main`을 명시해야 한 번 실행 후 돌아온다.
- `[mode.main.binding]`을 직접 정의하면 기본 키맵 전체를 자동 상속하지 않는다. 실제 설정에서 사용할 기본 키를 함께 선언해야 한다.

**현재 구성의 service 모드:** `Alt+Shift+;`로 진입해 `f`(플로팅 전환), `r`(트리 평탄화), `backspace`(현재 창 외 닫기), `alt-shift-h/j/k/l`(창 묶기) 등을 사용한다. 키와 복귀 방식은 실제 `~/.aerospace.toml`에 따라 달라진다. 자세한 설계는 [서비스 모드 글](https://clang-engineer.github.io/posts/macos/2026-07-14-aerospace-service-mode/) 참고.

## 4. 관찰과 자동화 — CLI · Config · Rules

**작동 예시:** `aerospace list-windows --all`로 대상을 조회하고, `aerospace workspace 3`으로 작업 공간을 전환한다. 창을 선택한 상태에서 `aerospace move-node-to-workspace 2`를 실행하면 그 창을 다른 Workspace로 옮긴다. 조회·전환·이동은 서로 다른 동작이다.


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

**새 키가 안 먹을 때:** 설정 파일에서 해당 바인딩만 찾지 말고 먼저 `aerospace reload-config`의 파싱 오류를 읽는다. 다른 곳의 잘못된 TOML/필드 타입 때문에 새 설정 전체가 거부되어 이전 유효 설정이 남을 수 있다. 예컨대 `if = 'true'`는 `if`가 테이블이어야 하므로 잘못된 표현이고, 마지막 catch-all 규칙은 `if`를 생략한다:

```toml
[[on-window-detected]]
run = ['layout floating']
```

catch-all은 앞의 구체 규칙 뒤에 둔다. `reload-config`가 오류를 출력하면 해당 블록과 필드를 고친 뒤 다시 로드한다. 파일을 dotfiles 도구로 관리한다면 소스를 변경하고 live 파일 반영과 앱 리로드를 각각 확인한다.


## 관련 글

- [Tiling Window Management — 창 배치와 작업 공간의 구조](https://clang-engineer.github.io/posts/developer-tools/2026-10-05-window-management-map/) — i3·Sway·AeroSpace·yabai의 계층과 관계, tmux와의 경계
- [AeroSpace 서비스 모드 — 저빈도·위험 동작을 별도 모드로 격리하는 설계](https://clang-engineer.github.io/posts/macos/2026-07-14-aerospace-service-mode/)

