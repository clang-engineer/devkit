# LazyVim — 편집·탐색·코드 작업의 작동 지도

> **LazyVim은 Neovim의 편집 모델에 플러그인·키맵·설정을 조합한 배포판**이다. 기능을 단순 나열하기보다 **무엇을 편집하고, 어떻게 탐색하며, 어떤 계층이 기능을 제공하는지** 이해한다. Vim의 Operator·Motion 문법은 [Vim 치트시트](vim.md)를 참고한다.

## 전체 작동 모델 — 편집 대상에서 기능 확장까지

```text
사용자 입력 (Mode에 따라 키 의미 변화)
           │
           ▼
Neovim 편집 모델
├─ Buffer : 실제 편집 텍스트
├─ Window : Buffer를 보여 주는 화면 영역
└─ Tab    : Window 배치의 묶음
           │
           ├─ Vim Operator + Motion / Text Object → 텍스트 변경 [1]
           ├─ Explorer / Picker / Search         → 대상 발견 [2]
           └─ LSP / Treesitter / Formatter       → 코드 이해·변환 [3]
                         │
LazyVim 설정·키맵·플러그인 → 위 기능을 연결·확장 [4]
                         │
                Extras로 선택적 기능 활성화
```

**Neovim이 편집 대상과 상태를 관리하고, LazyVim은 그 위에 기능을 연결한다.** Buffer·Window·Tab은 포함 관계가 아니다. Window는 Buffer를 표시하며 Tab은 Window 배치의 묶음이다. 위 숫자는 본문의 기능 영역을 가리킨다.

## 1. 편집 — Mode·Operator·Text Object

Vim의 **Mode는 입력의 의미**를 결정하고, Operator는 **무엇을 할지**, Motion·Text Object는 **어느 범위에 적용할지** 결정한다. LazyVim은 이 문법을 유지하면서 Flash·Surround·Treesitter 기반 선택 등을 추가한다.

| 대상·목적 | 대표 조작 | 의미 |
|---|---|---|
| 범위 변경 | `ciw`, `dap` | 단어 내부 변경 / 문단 삭제 (Vim) |
| 빠른 위치 이동 | `s` | Flash로 화면 내 위치 선택 |
| 구조 선택 | `S` | Flash Treesitter (활성 플러그인 기준) |
| 둘러싸기 | Surround 플러그인 | 따옴표·괄호 추가·교체·삭제 |
| 창 이동 | `Ctrl+h/j/k/l` | 인접 Window로 Focus 이동 |
| Buffer 전환 | `Shift+h/l` | 이전·다음 Buffer |

**예시:** `ciw`는 현재 단어 내부를 바꾸는 Vim 조합이고, Flash의 `s`는 **편집 범위를 바꾸는 것이 아니라 이동할 위치를 찾는 기능**이다. 둘을 연결하면 이동 후 원하는 범위를 편집할 수 있다.

## 2. 탐색 — Explorer·Picker·Search·Root

```text
파일·심볼·문자열을 찾고 싶다
           │
      ┌────┼───────────┐
      ▼    ▼           ▼
  Explorer Picker     LSP Navigation
  파일 트리  후보 검색  정의·참조·구현
      │    │           │
      └────┴───────────┘
           ▼
       Buffer 열기
           │
       Window에 표시
```

**Explorer**는 파일 트리를 따라가고, **Picker**는 파일·내용·심볼 등의 후보를 찾아 선택한다. **LSP Navigation**은 코드 의미에 기반해 위치를 이동한다. Root는 검색·프로젝트 범위의 기준이고 `cwd`는 Neovim의 현재 작업 디렉터리다. 두 값은 같지 않을 수 있다.

| 목적 | 대표 키 |
|---|---|
| 파일 탐색기 | `<leader>e` |
| 프로젝트 파일 찾기 | `<leader>ff` |
| 프로젝트 내용 검색 | `<leader>sg` |
| Buffer 목록 | `<leader>,` |
| 정의로 이동 | `gd` |
| 참조 찾기 | `gr` |

