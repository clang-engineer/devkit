---
layout: notes
title: "Neovim 배포판이란 무엇인가 — LazyVim과 Kickstart.nvim의 철학 차이"
date: 2026-06-06
categories: [neovim]
tags: [lazyvim, kickstart, distro, lazy-nvim, config]
---

LazyVim은 "플러그인 덩어리"가 아니라 Neovim **배포판(distribution)**이다. 배포판이 무엇이고, 왜 LazyVim은 통째로 상속받는 프리셋인 반면 Kickstart.nvim은 읽고 소유하는 단일 파일인지를 구분하면, Neovim 설정을 "직접 조립하는 것"과 "남의 프리셋을 물려받는 것"의 경계가 보인다.

## 배포판(distribution)이란 개념

Neovim 0.5(2021)에서 Lua 설정이 가능해진 뒤 등장한 세대의 개념이다. 순정 Neovim은 빈 그릇에 가깝고, 사용자가 `init.lua`부터 플러그인 매니저·LSP·자동완성·Treesitter를 직접 엮어야 IDE급 환경이 된다. **배포판은 그 조립 결과를 미리 선별·설정해서 한 벌로 묶어 배포한 것**이다.

핵심은 배포판이 단순한 플러그인 묶음이 아니라는 점이다. 플러그인을 **어떻게 로드하고(lazy loading) 어떻게 설정할지에 대한 레이어/규칙**까지 포함한다. 이 "규칙 레이어"가 있어야 배포판이라 부른다.

대표적인 distro 계열:

- **LazyVim** — folke의 lazy.nvim 기반. 현재 가장 활발히 유지되는 축.
- **AstroNvim** — 기능 풍부한 IDE형. LazyVim과 가장 직접적인 경쟁.
- **NvChad** — 빠른 시작 속도와 UI 테마가 강점.
- **LunarVim** — 한때 인기였으나 유지보수 정체.

## LazyVim이 플러그인 덩어리가 아닌 이유

이름이 비슷해서 헷갈리지만 둘은 별개다:

- **lazy.nvim** — 플러그인 매니저. LazyVim 없이도 독립적으로 동작하는 **도구**. 순정 구성에서도 사실상 표준.
- **LazyVim** — lazy.nvim 위에 올라가는 **프리셋 배포판**. 미리 선별·설정된 플러그인 + 기본 키맵 + 옵션 + 자체 설정 프레임워크.

LazyVim을 배포판으로 만드는 건 다음 같은 "레이어"다:

- `LazyVim.config` — 중앙 설정 진입점
- `extras` 모듈 — 언어별/기능별 묶음을 `:LazyExtras`로 토글
- override 구조 — `lua/plugins/`에 파일만 얹으면 기본값을 덮어씀

그래서 LazyVim은 LSP·nvim-cmp·mini.* 묶음·키맵·진단 표시 포맷을 **통째로 끌고 들어오는** 패키지다. 커스터마이징하는 순간 "잘 세팅된 Neovim 한 벌"이 아니라 "프레임워크"로서의 성격을 이해해야 한다.

## LazyVim의 override 구조는 어디서 왔나

직접 lazy.nvim만으로 구성해도 보통 이런 디렉토리 구조를 잡는다:

```
~/.config/nvim/
├── init.lua
└── lua/
    ├── config/      # options, keymaps, autocmds
    └── plugins/     # 플러그인별 설정 파일
```

`init.lua`에서 lazy.nvim을 부트스트랩하고 `{ import = "plugins" }`로 `lua/plugins/`를 자동 로드하면, LazyVim과 거의 같은 모듈식 구조가 된다. 사실 **LazyVim의 `lua/plugins/` override 방식이 이 순정 패턴을 그대로 가져온 것**이다. LazyVim의 플러그인 spec 문법도 결국 lazy.nvim 문법이라, override 파일 상당수는 순정 구성에 그대로 재활용된다 — 다만 `opts`가 LazyVim의 기본 opts를 머지하는 걸 전제한 부분은 손봐야 한다.

## LazyVim vs Kickstart.nvim — 철학의 분기

같은 lazy.nvim을 밑에 깔지만 지향이 정반대다.

**LazyVim — 설정을 통째로 제공(configure *around* it)**
- opinionated 기본값, 플러그인 추상화 레이어(`opts`/`keys` spec 머지), 대규모 프리컨피그 생태계.
- 코어를 소유하지 않고 그 **주변을** 설정한다. batteries-included지만 나와 실제 설정 사이에 "magic"이 낀다.
- 본질이 **남이 정해둔 의존성·기본값을 통째로 상속받는** 구조. 그래서 "의존성이 싫다"가 이유라면 벗어야 할 대상은 lazy.nvim이 아니라 LazyVim 쪽이다.

**Kickstart.nvim — 학습용 단일 파일(read and own)**
- TJ DeVries가 만든, 주석이 빽빽한 단일 `init.lua`(수백 줄). 프레임워크가 아니라 **읽고 소유하도록** 만든 출발점.
- 포크해서 직접 편집한다. 각 줄이 무엇을 하는지 정확히 배우게 된다.
- 최소 플러그인 셋(LSP, Treesitter, Telescope, 자동완성 + 약간의 QoL)만 검증된 골격으로 들어있다.

정리하면 트렌드가 "LazyVim 다음 세대"로 넘어간 게 아니라, **distro를 쓸지 말지의 취향 분기**에서 두 흐름이 공존한다:

- 편하게 IDE급 환경을 바로 쓰고 싶다 → LazyVim (여전히 주류)
- 한 줄씩 통제하고 이해하며 짜고 싶다 → Kickstart.nvim

## LazyVim을 벗으면 직접 책임져야 하는 것

LazyVim이 가려주던 부분들이 그대로 드러난다:

- **LSP 기본 셋업** — `nvim-lspconfig` + `mason` 연결, on_attach 키맵, capabilities를 cmp와 연결
- **자동완성** — `nvim-cmp`(또는 blink.cmp) 소스·키맵 직접 구성
- **mini.* 묶음** — mini.pairs, mini.surround, mini.ai 등에서 필요한 것만 골라 명시
- **키맵 전체** — `<leader>` 기반 매핑이 다 사라지므로 손맛대로 다시 깜
- **진단/UI 디테일** — 진단 표시 포맷, statuscolumn, which-key 그룹 라벨

이 목록이 곧 "LazyVim이 배포판으로서 실제로 해주던 일"의 정체다. 벗는 방법은 두 갈래인데, 의존성을 싫어하는 성향이면 **Kickstart에서 새로 시작**하는 쪽이 낫다. 기존 LazyVim 설정을 포크해 `import` 줄만 제거하는 방식은 기존 커스터마이즈를 살리지만, 결국 "무엇이 LazyVim 덕분에 돌아가던 건지"를 역추적하게 되어 오히려 블랙박스를 더 들여다보게 된다.
