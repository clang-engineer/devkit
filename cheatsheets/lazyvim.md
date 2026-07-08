# LazyVim Cheatsheet

> ⚠️ LazyVim 키맵은 **활성 Extras 구성에 따라 달라진다.** 본 문서는 아래 기준 환경에서 정리됨. 자신의 설치에서 해당 Extra가 꺼져 있으면 그 키맵은 동작하지 않는다. `:LazyExtras`로 본인 환경 확인 가능.

> `<leader>` 기본값: `Space`
> 모드: `n`(Normal) `i`(Insert) `v`(Visual) `x`(Visual+Select) `o`(Operator) `t`(Terminal) `s`(Select) `c`(Cmdline)
> 출처: `vim` = Vim 내장, `lv` = LazyVim, `플러그인명` = 해당 플러그인
> 기준 환경 (Extras): `ai.copilot`, `ai.copilot-chat`, `coding.mini-comment`, `coding.mini-surround`, `coding.yanky`, `dap.core`, `editor.outline`, `ui.treesitter-context`, `lang.docker`, `lang.java`, `lang.kotlin`, `lang.markdown`, `lang.sql`, `lang.typescript`, `lang.yaml`

## 목차

1. [Leader 그룹 인덱스](#leader-그룹-인덱스) — `<leader>` prefix 요약
2. [그룹별 상세](#leadera--alternate-vim-projectionist--ai) — `<leader>a` ~ `<leader><tab>`, 기타
3. [비-Leader 키맵](#비-leader-키맵) — 창 이동, LSP 점프, Flash, surround 등
4. [부록](#부록-컨텍스트별-키--명령어) — Picker·Explorer 내부 키, Extras 관리

---

## Leader 그룹 인덱스

| 키 | 그룹 | 용도 |
|---|---|---|
| `<leader>a` | AI | CopilotChat |
| `<leader>b` | Buffer | 버퍼 전환/닫기 |
| `<leader>c` | Code | LSP 액션, 포맷, 진단, rename, outline |
| `<leader>d` | Debug | DAP (`dap.core` extras) |
| `<leader>D` | Database | vim-dadbod-ui (`lang.sql` extras) |
| `<leader>e` / `<leader>E` | Explorer | snacks.explorer (Root / cwd) |
| `<leader>f` | File/Find | 파일 열기/탐색, 터미널 |
| `<leader>g` | Git | lazygit, blame, browse, gitsigns hunk |
| `<leader>l` / `<leader>L` | Lazy | 플러그인 매니저 / Changelog |
| `<leader>n` | Notifications | snacks 알림 이력 |
| `<leader>p` | Paste | yank 히스토리 (yanky) |
| `<leader>q` | Quit/Session | 세션 저장/복원/종료 |
| `<leader>s` | Search | snacks picker 검색 |
| `<leader>u` | UI/Toggle | 옵션 토글 모음 |
| `<leader>w` | Window | 창 분할/닫기/줌 |
| `<leader>x` | Diagnostics | trouble.nvim |
| `<leader>t` | Test | Java 테스트 (lang.java extras) |
| `<leader><tab>` | Tabs | 탭 관리 |

기타 단일 leader: [`<space>`](#기타-leader), `` ` ``, `,`, `:`, `.`, `?`, `S`, `K`. 비-leader `gs*` 그룹은 [mini-surround](#mini-surround) 참조.

---

## `<leader>a` — AI (CopilotChat)

### CopilotChat

| 키 | 모드 | 설명 |
|---|---|---|
| `<leader>aa` | n, v | CopilotChat 토글 |
| `<leader>ax` | n, v | 채팅 히스토리 클리어 |
| `<leader>aq` | n, v | Quick chat (입력 프롬프트) |
| `<leader>ap` | n, v | Prompt actions 메뉴 |
| `<C-s>` | (chat buffer) | 프롬프트 제출 |

> 모델은 `model = "auto"`로 고정 (`ai.lua`에서 override).

## `<leader>b` — Buffer

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `<leader>bb` / `` <leader>` `` | n | 이전 버퍼로 전환 | lv |
| `<leader>bd` | n | 현재 버퍼 닫기 | snacks |
| `<leader>bD` | n | 버퍼 + 윈도우 함께 닫기 | snacks |
| `<leader>bo` | n | 다른 버퍼 모두 닫기 | snacks |
| `<leader>be` | n | Buffer Explorer (snacks.explorer 변형) | snacks |

## `<leader>c` — Code (LSP / 포맷 / 진단)

| 키 | 모드 | 설명 | 조건 |
|---|---|---|---|
| `<leader>cf` | n, x | 포맷 (`:Format`) | conform |
| `<leader>cd` | n | 현재 줄 진단 float | lv |
| `<leader>ca` | n, x | LSP code action | has codeAction |
| `<leader>cA` | n | LSP source action | has codeAction |
| `<leader>co` | n | Organize Imports | has codeAction |
| `<leader>cr` | n | LSP rename (커서 심볼) | has rename |
| `<leader>cR` | n | 파일 rename + import 자동 수정 | has workspace file ops |
| `<leader>cs` | n | Outline 토글 (`outline.nvim`) | — |
| `<leader>cl` | n | LSP Info picker | — |
| `<leader>cc` | n, x | Run Codelens | has codeLens |
| `<leader>cC` | n | Codelens refresh | has codeLens |
| `<leader>cxv` | n, x | Extract Variable | Java (jdtls) |
| `<leader>cxc` | n, x | Extract Constant | Java (jdtls) |
| `<leader>cxm` | x | Extract Method | Java (jdtls) |

## `<leader>d` — Debug (DAP)

> `dap.core` extras 활성.

| 키 | 모드 | 설명 |
|---|---|---|
| `<leader>db` | n | breakpoint 토글 |
| `<leader>dB` | n | conditional breakpoint |
| `<leader>dc` | n | continue / 실행 |
| `<leader>dC` | n | run to cursor |
| `<leader>da` | n | run with args |
| `<leader>dg` | n | go to line (실행 안 함) |
| `<leader>di` | n | step into |
| `<leader>do` | n | step over |
| `<leader>dO` | n | step out |
| `<leader>dj` / `<leader>dk` | n | 스택 frame 아래/위 |
| `<leader>dl` | n | run last |
| `<leader>dP` | n | pause |
| `<leader>dr` | n | REPL 토글 |
| `<leader>ds` | n | session |
| `<leader>dt` | n | terminate |
| `<leader>dw` | n | widgets |
| `<leader>du` | n | DAP UI 토글 |
| `<leader>de` | n, x | 표현식 평가 |
| `<leader>dpp` | n | Profiler 토글 |
| `<leader>dph` | n | Profiler 하이라이트 토글 |
| `<leader>dps` | n | Profiler 스크래치 버퍼 |

> 사용자 환경에 kotlin DAP adapter(kotlin-debug-adapter) 별도 설정 있음.

## `<leader>D` — Database (DBUI)

> `lang.sql` extras 활성. vim-dadbod-ui. 연결 목록은 `vim.g.dbs`로 설정.

| 키 | 모드 | 설명 |
|---|---|---|
| `<leader>D` | n | DBUI 사이드바 토글 |

SQL 쿼리 버퍼·DBUI 트리 내부 컨텍스트 키는 [부록](#dbui-사이드바-트리) 참조.

## `<leader>e` — Explorer (snacks.explorer)

> 사용자 환경은 **snacks.explorer**. neo-tree extras 미활성. `hidden = true`, `ignored = true`로 숨김 파일도 표시.

| 키 | 설명 |
|---|---|
| `<leader>e` | Explorer (Root Dir) |
| `<leader>E` | Explorer (cwd) |
| `<leader>fe` | Explorer (Root Dir) |
| `<leader>fE` | Explorer (cwd) |
| `<leader>be` | Buffer Explorer |

## `<leader>f` — File / Find

| 키 | 설명 |
|---|---|
| `<leader>ff` | 파일 찾기 (Root Dir) |
| `<leader>fF` | 파일 찾기 (cwd) |
| `<leader>fn` | 새 파일 |
| `<leader>fr` | 최근 파일 (Root Dir) |
| `<leader>fR` | 최근 파일 (cwd) |
| `<leader>fb` | 열린 버퍼 picker |
| `<leader>fB` | 모든 버퍼 picker |
| `<leader>fc` | LazyVim config 파일 찾기 |
| `<leader>fg` | git tracked 파일 찾기 |
| `<leader>fp` | projects picker |
| `<leader>ft` | 터미널 열기 (Root Dir) |
| `<leader>fT` | 터미널 열기 (cwd) |
| `<C-/>` (n) | 터미널 열기 |
| `<C-/>` (t) | 터미널 닫기 |

## `<leader>g` — Git

| 키 | 설명 | 조건 |
|---|---|---|
| `<leader>gg` | Lazygit (Root Dir) | lazygit executable |
| `<leader>gG` | Lazygit (cwd) | lazygit executable |
| `<leader>gl` | Git Log (Root Dir) | — |
| `<leader>gL` | Git Log (cwd) | — |
| `<leader>gf` | 현재 파일 Git history | — |
| `<leader>gb` | 현재 줄 Git blame | gitsigns |
| `<leader>gB` | Git Browse 열기 | — |
| `<leader>gY` | Git Browse URL 복사 | — |

### Hunk 그룹 (`<leader>gh*`)

| 키 | 모드 | 설명 |
|---|---|---|
| `<leader>ghs` | n, x | hunk 스테이지 |
| `<leader>ghr` | n, x | hunk 리셋 |
| `<leader>ghS` | n | 버퍼 전체 스테이지 |
| `<leader>ghR` | n | 버퍼 전체 리셋 |
| `<leader>ghu` | n | hunk 스테이지 취소 |
| `<leader>ghp` | n | hunk preview (inline) |
| `<leader>ghb` | n | blame line (full) |
| `<leader>ghB` | n | blame buffer |
| `<leader>ghd` | n | diff this |
| `<leader>ghD` | n | diff this against `~` |
| `ih` | o, x | hunk text object (e.g. `vih`, `dih`) |

> Lazygit은 사용자 환경에서 `editPreset = ""`, `editCommand = "nvim"`으로 설정 (Windows 호환).

## `<leader>l` / `<leader>L` — Lazy

| 키 | 설명 |
|---|---|
| `<leader>l` | Lazy UI 열기 |
| `<leader>L` | LazyVim Changelog |

## `<leader>n` — Notifications

| 키 | 설명 |
|---|---|
| `<leader>n` | 알림 이력 (snacks notifier picker) |

> Noice picker는 [`<leader>sn*`](#noice-leadersn) 참조.

## `<leader>p` — Paste (Yanky)

| 키 | 모드 | 설명 |
|---|---|---|
| `<leader>p` | n, x | Yank History picker |
| `y` / `p` / `P` | n, x | 표준 yank/paste (히스토리 자동 누적) |
| `]y` / `[y` | n | yank 히스토리 backward/forward 순환 |
| `gp` / `gP` | n, x | 선택 영역 뒤/앞에 paste |
| `]p` / `[p` | n | 인덴트에 맞춰 아래/위에 paste (linewise) |
| `]P` / `[P` | n | 위와 같음 (P 변형) |
| `>p` / `<p` | n | paste 후 우/좌 인덴트 |
| `>P` / `<P` | n | paste(앞) 후 우/좌 인덴트 |
| `=p` / `=P` | n | filter 적용 후 paste |

## `<leader>q` — Quit / Session

| 키 | 설명 |
|---|---|
| `<leader>qq` | 모든 창 종료 |
| `<leader>qs` | 세션 복원 (현재 디렉토리) |
| `<leader>qS` | 세션 선택 (프로젝트별) |
| `<leader>ql` | 마지막 세션 복원 |
| `<leader>qd` | 세션 저장 비활성 |

## `<leader>s` — Search (snacks picker)

| 키 | 설명 |
|---|---|
| `<leader>/` | live grep (Root Dir) |
| `<leader>s/` | Search History |
| `<leader>s"` | Registers |
| `<leader>sa` | Autocmds |
| `<leader>sb` | 현재 버퍼 라인 검색 |
| `<leader>sB` | 열린 버퍼 grep |
| `<leader>sc` | Command History |
| `<leader>sC` | Commands |
| `<leader>sd` | Diagnostics (워크스페이스) |
| `<leader>sD` | Diagnostics (현재 버퍼) |
| `<leader>sg` | live grep (Root Dir) |
| `<leader>sG` | live grep (cwd) |
| `<leader>sh` | Help pages |
| `<leader>sH` | Highlights |
| `<leader>si` | Icons |
| `<leader>sj` | Jumps |
| `<leader>sk` | Keymaps |
| `<leader>sl` | Location List |
| `<leader>sm` | Marks |
| `<leader>sM` | Man pages |
| `<leader>sp` | Plugin Spec 검색 |
| `<leader>sq` | Quickfix List |
| `<leader>sr` | Search and Replace (grug-far) |
| `<leader>sR` | Resume last picker |
| `<leader>ss` | LSP symbols (버퍼) |
| `<leader>sS` | LSP workspace symbols |
| `<leader>su` | Undotree |
| `<leader>sw` | 단어/선택 검색 (Root Dir) |
| `<leader>sW` | 단어/선택 검색 (cwd) |
| `<leader>st` | Todo comments |
| `<leader>sT` | Todo (TODO/FIX/FIXME) |

### Noice (`<leader>sn*`)

| 키 | 명령어 | 설명 |
|---|---|---|
| `<leader>snh` | `:Noice history` | 지나간 알림 목록 |
| `<leader>snl` | `:Noice last` | 마지막 알림 |
| `<leader>sna` | `:Noice all` | 전체 알림 |
| `<leader>snd` | `:Noice dismiss` | 현재 알림 닫기 |

> **Root Dir vs cwd** — LazyVim은 열린 파일에서 가장 가까운 루트 마커(`.git > .editorconfig > package.json > Makefile > ...`)를 Root Dir로 잡는다. monorepo 하위 `package.json`이 Root로 잡히는 등 검색 범위가 좁다 싶으면 대문자(cwd) 버전을 쓰거나 `:pwd`/`:cd`로 확인. Root = cwd인 단순 프로젝트에선 차이 없음.

## `<leader>u` — UI / Toggle

| 키 | 설명 |
|---|---|
| `<leader>uf` / `uF` | Format on save 토글 (버퍼 / 글로벌) |
| `<leader>us` | 스펠링 토글 |
| `<leader>uw` | wrap 토글 |
| `<leader>ul` / `uL` | 라인 번호 / 상대 번호 |
| `<leader>ud` / `uD` | 진단 / Dim 토글 |
| `<leader>uc` | conceallevel 토글 |
| `<leader>uA` | Tabline 토글 |
| `<leader>uT` | Treesitter 토글 |
| `<leader>ut` | Treesitter Context 토글 |
| `<leader>ub` | 다크 배경 토글 |
| `<leader>ug` | Indent guide 토글 |
| `<leader>uh` | LSP Inlay Hints 토글 |
| `<leader>uG` | Gitsigns 토글 |
| `<leader>ua` / `uS` | 애니메이션 / 스크롤 애니메이션 |
| `<leader>uz` | Zen 모드 |
| `<leader>uZ` | 줌 (최대화) |
| `<leader>ur` | redraw / 검색 하이라이트 / diff 업데이트 |
| `<leader>ui` | 커서 위치 inspect (highlight 그룹 확인) |
| `<leader>uI` | Treesitter Inspect Tree |

## `<leader>w` — Window

| 키 | 설명 |
|---|---|
| `<leader>wd` | 창 닫기 |
| `<leader>w-` / `<leader>-` | 아래로 split |
| `<leader>w|` / `<leader>|` | 오른쪽으로 split |
| `<leader>wm` | 줌 토글 (= `<leader>uZ`) |

## `<leader>x` — Diagnostics / Lists

| 키 | 설명 | 출처 |
|---|---|---|
| `<leader>xl` | Location List | lv |
| `<leader>xq` | Quickfix List | lv |
| `<leader>xx` | `:Trouble diagnostics` (워크스페이스) | trouble |
| `<leader>xX` | `:Trouble diagnostics_buffer` | trouble |
| `<leader>xQ` | `:Trouble qflist` | trouble |
| `<leader>xL` | `:Trouble loclist` | trouble |
| `<leader>xs` | `:Trouble symbols` | trouble |
| `<leader>xS` | `:Trouble lsp` (references/definitions) | trouble |
| `<leader>xt` | `:Trouble todo` | trouble |
| `<leader>xT` | `:Trouble todo` (TODO/FIX/FIXME만) | trouble |

## `<leader><tab>` — Tabs

| 키 | 명령어 | 설명 |
|---|---|---|
| `<leader><tab><tab>` | `:tabnew` | 새 탭 |
| `<leader><tab>d` | `:tabclose` | 탭 닫기 |
| `<leader><tab>]` / `[` | `:tabnext` / `:tabprev` | 다음/이전 탭 |
| `<leader><tab>f` / `l` | `:tabfirst` / `:tablast` | 첫 번째/마지막 탭 |
| `<leader><tab>o` | `:tabonly` | 다른 탭 모두 닫기 |

## 기타 leader

| 키 | 설명 |
|---|---|
| `<leader><space>` | 파일 찾기 (Root Dir, `<leader>ff`와 동일) |
| `<leader>,` | 열린 버퍼 picker |
| `<leader>:` | command history |
| `<leader>.` | 스크래치 버퍼 토글 |
| `<leader>S` | 스크래치 버퍼 선택 |
| `<leader>K` | Keywordprg 실행 |
| `<leader>?` | Buffer Keymaps (which-key) |

---

## 비-Leader 키맵

### 창 이동 & tmux pane 이동

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `<C-h/j/k/l>` | n | nvim 창 + tmux pane 이동 (좌/하/상/우) | vim-tmux-navigator |
| `<C-\>` | n | 이전 tmux pane | vim-tmux-navigator |
| `<C-Up/Down/Left/Right>` | n | 창 크기 조절 (±2) | lv |
| `<C-w><space>` | n | Window Hydra Mode (which-key) | which-key |

> `<C-h/j/k/l>`은 vim-tmux-navigator로 재바인딩되어 nvim 창 경계에서 tmux pane으로 자연스럽게 넘어감. LazyVim 기본의 단순 창 이동을 대체.

### 줄 이동

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `j` / `k` | n, x | count 없으면 `gj`/`gk` (줄바꿈 단위) | lv |
| `<A-j>` | n, i, v | 현재 줄/선택 영역 아래로 | lv |
| `<A-k>` | n, i, v | 현재 줄/선택 영역 위로 | lv |

### 검색 & 하이라이트

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `<Esc>` | i, n, s | 검색 하이라이트 제거 + snippet 중단 | lv |
| `n` / `N` | n, x, o | 다음/이전 검색 결과 (`zv` 포함) | lv |

### 편집 & 저장

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `<C-s>` | i, x, n, s | 파일 저장 | lv |
| `, . ;` | i | 입력 중 undo 포인트 추가 | lv |
| `<` / `>` | v | 인덴트 (선택 유지) | lv |
| `gco` | n | 현재 줄 아래에 주석 줄 추가 | lv |
| `gcO` | n | 현재 줄 위에 주석 줄 추가 | lv |
| `<C-n>` | n, v | 다음 단어 선택 (multi-cursor) | vim-visual-multi |

> nvim-nocut: `d`, `x`, `dd`가 레지스터를 덮어쓰지 않음 (`Y`는 예외). `paste_without_copy` 옵션도 활성.

### 진단·hunk·quickfix·todo 이동

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `[d` / `]d` | n | 이전/다음 진단 | vim |
| `[e` / `]e` | n | 이전/다음 에러 | lv |
| `[w` / `]w` | n | 이전/다음 워닝 | lv |
| `[q` / `]q` | n | 이전/다음 quickfix | vim |
| `]h` / `[h` | n | 다음/이전 git hunk | gitsigns |
| `]H` / `[H` | n | 마지막/처음 git hunk | gitsigns |
| `]t` / `[t` | n | 다음/이전 todo 코멘트 | todo-comments |
| `]]` / `[[` | n | 커서 심볼의 다음/이전 참조 | lv (LSP documentHighlight) |
| `<A-n>` / `<A-p>` | n | 위와 동일 (alt 버전) | lv |

### 버퍼 전환

| 키 | 모드 | 설명 | 출처 |
|---|---|---|---|
| `<S-h>` / `[b` | n | 이전 버퍼 | lv |
| `<S-l>` / `]b` | n | 다음 버퍼 | lv |

### LSP 점프

| 키 | 모드 | 설명 | 조건 |
|---|---|---|---|
| `gd` | n | 정의로 이동 | has definition |
| `gr` | n | 참조 목록 | — |
| `gI` | n | 구현으로 이동 | — |
| `gy` | n | 타입 정의로 이동 | — |
| `gD` | n | 선언으로 이동 | — |
| `K` | n | hover 정보 | — |
| `gK` | n | 시그니처 도움말 | has signatureHelp |
| `<C-k>` | i | 시그니처 도움말 | has signatureHelp |
| `<C-o>` / `<C-i>` | n | 점프 목록 뒤로 / 앞으로 (`gd` 후 돌아오기) | vim 내장 |

### Flash (점프)

| 키 | 모드 | 설명 |
|---|---|---|
| `s` | n, x, o | 화면 아무 위치로 라벨 점프 |
| `S` | n, x, o | Treesitter 단위(함수/블록) 선택 점프 |
| `r` | o | Remote Flash |
| `R` | o, x | Treesitter Search |
| `<C-s>` | c | Cmdline에서 Flash Search 토글 |
| `<C-space>` | n, x, o | Treesitter Incremental Selection |

### mini-surround (`gs*`)

| 키 | 모드 | 설명 |
|---|---|---|
| `gsa` | n, v | Add surrounding (예: `gsaiw"` = 단어를 `"`로 감싸기) |
| `gsd` | n | Delete surrounding |
| `gsr` | n | Replace surrounding |
| `gsf` | n | Find right surrounding |
| `gsF` | n | Find left surrounding |
| `gsh` | n | Highlight surrounding |
| `gsn` | n | Update `n_lines` 옵션 |

### Treesitter 이동 (사용 시)

| 키 | 설명 |
|---|---|
| `]f` / `[f` | 다음/이전 함수 |
| `]c` / `[c` | 다음/이전 클래스 |
| `]a` / `[a` | 다음/이전 인자 |

### Copilot (제안)

| 키 | 모드 | 설명 |
|---|---|---|
| `<M-]>` | i | 다음 Copilot 제안 |
| `<M-[>` | i | 이전 Copilot 제안 |
| `<Tab>` | i | 제안 수락 (cmp/blink가 처리) |

---

## 부록: 컨텍스트별 키 & 명령어

### Picker 내부 (snacks picker insert mode)

| 키 | 동작 |
|---|---|
| `<C-n>` / `<C-p>` | 결과 항목 이동 (`j` / `k` 도 normal mode 에서) |
| `<C-f>` / `<C-b>` | preview 스크롤 (한 페이지 아래/위) |
| `<C-d>` / `<C-u>` | preview 반페이지 스크롤 (버전에 따라 리스트일 수도) |
| `<CR>` | 항목 선택 (Enter — 버퍼로 점프) |
| `?` | 키맵 도움말 |
| `<Esc>` | normal mode 진입 또는 picker 종료 |

### Explorer 내부 (snacks.explorer)

| 키 | 설명 |
|---|---|
| `l` | 선택 항목 열기 (디렉토리는 확장) |
| `h` | 노드 접기 |
| `.` | 가리킨 폴더를 트리 root로 focus (트리 표시만, nvim cwd 무관) |
| `<BS>` | 트리 root를 한 단계 상위로 |
| `<C-c>` | 가리킨 폴더를 nvim (탭) cwd로 변경 (tcd — lazygit·grep이 그 폴더 기준) |
| `Y` | 클립보드에 경로 복사 |
| `O` | 시스템 앱으로 열기 |
| `P` | preview 토글 |

### Outline 내부 (outline.nvim)

| 키 | 설명 |
|---|---|
| `<CR>` | 심볼로 점프 |
| `o` | 점프 후 닫기 |
| `K` | hover |
| `r` | rename |
| `<Up>` / `<Down>` | 이전/다음 심볼 |

### DBUI 사이드바 (트리)

| 키 | 설명 |
|---|---|
| `o` / `<CR>` | 펼치기/접기 |
| `S` | 수직 분할로 열기 |
| `R` | 새로고침 (스키마 변경 후) |
| `d` | 항목 삭제 (Saved queries 등) |
| `A` | 새 연결 추가 |
| `?` | 도움말 |
| `q` | 사이드바 닫기 |

### DBUI SQL 쿼리 버퍼

| 모드 | 키/명령 | 동작 |
|---|---|---|
| n | `<leader>S` | 커서 위치 문단(paragraph) 실행 |
| x | `<leader>S` | 선택 영역 실행 |
| n | `<leader>W` | Saved queries에 저장 |
| n | `<leader>E` | Bind parameter 편집 |
| n | `<C-l>` | 결과창 레이아웃 토글 (수평/수직) |
| n | `:w` | **저장 시 자동 실행** (기본 ON, `vim.g.db_ui_execute_on_save = 0`으로 끔) |
| - | `:DB` | 현재 줄 실행 |
| - | `:%DB` | 버퍼 전체 실행 |
| x | `:'<,'>DB` | 선택 영역 실행 |

### 명령어 레퍼런스

| 명령어 | 설명 |
|---|---|
| `:Toolbox [주제]` | toolbox 검색 (인자 없으면 전체 피커, 인자는 cheatsheet 바로 열기) |
| `:ToolboxGrep` | toolbox 전체 본문 grep 검색 |
| `:DBUI` / `:DBUIToggle` / `:DBUIFindBuffer` | DBUI 열기/토글/현재 버퍼 찾기 |
| `:DB <SQL>` | `vim.g.db` 또는 현재 URL로 SQL 한 줄 실행 |
| `:MarkdownPreview` / `Stop` / `Toggle` | 브라우저 마크다운 미리보기 |
| `:TSContextToggle` / `Enable` / `Disable` | Treesitter Context 토글 |
| `:LazyExtras` | Extras 토글 UI (`x` 선택, `r` 재시작) |
| `:Lazy sync` | 플러그인 설치/동기화 |
| `:Lazy` | 플러그인 매니저 UI |
| `:checkhealth lazy` | 헬스체크 |

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

### 비활성 Extras (필요 시 활성화 고려)

| Extra | 용도 |
|---|---|
| editor/grug-far | 멀티파일 검색/치환 (`<leader>sr`, `<leader>r` 그룹) |
| editor/harpoon2 | 자주 쓰는 파일 4~5개 빠른 전환 |
| editor/inc-rename | 이름 변경 시 라이브 프리뷰 (`<leader>cr` 개선) |
| editor/mini-files | 현재 파일 위치에서 여는 미니 파일 탐색기 |
| editor/neo-tree | snacks.explorer 대신 neo-tree 사용 |
