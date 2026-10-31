# LazyVim — 개발 환경 구성과 기능 발견 지도

> **LazyVim은 Neovim 위에 플러그인·설정·키맵을 통합한 개발 환경 배포판**이다. Vim 편집 문법을 반복하기보다, 기능이 **어디서 제공되고 어떻게 활성화·호출되는지** 이해한다. 기본 편집 원리는 [Vim 치트시트](vim.md)에 맡긴다.

## 전체 작동 모델 — 구성에서 실제 기능까지

```text
Neovim (편집기·Buffer·Window·Mode)
             │
             ▼
lazy.nvim (플러그인 로드·설정 관리)
             │
    ┌────────┼────────────────┐
    ▼        ▼                ▼
LazyVim 기본 구성       User Plugin Spec       Extras
(기본 플러그인·키맵)    (추가·변경·비활성화)   (선택적 기능 묶음)
    └────────┬────────────────┘
             ▼
      실제 활성 플러그인·키맵 [1]
             │
       사용자가 기능 호출
             │
    ┌────────┼──────────────┐
    ▼        ▼              ▼
탐색·이동 [2]   코드 기능 [3]   편집·Git·UI [3]
    │        │              │
    └────────┴──────────────┘
             ▼
       Neovim Buffer·Window

기능 문제 → 키맵 / Plugin / LSP / Root 상태 확인 [4]
```

이 그림은 단일 명령의 내부 실행 순서가 아니라 **설정·기능 제공·호출의 관계**다. Neovim은 편집 상태를 관리하고, lazy.nvim은 플러그인 로딩을 맡으며, LazyVim은 그 위의 기본 구성을 제공한다. Extra는 별도 편집기가 아니라 추가 Plugin Spec 묶음이다.

## 1. 기능이 구성되는 방식 — Plugin·Spec·Extra·Keymap

