# LazyVim — 기능과 키맵의 거시적 지도

> **Vim의 편집 모델 위에 Neovim 기능·플러그인·키맵을 조합한 배포판**이다. 이 문서는 모든 단축키가 아니라 어떤 기능이 어디에 있으며 어떻게 찾아가는지를 설명한다.

## 기능의 계층

```text
Vim / Neovim (Mode·Buffer·Window·Tab·LSP API)
           │
LazyVim (기본 설정·키맵·플러그인 통합)
  ├─ 편집·이동      : Vim Operator·Motion + Flash·Surround
  ├─ 파일·버퍼·창   : Explorer·Picker·Buffer·Window
  ├─ 코드 인텔리전스: LSP·Diagnostics·Completion·Formatting
  ├─ 구조 인식      : Treesitter·Text Object
  ├─ 버전 관리      : Git 상태·Hunk·LazyGit 연동
  ├─ UI·상태       : Notifications·Trouble·Toggle
  └─ 선택적 확장    : Debug·Test·AI·Database 등 Extras
```

**Vim 내장 기능과 LazyVim이 추가한 매핑·플러그인은 구분한다.** 기본 편집 문법은 [Vim 치트시트](vim.md), 실제 키맵 전체는 [LazyVim 공식 키맵](https://www.lazyvim.org/keymaps)을 참고한다.

## 키맵을 읽는 문법

```text
<leader> + 기능 그룹 + 동작
    │         │          └─ 해당 그룹 안의 구체적 작업
    │         ├─ f : file/find     b : buffer
    │         ├─ s : search        g : Git
    │         ├─ c : code          w : window
    │         ├─ x : diagnostics   u : UI/toggle
    │         └─ q : quit/session
    └─ 기본 Space (사용자 설정으로 변경 가능)

] / [ + 대상 → 다음 / 이전 대상 탐색
g + 동작     → Vim·플러그인의 동작 접두어 (항상 같은 의미는 아님)
```

`<leader>ff`처럼 **그룹을 먼저 이해하고 필요한 동작을 발견**한다. `]d` / `[d`는 진단 이동, `]h` / `[h`는 Git 변경 구간(hunk) 이동을 나타내는 대표적인 패턴이다. 모든 키가 동일한 조합 문법을 따르는 것은 아니다.

## 탐색·편집의 세 갈래

```text
파일을 찾는다   → Explorer / Picker
위치로 이동한다 → Flash / LSP / Search
범위를 편집한다 → Vim Text Object / Treesitter / Surround
```

- **Explorer**는 파일 트리를 탐색하고, **Picker**는 파일·문자열·심볼 등의 후보를 검색해 선택한다.
- **Flash**는 화면 안의 위치로 빠르게 이동한다. **LSP**는 정의·참조·구현 등 코드 의미 기반 이동을 지원한다.
- **Treesitter**는 구문 구조를 기반으로 영역을 인식하고, **Surround**는 따옴표·괄호 같은 둘러싼 문자를 추가·변경·삭제한다.

## 코드 기능의 역할 구분

```text
Language Server ──> 정의·참조·진단·완성 등의 언어 기능
Formatter       ──> 코드 형식 변경
Treesitter      ──> 구문 트리·구조 기반 편집
DAP             ──> 디버거와 통신 (Extra에 따라 활성화)
```

기능이 비슷해 보여도 서로 다른 계층이다. 예를 들어 `gd`가 동작하지 않는다고 해서 반드시 LSP 연결 실패는 아니다. 기능 제공 여부와 실제 키맵은 활성 플러그인·Extras·버전에 따라 달라진다.

## Root·cwd·설정의 경계

```text
Root    → 프로젝트 경계 (탐색·검색·언어 서버에 영향)
cwd     → Neovim의 현재 작업 디렉터리 (:pwd)
Plugin  → lazy.nvim의 spec·설정으로 구성
Extra   → 필요할 때 활성화하는 추가 기능 묶음
```

Root와 cwd는 항상 같지 않다. `init`·`opts`·`config`는 lazy.nvim 플러그인 설정의 서로 다른 역할이며, 실제 병합·로드 규칙은 [lazy.nvim 공식 문서](https://lazy.folke.io/spec)를 따른다.

## 현재 환경에서 기능 발견하기

| 목적 | 확인 방법 |
|---|---|
| 현재 키맵 검색 | `<leader>sk` 또는 `<leader>?` (설정에 따라 차이) |
| 활성 Extras | `:LazyExtras` |
| 플러그인 상태 | `:Lazy` |
| LSP 연결·진단 | `:checkhealth vim.lsp` (지원 버전 확인) |
| 기능별 도움말 | `:help`, `:helpgrep` |

**기본 키와 설치된 키는 다를 수 있다.** 정적인 명령어 표보다 현재 환경의 키맵 검색과 공식 문서를 기준으로 삼는다.

관련: [Neovim 로드맵](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/neovim/2026-06-16-00-neovim-roadmap.md) · [LazyVim 공식 문서](https://www.lazyvim.org/)
