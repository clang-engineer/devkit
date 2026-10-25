# LazyVim Cheatsheet

> LazyVim의 키맵은 **활성 Extras 구성에 따라 달라진다.** 전체 키맵은 에디터 안에서 `<leader>sk`(Keymaps picker, 라이브 검색) 또는 `<leader>?`(현재 버퍼 which-key)로 보거나 공식 문서 <https://lazyvim.github.io/keymaps> 참고. 활성 Extra는 `:LazyExtras`로 확인.
>
> `<leader>` 기본값: `Space`
> 모드: `n`(Normal) `i`(Insert) `v`(Visual) `x`(Visual+Select) `o`(Operator) `t`(Terminal) `s`(Select) `c`(Cmdline)

## 키맵을 읽는 구조

```text
Neovim 기본 편집 문법
      │
LazyVim (Plugin + 기본 설정)
      │
<leader> (기본 Space)
  ├─ f : file 관련
  ├─ b : buffer 관련
  ├─ g : Git 관련
  ├─ s : search 관련
  └─ w : window 관련
```

`<leader>ff`처럼 **접두 키 → 기능 그룹 → 동작** 순으로 읽는다. 하지만 실제 키는 설치된 Plugin·Extras·사용자 설정에 따라 달라진다. `<leader>sk`로 현재 Keymap을 검색하고 `:LazyExtras`로 활성 Extras를 확인한다. 전체 키 목록을 외우기보다 그룹을 먼저 익힌다.

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

## 동작을 추론할 때 필요한 경계

### Root와 cwd

```text
Root : 프로젝트 경계 (검색·탐색 범위에 사용될 수 있음)
cwd  : Neovim의 현재 작업 디렉터리 (:pwd)
```

프로젝트 검색 범위가 예상보다 좁다면 `:pwd`와 Root 판정 설정을 확인한다. LazyVim의 키맵은 Root 기준과 cwd 기준을 구분할 수 있으며, 실제 매핑은 `<leader>sk`에서 확인한다.

### Vim 명령과 Plugin 명령

```text
Vim Register       → "_diw : 단어 삭제, 블랙홀 레지스터 사용
lazy.nvim spec     → init / opts / config
Neovim Help        → :help / :helpgrep / :helptags
프로젝트 로컬 설정 → 'exrc' 옵션 + 파일 신뢰 확인
Snippet            → completion engine + snippet source + 파일 형식
```

- `"_`는 **블랙홀 레지스터**다. 삭제가 기본 레지스터를 덮는 것이 싫을 때 `"_diw`처럼 명시한다. 편집 문법은 [Vim 치트시트](vim.md)에서 다룬다.
- `init`은 Plugin 로드 전 실행할 코드, `opts`는 설정값, `config`는 로드 시 설정 동작을 지정한다. 자세한 병합·로딩 규칙은 [lazy.nvim 공식 문서](https://lazy.folke.io/spec).
- 프로젝트의 `.nvim.lua` 같은 로컬 설정은 `exrc` 활성화와 신뢰 정책을 확인해야 한다. [Neovim 공식 도움말](https://neovim.io/doc/user/options.html#'exrc')
- 도움말 태그는 `:help {tag}`, 본문 검색은 `:helpgrep {pattern}`을 사용한다. 스니펫 디렉터리·자동 로드 여부는 설치한 completion/snippet 플러그인 설정에 따라 확인한다.

**원칙:** 이 문서는 LazyVim 키맵의 구조를 설명한다. Neovim 내부 API·설정 플러그인의 전체 사용법은 공식 문서와 개별 주제 문서에 맡긴다.
