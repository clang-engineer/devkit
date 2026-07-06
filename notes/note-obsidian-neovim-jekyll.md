---
layout: notes
title: "Obsidian을 Neovim·Jekyll 블로그에 얹기 — 마크다운 PKM의 실체와 제약"
date: 2026-07-03
categories: [neovim]
tags: [obsidian, obsidian-nvim, pkm, jekyll, markdown, lazyvim]
---

Obsidian은 독자 포맷이 아니라 **평문 `.md` 파일 기반 PKM 앱**이라, 이미 md+git으로 굴리는 Jekyll 블로그를 vault로 바로 열 수 있다. 단 링크 형식 때문에 백링크·그래프는 그냥은 안 산다.

## Obsidian의 정체

- **노트 = `.md` 파일 하나, vault = 그 파일들이 든 폴더.** 앱이 사라져도 아무 에디터로 열림(락인 0, 데이터 소유). 이게 존재 이유.
- 위키링크 `[[ ]]`·백링크·그래프 뷰·플러그인은 마크다운 자체가 아니라 **"마크다운 파일들 사이의 연결"에 얹는 레이어**.
- 순수 CommonMark이 아니라 Obsidian 방언(`[[wikilink]]`, 콜아웃 `> [!note]` 등)을 얹음.

## LazyVim / Neovim에서

- **LazyVim 기본 LazyExtras에 `obsidian`은 없다.** 관련은 `lang.markdown`(marksman·markdownlint·render-markdown)뿐. obsidian.nvim은 **직접 추가하는 플러그인 spec**.
- 원조 `epwalsh/obsidian.nvim`은 아카이브됨 → 유지되는 포크 **`obsidian-nvim/obsidian.nvim`** 사용.

```lua
-- lua/plugins/obsidian.lua
return {
  {
    "obsidian-nvim/obsidian.nvim",
    version = "*",
    ft = "markdown",
    dependencies = { "nvim-lua/plenary.nvim" },
    opts = {
      workspaces = { { name = "blog", path = "~/path/to/blog-repo" } },
    },
  },
}
```

- 명령은 `:Obsidian` 하나에 서브커맨드: `search`·`quick_switch`·`new`·`backlinks`·`tags`·`links`. 링크 위 `gf`/`<CR>`로 점프. `[[` 타이핑 시 노트명 자동완성.
- **그래프 뷰는 Obsidian 앱 전용.** Neovim에서 얻는 건 링크이동·백링크·검색이지 시각적 그래프가 아니다.

## Jekyll(Chirpy) 블로그에 얹을 때의 제약

- Chirpy 내부 링크는 `](/posts/<dir>/<date>-<slug>/)` **절대 사이트 URL**(빌드된 웹 주소)이라 디스크 파일을 안 가리킨다 → Obsidian이 노트 링크로 인식 못 함 → **백링크·그래프가 비어 있음**.
- 즉 지금 그대로면 **검색·편집·노트생성만** 되고, 백링크/그래프는 안 산다.
- 살리려면 링크를 `[[wikilink]]`로 바꿔야 하는데, Jekyll 빌드는 위키링크를 모름 → `jekyll-wikilinks` 류 변환 플러그인 필요(GitHub Actions 빌드라 커스텀 gem 가능). Chirpy 코어를 디지털가든 테마로 개조하는 건 비권장.

## 결론

이미 md+git+내부링크+Jekyll 호스팅이면 PKM·퍼블리싱을 사실상 자가구축한 상태. Obsidian은 **필수가 아니라 곁들임**(로컬 프리뷰·검색·백링크). 백링크/그래프가 정말 필요할 때만 링크 형식 변환을 결정한다.

관련: [[note-neovim-vs-emacs]]
