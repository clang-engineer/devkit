---
layout: notes
title: lazy.nvim 플러그인 초기화 방식 — opts vs config vs init
date: 2026-06-19
categories: [nvim]
tags: [neovim, lazy.nvim, plugin, blackhole-register]
---

> lazy.nvim 의 플러그인 setup 호출은 `opts`(선언형)와 `config`(명령형)로 나뉘고, `opts` 는 `config` 의 가장 흔한 패턴을 자동화한 설탕(sugar)이다.

## 세 가지 훅

| 훅 | 시점/역할 | 형태 |
|---|---|---|
| `init` | 플러그인 로드 **전** 실행. 주로 vimscript 전역변수 세팅 | `init = function() vim.g.xxx = 1 end` |
| `opts` | 데이터만 선언 → lazy 가 `require(main).setup(opts)` 대신 호출 | `opts = { ... }` |
| `config` | 호출 코드까지 직접 작성. setup 외 키맵·autocmd 도 가능 | `config = function() require("mod").setup({...}) end` |

핵심: `opts` 를 주면 lazy 의 **기본 `config` 함수**가 실행되고, 그게 바로 `require(main).setup(opts)` 다. 그래서 둘은 내부적으로 같은 지점으로 수렴한다.

```lua
-- 선언형: lazy 가 setup 호출 대행
{ "author/plugin", opts = { foo = true } }

-- 명령형: 내가 직접 호출 (+ 추가 로직 가능)
{ "author/plugin", config = function() require("mod").setup({ foo = true }) end }
```

## 함정: `main` 모듈명 자동 추론

`opts` 방식은 lazy 가 호출할 모듈명(`main`)을 **repo 이름에서 추론**한다. repo 이름과 실제 `require` 모듈명이 다르면 조용히 setup 이 안 불린다.

- 예: repo `nvim-nocut` ↔ 실제 모듈 `no-cut` (하이픈 위치가 다름) → 추론 어긋날 위험.
- 해결: `main` 을 명시하거나, 애초에 `config` 함수로 모듈명을 직접 적는다.

```lua
{ "maarutan/nvim-nocut", main = "no-cut", opts = {} }  -- main 명시로 안전
```

## 부수 학습: setup() 자체가 필수인 플러그인

`plugin/` 자동 로드 디렉토리가 없고 모든 동작이 `setup()` 안에서만 일어나는 플러그인은, setup 을 안 부르면 설치만 하고 효과 0. (`opts = {}` / 빈 `setup()` 이라도 호출 자체는 필요.)

확인법: 플러그인 디렉토리에 `plugin/*.lua` 가 있으면 자동 실행, 없으면 setup 수동 호출 필수.

## 부수 학습: 블랙홀 레지스터로 삭제 ≠ 잘라내기

`nvim-nocut` 의 원리. Vim 은 삭제(`d`/`x`/`c`)가 곧 잘라내기라 무명 레지스터(`"`)에 들어가고, yank(`y`)도 같은 `"` 를 써서 복사본이 날아간다.

```vim
yiw   " 단어 A 복사 (" = A)
diw   " 단어 B 삭제 (" = B 로 덮어써짐)
p     " A 기대했지만 B 나옴
```

정공법: 블랙홀 레지스터 `"_` 프리픽스. `"_d` 는 지운 내용이 아무 데도 안 들어간다. nocut 은 이 프리픽스를 `d/x/c/...` 에 자동으로 매핑한다. `:verbose nmap c` 로 `"_c` 매핑 확인 가능.

대가: `d` 로 잘라 `p` 로 옮기는 cut&paste 관용구가 막힘 → 이름 있는 레지스터(`"add`→`"ap`)나 예외로 둔 `Y` 로 우회.

## 참고
- [lazy.nvim · Spec setup](https://lazy.folke.io/spec)
- `:h registers` (블랙홀 `"_`)
