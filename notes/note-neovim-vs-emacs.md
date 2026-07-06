---
layout: notes
title: "LazyVim 사용자가 본 Emacs — 에디터가 아니라 Lisp 런타임"
date: 2026-06-21
categories: [editor]
tags: [emacs, neovim, lazyvim, elisp, evil-mode]
---

Vim과 Emacs의 차이는 단축키가 아니라 "에디터를 무엇으로 보느냐"에서 갈린다. Vim은 텍스트를 정밀하게 다루는 날카로운 도구고, Emacs는 Elisp 위에 에디터가 얹힌 확장 가능한 런타임이다.

## 근본 차이: 모달 에디터 vs Lisp 런타임

Vim의 핵심은 "모달 에디터"다. 반면 Emacs의 핵심은 에디터가 아니라 **Elisp(Emacs Lisp)로 돌아가는 확장 가능한 런타임**이다. "Lisp 인터프리터 위에 에디터가 얹힌 OS"에 가까워서 메일·git·파일관리·터미널·일정관리(org-mode)까지 전부 그 안에서 돌린다.

모달 편집조차 Emacs의 정체성이 아니다. `evil-mode`를 켜면 `hjkl`, `dd`, `ciw`, `:wq`, 비주얼 모드, 매크로까지 Vim이 거의 그대로 재현된다. 그래서 Vim 손버릇이 있는 사람은 순정 Emacs가 아니라 evil이 기본 탑재된 Doom Emacs나 Spacemacs로 시작한다.

## Doom Emacs는 Neovim이 아니다 — 포크 vs 설정 레이어

체감상 `LazyVim ↔ Doom Emacs` 비유는 맞다. 둘 다 "복잡한 설정을 미리 다 해둔 배포판"이다. 하지만 아래 깔린 구조가 다르다.

- **Neovim은 Vim의 포크(별도 구현체)** 다. 엔진 자체가 갈라져 나왔다.
- **Doom Emacs는 Emacs의 포크가 아니다.** 순정 Emacs 엔진 위에 패키지 묶음 + 기본 설정 + evil 세팅을 얹는 **설정 프레임워크**일 뿐이다.

즉 대응 관계는 `엔진(Neovim/Emacs)` + `배포판(LazyVim/Doom)` + `플러그인 매니저(lazy.nvim / straight.el·use-package)`로 정리된다. 만지는 설정 언어는 Lua(LazyVim)냐 Elisp(Doom)냐로 갈린다.

## 단축키: 편집은 같고 운영 단은 다르다

Doom은 evil 기본 탑재라 **편집 단 키는 Vim과 거의 동일**하다. 리더 키 체계도 Doom이 의도적으로 Spacemacs/LazyVim식 `<Space>` 레이아웃을 따라 만들어서 `<Space>ff`, `<Space>gg` 같은 게 꽤 겹친다. 진짜 이질적인 건 evil이 덮지 않는 순정 Emacs 키다 — `C-x C-f`(파일 열기), `C-g`(취소), `M-x`(명령 실행). 특히 `M-x`는 커맨드 팔레트 감각으로 가장 자주 만난다.

## 왜 Emacs 유저는 Vim 편집 우위를 알면서도 안 가나

편집 효율이 그들의 1순위 가치가 아니기 때문이다. 코드 → git → 할일 → 메일을 **같은 버퍼 시스템·같은 키바인딩·같은 검색 안에서** 처리하면 도구 사이 맥락 전환 비용이 사라진다. 편집은 evil로 챙기면서 통합까지 얻는 트레이드오프다. 남는 이유는 대략 셋이다.

- **magit** — git 인터페이스의 끝판왕이라 불린다.
- **org-mode** — 노트·할일·일정·문헌·개인재무까지 평문 텍스트 하나로 굴리는 시스템. Neovim에 포팅 시도(nvim-orgmode)가 있어도 원본만큼 안 나온다.
- **런타임 재프로그래밍** — 실행 중인 상태로 자기 자신을 다시 프로그래밍한다. 마음에 안 드는 동작을 그 자리에서 Elisp 몇 줄로 고쳐 즉시 반영. 그리고 Emacs는 GNU/자유소프트웨어 운동의 정신적 본진이라는 이념적 애착도 있다.

정리하면 Vim 유저는 "최고의 칼"을, Emacs 유저는 "내가 완전히 지배하는 작업장"을 원한다.

## 왜 Vim 생태계가 더 큰가 (확장성의 깊이 ≠ 생태계의 넓이)

Emacs가 기술적으로 더 확장 가능한데도 생태계는 더 작다. 이유는 겹쳐 있다.

1. **어디에나 깔려 있다** — `vi`는 사실상 모든 유닉스/리눅스에 기본 탑재(POSIX). SSH로 서버 들어가면 싫든 좋든 Vim 기초를 익히게 된다. 강제 노출 사용자 수가 저변 크기를 결정한다.
2. **점진적 진입** — Vim은 종료만 배워도 일단 쓰고 문법을 조금씩 늘린다. Emacs는 제대로 쓰려면 Elisp 벽을 넘어야 해서 중도 이탈이 많다.
3. **Neovim의 세대교체(2014)** — VimScript 대신 Lua 채택으로 신규 기여자가 폭발했고, 비동기 + 안정 API로 LSP·treesitter가 매끄럽게 붙었으며, 내장 LSP로 VS Code 이탈자를 흡수했다. telescope·snacks·mini.nvim이 이 흐름에서 터졌다. **Emacs엔 이만한 리부트가 없었다.**

데이터로도 Vim 24.3% + Neovim 14%로 Emacs(8~9%)의 4배 이상이다(2025 Stack Overflow 설문). Emacs는 소수파이자 하향 추세지만, "에디터가 아니라 하나의 컴퓨팅 라이프스타일"을 원하는 견고한 충성층으로 유지된다.

## PKM은 Neovim에도 있다 — 통합 시스템 vs 조합

"org-mode 대체재가 없다"는 정확히는 "org-mode만큼 깊은 **단일 통합 시스템**이 없다"는 뜻이다. 기능별 도구로 보면 Neovim에도 obsidian.nvim, nvim-orgmode, marksman(LSP), markview.nvim 등이 풍부하다. 차이는 org-mode가 노트·할일·아젠다·문헌·코드실행(org-babel)을 한 몸통으로 통합한 반면, Neovim은 여러 플러그인을 **조합**한다는 점이다. Vim 진영다운 조합형 사고에는 오히려 후자가 자연스럽다.

실용적 첫걸음은 Emacs 전면 이주가 아니라 obsidian.nvim이다. Obsidian은 로컬-퍼스트 평문 마크다운 기반이라 같은 파일을 Neovim으로도 연다 — 칼(Neovim)은 그대로 두고 지도(그래프 뷰·백링크)만 얻는 공존 구조다.
