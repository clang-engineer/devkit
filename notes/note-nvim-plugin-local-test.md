---
layout: notes
title: 로컬에서 개발 중인 Neovim 플러그인 테스트
date: 2026-06-18
categories: [nvim]
tags: [neovim, lazy.nvim, plenary, testing]
---

> push 없이 로컬 작업 디렉토리를 그대로 lazy.nvim 이 쓰게 만든다.

## 1. lazy.nvim `dev` 옵션 — 일상 개발용

플러그인 spec 에 `dev = true` 한 줄, lazy.setup 에 검색 경로 한 번.

```lua
-- ~/.config/nvim/lua/config/lazy.lua
require("lazy").setup(plugins, {
  dev = { path = "~/Desktop/_zero/oss" }, -- 여기 하위에서 동명 디렉토리 탐색
})

-- ~/.config/nvim/lua/plugins/jvm-env.lua
return {
  {
    "clang-engineer/jvm-env.nvim",
    dev = true, -- ← origin 대신 ~/Desktop/_zero/oss/jvm-env.nvim 사용
    lazy = false,
    priority = 100,
  },
}
```

수정 후 `:Lazy reload jvm-env.nvim` 으로 재로드. 작업 끝나면 `dev = true` 만 빼면 다시 원격 origin 사용.

## 2. plenary.busted — 단위 테스트

기존 detect_spec.lua 처럼 알고리즘 단위 검증에 적합. `io.open` / `string.format` 한 줄짜리 커맨드 같은 건 가성비 낮음.

```sh
nvim --headless -c "PlenaryBustedDirectory tests/ {minimal_init = 'tests/minimal_init.lua'}"
```

## 3. headless smoke test — CI / 일회성

명령 등록·동작을 통째로 한번 굴려본다. 임시 디렉토리에서 부수효과까지 확인.

```sh
cd /tmp/smoke && nvim --headless --clean -u NONE \
  -c "set rtp+=/path/to/plugin" \
  -c "lua require('plugin').setup()" \
  -c "MyCommand 21 17" \
  -c "qa"
cat .nvim.lua  # 결과물 검증
```

## 어떤 걸 쓸까

| 상황 | 선택 |
|---|---|
| 일상 개발 (수정 → 바로 써보기) | `dev = true` |
| 알고리즘·파서 등 순수 로직 | plenary.busted |
| 명령 등록·파일 IO·부수효과 통합 검증 | headless smoke |

## 참고
- [lazy.nvim · Developer setup](https://lazy.folke.io/configuration#dev)
- [plenary.nvim test_harness](https://github.com/nvim-lua/plenary.nvim/blob/master/TESTS_README.md)

## 2026-06-18 추가 — `dev = true` 실전 검증 흐름

jvm-env.nvim 의 신규 `:JvmEnvInit` 명령을 push 전에 1번 방식으로 검증한 실제 절차.

1. 글로벌 dev path 한 번 (영구 OK, 다른 머신엔 영향 없음):

   ```lua
   -- nvim/lazy/lua/config/lazy.lua
   require("lazy").setup({ ... }, {
     dev = { path = "~/Desktop/_zero/oss" },
   })
   ```

2. 검증할 플러그인 spec 에 `dev = true` 임시 토글 (회수 표시 주석 같이):

   ```lua
   {
     "clang-engineer/jvm-env.nvim",
     dev = true, -- TODO: 검증 후 회수
     ...
   }
   ```

3. 임시 cwd 에서 실 환경 검증:

   ```sh
   mkdir -p /tmp/jvm-env-real && cd /tmp/jvm-env-real && nvim
   ```
   nvim 안에서 `:Lazy reload jvm-env.nvim` → `:JvmEnvInit 21 17` → `:e .nvim.lua` 로 결과 확인.

4. OK 면 `dev = true` 만 회수, 외부 repo 커밋·푸시.

핵심: lazy.lua 의 `dev.path` 는 영구로 둬도 안전 (`dev = true` 가 켜진 spec 만 영향 받음). 검증 토글은 spec 한 줄이라 PR 직전에 손쉽게 회수 가능.

