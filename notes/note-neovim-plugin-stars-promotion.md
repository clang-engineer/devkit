---
layout: notes
title: "Neovim 플러그인 스타 늘리는 채널 (ROI순)"
date: 2026-07-06
categories: [neovim, opensource]
tags: [neovim-plugin, reddit, promotion, awesome-neovim, dotfyle]
---

Neovim 플러그인 스타는 **니치 크기 × 노출**로 결정된다. 발행([[flow-nvim-plugin-publication]]) 이후 노출을 늘리는 채널을 ROI 순으로.

## 채널 (효과 큰 순)

1. **r/neovim (reddit.com/r/neovim) "Show and tell" 게시** — 압도적 1위. Neovim 플러그인 스타의 대부분이 여기서. 나머지 다 합친 것보다 세다.
2. **README 상단 데모 GIF** — 스타는 첫 화면에서 결정. 움직이는 데모 = 전환율 몇 배. ([[flow-vhs-nvim-demo]])
3. **awesome-neovim PR** (`rockerBOO/awesome-neovim`) — 카테고리 맞춰 한 줄 등록. 꾸준한 롱테일 유입.
4. **GitHub Topics** — `neovim`, `neovim-plugin`, `lua` + 도메인 태그. 안 달면 GitHub 내 검색에 거의 안 잡힘.
5. **dotfyle.com 등록** — Neovim 플러그인 디렉토리. 직접 등록하면 확실.

## r/neovim 게시 요령

- **flair를 `Plugin`으로** 지정 (서브레딧마다 규칙 있음).
- **GIF는 본문에 직접 업로드**(드래그). Reddit이 GitHub raw 링크보다 인라인 이미지를 잘 렌더.
- **톤이 핵심**: r/neovim은 저품질 자기홍보를 싫어함. "스타 주세요" X. **"이런 pain point를 풀려고 만들었다 + 데모 + 피드백 환영"** 순서로 가치를 먼저 보여줄 것.
- 본문 구조: 문제 상황 → 해결(플러그인 한 줄 요약 + 코드) → 안 하는 것 명시 → 데모 GIF → repo 링크 → "experimental, feedback welcome (특히 덜 테스트된 OS)".
- 노출 시간대: 미국 오전(한국 밤~새벽).

## 현실 체크

- 니치가 작으면(예: "Neovim × JVM 개발자" 교집합) 수천 스타는 어렵다. 위 채널 다 해도 **수십~수백 대**가 현실적.
- 그래도 1번(r/neovim)이 지렛대. 데모 GIF 하나 잘 뽑아 올리는 게 단일 최대 액션.

## 참고

- [[flow-nvim-plugin-publication]] — 발행 흐름 (Topics·awesome-neovim 체크리스트 포함)
- [[flow-vhs-nvim-demo]] — 데모 GIF 제작
