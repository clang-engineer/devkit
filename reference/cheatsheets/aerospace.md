# Aerospace Cheatsheet

macOS용 i3 스타일 타일링 윈도우 매니저. SIP 비활성화 없이 기본 타일링을 사용할 수 있다.

## 전체 구조 — 입력과 배치 트리

```text
키 입력 / CLI / 창 감지 규칙
           │
     Mode · Binding / Config
           │
           ▼
       AeroSpace 명령
           │
    ┌──────┼──────────────────┐
    ▼      ▼                  ▼
  Focus   Move             Layout / Join
  선택    위치 변경         구조·배치 변경
           │                  │
           └────────┬─────────┘
                    ▼
             Workspace [1·2]
                 └─ Layout Tree
                     ├─ Container (Tiles / Accordion)
                     │   ├─ Window A
                     │   └─ Window B
                     └─ Window C

Resize / Balance / Flatten → 크기·트리 조정 [2]
Mode / Binding             → 키 입력의 명령 매핑 [3]
Config / Rules             → 키·자동 배치 설정 [4]
```

Workspace는 창을 배치하는 작업 공간이고, **Layout Tree는 컨테이너와 Window의 배치 관계**를 나타낸다. Focus는 조작할 대상을 고르고, Move는 위치를 바꾸며, Join·Layout은 트리 구조·배치 방식에 작용한다. 위 그림은 대표적인 **대상 관계와 명령의 적용 위치**이지 모든 명령의 실행 순서는 아니다. tmux의 세션·프로세스 유지와는 별개다.

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
| 분할 방향·방식 | `layout h_tiles` / `layout v_accordion` | `Alt+/` / `Alt+,` |
| 창 위치 변경 | `move left/right/up/down` | `Alt+Shift+H/J/K/L` |
| 이웃과 묶기 | `join-with left/right/up/down` | 사용자 정의 service 모드 |
| 크기 조절 | `resize smart -50` / `resize smart +50` | `Alt+-` / `Alt+=` |
| 크기 균등화 | `balance-sizes` | CLI 또는 사용자 키맵 |
| 트리 평탄화 | `flatten-workspace-tree` | service 모드 `r` |
| 플로팅 전환 | `layout floating tiling` | service 모드 `f` |

**Join은 단순한 창 이동이 아니다.** `join-with <direction>`은 현재 창과 지정 방향의 가장 가까운 노드를 공통 부모 컨테이너 아래로 묶는다. 방향 인자는 **묶을 상대의 위치**이지, 새 컨테이너의 분할 방향이 아니다.

```text
처음: h_tiles (좌우 배치)
┌──────┬──────┬──────┐
│  A   │  B*  │  C   │
└──────┴──────┴──────┘

B에서 join-with right
┌──────┬──────┐
│      │  B*  │
│  A   ├──────┤
│      │  C   │
└──────┴──────┘

트리: h_tiles
      ├─ A
      └─ v_tiles
         ├─ B*
         └─ C
```

위는 **기본 정규화 설정에서의 대표 사례**다. 중첩 컨테이너의 방향은 부모와 반대가 되도록 정규화될 수 있으며, 기존 트리·설정에 따라 결과가 달라진다. `flatten-workspace-tree`는 복잡한 중첩 구조를 평탄화하지만 Join의 Undo는 아니다.

| 명령 | 차이 |
|---|---|
| `move right` | 현재 창을 오른쪽으로 재배치하며 트리가 바뀔 수 있음 |
| `swap right` | 오른쪽 이웃 창과 자리 교환 |
| `join-with right` | 오른쪽 이웃과 공통 컨테이너 구성 |

**Layout 문법:** `layout h_tiles`는 가로 타일 배치를 지정한다. `layout tiles horizontal vertical`처럼 여러 인자를 쓰면 각각을 동시에 적용하는 것이 아니라, **현재 상태와 다른 첫 번째 후보를 선택**한다. [공식 Join·Layout 명령 문서](https://nikitabobko.github.io/AeroSpace/commands#join-with) 참고.

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

## 4. 설정·자동화 — CLI · Config · Rules

```text
CLI     → 현재 상태 조회·명령 실행
Config  → Mode·Binding·기본 동작 설정
Rules   → 창 감지 조건 → 자동 배치 명령
```

| 목적 | 대표 명령 |
|---|---|
| Workspace·창 조회 | `aerospace list-workspaces` · `aerospace list-windows --all` |
| Workspace 전환·창 이동 | `aerospace workspace <name>` · `aerospace move-node-to-workspace <name>` |
| 설정 다시 읽기 | `aerospace reload-config` |
| 특정 창 지정·출력 형식 | `--window-id <id>` · `--format '%{window-id}'` |

**자동 배치:** `[[on-window-detected]]`는 새 창의 앱·제목 등을 조건으로 Workspace 이동이나 Layout 변경 명령을 실행한다.

```toml
[[on-window-detected]]
if.app-id = 'com.mitchellh.ghostty'
run = ['move-node-to-workspace 2:Terminal']
```

규칙은 위에서부터 평가하므로 구체적인 조건을 먼저 둔다. `if`는 테이블이며, 모든 창에 적용하는 규칙은 `if = {}`처럼 빈 조건으로 정의할 수 있다. 상세 옵션·오류 진단은 [공식 설정 문서](https://nikitabobko.github.io/AeroSpace/guide#configuring-aerospace) 참고.

## 관련 글

- [Tiling Window Management — 창 배치와 작업 공간의 구조](https://clang-engineer.github.io/posts/developer-tools/2026-10-05-window-management-map/) — i3·Sway·AeroSpace·yabai의 계층과 관계, tmux와의 경계
- [AeroSpace 서비스 모드 — 저빈도·위험 동작을 별도 모드로 격리하는 설계](https://clang-engineer.github.io/posts/macos/2026-07-14-aerospace-service-mode/)

