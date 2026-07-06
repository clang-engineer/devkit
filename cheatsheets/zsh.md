# Zsh Cheatsheet

> Zsh **고유** 기능 중심. 일반 라인 편집 단축키와 셸 공통 패턴(`set -e`, job 제어, 프로세스 조회 등)은 [shell.md](shell.md), [linux-process.md](linux-process.md) 참고.

## 라인 편집 (Emacs 키바인딩 기본)

대부분 GNU readline과 동일. 자주 쓰는 것만:

| 단축키 | 동작 |
|--------|------|
| `Ctrl+A` / `Ctrl+E` | 줄 처음 / 끝 |
| `Alt+F` / `Alt+B` | 단어 단위 이동 |
| `Ctrl+W` | 커서 앞 단어 삭제 |
| `Ctrl+U` / `Ctrl+K` | 커서 앞 / 뒤 전체 삭제 |
| `Ctrl+Y` | 마지막 삭제 내용 붙여넣기 |
| `Ctrl+_` | 실행 취소 |
| `Ctrl+R` | 히스토리 역방향 검색 |
| `Alt+.` | 이전 명령어의 마지막 인자 (반복 가능) |

> Vi 키바인딩으로 바꾸려면: `bindkey -v` (zshrc에).

## 히스토리 확장 (`!` 시리즈)

bash와 호환되는 csh 스타일 확장. 명령 중간에서도 동작.

| 표현 | 의미 |
|------|------|
| `!!` | 마지막 명령어 (`sudo !!` 패턴 유명) |
| `!$` | 마지막 명령어의 마지막 인자 |
| `!*` | 마지막 명령어의 모든 인자 |
| `!<n>` | 히스토리 n번째 명령어 |
| `!<str>` | str로 시작하는 최근 명령어 |
| `^old^new` | 마지막 명령어의 첫 `old`를 `new`로 교체 |

```sh
mkdir /etc/foo
sudo !!                    # → sudo mkdir /etc/foo

ls /var/log/messages
less !$                    # → less /var/log/messages
```

## Glob (Zsh 확장)

**기본 활성화**. bash와 다르게 추가 옵션 없이 즉시 사용.

| 패턴 | 의미 | 예 |
|------|------|----|
| `**/*.js` | 재귀 (모든 하위 디렉터리) | `ls **/*.js` |
| `*.{js,ts}` | brace 확장 | `rm *.{log,tmp}` |
| `file<1-10>.txt` | 숫자 범위 | `ls file<1-5>.txt` |
| `*.txt~backup.txt` | 제외 (negation) | `ls *.txt~backup.txt` |
| `(#i)pattern` | 대소문자 무시 | `ls (#i)*.JPG` |
| `*(.)` | 일반 파일만 | `ls *(.)` |
| `*(/)` | 디렉터리만 | `ls *(/)` |
| `*(@)` | 심볼릭 링크만 | `ls *(@)` |
| `*(.x)` | 실행 가능한 파일만 | `ls *(.x)` |
| `*(.m-7)` | 7일 이내 수정 | `ls *(.m-7)` |
| `*(.Lm+1)` | 1MB 초과 | `ls *(.Lm+1)` |

> 끝의 `(...)`는 **glob qualifier** — Zsh만의 강력한 필터. `find` 없이 한 줄.

`setopt extended_glob`가 필요한 패턴도 있으니 zshrc에 미리 켜두면 편함.

## 디렉터리 스택

| 명령 | 동작 |
|------|------|
| `cd -` | 직전 디렉터리로 |
| `dirs -v` | 스택 보기 (번호와 함께) |
| `cd +<n>` / `cd -<n>` | 스택 n번 위치로 (`dirs -v` 번호 기준, `AUTO_PUSHD` 시 매번 자동 push) |
| `pushd <dir>` | 스택에 추가하고 이동 |
| `popd` | 스택에서 꺼내고 이동 |

```sh
setopt AUTO_PUSHD PUSHD_IGNORE_DUPS PUSHD_SILENT   # ~/.zshrc 추천
```

## 별칭 (alias)

| 명령 | 동작 |
|------|------|
| `alias ll='ls -alh'` | 일반 별칭 |
| `alias -g G='\| rg'` | 전역 별칭 — 명령줄 어디서나 치환 (`ls G foo`) |
| `alias -s pdf=open` | 접미사 별칭 — `foo.pdf`만 쳐도 `open foo.pdf` |
| `alias -s {md,txt}=nvim` | 접미사 별칭 (여러 확장자) |

> `-g`/`-s`는 zsh 고유. 인자 없이 `alias`로 전체 목록, `unalias <name>`으로 해제.

## 자동완성

| 키 | 동작 |
|----|------|
| `Tab` | 보완 |
| `Tab Tab` | 후보 목록 표시 |
| `**` + `Tab` | 재귀 자동완성 (`vim **/conf<Tab>`) |
| `Alt+/` | 경로 확장 (실제 경로로 풀기) |

```sh
# ~/.zshrc — 새 시스템에 처음 깔 때
autoload -Uz compinit && compinit
zstyle ':completion:*' menu select         # 화살표로 후보 선택
zstyle ':completion:*' matcher-list '' 'm:{a-zA-Z}={A-Za-z}'   # 대소문자 무시
```

## 옵션 (자주 켜는 것들)

```sh
setopt extended_glob       # 위 glob qualifier 활성화
setopt auto_cd             # 디렉터리명만 입력해도 cd
setopt auto_pushd          # cd마다 스택에 push
setopt hist_ignore_dups    # 중복 히스토리 무시
setopt hist_ignore_space   # 공백으로 시작하는 명령은 히스토리 제외
setopt share_history       # 여러 셸 간 히스토리 공유
setopt no_beep             # 비프음 끄기
```

확인: `setopt` (켜진 것만), `set -o` (전체).

## 프롬프트 / 환경

```sh
export EDITOR=nvim
export PATH=$HOME/.local/bin:$PATH
export LESS='-R'

# 프롬프트 정보 표시 (vcs)
autoload -Uz vcs_info
precmd() { vcs_info }
PROMPT='%~ ${vcs_info_msg_0_} $ '
```

> 실전에서는 `starship` 같은 외부 프롬프트를 쓰는 게 표준. `eval "$(starship init zsh)"`.

## Oh My Zsh — 프레임워크 옵션

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

자주 켜는 플러그인:

```sh
# ~/.zshrc
plugins=(
  git
  zsh-autosuggestions       # 회색 자동 제안
  zsh-syntax-highlighting   # 문법 강조
  z                         # 디렉터리 점프 (또는 zoxide)
  extract                   # x 명령으로 압축 자동 해제
)
```

`zsh-autosuggestions`, `zsh-syntax-highlighting`은 별도 clone 필요:

```sh
git clone https://github.com/zsh-users/zsh-autosuggestions \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

> Oh My Zsh가 무거우면 `zinit`이나 [zsh4humans](https://github.com/romkatv/zsh4humans) 같은 가벼운 대안 검토.

## 참고

- `man zshall` — 거대하지만 가장 정확한 레퍼런스
- `man zshexpn` — 확장(`!`, glob qualifier 등) 전용
- [Zsh Lovers](https://grml.org/zsh/zsh-lovers.html) — 패턴 모음
