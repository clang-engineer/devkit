# fzf — 후보 선택과 셸 통합 치트시트

> `fzf`는 **임의의 후보 목록을 매칭하고 선택하는 범용 CLI 인터페이스**다. 기본 파일 탐색기도 제공하지만, 외부 후보 생성기나 검색 엔진과 분리해 사용할 수 있다.

## 전체 작동 모델 — 입력에서 선택까지

```text
Provider (fd / rg / git / history / built-in walker)
    │ 후보 공급
    ▼
fzf
├─ Input        : 후보 수신·항목 경계·목록 갱신
├─ Matching     : 필터링·순위
├─ Presentation : 목록·필드·레이아웃·미리보기
├─ Interaction  : 키·이벤트 → 액션
└─ Selection    : 단일·다중 선택
    │ stdout 반환 또는 액션 실행
    ▼
Consumer (shell / editor / git / tmux / ...)

Integration: Shell / tmux / 외부 프로그램
```

`fzf`의 입력은 보통 **stdin**, 결과는 **stdout**이다. `|`는 앞 명령의 stdout을 뒤 명령의 stdin으로 연결한다.

```sh
fd -t f | fzf                     # 파일 후보 중 하나 선택
rg -l 'TODO' | fzf                # TODO가 있는 파일 중 선택
git branch --format='%(refname:short)' | fzf  # 브랜치 후보 중 선택
```

## 1. Input · Matching — 후보 공급과 검색

후보 생성과 매칭은 다른 역할이다. 입력이 터미널이면 기본 walker 또는 설정된 기본 명령으로 후보를 만들 수 있고, 파이프로 외부 후보를 공급할 수도 있다.

| 기능 | 대표 옵션·설정 | 존재 이유 |
|---|---|---|
| 후보 공급 | stdin / `FZF_DEFAULT_COMMAND` | 탐색 대상 결정 |
| 항목 경계 | `--read0` | NUL로 구분된 항목 수신 |
| 스트림 유지 | `--tail` | 지속적으로 들어오는 후보의 보관량 제한 |
| 매칭 | `--exact`, 검색 문법 | 후보를 좁히기 |
| 정렬 | `--no-sort` | 입력 순서 유지 |
| 외부 검색 | `--disabled`, `reload` | 외부 엔진이 검색을 담당 |

```text
고정 후보: Provider ──> fzf Matching ──> Selection

동적 검색: Query ──> rg ──> fzf List ──> Selection
              ▲                │
              └─ change/reload ┘
```

`rg TODO | fzf`는 이미 검색된 후보를 다시 좁히는 방식이다. 반면 `change:reload`는 검색어가 변할 때 rg를 다시 실행한다. 이때 fzf 내부 매칭을 끌 수 있다.

### 검색 방식 선택

| 방식 | 검색 주체 | 활용 |
|---|---|---|
| `rg TODO` / `fd main` | rg / fd | 결과 확인만 필요할 때 |
| `rg TODO \| fzf` | rg 후 fzf | 고정 후보를 추가 필터링 |
| Live Grep | rg | 검색어 변경 때마다 재검색 |
| 2단계 검색 | rg → fzf | 외부 검색 결과를 고정하고 내부 매칭으로 전환 |

Live Grep의 최소 형태:

```sh
fzf --disabled --ansi \\
  --bind 'start:reload:rg --column --color=always --smart-case -- {q} || :' \\
  --bind 'change:reload:rg --column --color=always --smart-case -- {q} || :'
```

