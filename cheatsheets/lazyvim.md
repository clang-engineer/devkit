# LazyVim Cheatsheet

> LazyVim의 키맵은 **활성 Extras 구성에 따라 달라진다.** 전체 키맵은 에디터 안에서 `<leader>sk`(Keymaps picker, 라이브 검색) 또는 `<leader>?`(현재 버퍼 which-key)로 보거나 공식 문서 <https://lazyvim.github.io/keymaps> 참고. 활성 Extra는 `:LazyExtras`로 확인.
>
> `<leader>` 기본값: `Space`
> 모드: `n`(Normal) `i`(Insert) `v`(Visual) `x`(Visual+Select) `o`(Operator) `t`(Terminal) `s`(Select) `c`(Cmdline)

## 목차

1. [Leader 그룹 인덱스](#leader-그룹-인덱스)
2. [기억할 만한 기본 키 (비-Leader)](#기억할-만한-기본-키-비-leader)
3. [Flash · mini-surround · Treesitter 모션](#flash--mini-surround--treesitter-모션)
4. [부록: 스톡 개념 레퍼런스](#부록-스톡-개념-레퍼런스)

---

## Leader 그룹 인덱스

`<leader>` prefix를 누르면 which-key 팝업이 하위 키를 보여준다. 개별 키를 전부 외울 필요 없이 그룹만 기억하면 된다.

| 키 | 그룹 | 용도 |
|---|---|---|
| `<leader>b` | Buffer | 버퍼 전환/닫기 |
| `<leader>c` | Code | LSP 액션, 포맷, 진단, rename |
| `<leader>d` | Debug | DAP (`dap.core` extra) |
| `<leader>e` / `E` | Explorer | 파일 탐색기 (Root Dir / cwd) |
| `<leader>f` | File/Find | 파일 열기·탐색, 터미널 |
| `<leader>g` | Git | lazygit, blame, browse, hunk |
| `<leader>l` / `L` | Lazy | 플러그인 매니저 / Changelog |
| `<leader>n` | Notifications | 알림 이력 |
| `<leader>q` | Quit/Session | 세션 저장/복원/종료 |
| `<leader>s` | Search | picker 검색 (grep·symbols·keymaps 등) |
| `<leader>u` | UI/Toggle | 옵션 토글 모음 |
| `<leader>w` | Window | 창 분할/닫기/줌 |
| `<leader>x` | Diagnostics | trouble.nvim (진단·quickfix·todo) |
| `<leader><tab>` | Tabs | 탭 관리 |

기타 단일 leader: `<leader><space>`(파일 찾기), `<leader>,`(버퍼), `<leader>:`(command history), `<leader>/`(live grep), `<leader>.`(스크래치 버퍼), `<leader>?`(현재 버퍼 키맵). AI·Debug·Database·Test 등은 대응 Extra가 켜져 있을 때만 그룹이 나타난다.

> **전체 키 목록은 정적 표로 옮기지 않는다.** `<leader>sk`(라이브 검색) 또는 <https://lazyvim.github.io/keymaps>가 항상 현재 설치 기준의 정확한 소스다.

---

## 기억할 만한 기본 키 (비-Leader)

키맵 인덱스에 없지만 일상적으로 손에 붙는 LazyVim 기본값. 나머지는 `<leader>sk`로 검색.

### 창·버퍼·줄

| 키 | 모드 | 설명 |
|---|---|---|
| `<C-h/j/k/l>` | n | 창 이동 (좌/하/상/우) |
| `<C-Up/Down/Left/Right>` | n | 창 크기 조절 (±2) |
| `<S-h>` / `<S-l>` | n | 이전 / 다음 버퍼 (`[b` / `]b`) |
| `<A-j>` / `<A-k>` | n, i, v | 현재 줄/선택 영역 아래로 / 위로 |
| `j` / `k` | n, x | count 없으면 `gj`/`gk` (화면 줄 단위) |
| `<C-s>` | i, x, n, s | 파일 저장 |
| `<Esc>` | i, n, s | 검색 하이라이트 제거 + snippet 중단 |
| `gco` / `gcO` | n | 아래 / 위에 주석 줄 추가 |

### LSP 점프

| 키 | 모드 | 설명 |
|---|---|---|
| `gd` | n | 정의로 이동 |
| `gr` | n | 참조 목록 |
| `gI` | n | 구현으로 이동 |
| `gy` | n | 타입 정의로 이동 |
| `gD` | n | 선언으로 이동 |
| `K` | n | hover 정보 |
| `gK` | n | 시그니처 도움말 |
| `<C-o>` / `<C-i>` | n | 점프 목록 뒤로 / 앞으로 (`gd` 후 복귀) |

### LSP 상태·재시작 (Neovim 0.12+)

Neovim 0.12는 내장 `:lsp` 명령을 제공한다. 이때 `nvim-lspconfig`는 예전 alias인 `:LspInfo`를 등록하지 않으므로 다음 명령을 쓴다.

```vim
:checkhealth vim.lsp   " 활성 client, attached buffer, root directory 확인
:lsp restart           " 현재 LSP client 재시작
:lsp restart vue_ls    " 특정 client만 재시작
```

`attached`는 서버와 버퍼가 연결됐다는 뜻이다. `gd` 실패가 곧 attach 실패는 아니며, 동적으로 생성된 심볼은 연결이 정상이어도 정의가 없을 수 있다.

### 진단·hunk·todo 이동 (`]`/`[` 짝)

| 키 | 설명 | 출처 |
|---|---|---|
| `]d` / `[d` | 다음/이전 진단 | vim |
| `]e` / `[e` | 다음/이전 에러 | lv |
| `]w` / `[w` | 다음/이전 워닝 | lv |
| `]q` / `[q` | 다음/이전 quickfix | vim |
| `]h` / `[h` | 다음/이전 git hunk | gitsigns |
| `]t` / `[t` | 다음/이전 todo 코멘트 | todo-comments |
| `]]` / `[[` | 커서 심볼의 다음/이전 참조 | lv (LSP documentHighlight) |

---

## Flash · mini-surround · Treesitter 모션

LazyVim이 기본 탑재하는 모션 플러그인.

### Flash (점프)

| 키 | 모드 | 설명 |
|---|---|---|
| `s` | n, x, o | 화면 아무 위치로 라벨 점프 |
| `S` | n, x, o | Treesitter 단위(함수/블록) 선택 점프 |
| `r` | o | Remote Flash |
| `R` | o, x | Treesitter Search |
| `<C-s>` | c | Cmdline에서 Flash Search 토글 |

### mini-surround (`gs*`)

| 키 | 모드 | 설명 |
|---|---|---|
| `gsa` | n, v | Add surrounding (예: `gsaiw"` = 단어를 `"`로 감싸기) |
| `gsd` | n | Delete surrounding |
| `gsr` | n | Replace surrounding |
| `gsf` / `gsF` | n | Find right / left surrounding |
| `gsh` | n | Highlight surrounding |
| `gsn` | n | Update `n_lines` 옵션 |

### Treesitter 텍스트오브젝트 이동

| 키 | 설명 |
|---|---|
| `]f` / `[f` | 다음/이전 함수 |
| `]c` / `[c` | 다음/이전 클래스 |
| `]a` / `[a` | 다음/이전 인자 |
| `<C-space>` | Treesitter Incremental Selection (확장) |

---

## 부록: 스톡 개념 레퍼런스

키맵 표에 안 들어가지만 알아두면 원리가 잡히는 Neovim·lazy.nvim 기본 개념 모음.

### Root Dir vs cwd

LazyVim은 열린 파일에서 가장 가까운 루트 마커(`.git > .editorconfig > package.json > Makefile > ...`)를 **Root Dir**로 잡고, 검색·grep·탐색기의 기본 범위로 쓴다. 대문자 변형(`<leader>fF`, `<leader>sG` 등)은 **cwd** 기준. monorepo 하위 `package.json`이 Root로 잡혀 검색 범위가 좁다 싶으면 cwd 버전을 쓰거나 `:pwd`/`:cd`로 확인. Root = cwd인 단순 프로젝트에선 차이 없음.

### 블랙홀 레지스터 `"_` (삭제 ≠ 잘라내기)

Vim은 삭제(`d`/`x`/`c`)도 무명 레지스터(`"`)에 넣어 yank한 내용을 덮어쓴다. `"_` 프리픽스로 지우면 아무 레지스터에도 안 들어감.

```vim
"_d    " 지운 내용이 어디에도 안 들어감 (yank 보존)
"_diw  " 단어 삭제하되 클립보드 유지
```

### lazy.nvim 플러그인 스펙 — 초기화 훅

플러그인 spec의 세 가지 setup 훅. `opts`는 `config`의 가장 흔한 패턴(`require(main).setup(opts)`)을 자동화한 sugar.

| 훅 | 시점/역할 | 형태 |
|---|---|---|
| `init` | 플러그인 로드 **전** 실행 (주로 vimscript 전역변수 세팅) | `init = function() vim.g.xxx = 1 end` |
| `opts` | 데이터만 선언 → lazy가 `require(main).setup(opts)` 대행 | `opts = { ... }` |
| `config` | setup 호출을 직접 작성 (키맵·autocmd 등 추가 로직 가능) | `config = function() require("mod").setup({...}) end` |

```lua
{ "author/plugin", opts = { foo = true } }                                         -- 선언형
{ "author/plugin", config = function() require("mod").setup({ foo = true }) end }   -- 명령형
{ "rose-pine/neovim", name = "rose-pine", opts = {} }                              -- name 명시
```

> `main`은 setup할 모듈명, `name`은 플러그인 식별자·설치 디렉토리명. 둘 다 repo 마지막 세그먼트에서 추론되므로 repo명이 모듈명·식별자와 어긋나면 명시 필요 (예: `rose-pine/neovim` → 식별자가 `neovim`으로 잡히므로 `name = "rose-pine"`).

### 프로젝트 로컬 설정 (`.nvim.lua` / `.exrc`)

Neovim은 옵션 활성화 + 파일 trust **두 가지가 모두** 충족돼야 로컬 설정을 로드한다.

```lua
-- ~/.config/nvim/lua/config/options.lua
vim.o.exrc = true
```

빈 버퍼에서 `:trust`만 치면 `cannot update trust file: buffer is not associated with file` 에러. 파일을 열고 실행:

```vim
:e .nvim.lua
:trust
" 또는
:trust ++file=.nvim.lua
```

성공 시 `~/.local/state/nvim/trust`에 해시 등록. 로드 확인:

```vim
:lua print(vim.secure.read('.nvim.lua'))   " nil → trust 안 됨
:echo &exrc                                 " 1이어야 함
```

소유자/권한이 본인이어야 함 (`vim.secure`는 타 사용자 소유 거부). 심볼릭 링크면 실제 파일도 동일 조건.

### 플러그인 문서 보기 (vimdoc)

플러그인 문서는 `:help`(vimdoc)로 본다. 태그를 모를 땐 **Tab 자동완성**이 핵심.

```vim
:help obsidian.nvim
:help obsidian<Tab>      " 태그 모를 때: 실제 help 태그 후보가 뜸 (안 뜨면 vimdoc 없음, README만)
:helpgrep workspaces     " 헬프 본문 전체 검색 → :cnext / :cprev 로 이동
:helptags ALL            " 방금 설치해 :help에 안 뜰 때 (또는 :Lazy sync 후 재시작)
```

- 헬프 창 내부: `<C-]>` 태그 점프 / `<C-o>`·`<C-t>` 뒤로 / `:q` 닫기.
- picker 지름길: `<leader>sh`(Help Pages), `<leader>sk`(Key Maps), `<leader>sm`(Man Pages).
- `:Lazy`에서 플러그인 위 `<CR>` → 렌더된 README + help 태그 링크 (vimdoc 없는 플러그인 폴백).

### VSCode 스니펫 추가 (blink.cmp 자동 로드)

LazyVim 기본 보완 엔진은 [blink.cmp](https://github.com/Saghen/blink.cmp). 그 스니펫 소스가 시작 시 `~/.config/nvim/snippets/`를 **규약으로 자동 스캔**한다 — Lua 배선 0. VSCode 스니펫 포맷(`package.json` + 언어별 `.json`) 그대로 놓으면 끝.

```
~/.config/nvim/snippets/
├── package.json    # 어떤 .json을 어떤 언어에 물릴지 등록
└── cpp.json        # 언어별 스니펫 정의
```

```jsonc
// package.json — contributes.snippets 배열에 언어별 파일 등록
{ "contributes": { "snippets": [ { "language": "cpp", "path": "./cpp.json" } ] } }

// cpp.json — "이름": { prefix, body, description }
{ "for loop": {
  "prefix": "fori",
  "description": "인덱스 for",
  "body": [ "for (int ${1:i} = 0; $1 < ${2:n}; $1++) {", "\t$0", "}" ]
} }
```

- **body 문법**: `$1`,`$2` = Tab 정지점(같은 번호는 동시 편집) / `${1:default}` = 기본값 있는 placeholder / `$0` = 최종 커서 / `\t` = 리터럴 들여쓰기 탭.
- **쓰는 법**: 해당 언어 파일에서 insert 모드로 `prefix` 입력 → blink 완성 메뉴에서 확정 → body 펼침, `Tab`으로 정지점 이동.
- **반영**: 스니펫 캐시하므로 편집 후 **nvim 재시작**. 새 언어는 `<lang>.json` 추가 + `package.json`에 한 줄 등록.
- blink의 스캔 경로는 `search_paths` 기본값이 `stdpath("config")/snippets` — 즉 위 규약은 blink stock 동작이지 LazyVim이 따로 얹은 게 아니다.
