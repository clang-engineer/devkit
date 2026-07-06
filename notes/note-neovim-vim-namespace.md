---
layout: notes
title: "vim.* Lua 함수는 어디서 왔나 — Neovim 네이티브 vs Vim 브리지"
date: 2026-06-20
categories: [neovim]
tags: [neovim, lua, vimscript, nvim-api, rpc]
---

`vim.xxx` 형태라고 전부 Neovim 전용이 아니다. 같은 `vim` 테이블 안에 Neovim이 새로 만든 네이티브 API, Vim 시절 함수를 Lua로 감싼 브리지, Lua 헬퍼가 계보가 다른 채로 섞여 있다.

## 세 갈래로 나뉘는 `vim.*`

`vim` 전역 테이블은 Neovim이 Lua 런타임에 주입한 모듈이라, 순정 Vim에는 이 `vim` Lua 전역 자체가 없다. 그 안의 항목은 출처가 셋으로 갈린다.

- **Neovim이 새로 만든 것 (Vim에 없음)**
  - `vim.api.*` — Neovim API (`nvim_buf_*`, `nvim_create_autocmd` 등)
  - `vim.lsp.*`, `vim.treesitter.*`, `vim.diagnostic.*`
  - `vim.keymap.set`, `vim.opt`, `vim.b/w/g/o` 등 Lua 인터페이스
  - `vim.loop`(libuv), `vim.uv`
  - `vim.notify`, `vim.schedule`, `vim.defer_fn`
  - `vim.tbl_*`, `vim.split`, `vim.inspect` 같은 Lua 유틸
- **원래 Vim 기능을 Lua로 감싼 브리지**
  - `vim.fn.*` — Vimscript 함수 호출. `vim.fn.expand()` = Vimscript의 `expand()`
  - `vim.cmd` — Ex 명령 실행
  - `vim.g`, `vim.o` 등 — 기존 옵션/변수에 대응

Vim도 9.0부터 `:lua`와 Lua 인터페이스가 일부 있지만 Neovim의 `vim` 모듈과 API가 호환되지 않는다. 그래서 실무적으로 `vim.xxx` Lua 코드는 거의 Neovim 전용으로 본다. 소속 확인은 `:h vim.api`, `:h lua-vim`, 유틸은 `:h lua-stdlib`.

## `vim.api`는 본체가 아니라 통로

Neovim API가 전부 `vim.xxx` 형태인 건 아니다. Lua **런타임 안에서** 접근할 때 거의 모든 게 `vim` 테이블로 노출될 뿐이고, API의 본체는 따로 있다.

진짜 핵심 API는 **`nvim_*` 함수 집합**이다. 이건 언어 중립적인 MessagePack-RPC 인터페이스로 정의돼 있어서 접근 경로가 여럿이다.

- Lua: `vim.api.nvim_create_autocmd(...)`
- Vimscript: `nvim_create_autocmd(...)` (그냥 함수로)
- 외부 클라이언트(pynvim, Rust 등): RPC로 같은 `nvim_*` 호출

즉 `vim.api.nvim_xxx`의 `vim.api`는 Lua에서 그 API에 닿는 **껍데기**이고, 정체는 `nvim_*`이다. 반대로 `vim.fn.*`, `vim.tbl_*`, `vim.loop`는 `vim.*`이긴 해도 nvim API가 아니다 — 각각 Vim 호환 함수, Lua 헬퍼, libuv 바인딩이다.

## `nvim_*`의 정체 — C 코어를 RPC로 노출

`nvim_*` 함수의 본체는 Neovim 소스의 C 코드에 있다 (`src/nvim/api/*.c` — `vim.c`, `buffer.c`, `window.c` 등). 단순 C 모듈로 두는 게 아니라 **RPC로 노출되는 공개 API**로 등록하는 게 핵심이다.

- 빌드 과정에서 C 함수 시그니처를 스캔해 디스패치 테이블과 메타데이터를 자동 생성한다. `nvim --api-info`로 확인.
- `vim.api.nvim_xxx`는 같은 프로세스 안에서 이 C 함수를 직접 부르는 빠른 경로(RPC 안 거침).
- Vim에는 이 `nvim_*` 레이어와 RPC API 자체가 없다. "에디터를 라이브러리/서버처럼 다루게" 하려던 Neovim 초기 리팩터링의 핵심 목표였다.

"RPC로 노출된다"는 건 `nvim_*`를 Neovim 안에서만 쓰는 게 아니라 **외부 프로세스가 파이프/소켓으로 호출**할 수 있게 공개했다는 뜻이다. 이 덕에 GUI 분리(Neovide, nvim-qt), 에디터 임베딩(vscode-neovim), `nvim --remote` 연동이 가능하다. 층으로 보면:

```
nvim_buf_set_lines(...)   ← 호출하려는 API (무엇을)
   ↓
MessagePack-RPC           ← 프로토콜 (요청/응답/알림 메시지 규격)
   ↓
MessagePack               ← 직렬화 포맷 (JSON 비슷한 바이너리)
   ↓
소켓 / 파이프(stdio)       ← 전송 수단
```

syscall 비유는 "안정적 공개 API 뒤에 구현을 숨긴다"는 점만 닮았다. 특권 경계 전환(trap)이 아니라 같은 유저 권한 두 프로세스의 양방향 메시지 교환이라, 오히려 D-Bus나 클라이언트-서버 API 호출에 가깝다.

## LuaJIT과의 관계

Neovim이 Lua를 실행하는 런타임은 **LuaJIT**이다. `vim` 전역 테이블은 Neovim이 이 LuaJIT 런타임에 주입한 모듈이다 — LuaJIT이 "엔진", `vim.*`가 그 위의 "API".

- LuaJIT은 **Lua 5.1 기준** + 확장(`ffi`, `bit`, `jit`). Lua 5.2/5.3 기능(`goto`, `//`, `<<`/`>>` 등)은 부분 백포트만 된다.
- `vim.loop`(=`vim.uv`)는 LuaJIT의 FFI 위에 libuv를 바인딩한 것.
- "Lua 5.3 문서대로 했는데 안 된다"면 LuaJIT(5.1) 기준이라 그런 경우가 많다. 확인: `:lua print(jit and jit.version or _VERSION)`.