start는 초기 후보를 채우고 change는 검색어가 달라질 때 후보를 갱신한다. Enter는 기본적으로 선택 결과를 출력한다. 미리보기와 에디터 열기, 다중 선택은 [공식 Ripgrep integration](https://junegunn.github.io/fzf/tips/ripgrep-integration/)을 참고한다. 내부 검색 전환 예제는 [ADVANCED.md](https://github.com/junegunn/fzf/blob/master/ADVANCED.md)를 참고한다.

파일 전용 Ctrl-T 설정과 본문 검색 옵션을 전역 옵션에 혼합하지 않는다. 별도 Picker가 필요하다면 독립 스크립트나 이미 제공되는 확장을 선택한다. [확장 생태계 비교](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/shell/2026-11-22-developer-tool-extension-ecosystems.md)는 도입 판단과 Television 대안을 다룬다.

## 2. Selection — 기본 선택 조작

| 조작 | 의미 |
|---|---|
| 타이핑 | 후보를 fuzzy matching으로 좁히기 |
| `↑` / `↓` | 후보 이동 |
| `Enter` | 현재 선택 확정 |
| `Esc` / `Ctrl-C` | 취소 |
| `-m` / `--multi` | 복수 선택 허용 |
| `Tab` / `Shift-Tab` | 다중 선택 모드에서 항목 선택·해제 및 이동 |

`fzf`는 후보를 검색해 선택할 뿐, 선택된 파일을 자동으로 열지 않는다. 후속 동작은 셸 통합이나 연결된 명령이 담당한다.

## 3. Presentation — 목록과 미리보기

```sh
fd -t f | fzf --preview 'head -80 {}'
fd -t f | fzf --preview 'bat --color=always -- {}'
```

`{}`는 현재 강조된 후보를 나타내는 자리표시자다. `--preview`는 후보가 바뀔 때 해당 명령을 실행해 내용을 보여준다. 두 번째 예제에는 `bat` 설치가 필요하다.

| 옵션 | 역할 |
|---|---|
| `--preview CMD` | 현재 후보 미리보기 |
| `--preview-window` | 미리보기 창 위치·크기 제어 |
| `--height` | 화면 높이 조절 |
| `--layout` | 후보 목록 배치 |
| `--nth` | 매칭에 사용할 필드 지정 |
| `--delimiter` | 필드 구분 기준 |
| `--with-nth` | 표시할 필드 변환 |

## 4. Interaction — 이벤트와 액션

```text
Key / Event (change, focus, ...)
        │ --bind
        ▼
Action
├─ 상태 변경
├─ reload         : 후보 목록 갱신
├─ execute        : 외부 명령 실행
├─ execute-silent : 화면 전환 없이 명령 실행
└─ become         : 다른 명령으로 프로세스 교체
```

`--bind`는 키나 이벤트를 액션에 연결한다. `{q}`는 현재 검색어, `{}`는 현재 강조된 항목, `{+}`는 선택 항목을 참조하는 자리표시자다. Preview는 관련 정보를 보여주고 reload는 후보 자체를 갱신한다. 이벤트와 액션은 내부 매칭 여부와 독립적으로 활용할 수 있다.

## 5. 셸 통합 — 긴 파이프라인 없이 사용

zsh에서 지원되는 fzf 버전은 `source <(fzf --zsh)`로 셸 통합을 활성화할 수 있다. 설치 방식에 따라 이미 활성화되어 있을 수 있다.

| 셸 단축키 | 동작 |
|---|---|
| `Ctrl-T` | 파일·경로 선택 후 현재 명령행에 삽입 |
| `Alt-C` | 디렉터리 선택 후 이동 |
| `Ctrl-R` | 명령 이력에서 선택 |

예를 들어 셸에 `nvim `을 입력한 뒤 `Ctrl-T`로 파일을 선택하면 경로가 명령행에 들어간다. 별도 `fd | fzf | xargs`를 매번 작성할 필요가 없다. 다른 히스토리 도구(예: Atuin)가 `Ctrl-R`을 사용한다면 키 바인딩 충돌을 확인한다.

### Ctrl-T 사용 전제

아래 사용법은 터미널 pane 전체를 쓰는 Ctrl-T 화면과 오른쪽 50% `bat` 미리보기, `Ctrl-/` 위치 전환,
macOS `Ctrl-Y` 절대 경로·`Alt-Y` 상대 경로 복사를 추가한 구성을 기준으로 한다.
`Ctrl-/`·`Ctrl-Y`·`Alt-Y`는 fzf 기본 바인딩이 아니라 사용자 설정이다.
이 치트시트는 설정 코드와 셸별 공통 관리 구조 대신,
설정 후의 사용 순서와 기본·추가 키의 구분에 집중한다.
설정 코드와 분리 이유: [fzf Ctrl-T 설정을 세 셸에서 한곳으로 모으기](https://clang-engineer.github.io/posts/reference/tools/2026-11-23-fzf-ctrl-t-shared-config/).

높이는 fzf 전체 UI, `right,50%`는 그 안의 미리보기 너비다.
이 구성은 `--no-height`로 셸 통합이 추가하는 높이 제한을 덮어써 현재 pane 전체를 사용한다.
`--height=80%`를 사용하면 전체 UI가 pane 높이의 80%만 차지하며, 오른쪽 미리보기 비율과는 별개다.

### Ctrl-T 사용 순서와 키

1. 셸 명령행에 `nvim ` 또는 macOS의 `open `을 입력한다. 아직 Enter는 누르지 않는다.
2. `Ctrl-T`를 누르고 파일명 일부를 입력해 후보를 좁힌다.
3. 미리보기로 내용을 확인한 뒤 Enter로 경로를 삽입한다. macOS에서는 `Ctrl-Y`로 절대 경로, `Alt-Y`로 상대 경로를 복사하고 닫을 수도 있다.
4. Enter로 경로를 삽입했다면 완성된 명령을 확인하고 Enter를 한 번 더 눌러 실행한다.

| 선택 화면의 입력 | 동작 | 설정 구분 |
|---|---|---|
| `↑` / `↓` | 다른 파일·디렉터리 후보로 이동 | 기본 |
| `Shift-↑` / `Shift-↓` | 현재 파일의 미리보기만 한 줄씩 스크롤 | 기본 |
| 미리보기 위에서 마우스 휠 | 미리보기 스크롤 | 기본, 마우스 활성화 시 |
| `Ctrl-/` | 미리보기 아래쪽 → 숨김 → 기본 오른쪽 50% 순환 | 추가 |
| `Enter` | 선택 경로를 현재 셸 명령행에 삽입, 명령 자체는 실행하지 않음 | 기본 셸 통합 |
| `Ctrl-Y` | 현재 강조된 후보의 절대 경로를 복사하고 닫기, 명령행에 삽입하지 않음 | 추가, macOS 전용 |
| `Alt-Y` | 현재 강조된 후보를 표시된 경로 그대로 복사하고 닫기, 기본 후보는 상대 경로 | 추가, macOS 전용 |

미리보기 창으로 포커스를 옮길 필요는 없다. Shift+방향키가 동작하지 않으면 터미널이나 tmux가 키를 가로채는지 확인한다.
두 복사 키의 `{}`는 현재 강조된 후보 하나를 뜻하며, Tab으로 표시한 여러 항목 전체를 복사하는 바인딩은 아니다.
macOS 헤더에 `Ctrl-Y: 절대 경로 복사 · Alt-Y: 상대 경로 복사`가 표시된다.
`Ctrl-Y`는 `realpath`로 심볼릭 링크까지 해석한다. `Alt-Y`는 별도 후보 생성기가 절대 경로를 제공하면 그 값을 그대로 복사한다.

주의할 경계:

- `--walker-skip`은 fzf의 기본 후보 생성기에 적용된다. `FZF_CTRL_T_COMMAND`로 `fd` 등 별도 생성기를 지정했다면 그 명령에서 제외 규칙을 설정한다.
- Ctrl-T에는 디렉터리도 나타난다. 위 `bat` 미리보기는 텍스트 파일용이며 디렉터리·바이너리를 위한 구조·이미지 미리보기를 제공하지 않는다.
- 두 복사 키는 선택기를 닫는 동작까지 묶여 있다. 복사 명령이 실패해도 닫힐 수 있다. macOS에서 `pbcopy`, `realpath`, `perl`을 사용할 수 있는지와 클립보드 접근을 확인한다.

근거: [공식 셸 통합과 Ctrl-T 예제](https://junegunn.github.io/fzf/shell-integration/#ctrl-t),
[기본 키 바인딩 소스](https://github.com/junegunn/fzf/blob/master/src/terminal.go).

## 6. Output — 선택 결과와 인자

```text
fzf 결과(stdout) ── $(...) ──> 셸 명령행 인자
                  ├─ | ─────> 다음 명령의 stdin
                  └─ xargs ─> 후속 명령의 argv
```

```sh
nvim "$(fd -t f | fzf)"     # 개념 예시: 선택 경로를 하나의 인자로 전달
```

위 예시는 선택 취소 시 빈 인자가 될 수 있다. 실제 자동화에서는 종료 상태를 확인해야 한다. 복수 선택 결과를 `"$(...)"`로 감싸면 여러 줄이 하나의 인자가 되므로 주의한다. 공백·줄바꿈이 있는 파일명을 안전하게 처리하려면 `--read0`, `--print0` 등 NUL 구분을 사용한다.

## 7. Integration — 주변 도구와 역할 구분

```text
fd      이름·경로로 파일 후보 생성
rg      파일 내용 검색, -l로 일치한 파일 후보 생성
fzf     전달된 후보를 좁혀 선택
zoxide  방문 기록을 기반으로 디렉터리 이동
```

LazyVim Picker가 편집기 안의 코드 탐색을 담당한다면, `fzf` 셸 통합은 **터미널 명령행에서 경로·이력·디렉터리를 선택할 때** 특히 유용하다. 개인 alias나 함수 없이도 기본 기능으로 활용할 수 있다.

셸 통합은 명령줄 편집과 현재 셸 상태 변경을 담당하고, tmux 통합은 셸 이외의 pane에서도 선택 UI를 활용할 수 있게 한다. 외부 프로그램은 자식 프로세스로 fzf를 실행해 후보를 공급하고 결과를 소비할 수 있다.

## 개념별 공식 학습 자료

| 학습할 개념 | 공식 가이드 |
|---|---|
| 입력·스트림 | [Browsing log streams](https://junegunn.github.io/fzf/tips/browsing-log-streams/), [Processing multi-line items](https://junegunn.github.io/fzf/tips/processing-multi-line-items/) |
| 외부 검색·이벤트·액션 | [Ripgrep integration](https://junegunn.github.io/fzf/tips/ripgrep-integration/) |
| 결과 반환·프로세스 통합 | [Using fzf in your program](https://junegunn.github.io/fzf/tips/using-fzf-in-your-program/) |
| 셸·tmux·응용 사례 | [Shell Integration 및 Examples](https://junegunn.github.io/fzf/) |

세부 구현은 공식 가이드에서 확인한다. 표준 입력과 명령행 인자의 차이는 [Shell 파이프와 xargs](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/shell/2026-11-23-shell-pipe-stdin-argv-xargs.md)를 참고한다.

공식 문서: [fzf 저장소](https://github.com/junegunn/fzf) · [셸 통합](https://junegunn.github.io/fzf/shell-integration/) · `fzf --help`
