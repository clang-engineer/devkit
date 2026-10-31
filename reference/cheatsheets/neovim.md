# Neovim — 내장 API·언어 기능·확장 구조 치트시트

> **Neovim은 Vim의 편집 모델을 계승하고, Lua API·내장 LSP·진단·외부 프로세스 연동을 제공하는 확장 가능한 편집기**다. 편집 명령은 [Vim](vim.md), 플러그인 구성·키맵은 [LazyVim](lazyvim.md)에서 다룬다.

## 전체 개념지도 — 계승과 확장

```text
                       Neovim
                          │
          ┌───────────────┴────────────────┐
          ▼                                ▼
       Vim 계승                         확장 기반
   Mode / Motion / Mark             Lua / Runtime API
   Buffer / Window                  Extmark / UI
   Quickfix / Loclist               LSP / Diagnostics
          │                         Treesitter / Job·RPC
          └───────────────┬────────────────┘
                          ▼
                    Plugin / LazyVim
```

Vim에도 확장·비동기 기능이 존재한다. 이 구분은 **Neovim이 독점적으로 발명한 개념**이 아니라 Neovim에서 중요하게 쓰이는 **내장 인터페이스와 통합 경로**를 나타낸다.

## 1. Runtime API — 편집기를 프로그래밍한다

```text
Lua / Plugin
    │
    ├─ vim.api      → Buffer·Window 등 편집기 상태 조작
    ├─ vim.fn       → Vimscript 함수 호출
    ├─ vim.keymap   → 키 입력과 동작 연결
    ├─ vim.opt      → 옵션 접근
    └─ vim.uv       → 이벤트 루프·비동기 I/O
```

| 목적 | 대표 진입점 |
|---|---|
| Lua 실행 | `:lua print(vim.bo.filetype)` |
| 편집기 API 도움말 | `:help api` |
| Lua API 도움말 | `:help lua` |
| 자동 명령·이벤트 | `:help lua-guide-autocommands` |

Event / Autocommand는 **이벤트 발생 시 동작을 실행하는 모델**이며 Vim에서도 계승한 개념이다. Neovim은 Lua API로 이를 구성할 수 있다.

## 2. 편집기 상태와 화면 장식 — Extmark

```text
Buffer (실제 텍스트)
    │
    ├─ Window → Buffer를 보여주는 화면
    └─ Extmark → 편집에 따라 추적되는 위치·범위
                    │
                    ├─ Highlight / Underline
                    ├─ Virtual Text / Virtual Lines
                    └─ 기타 플러그인 화면 장식
```

**Mark**는 사용자의 책갈피, **Extmark**는 플러그인 등이 편집 중 위치를 추적하고 화면 정보를 붙이기 위한 API다. Virtual Text는 실제 파일 내용을 변경하지 않고 텍스트를 표시한다. Floating Window는 별도의 Window 표시 방식이며 Extmark와 같은 개념이 아니다.

| 개념 | 대표 도움말 |
|---|---|
| Buffer / Window / Tabpage | `:help windows` |
| Extmark | `:help api-extmarks` |
| Floating Window | `:help nvim_open_win()` |

## 3. 언어 기능 — 구문·의미·진단의 구분

```text
                    소스코드
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
         Treesitter           LSP Client
         구문 트리                │
             │              Language Server
      구조·하이라이트             │
                           ┌─────┴──────────┐
                           ▼                ▼
                       Navigation       Diagnostics
                     정의·참조·구현       오류·경고 상태
                           │                │
                           └────────┬───────┘
                                    ▼
                            Plugin UI / Trouble
```

**Treesitter**는 구문 구조, **LSP**는 언어 서버와 통신해 코드 의미 정보를 얻는 경로다. **Diagnostics**는 LSP·Linter 등이 제공한 오류·경고를 Neovim이 버퍼·제공자별로 관리하는 API다. LSP가 제공하는 모든 결과가 Diagnostics는 아니다.

| 목적 | 대표 진입점 |
|---|---|
| LSP 연결 상태 확인 | `:checkhealth vim.lsp` |
| LSP 정의·참조 API | `vim.lsp.buf.definition()`, `vim.lsp.buf.references()` |
| 진단 목록을 Quickfix에 복사 | `:lua vim.diagnostic.setqflist()` |
| 진단 API 도움말 | `:help diagnostic` |

**Quickfix는 Vim에서 계승한 범용 위치 목록**이고 Diagnostics는 현재 진단 상태를 관리한다. Quickfix를 계속 갱신할 수도 있으므로 '스냅샷 대 실시간'만으로 구분하지 않는다. Trouble은 둘을 보여줄 수 있는 **별도 플러그인**이다.

## 4. 외부 연동 — Job·RPC·UI

```text
Neovim
  ├─ Job / vim.system → 외부 명령·프로세스 실행
  ├─ RPC             → 외부 프로세스와 메시지 통신
  ├─ Remote Plugin   → 외부 언어로 기능 확장
  └─ UI Protocol     → 외부 프런트엔드와 화면 연동
```

Job과 RPC는 같은 개념이 아니다. **Job은 프로세스 실행·관리**, **RPC는 메시지 기반 통신**에 초점을 둔다. LSP도 외부 언어 서버와 통신하지만, 모든 외부 프로세스가 LSP 서버인 것은 아니다.

| 목적 | 대표 도움말 |
|---|---|
| 외부 명령 실행 | `:help vim.system()` |
| RPC | `:help rpc` |
| 원격 플러그인 | `:help remote-plugin` |
| UI 프로토콜 | `:help ui` |

## 5. 어디서 더 살펴볼까?

- **Vim 편집·위치 목록:** [Vim 치트시트](vim.md)
- **LazyVim의 Picker·Trouble·키맵:** [LazyVim 치트시트](lazyvim.md)
- **개념 간 관계:** [Neovim 로드맵](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/neovim/2026-06-16-00-neovim-roadmap.md)
- **LSP·Quickfix·Diagnostics·Trouble 상세:** [코드 진단과 결과 탐색](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/neovim/2026-05-04-neovim-code-diagnostics-and-navigation.md)

**문서 경계:** 이 문서는 Neovim 내장 기능의 **역할과 관계**만 다룬다. 개별 API의 옵션·시그니처는 `:help`와 [Neovim 공식 문서](https://neovim.io/doc/user/)에서 확인한다.
