---
layout: notes
title: "Telescope vs fzf: 퍼지 파인더의 경계선"
date: 2026-06-20
categories: [neovim]
tags: [telescope, fzf, fzf-lua, plenary, ripgrep]
---

fzf는 Neovim 바깥에서도 도는 독립 실행 CLI 바이너리이고, Telescope는 Neovim API에 얹힌 순수 Lua 플러그인이다. "둘 다 파일 검색된다"는 겹치는 기능 하나일 뿐, 본질은 **어디서 도느냐(OS 전역 vs 에디터 내부)**와 **무엇을 검색 대상으로 넘기느냐**가 다르다.

## 둘의 정체가 다르다

- **fzf** — Go로 작성된 독립 실행 프로그램. 셸(`Ctrl-R` 히스토리, 파이프 입력), Vim, tmux 어디서든 쓴다. Neovim이 없어도 동작하는 게 핵심.
- **Telescope** — Neovim 전용 플러그인. Lua로 작성됐고 Neovim API에 깊이 통합돼 있다. 파일뿐 아니라 LSP 심볼, diagnostics, git, buffer, treesitter 같은 **에디터 내부 데이터**를 picker로 다룬다. preview 창, 결과 정렬, 키맵 커스터마이징이 강력하다.

## "파일 검색 모듈"이 아니라 퍼지 매칭 엔진이다

둘 다 파일 검색은 되지만 정확히는 **fuzzy finder(퍼지 매칭 엔진)**이고, 파일 검색은 여러 용도 중 하나일 뿐이다. 핵심은 **무엇을 입력으로 넘기느냐**.

- fzf는 그냥 "줄 목록을 받아 퍼지 매칭해주는 엔진"이다. 파일 목록을 넣으면 파일 검색, 셸 히스토리를 넣으면 히스토리 검색, `git branch` 출력을 넣으면 브랜치 검색. 검색 대상이 뭐든 상관 안 한다.
- Telescope도 같은 구조인데, 대신 Neovim 안의 것들(LSP 심볼, diagnostics, buffer 등)을 검색 대상으로 쉽게 꽂을 수 있게 picker들이 미리 만들어져 있다.

> 비유하면 둘 다 물을 끓일 수 있다고 전기포트와 가스레인지가 같은 물건은 아니다. 겹치는 기능 하나로 보면 같아 보여도, fzf는 OS 전역 도구, Telescope는 에디터 내장 데이터까지 다루는 통합 도구라는 게 본질.

## 핵심 트레이드오프

| 축 | fzf | Telescope |
|---|---|---|
| 범위 | OS 전역 | Neovim 내부 |
| 언어/통합 | 외부 바이너리 | Lua 네이티브 |
| 속도 | 대형 저장소에서 빠른 경향(네이티브) | 상대적으로 느림 |
| 확장성 | 범용 | Neovim 생태계(LSP 등) 연동 압도적 |

## 어디까지가 Neovim 내부이고 어디부터 외부 프로세스인가

Telescope는 순수 Lua지만 혼자 다 하는 게 아니다. 경계가 둘로 나뉜다.

- **Lua 레벨 의존성 (Neovim 내부)** — `plenary.nvim`이 유일한 진짜 의존성. 비동기 처리(async/await), job 제어, 경로 처리, 파일시스템 함수 등 Telescope의 거의 모든 내부 동작이 그 위에 올라간다. 없으면 Telescope 자체가 로드되지 않는다. `nvim-web-devicons`는 아이콘용 선택 의존성.
- **런타임에 부르는 시스템 바이너리 (외부 프로세스)** — picker별로 외부 CLI를 spawn 한다. `live_grep`/`grep_string`은 **ripgrep(rg)**를 내부적으로 호출(사실상 필수급), 파일 검색은 **fd**를 빠른 대안으로, git picker는 **git**을 부른다. 이건 Lua 의존성이 아니라 시스템 도구다.

즉 Telescope는 "Lua로 짠 picker/preview 프레임워크(내부) + 무거운 검색은 외부 바이너리에 위임" 구조다. fzf가 통째로 외부 프로세스인 것과 대비된다.

## 둘을 섞는 선택지

- **telescope-fzf-native.nvim** — Telescope의 정렬 알고리즘을 fzf의 C 구현으로 바꿔 속도를 끌어올리는 확장. C로 컴파일되므로 `make`가 필요. picker UI는 Telescope 그대로, 매칭만 빨라진다.
- **fzf-lua** — fzf 바이너리를 Telescope처럼 Neovim picker로 감싼 플러그인. fzf의 속도 + 에디터 통합을 둘 다 가져간다. 가볍고 빠른 쪽을 원할 때 매력적.

kickstart.nvim처럼 정리하는 흐름이면 Telescope + fzf-native 조합이 무난하고, plenary + fzf-native + ripgrep이 기본 조합이다.
