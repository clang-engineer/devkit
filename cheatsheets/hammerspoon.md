# Hammerspoon Cheatsheet

macOS 자동화 런타임. Lua로 창 관리·키바인딩·알림·이벤트 반응을 스크립팅.

- 설정 진입점: `~/.hammerspoon/init.lua`
- 모듈 로드: `require('modules.<이름>')` (`.lua` 생략)

## 필수 조작

| 작업 | 방법 |
|---|---|
| 설정 리로드 | 메뉴바 🔨 → Reload Config |
| CLI로 리로드 | `hs -c "hs.reload()"` (ipc 필요, 아래) |
| Lua 콘솔 | 메뉴바 🔨 → Console (즉석 평가·디버깅) |
| `hs` CLI 활성화 | `init.lua`에 `hs.ipc.cliInstall()` (최초 1회 수동 리로드 필요) |

> `hs.ipc.cliInstall()`은 닭-달걀 문제가 있다. 이 줄을 넣어도 최초 한 번은 메뉴바에서 수동 리로드해야 `hs` CLI가 생긴다. 그 뒤로는 CLI로 원격 리로드 가능.

## 창 힌트 (window hint)

화면의 모든 창에 라벨을 띄우고 키 입력으로 즉시 포커스 전환.

```lua
hs.hotkey.bind({'shift'}, 'F1', hs.hints.windowHints)
```

- `hs.hints.windowHints` — 열린 창마다 문자 라벨을 오버레이. 해당 문자를 누르면 그 창으로 이동.
- AeroSpace 같은 WM의 방향 포커스(`Alt+H/J/K/L`)로 안 잡히는 창을 한 번에 고를 때 유용.

## 전역 키 리매핑 패턴 (참고 — 현재 미사용)

> `hjkl.lua` 모듈. `ctrl+hjkl`을 방향키로 매핑하는 전역 remap. **현재 `init.lua`에서 주석 처리(비활성)** 상태. AeroSpace/앱 자체 vim 바인딩과 겹쳐 실사용은 접었으나, "Hammerspoon으로 전역 키를 갈아끼우는 패턴" 참고용으로 남긴다.

핵심 아이디어 세 가지:

```lua
-- ① 키 입력을 흉내내는 함수를 반환 (클로저)
local function pressFn(mods, key)
    if key == nil then key = mods; mods = {} end
    return function() hs.eventtap.keyStroke(mods, key, 1000) end
end

-- ② 바인딩을 테이블에 모아두기 (나중에 일괄 on/off)
remap({'ctrl'}, 'h', pressFn('left'))   -- ctrl+h → ←

-- ③ 토글: 모은 바인딩을 한 번에 enable/disable
hs.hotkey.bind({'alt'}, 'tab', function()
    -- boundHotKeys를 순회하며 v:enable() / v:disable()
end)
```

- **`hs.eventtap.keyStroke(mods, key)`** — 실제 키 입력을 프로그램적으로 발생. remap의 핵심.
- **바인딩 객체를 배열에 저장** → `:enable()`/`:disable()`로 모드 토글 구현 가능.
- 전역 remap은 앱별 단축키와 충돌하기 쉬우니 토글을 같이 두는 게 안전.

## 관련

- 창 화면 내 배치(반/3분할): `hs.window` + `setFrame` → 블로그 "Rectangle을 Hammerspoon으로 대체" 참고
- AeroSpace 연동(URL scheme, hs.task 비동기): 블로그 "AeroSpace + Hammerspoon" 시리즈 참고
- AeroSpace 단축키·CLI 빠른 참조: `cheatsheets/aerospace.md`
