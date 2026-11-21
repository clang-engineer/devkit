# Zsh Cheatsheet

> Zsh **고유** 기능 중심. 스크립트·job 제어의 Bash 기준 예제는 [shell.md](shell.md), 프로세스 조회 명령은 [CLI 도구 발견 지도](../tools-dictionary.md) 참고. Bash 예제를 옮길 때는 배열·파라미터 확장 차이를 확인한다.

## 세 가지 역할부터 구분

```text
Zsh
├─ ZLE (Line Editor)     → 실행 전 입력줄 편집
│   └─ Ctrl+A / Ctrl+E / Ctrl+R
├─ Expansion             → 입력을 실제 인자로 변환
│   ├─ History            !! / !$
│   ├─ Parameter          ${var} / ${(flags)var}
│   └─ Filename Generation (Glob) **/*.py / *(.)
└─ Shell 환경            → Directory Stack / Alias / Completion / Option
```

**ZLE는 입력 편집기이지 명령 해석의 첫 확장 단계가 아니다.** 입력을 확정하면 History Expansion 등이 처리되고, Filename Generation(Glob)은 뒤쪽에서 수행된다. 확장에는 별칭·명령 치환·Brace Expansion 등도 포함되므로 위 그림은 전체 파서 순서가 아니라 **역할 구분도**다.

Bash와 Zsh는 배열 인덱스·단어 분리·확장 규칙이 다르다. 공통 스크립트 문법은 [Shell](shell.md)에서 다룬다.

## 1. 입력 편집 — ZLE와 History

ZLE는 **실행 전 입력줄**을 편집하고 History Expansion은 **기존 명령의 일부를 재사용**한다. 터미널 에뮬레이터의 화면·스크롤 제어와 구분한다.

### 프롬프트 입력 편집 (Emacs 키바인딩)

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

**Alt/Ctrl+화살표가 단어 이동을 하지 않으면:** ZLE의 `bindkey`부터 확인하고, 터미널 → tmux → zsh 순서로 실제 전달 시퀀스를 좁힌다. Emacs 모드 기본 `Alt+B/F`와 화살표 조합은 별개다. 프롬프트에서 `Ctrl+V` 뒤 대상 키를 눌러 들어온 시퀀스를 보고, 다음은 **레거시 xterm 시퀀스를 받는 경우에만** `.zshrc`에 추가한다:

```zsh
bindkey $'\e[1;3D' backward-word   # Alt+Left
bindkey $'\e[1;3C' forward-word    # Alt+Right
bindkey $'\e[1;5D' backward-word   # Ctrl+Left
bindkey $'\e[1;5C' forward-word    # Ctrl+Right
```

`Ctrl+V` 표시의 `^[`는 Escape 바이트이며 위의 `\e`가 실제 ESC 바이트를 만든다. 자신의 터미널 출력과 다르면 바인딩 문자열도 바꾼다. `tmux-256color`의 terminfo에 해당 특수 키 항목이 없더라도 raw 시퀀스로 등록한 ZLE 바인딩은 작동할 수 있다. Ghostty의 Option 처리와 tmux 키 프로토콜 설정도 함께 확인한다.

#### Alt+Backspace 뒤 입력이 Vi 명령 모드처럼 동작할 때

**자동완성 중이 아닌 일반 입력에서도 발생하면 기본 키맵부터 확인한다.** 터미널이 Alt+Backspace를 `Esc + Backspace`로 보내고 Vi 입력 키맵에 해당 조합이 없으면, `Esc`가 명령 모드 전환으로 처리될 수 있다. Visual 선택 모드나 히스토리 검색창이 열린 것과는 구분한다.

```zsh
bindkey -lL main              # 기본 키맵: emacs 또는 viins에 연결되는지 확인
bindkey -M viins '^[^?'       # Esc + DEL 조합의 Vi 입력 모드 바인딩
bindkey -M emacs '^[^?'       # 기본 Emacs 키맵에서는 backward-kill-word
```

