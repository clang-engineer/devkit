---
layout: notes
title: "Neovim·LazyVim에서 플러그인 문서 보는 법"
date: 2026-07-03
categories: [neovim]
tags: [neovim, lazyvim, vimdoc, help, helptags]
---

플러그인 문서는 **vimdoc(`:help`)** 으로 본다. 정확한 태그를 모를 땐 **Tab 자동완성**으로 찾는 게 핵심.

## 기본 — `:help`

```vim
:help obsidian.nvim
:help obsidian<Tab>   " 태그 모를 때: 실제 help 태그가 후보로 뜸
```

- Tab에 아무것도 안 뜨면 = 그 플러그인이 vimdoc을 안 냄(README만 있음).
- 헬프 창 안 이동: `<C-]>` 태그 점프 / `<C-o>`·`<C-t>` 뒤로 / `:q` 닫기.

## 내용으로 검색

```vim
:helpgrep workspaces   " 모든 헬프 본문에서 매칭 → :cnext / :cprev 로 이동
```

## LazyVim 지름길 (picker)

- `<leader>sh` — Help Pages(헬프 태그 퍼지 검색). 제일 자주 씀.
- `<leader>sk` — Key Maps, `<leader>sm` — Man Pages.

## `:Lazy` UI (README 폴백)

```vim
:Lazy
```

플러그인 위에서 `<CR>` → 렌더된 **README + 그 플러그인 help 태그 링크**. vimdoc 없는 플러그인도 여기서 README를 봄.

## 함정 — 방금 설치해서 `:help`에 안 뜰 때

헬프태그가 아직 색인 안 된 것. `:Lazy sync` 후 재시작하거나 `:helptags ALL` 한 번 돌리면 잡힌다.
