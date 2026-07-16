# fzf Cheatsheet

> **fuzzy finder** — stdin으로 들어오는 무엇이든 인터랙티브하게 좁혀서 고른다.
> 파일/히스토리/git 브랜치/프로세스/ssh 호스트 — **목록이면 다 된다**.

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

## 설치

```bash
brew install fzf                # macOS
scoop install fzf               # Windows
```

## 셸 통합 (가장 큰 가치)

### Bash / Zsh

`~/.zshrc` 또는 `~/.bashrc`:

```bash
eval "$(fzf --zsh)"             # zsh
eval "$(fzf --bash)"            # bash
```

### PowerShell (`$PROFILE`)

```powershell
Install-Module PSFzf -Scope CurrentUser
Import-Module PSFzf
Set-PsFzfOption -PSReadlineChordProvider 'Ctrl+t' -PSReadlineChordReverseHistory 'Ctrl+r'
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
| `Ctrl+/` | 미리보기 토글 |
| `Enter` | 확정 |
| `Esc` / `Ctrl+C` | 취소 |

## 파이프 조합

```bash
vim $(fzf)                                    # 파일 골라 vim 열기
git checkout $(git branch | fzf)              # 브랜치 골라 체크아웃
kill -9 $(ps aux | fzf | awk '{print $2}')    # 프로세스 골라 kill
rg "TODO" | fzf                               # rg 결과에서 좁히기
ls | fzf -m | xargs rm                        # 멀티 선택 후 일괄 처리
```

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

## 활용 시나리오

git 브랜치 골라 체크아웃하는 함수 (원격 브랜치 포함):

```bash
gco() {
  git checkout "$(git branch --all | grep -v HEAD | fzf | tr -d ' *' | sed 's|remotes/origin/||')"
}
```

## 더 보기

- `man fzf`, `fzf --help`
- 공식: https://github.com/junegunn/fzf
- 키바인딩: https://github.com/junegunn/fzf#key-bindings-for-command-line
- 활용 예: https://github.com/junegunn/fzf/wiki/Examples