**예시:** `<leader>ff`로 파일을 찾고 `gd`로 정의를 따라간다. 파일 탐색은 Picker가, 정의 탐색은 LSP가 담당한다. LSP 연결이나 기능 지원이 없다면 `gd`가 기대대로 동작하지 않을 수 있다.

## 3. 코드 기능 — LSP·Treesitter·Formatter·DAP

| 기능 | 작동 대상 | 존재 이유 |
|---|---|---|
| LSP | 언어 서버가 제공하는 코드 의미 정보 | 정의·참조·진단·Rename·Code Action |
| Completion | 입력 위치와 후보 | 코드·문자열 완성 |
| Treesitter | 파싱된 구문 트리 | 구조 인식·선택·하이라이트 |
| Formatter | 파일 또는 선택 범위 | 코드 형식 변환 |
| Diagnostics | 코드 문제의 위치·메시지 | 오류·경고 탐색 |
| DAP (Extra) | 실행 중인 프로그램·디버거 | Breakpoint·Step·상태 관찰 |
| Git 통합 | 파일의 변경 Hunk·상태 | 변경 탐색·비교·복구 |

**진단 정보의 제공자와 표시 UI는 다르다.** LSP 등이 문제를 보고하면 Neovim·플러그인이 표시하거나 목록으로 탐색할 수 있다. Treesitter는 LSP를 대신하지 않고, Formatter는 코드 의미 분석과 다른 책임을 가진다.

대표적으로 `<leader>ca`는 Code Action, `<leader>cr`는 Rename, `<leader>xx`는 Diagnostics 목록이다. `]d`·`[d`는 진단 위치 이동이며, 활성 플러그인과 버전에 따라 키가 달라질 수 있다.

## 4. 확장·설정 — Plugin·Extra·Keymap

```text
Neovim 기본 동작
       │
       ├─ LazyVim 기본 플러그인·키맵
       ├─ User Config / lazy.nvim Plugin Spec
       └─ Extras (선택적으로 기능 추가)
                    │
                    ▼
             실제 활성 기능·키맵
```

**Plugin은 기능 구현, Extra는 관련 플러그인·설정 묶음, Keymap은 사용자가 기능을 호출하는 경로**다. `init`·`opts`·`config`는 lazy.nvim 설정에서 서로 다른 역할을 하며, 실제 병합·로드는 [lazy.nvim 공식 문서](https://lazy.folke.io/spec)를 따른다.

### 키맵을 발견하는 패턴

```text
<leader> (기본 Space)
  ├─ f : File / Find
  ├─ s : Search
  ├─ b : Buffer
  ├─ c : Code
  ├─ g : Git
  ├─ w : Window
  ├─ x : Diagnostics
  └─ u : UI / Toggle

] / [ + 대상 → 다음 / 이전 위치
```

이것은 **암기용 공통 패턴이지 모든 키가 이 문법을 따른다는 뜻은 아니다.** 실제 키맵은 which-key와 설치된 플러그인 설정이 결정한다.

| 확인할 것 | 진입점 |
|---|---|
| 현재 키맵 검색 | `<leader>sk` / `<leader>?` |
| 플러그인 로드 상태 | `:Lazy` |
| 활성 Extras | `:LazyExtras` |
| LSP 연결 | `:LspInfo` / `<leader>cl` |
| 기능별 도움말 | `:help`, `:helpgrep` |

**진단 예시:** 정의 이동이 안 된다면 먼저 해당 Buffer의 파일 형식과 LSP 연결 상태를 확인하고, 그다음 `gd`의 실제 키맵을 확인한다. 키맵 존재와 기능 제공 여부는 별개의 문제다.

전체 키 목록은 [LazyVim 공식 Keymaps](https://www.lazyvim.org/keymaps), [설정별 키맵 변경](https://www.lazyvim.org/configuration/keymaps)을 참고한다. 관련 개념은 [Neovim 로드맵](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/neovim/2026-06-16-00-neovim-roadmap.md)에서 더 깊게 다룬다.
