# fzf Cheatsheet

> **fuzzy finder** — stdin으로 들어오는 무엇이든 인터랙티브하게 좁혀서 고른다.
> 파일/히스토리/git 브랜치/프로세스/ssh 호스트 — **목록이면 다 된다**.

## 개념 흐름

```text
후보 목록(stdin) → 검색 가능한 TUI → 선택한 줄(stdout)
       ↓
  Ctrl+R (히스토리)
  Ctrl+T (파일)
  Alt+C  (cd)
  파이프 (커스텀)
```

핵심 명령어:

| 단계 | 명령 | 설명 |
|------|------|------|
| 히스토리 | `Ctrl+R` | 명령 히스토리 검색 |
| 파일 선택 | `Ctrl+T` | 현재 디렉터리 파일 |
| cd | `Alt+C` | 디렉터리 골라 이동 |
| 파이프 | `... \| fzf` | 커스텀 후보에서 선택 |
| 멀티 선택 | `fzf -m` | Tab으로 여러 개 |

## 연결 도구

| 도구 | 관계 |
|------|------|
| rg | 파일 내용 검색 후 fzf로 선택 |
| fd | 파일 목록 생성 후 fzf로 선택 |
| bat | fzf 미리보기에서 파일 내용 표시 |
| zoxide | `z` 명령과 fzf 통합 |

## 30초만 본다면

| 상황 | 명령 / 키 |
|---|---|
| 히스토리 검색 | `Ctrl+R` (셸 통합 필요) |
| 디렉터리 파일 → 명령에 삽입 | `Ctrl+T` |
| 디렉터리 골라 `cd` | `Alt+C` |
| 명령 인자 자리에서 fuzzy | `vim **<Tab>` |
| 파이프 입력에서 한 줄 고르기 | `... \| fzf` |
| 여러 줄 선택 (Tab 멀티) | `... \| fzf -m` |
| 미리보기 패널 | `fzf --preview 'bat --color=always {}'` |
| 화면 안 종료 | `Esc` |

## 핵심 모델

```text
후보 목록(stdin) → 검색 가능한 TUI → 선택한 줄(stdout)
```

`fzf`는 후보가 파일인지 브랜치인지 해석하지 않는다. 후보를 만드는 producer와 선택
결과를 사용하는 consumer 사이에서 범용 선택기 역할만 한다. `fd`는 파일시스템
조건으로 후보를 만들고, `fzf`는 받은 후보에서 사용자가 대화형으로 선택한다.

```bash
git branch --format='%(refname:short)' | fzf  # 브랜치 후보 → 선택
fd --type f --extension sql | fzf      # fd가 파일 후보 생성, fzf가 선택
```

현대 `fzf`를 입력 없이 실행하면 자체 walker가 현재 디렉터리부터 하위를 재귀 탐색해
파일 후보를 만든다. 시스템 전체 검색은 아니며 시작 위치는 `--walker-root`로 바꾼다.

```bash
fzf                                    # 현재 디렉터리 아래 파일 선택
fzf --walker-root ~/projects           # 탐색 시작 위치 지정
```

## 설치

```bash
brew install fzf                # macOS
```

## 셸 통합 (가장 큰 가치)

`~/.zshrc` 또는 `~/.bashrc`:

```bash
eval "$(fzf --zsh)"             # zsh
eval "$(fzf --bash)"            # bash
```

## 셸 단축키 (통합 후)

| 키 | 기능 |
|----|------|
| `Ctrl+R` | 히스토리 퍼지 검색 |
| `Ctrl+T` | 현재 디렉터리 파일 → 커맨드라인 삽입 |
| `Alt+C` | 디렉터리 선택 → 바로 `cd` |
| `**<Tab>` | 인자 자리에서 자동완성 (`vim **<Tab>`) |

## fzf 화면 안에서

| 키 | 동작 |
|----|------|
| `Ctrl+J` / `Ctrl+K` | 아래/위 이동 |
| `Tab` / `Shift+Tab` | 멀티 선택 (`--multi`) |
| `Ctrl+/` | 프리뷰 줄바꿈 토글 (`toggle-wrap-word`; 프리뷰 표시 토글은 별도 바인딩 필요) |
| `Enter` | 확정 |
| `Esc` / `Ctrl+C` | 취소 |

## 파이프 조합

```bash
fzf --print0 | xargs -0 -o vim --             # 파일 골라 vim 열기
git branch --format='%(refname:short)' | fzf | xargs git checkout --
pid="$(ps -Ao pid=,command= | fzf | awk '{print $1}')"
[ -n "$pid" ] && kill "$pid"                 # 기본 SIGTERM; 확인 후 실행
rg "TODO" | fzf                               # rg 결과에서 좁히기
fd --max-depth 1 --type f --print0 | \
  fzf --read0 --print0 -m | xargs -0 rm --    # 파일명 공백·특수문자 안전
```

삭제 명령은 선택 결과를 먼저 출력해 확인한 뒤 실행한다.

## 미리보기

```bash
fzf --preview 'cat {}'
fzf --preview 'bat --color=always {}'        # bat과 조합
fzf --preview 'tree -L 1 {}'                 # 디렉터리 미리보기
```

## 환경변수

| 변수 | 설명 |
|------|------|
| `FZF_DEFAULT_COMMAND` | 기본 파일 목록 명령 (예: `fd --type f`) |
| `FZF_CTRL_T_COMMAND` | Ctrl+T용 명령 |
| `FZF_ALT_C_COMMAND` | Alt+C용 명령 |
| `FZF_DEFAULT_OPTS` | 기본 옵션 (`--height 40% --layout=reverse` 등) |

권장 설정 (rg + fd 조합):

```bash
export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d'
```

## 더 보기

- `man fzf`, `fzf --help`
- 공식: https://github.com/junegunn/fzf
- 키바인딩: https://github.com/junegunn/fzf#key-bindings-for-command-line
- 활용 예: https://github.com/junegunn/fzf/wiki/Examples
