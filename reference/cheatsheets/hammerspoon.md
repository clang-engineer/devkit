# Hammerspoon Cheatsheet

macOS 자동화 런타임. Lua로 창 관리·키바인딩·알림·이벤트 반응을 스크립팅.

## 자동화의 입력과 동작

```text
~/.hammerspoon/init.lua (Lua 설정·바인딩)
               │ 로드 / reload
               ▼
Hammerspoon Runtime
       │
       ├─ hs.hotkey / hs.timer / hs.eventtap → 이벤트 감지
       │                          │
       │                          ▼
       │                      Lua Callback
       │                          │
       └─ hs.window / hs.alert / hs.application → macOS 동작

Console / hs CLI → 실행 상태 관찰·재로드
```
Hammerspoon은 고정된 키맵을 외우는 도구가 아니라 **이벤트 → Lua Callback → macOS 동작**을 조합하는 런타임이다. `hs.window`는 이벤트 소스가 아니라 창을 조회·조작하는 API이고, `hs.alert`는 표시 동작이다. `hs.reload()`는 설정 재로드, `hs.ipc.cliInstall()`은 CLI 접근을 설치한다.

## 1. 런타임·설정 — 이벤트와 Lua

Hammerspoon은 **이벤트를 받아 Lua Callback을 실행하는 자동화 환경**이다. 키를 외우기보다 이벤트·대상·동작을 조합한다.

### 필수 조작

| 작업 | 방법 |
|---|---|
| 설정 리로드 | 메뉴바 🔨 → Reload Config |
| CLI로 리로드 | `hs -c "hs.reload()"` (ipc 필요, 아래) |
| Lua 콘솔 | 메뉴바 🔨 → Console (즉석 평가·디버깅) |
| `hs` CLI 활성화 | `init.lua`에 `hs.ipc.cliInstall()` (최초 1회 수동 리로드 필요) |

> `hs.ipc.cliInstall()`은 닭-달걀 문제가 있다. 이 줄을 넣어도 최초 한 번은 메뉴바에서 수동 리로드해야 `hs` CLI가 생긴다. 그 뒤로는 CLI로 원격 리로드 가능.

## 2. 창 조작 — Window Hint

Window Hint는 화면의 창을 빠르게 선택하는 기능으로, 창 배치·타일링과는 별개다.

화면의 창에 라벨을 띄우고 키 입력으로 포커스를 전환한다. 아래 예시는 **키 입력 이벤트 → Callback → Window Hint 표시**의 흐름이다.

```lua
hs.hotkey.bind({'shift'}, 'F1', hs.hints.windowHints)
```

- `hs.hints.windowHints` — 열린 창마다 문자 라벨을 오버레이. 해당 문자를 누르면 그 창으로 이동.
- AeroSpace 같은 WM의 방향 포커스(`Alt+H/J/K/L`)로 안 잡히는 창을 한 번에 고를 때 유용.

## 3. 입력 자동화 — Hotkey와 Remapping

키 입력을 다른 동작에 연결하는 기능이며 시스템 전체 입력 처리에는 접근 권한·제약이 있다.

`hs.eventtap.keyStroke`로 실제 키 입력을 프로그램적으로 발생시켜 임의의 키를 다른 키로 remap.

```lua
-- ctrl+h → ← (왼쪽 방향키)
hs.hotkey.bind({'ctrl'}, 'h', function()
    hs.eventtap.keyStroke({}, 'left', 1000)
end)
```

- **`hs.eventtap.keyStroke(mods, key)`** — 지정한 조합키를 실제 입력한 것처럼 발생. remap의 핵심.
- `hs.hotkey.bind`는 바인딩 객체를 반환하며, `:enable()`/`:disable()`로 개별 on/off 가능 → 모드 토글 구현에 활용.
- 전역 remap은 앱별 단축키와 충돌하기 쉬우므로 토글 장치를 함께 두는 게 안전.

## 관련

- AeroSpace 단축키·CLI 빠른 참조: `cheatsheets/aerospace.md`