Zsh는 **시작할 때 상속받은** `EDITOR`/`VISUAL` 값에 `vi`가 포함되면 기본 키맵으로 `viins`를 선택할 수 있다 (`vim`, `nvim` 포함). `.zshrc`에서 나중에 `EDITOR=nvim`을 설정했다고 현재 셸이 즉시 전환되는 것은 아니지만, 여기서 실행한 새 셸은 그 값을 상속받는다. 자세한 선택 규칙은 [공식 ZLE Keymaps 문서](https://zsh.sourceforge.io/Doc/Release/Zsh-Line-Editor.html#Keymaps-1)를 참고한다.

Vi 방식의 셸 편집을 의도하지 않았다면 현재 셸에서 복구한다:

```zsh
bindkey -e
```

새 셸에서도 유지하려면 같은 줄을 `~/.zshrc`의 **fzf·Atuin 등 키를 등록하는 초기화보다 앞**에 둔다. 이후에 다른 설정이 `bindkey -v`를 실행하면 다시 바뀔 수 있다. 이는 셸 입력 편집만 바꾸며 Vim/Neovim의 모드나 기본 편집기 선택은 바꾸지 않는다.

**Oh My Zsh 제거 후 달라졌다면:** Oh My Zsh는 [기본 키 설정에서 `bindkey -e`를 실행한다](https://github.com/ohmyzsh/ohmyzsh/blob/master/lib/key-bindings.zsh). 프레임워크만 제거하고 이 설정을 별도로 남기지 않으면 이전과 다른 기본 키맵이 드러날 수 있다. 재설치 대신 필요한 키맵을 명시하면 된다. 키맵이 정상인데도 문제가 남으면 앞 절의 `Ctrl+V` 확인법으로 터미널이 실제 보내는 시퀀스를 확인한다.


### 대화형 작업 팁 — 명령줄 편집·임시 보관·파일 작업

ZLE 단축키는 **현재 키맵과 사용자 바인딩에 따라 달라진다.** 아래 기능은 기본 내장 기능, 별도 바인딩, 프레임워크 제공 명령을 구분한다.

| 목적 | 명령 / 위젯 | 준비 |
|---|---|---|
| 긴 명령을 에디터에서 편집 | `edit-command-line` | 위젯 등록 및 키 바인딩 |
| 입력 중인 명령 잠시 치우기 | `push-line` | 키 바인딩; 다음 프롬프트에서 복원 |
| 디렉터리 생성 후 이동 | `take dir` | Oh My Zsh 제공; 순수 Zsh 기본 명령 아님 |
| 파일명 일괄 변경 | `zmv` | `autoload -Uz zmv` |
| 셸 계산기 | `zcalc` | `autoload -Uz zcalc` |

```zsh
# ~/.zshrc — 필요한 기능만 등록
autoload -Uz edit-command-line zmv zcalc
zle -N edit-command-line
bindkey '^X^E' edit-command-line  # Ctrl+X, Ctrl+E 순서대로
bindkey '^Q' push-line            # Ctrl+Q: 현재 입력줄을 보관하고 다음 프롬프트에 복원
```

`push-line`은 단순 토글이 아니다. 입력 중인 줄을 치우고 다른 명령을 **실행한 뒤** 다음 프롬프트에서 원래 줄을 복원한다. 현재 바인딩은 `bindkey '^Q'`로 확인한다. `Ctrl+Q`는 터미널 흐름 제어와 충돌할 수 있으므로 작동하지 않으면 다른 키를 지정한다.

```zsh
# 파일명 일괄 변경: 먼저 미리보기
zmv -n '(*).(jpg|jpeg)' 'photo-$1.$2'
zmv '(*).(jpg|jpeg)' 'photo-$1.$2'

zcalc '10 * (5 + 2)'              # 70
mkdir -p -- ~/work/demo && cd -- ~/work/demo  # take 없이 같은 작업
```

`zmv`의 캡처 그룹 `$1`, `$2`는 파일명과 확장자를 재사용한다. 실제 변경 전에 `-n`으로 대상을 확인한다. `take`는 Oh My Zsh의 편의 함수이므로 프레임워크를 쓰지 않는다면 위 `mkdir && cd` 방식으로 충분하다.

참고: [Twilio — Zsh Tricks to Blow Your Mind](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/zsh-tricks-to-blow-your-mind).

### 히스토리 확장 (`!` 시리즈)

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

## 2. 명령 해석 — Glob과 확장

패턴은 후보 파일명을 선택하고 Qualifier는 속성 조건으로 좁힌다. 명령 실행 순서가 아니라 **파일 선택 문법**을 이해하는 영역이다.

### Glob — 패턴과 필터를 조합한다

```text
<파일명 패턴>[(qualifier)]
      │             └─ 어떤 종류·속성의 파일을 남길까?
      └─ 어떤 이름·경로와 일치할까?

**/*.js       하위 디렉터리까지 .js 파일명 매칭
*(.)          일반 파일만
*(/)          디렉터리만
*(.m-7)       7일 이내 수정된 일반 파일
**/*(.m-7)    재귀 검색 + 파일 종류 + 수정 시각 조건
```

| 구성 요소 | 의미 | 조합 예 |
|---|---|---|
| `*` / `**/` | 현재 경로의 이름 / 하위 경로까지 | `**/*.js` |
| `(.)` / `(/)` / `(@)` | 일반 파일 / 디렉터리 / 심볼릭 링크 | `*(.)` |
| `(.x)` | 실행 가능한 일반 파일 | `*(.x)` |
| `(.m-7)` / `(.Lm+1)` | 최근 7일 수정 / 1MiB 초과 | `*(.m-7)` |
| `*.{js,ts}` | Brace Expansion으로 두 패턴 생성 | `*.js`, `*.ts` |

**옵션 구분:** 위의 기본 Glob Qualifier는 `BARE_GLOB_QUAL` 설정에 의존한다. `^pattern`, `pattern~exclude`, `(#i)pattern` 등은 `EXTENDED_GLOB`가 필요한 별도 패턴 문법이다.

```zsh
setopt extended_glob
print -rl -- **/*(.m-7)       # 최근 수정된 일반 파일
print -rl -- *.txt~backup.txt # 제외 패턴
```

매칭이 없을 때 Zsh는 기본적으로 오류를 낼 수 있다(`NOMATCH`). 삭제 명령과 Glob을 조합할 때는 먼저 `print -rl -- PATTERN`으로 실제 대상을 확인한다.

## 3. 셸 환경 — 이동·Alias·Completion·Option

디렉터리 이동, 명령 치환, 자동완성, 셸 옵션은 모두 입력·실행 환경을 보완하지만 서로 다른 기능이다.

### 디렉터리 스택

| 명령 | 동작 |
|------|------|
| `cd -` | 직전 디렉터리로 |
| `dirs -v` | 스택 보기 (번호와 함께) |
| `cd +<n>` / `cd -<n>` | 스택 n번 위치로 (`dirs -v` 번호 기준, `AUTO_PUSHD` 시 매번 자동 push) |
| `pushd <dir>` | 스택에 추가하고 이동 |
| `popd` | 스택에서 꺼내고 이동 |

```sh
setopt AUTO_PUSHD PUSHD_IGNORE_DUPS PUSHD_SILENT   # 필요할 때 선택
```

### 별칭 (alias)

| 명령 | 동작 |
|------|------|
| `alias ll='ls -alh'` | 일반 별칭 |
| `alias -g G='\| rg'` | 전역 별칭 — 명령 위치 외에도 치환 (예: `ls G foo` → `ls \| rg foo`; 검색어와 파이프라인 목적을 확인) |
| `alias -s pdf=open` | 접미사 별칭 — `foo.pdf`만 쳐도 `open foo.pdf` |
| `alias -s {md,txt}=nvim` | 접미사 별칭 (여러 확장자) |

> `-g`/`-s`는 zsh 고유. 인자 없이 `alias`로 전체 목록, `unalias <name>`으로 해제.

### 자동완성

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

### 옵션 (자주 켜는 것들)

```sh
setopt extended_glob       # ^, ~, (#i) 등 확장 패턴 활성화
setopt auto_cd             # 디렉터리명만 입력해도 cd
setopt auto_pushd          # cd마다 스택에 push
setopt hist_ignore_dups    # 중복 히스토리 무시
setopt hist_ignore_space   # 공백으로 시작하는 명령은 히스토리 제외
setopt share_history       # 여러 셸 간 히스토리 공유
setopt no_beep             # 비프음 끄기
```

확인: `setopt` (켜진 것만), `set -o` (전체).

프레임워크 없이 쓸 때는 `HISTSIZE`(메모리 내 기록 수)와 `SAVEHIST`(파일에 보존할 수)를 **둘 다** 명시적으로 정한다. `fzf` 등의 `Ctrl+R` 검색을 쓰면서 `SAVEHIST`가 작으면 오래된 명령이 빨리 사라진다. 현 상태는 `print -r -- "$HISTSIZE $SAVEHIST"`와 `setopt`로 확인한다. `auto_pushd` 같은 선택 옵션은 `zoxide` 등과 기능이 중복되는지 보고 결정한다.


## 4. 실행 환경·진단

### 명령어 해시 & 오타 교정 (`rehash`)

zsh는 PATH의 실행파일 위치를 **해시 테이블에 캐싱**한다. 셸 실행 중에 새 바이너리를
설치하면(예: `brew install foo`) 캐시에 없어서 못 찾는다. `setopt correct`가 켜져 있으면
"없는 명령"으로 보고 엉뚱한 오타 교정을 제안한다 (`correct 'foo' to 'fop' [nyae]?`).

```sh
rehash        # 명령어 해시 테이블 재빌드 → 방금 설치한 바이너리 인식
hash -r       # 동치
```

- 새 터미널을 열면 자동으로 잡히므로, 현재 셸에서만 `rehash` 한 번.
- `[nyae]` 프롬프트: `n`(거절) `y`(교정 수락) `a`(중단) `e`(직접 편집).

### 프롬프트 / 환경

```sh
export EDITOR=nvim
export PATH=$HOME/.local/bin:$PATH
export LESS='-R'
```

> 실전에서는 `starship` 같은 외부 프롬프트를 쓰는 게 표준. `eval "$(starship init zsh)"`.

Starship·powerlevel10k는 프롬프트를 만드는 **엔진**, Catppuccin 등은 색 **팔레트**, Oh My Zsh는 셸 설정·플러그인 **프레임워크**다. 같은 “테마”라는 이름으로 다른 계층을 혼동하지 않는다. 프롬프트 엔진은 하나를 골라 초기화하고, 색 통일은 가능한 한 터미널 팔레트에서 관리한다. 외부 프롬프트·히스토리 검색·디렉터리 이동을 각각 별도 도구로 쓰면 프레임워크 자체는 필수가 아니지만, 기존 프레임워크를 제거할 때는 히스토리 크기·키바인딩처럼 함께 제공하던 기본값을 점검한다.

프리셋을 비교하려면 현재 `~/.config/starship.toml`을 바로 덮지 말고 별도 파일로 출력해 같은 디렉터리에서 렌더링한다. Powerline 프리셋에는 Nerd Font가 필요하다.

```sh
starship preset catppuccin-powerline -o /tmp/starship-preview.toml
STARSHIP_CONFIG=/tmp/starship-preview.toml starship prompt
starship prompt                       # 현재 설정과 비교
```

[Starship 공식 프리셋](https://starship.rs/presets/catppuccin-powerline).



### Oh My Zsh와 역할 구분

`Oh My Zsh`는 Zsh 자체가 아니라 설정·플러그인 프레임워크다. ZLE·Glob·History 같은 **셸 내장 기능을 이해하는 데 설치가 필요하지 않다.** 플러그인 설정은 실제 사용 환경의 dotfiles에서 관리한다.

## 참고

- `man zshall` — 거대하지만 가장 정확한 레퍼런스
- `man zshexpn` — 확장(`!`, glob qualifier 등) 전용
- [Zsh Lovers](https://grml.org/zsh/zsh-lovers.html) — 패턴 모음