| 요소 | 역할 | 확인 위치 |
|---|---|---|
| Neovim | Buffer·Window·Mode와 편집 API 제공 | `:help` |
| lazy.nvim | Plugin Spec 해석·설치·로딩 | `:Lazy` |
| LazyVim | 기본 플러그인·옵션·키맵 구성 | [공식 설정 문서](https://www.lazyvim.org/configuration) |
| User Spec | 플러그인 추가·설정 재정의·비활성화 | `lua/plugins/*.lua` |
| Extra | 언어·디버깅·테스트 등 기능 묶음 활성화 | `:LazyExtras` |
| Keymap | 활성 기능을 키 입력과 연결 | `<leader>sk`, `<leader>?` |

**구성 예시:** `:LazyExtras`에서 필요한 언어 지원을 활성화 → 해당 Plugin Spec이 로딩 대상에 포함 → 플러그인·외부 도구가 준비되면 관련 기능과 키맵을 사용할 수 있다. Extra 활성화만으로 언어 서버나 디버거 실행 파일까지 반드시 설치되는 것은 아니다.

Plugin Spec의 `opts`는 플러그인 옵션 구성, `dependencies`는 플러그인 의존 관계, `keys`는 키맵·지연 로딩 선언 등에 쓰인다. `init`·`config`는 로딩 시점과 설정 실행에 관여한다. 세부 병합·로드 순서는 [lazy.nvim Spec](https://lazy.folke.io/spec)을 따른다.

## 2. 탐색 — 대상에 따라 다른 진입점

```text
무엇을 찾는가?
├─ 파일·문자열·심볼 후보 → Picker
├─ 파일 트리·디렉터리   → Explorer
├─ 화면 내 위치         → Flash
└─ 정의·참조·구현       → LSP Navigation
                              │
                        Buffer·Window 이동
```

| 목적 | 대표 키 |
|---|---|
| 파일 탐색기 | `<leader>e` |
| 파일 찾기 | `<leader>ff` |
| 내용 검색 | `<leader>sg` |
| Buffer 선택 | `<leader>,` |
| 화면 위치 이동 | `s` (Flash) |
| 정의 이동 | `gd` |
| 참조 찾기 | `gr` (설정·버전 확인) |

**조합 예시:** `<leader>ff`로 파일을 선택한 뒤 `gd`로 정의를 따라간다. 첫 단계는 Picker가 파일 후보를 찾는 것이고, 두 번째는 LSP 등 코드 탐색 기능이 의미 정보를 활용하는 것이다. Root(프로젝트 범위)와 `cwd`(현재 작업 디렉터리)가 다르면 검색 범위가 예상과 다를 수 있다.

### 탐색 결과는 어디에 보관되고 표시되는가?

```text
       결과 생성               결과 관리              결과 표시
  Search / :make ──────────> Quickfix ─────────┐
  LSP / Linter ────────────> Diagnostics ──────┼─> Trouble
  LSP References ──────────> Picker / Trouble ─┘
```

**Quickfix는 Vim/Neovim의 기본 위치 목록**, **Diagnostics는 Neovim이 관리하는 코드 진단**, **Trouble은 이들을 보여주는 탐색 UI**다. LSP 진단은 자동으로 Quickfix에 들어가지 않으며 Trouble은 Diagnostics를 직접 표시할 수 있다. Picker도 검색·LSP 결과를 직접 표시할 수 있으므로 모든 결과가 Quickfix를 거치지는 않는다.

| 상황 | 우선 사용할 기능 | 대표 진입점 |
|---|---|---|
| 파일·문자열을 찾아 한 곳으로 이동 | Picker | `<leader>ff`, `<leader>sg` |
| 여러 검색·빌드 결과를 목록으로 순회 | Quickfix | `:copen`, `:cnext`, `:cprev` |
| LSP 오류·경고를 모아 확인 | Trouble (Diagnostics) | `<leader>xx` |
| Quickfix를 Trouble UI로 확인 | Trouble (Quickfix) | `<leader>xQ` |
| 정의·참조 등 코드 의미 탐색 | LSP / Picker / Trouble | `gd`, `<leader>cS` (설정 확인) |

**빌드 결과 예시:** `makeprg`에 외부 빌드 명령을 설정 → `:make` 실행 → `errorformat`에 따라 오류 위치를 Quickfix에 수집한다. `:vimgrep`은 검색 위치를 Quickfix에 넣는다. 실제 키맵과 Picker 구현은 LazyVim 버전·설정에 따라 달라진다.

더 자세한 개념과 사용법은 [Neovim 코드 진단과 결과 탐색](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/neovim/2026-05-04-lazyvim-leader-x-trouble.md), Vim 기본 탐색 모델은 [Vim 치트시트](vim.md)를 참고한다.

## 3. 개발 기능 — 누가 무엇을 제공하는가?

| 기능 | 담당하는 역할 | 대표 진입점 |
|---|---|---|
| 편집·Text Object | Vim·Neovim 편집 문법, 플러그인 확장 | `ciw`, Surround |
| LSP | 코드 의미·정의·참조·Rename·Code Action | `gd`, `<leader>ca` |
| Completion | 입력 후보 제공·선택 | Insert Mode |
| Treesitter | 구문 트리·구조 기반 하이라이트·선택 | 활성 플러그인 |
| Formatter | 코드 스타일 변환 | `<leader>cf` (키맵 확인) |
| Diagnostics / Trouble | 진단 제공·목록 표시·탐색 | `]d`, `[d`, `<leader>xx` |
| Git | Hunk·변경 상태 탐색 및 Git TUI 연동 | `]h`, `[h`, LazyGit |
| DAP / Test | 디버깅·테스트 실행·상태 확인 | 해당 Extra 활성화 |

**기능 제공자와 화면 UI는 구분한다.** LSP가 제공하는 진단을 Neovim이 수집하고 Trouble 같은 UI가 목록으로 보여줄 수 있다. Treesitter는 LSP의 대체재가 아니며 Formatter도 코드 의미 탐색과 다른 기능이다.

Vim의 `Operator + Motion` 원리는 [Vim 치트시트](vim.md)를 참고한다. LazyVim에서는 그 위에 어떤 기능이 추가되고, 어떤 플러그인이 담당하는지 파악하는 데 집중한다.

## 4. 기능 발견과 진단 — 키맵·플러그인·환경

```text
키를 눌렀는데 동작하지 않는다
      │
      ├─ 키맵이 있는가?      → <leader>sk / <leader>?
      ├─ Plugin이 로드됐나?  → :Lazy
      ├─ Extra가 활성인가?   → :LazyExtras
      ├─ LSP가 연결됐나?     → :checkhealth vim.lsp
      └─ Root·cwd가 맞는가?  → :pwd / 프로젝트 탐색
```

**대표 패턴:** `<leader>`(기본 Space) 다음에 `f`(Find), `s`(Search), `b`(Buffer), `c`(Code), `g`(Git), `w`(Window), `x`(Diagnostics), `u`(UI) 같은 그룹이 이어진다. `]d`·`[d`처럼 대상 앞뒤로 이동하는 패턴도 있다. 모든 키가 동일한 규칙을 따르는 것은 아니다.

**진단 예시:** `gd`가 동작하지 않는다면 키맵을 먼저 확인하고, 파일 형식과 LSP 연결을 점검한다. `:Lazy`에서 플러그인 상태를 확인하되 **플러그인이 설치되어 있다는 사실과 해당 Buffer에서 기능이 동작한다는 사실은 다르다.**

기본 키는 버전·설정에 따라 달라질 수 있다. 전체 키 목록은 [LazyVim Keymaps](https://www.lazyvim.org/keymaps), 프로젝트 구조와 편집기 내부 원리는 [Neovim 로드맵](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/neovim/2026-06-16-00-neovim-roadmap.md)에서 확인한다.
