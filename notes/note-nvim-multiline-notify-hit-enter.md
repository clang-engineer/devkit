---
layout: notes
title: "Neovim 여러 줄 메시지와 hit-enter 프롬프트 (cmdheight)"
date: 2026-07-06
categories: [neovim]
tags: [neovim, vim-notify, cmdheight, hit-enter]
---

2줄 이상의 메시지(`vim.notify`·`echomsg` 등)를 출력하면 Neovim이 **"Press ENTER or type command to continue"** hit-enter 프롬프트를 띄운다. 메시지 줄 수가 `cmdheight`(명령줄 영역 높이)를 넘으면 화면이 밀리는 걸 막으려 확인을 요구하는 것. `cmdheight`를 메시지 줄 수 이상으로 키우면 프롬프트 없이 그대로 표시된다.

## 왜

- 기본 `cmdheight = 1` → 명령줄 영역이 1줄뿐.
- 알림/메시지가 2줄이면 1줄 영역을 넘어서므로, Neovim이 위쪽 내용을 가리기 전에 hit-enter로 멈춘다.
- 기본 `vim.notify` 핸들러는 사실상 `echomsg`라 이 규칙을 그대로 탄다. (noice.nvim·nvim-notify 같은 플러그인을 쓰면 floating window로 빠져서 이 프롬프트가 안 뜬다.)

## 해결

```lua
-- 2줄 알림이 hit-enter 프롬프트 없이 표시되게
vim.o.cmdheight = 2
```

- 플러그인 작성 시: 최소 config 사용자(알림 플러그인 없음)에게는 여러 줄 `vim.notify`가 hit-enter를 유발한다는 점을 염두. 짧은 한 줄 메시지를 선호하거나, 상세 내용은 별도 버퍼/`:messages`로.
- 데모 녹화(VHS 등)에서 이 프롬프트가 화면을 지저분하게 만들면 `cmdheight`를 키워 회피. → [[flow-vhs-nvim-demo]]

## 참고

- `:help hit-enter`
- `:help 'cmdheight'`
