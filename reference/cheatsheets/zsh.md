# Zsh Cheatsheet

> Zsh **고유** 기능 중심. 스크립트·job 제어의 Bash 기준 예제는 [shell.md](shell.md), 프로세스 조회 명령은 [tools-dictionary.md](tools-dictionary.md#linux시스템) 참고. Bash 예제를 옮길 때는 배열·파라미터 확장 차이를 확인한다.

## Zsh가 해석하는 입력의 층

```text
프롬프트 입력 (ZLE 키 바인딩)
       │
History Expansion   !! / !$ / !n
       │
Globbing            **/*.py / *(.) / ^pattern
       │
Parameter Expansion ${var} / ${(flags)var}
       │
명령 실행
```

`!!`은 직전 명령, `!$`는 직전 명령의 마지막 인자를 가리킨다. `**/`는 하위 디렉터리까지 재귀 매칭한다. ZLE 단축키는 **셸의 명령 입력줄**에 적용되며 tmux·Neovim의 키맵과 다르다.

Bash와 Zsh는 배열 인덱스·단어 분리·확장 규칙이 다르므로 동일한 문법이라고 가정하지 않는다. 공통 스크립트 문법은 [Shell](shell.md)에서 다룬다.

## 프롬프트 입력 편집 (Emacs 키바인딩)

**zsh 프롬프트에서 명령을 입력할 때** 쓰는 단축키다. Ghostty의 화면·스크롤백 관리나 tmux 단축키와는 별개이며, `vim` 같은 프로그램 안에서는 그 프로그램의 키 동작이 적용된다.

| 용도 | 단축키 | 동작 |
|------|--------|------|
| 이동 | `Ctrl+A` / `Ctrl+E` | 현재 줄의 처음 / 끝으로 이동 |
| 이동 | `Alt+B` / `Alt+F` | 단어 단위로 뒤 / 앞으로 이동 |
| 삭제 | `Ctrl+W` | 커서 앞 단어 삭제 |
| 삭제 | `Ctrl+U` | **현재 입력 줄 전체** 삭제 (`kill-whole-line`); 여러 줄 입력 중에는 현재 줄만 삭제 |
| 삭제 | `Ctrl+K` | 커서부터 줄 끝까지 삭제 |
| 복구 | `Ctrl+Y` | 마지막으로 삭제한 내용 붙여넣기 |
| 복구 | `Ctrl+_` | 입력 편집 실행 취소 |
| 화면 | `Ctrl+L` | 화면을 지우고 프롬프트·입력 중인 내용을 다시 그림; 입력과 커서의 논리적 위치는 유지. **스크롤백 기록 삭제는 아님** |
| 재사용 | `Ctrl+R` | 이전 명령 역방향 검색 |
| 재사용 | `Alt+.` | 이전 명령의 마지막 인자 삽입 (반복 가능) |

예: 긴 명령을 쓰다가 `Ctrl+L`을 눌러도 입력 내용은 남는다. 처음부터 다시 입력하려면 `Ctrl+U`, 커서 뒤쪽만 바꾸려면 `Ctrl+K`를 누른다. 삭제한 내용은 `Ctrl+Y`로 다시 붙여넣을 수 있다.

> 이 표는 Emacs 키바인딩 기준이다 (`bindkey -e`). `bindkey -v`로 Vi 키바인딩을 사용하면 일부 키가 달라진다. 예를 들어 Vi 입력 모드의 `Ctrl+U`는 삽입 모드에 들어온 위치까지 삭제하는 `vi-kill-line`이다. 현재 설정은 `bindkey '^U'`, `bindkey '^L'`로 확인한다.

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

## 명령어 해시 & 오타 교정 (`rehash`)

zsh는 PATH의 실행파일 위치를 **해시 테이블에 캐싱**한다. 셸 실행 중에 새 바이너리를
설치하면(예: `brew install foo`) 캐시에 없어서 못 찾는다. `setopt correct`가 켜져 있으면
"없는 명령"으로 보고 엉뚱한 오타 교정을 제안한다 (`correct 'foo' to 'fop' [nyae]?`).

```sh
rehash        # 명령어 해시 테이블 재빌드 → 방금 설치한 바이너리 인식
hash -r       # 동치
```

- 새 터미널을 열면 자동으로 잡히므로, 현재 셸에서만 `rehash` 한 번.
- `[nyae]` 프롬프트: `n`(거절) `y`(교정 수락) `a`(중단) `e`(직접 편집).

## 프롬프트 / 환경

```sh
export EDITOR=nvim
export PATH=$HOME/.local/bin:$PATH
export LESS='-R'
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
