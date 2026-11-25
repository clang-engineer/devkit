# Fish — 입력 편집·완성·실행·설정 지도

자동 제안·완성·구문 강조를 기본 제공하는 대화형 셸. **Bash/Zsh 설정 파일을 그대로 읽는 셸은 아니다.** 아래 키는 기본 Emacs 모드 기준이며, 명령과 키 표기는 Fish 4.9.3에서 확인했다. 플러그인·사용자 바인딩은 기본 동작을 바꿀 수 있다.

## 입력이 실행으로 바뀌는 흐름

```text
키 입력 → 편집 중인 명령줄 ── 실행 확정 → 구문·확장 → 명령 실행
              ▲                                      │
              │                                      ├─ stdout / stderr
              │                                      └─ 종료 상태
              ├─ 자동 제안 수락 ← 히스토리·완성·경로
              ├─ Tab 후보 선택 ← 완성 정의·파일·명령
              │       └─ Ctrl-S → 목록 검색 → 후보 축소
              └─ 이력 검색 선택 ← 저장된 명령

설정·함수·바인딩은 입력 편집과 명령 실행 환경에 영향을 준다.
화살표는 데이터나 선택 결과의 전달이며, 제안·완성이 명령을 자동 실행하지는 않는다.
```

## 1. 입력 편집 — 제안·완성·히스토리를 구분하기

### Tab 후보가 많을 때: 이동보다 검색

**`Tab` → `Ctrl-S` → 검색어 입력**으로 기본 완성 목록을 좁힌다. fzf나 플러그인 설치가 필요 없다. 후보가 하나면 바로 완성되므로 목록 검색 단계가 없다.

예: `git switch ` 뒤에서 Tab으로 브랜치 후보를 연 다음 Ctrl-S로 검색한다. 검색은 현재 완성 후보 안에서 수행하며, 파일 시스템 전체나 Git 로그를 새로 검색하는 것이 아니다.

| 상태·대상 | 키 | 효과 |
|---|---|---|
| 명령줄 | `Tab` | 완성 시도, 여러 후보면 pager 표시 |
| 완성 목록 | `Tab` / `Shift-Tab` | 다음 / 이전 후보 |
| 완성 목록 | 방향키, `PageUp` / `PageDown` | 후보 이동·페이지 이동 |
| 완성 목록 | `Ctrl-S` | 검색창 열기·닫기 (`pager-toggle-search`) |
| 회색 자동 제안 | `→` 또는 `Ctrl-F` | 제안 전체 수락 |
| 회색 자동 제안 | `Alt-→` 또는 `Alt-F` | 한 단어 수락 |
| 명령줄 | `↑` / `↓` | 현재 입력을 이용한 이력 탐색 |
| 명령줄 | `Ctrl-R` | 기본 히스토리 검색 pager 열기 |
| 명령줄 | `Ctrl-A` / `Ctrl-E` | 줄 처음 / 끝 이동 |
| 명령줄 | `Ctrl-U` / `Ctrl-K` | 커서 앞 / 뒤를 잘라내기 |
| 명령줄 | `Ctrl-W` / `Ctrl-Y` | 앞 경로 구성 요소 잘라내기 / 붙여넣기 |
| 명령줄 | `Ctrl-C` | 현재 입력 취소; 실행 중이면 인터럽트 |

**자동 제안은 아직 입력하지 않은 뒷부분**, **완성은 현재 명령 문맥의 후보**, **히스토리는 과거 명령**이다. 목록 검색 UI가 있어도 서로 같은 데이터는 아니다. Vi 모드에서는 pager 검색 키가 `/`이며 다른 편집 키도 달라진다.

### Shift-Tab: 명령 문맥의 후보를 fzf로 선택

**Fish 4.9.3 + fzf 0.74.4의 공식 통합에서 확인한 기능**이다. 별도 완성 플러그인 없이 `fzf --fish | source`가 `Shift-Tab`을 `fzf_complete`에 연결한다. 일반 `Tab`은 Fish 기본 완성으로 남는다. 구버전이나 다른 플러그인에서는 바인딩이 다를 수 있다.

```fish
# ~/.config/fish/config.fish — 이미 초기화했다면 중복 추가하지 않는다.
if status is-interactive
    fzf --fish | source
end

# 현재 키의 소유자 확인
bind shift-tab
# 기대: bind shift-tab fzf_complete
```

**`ssh`·`kill` 전용 기능이 아니다. Fish가 제공하는 명령·인자·옵션 후보를 fzf로 고른다.** 아래 공백으로 끝나는 예시는 뒤 공백까지, `git --`는 공백 없이 입력한 뒤 Enter 대신 `Shift-Tab`을 누른다. Bash/Zsh의 `**` 트리거는 필요 없다.

| 입력 중인 명령줄 | fzf에 표시할 후보 | 선택 후 삽입할 값 |
|---|---|---|
| `ssh ` | Fish SSH 완성이 제공하는 호스트 | 호스트 이름·별칭 |
| `kill ` | 실행 중인 프로세스 PID와 이름 설명 | PID |
| `git switch ` | Fish Git 완성이 제공하는 브랜치 | 브랜치 이름 |
| `git checkout ` | 현재 문맥의 브랜치·파일 등 | 브랜치 이름·경로 |
| `git add ` | 추가할 파일·경로 | 경로 |
| `cd ` | 디렉터리 | 디렉터리 경로 |
| `nvim ` / `cat ` | 파일·경로 | 경로 |
| `git --` | Git 전역 옵션 | 옵션 이름 |
| `docker exec ` | 컨테이너 — Docker 완성 정의와 접근 가능한 daemon 필요 | 컨테이너 이름·ID |
| `kubectl get ` | 리소스 종류 — kubectl 완성 정의와 클러스터 접근 등 필요 | 리소스 종류 |
| `systemctl restart ` | 서비스·유닛 — systemd 환경과 해당 완성 정의 필요 | 유닛 이름 |

Git 예시는 저장소 안에서 사용한다. 후보는 도구 설치 여부·완성 정의·현재 상태에 따라 달라진다. Docker·kubectl·systemctl 예시는 해당 환경에서 사용할 패턴이며, 위 버전 확인이 외부 서비스까지 검증했다는 뜻은 아니다.

1. fzf 창에서 검색어를 입력해 후보를 좁힌다. 프로세스 이름은 **`kill ` 뒤가 아니라 fzf 검색창에** 입력한다.
2. `↑` / `↓`로 이동하고 `Enter`로 명령줄에 삽입한다. `Tab` / `Shift-Tab`은 창 안에서는 복수 선택·해제와 이동을 담당한다. `ssh`의 목적지처럼 하나만 필요한 인자는 하나만 고른다.
3. 완성된 명령을 확인한 뒤 셸에서 다시 `Enter`를 눌러 실행한다. **PID 선택만으로 프로세스가 종료되지는 않는다.** `Esc` / `Ctrl-C`로 선택을 취소할 수 있다.

후보는 fzf가 새로 수집하는 것이 아니라 Fish의 `complete -C` 결과다. 원하는 후보가 없으면 먼저 아래처럼 공급 결과를 확인한다. **파일 경로만 나온다고 컨테이너·리소스·유닛 완성이 동작하는 것은 아니다.** 명령별 완성 정의가 없을 때 일반 파일 완성이 나타날 수 있다.

```fish
complete -C 'ssh '
complete -C 'kill '
complete -C 'git switch '
complete -C 'docker exec '
```

이미 기본 Tab pager가 열려 있으면 `Shift-Tab`은 fzf를 열지 않고 Fish 완성을 처리하므로, pager를 닫고 명령줄에서 시작한다.

근거: [fzf 0.74.4 공식 Fish 완성 구현](https://github.com/junegunn/fzf/blob/v0.74.4/shell/completion.fish). 파일 선택용 `Ctrl-T`와 다른 기능이며, 공통 선택 조작은 [fzf 치트시트](fzf.md)를 참고한다.

```fish
bind ctrl-s           # 현재 적용되는 바인딩 조회
bind --preset ctrl-s # 기본 제공 바인딩 조회
bind --user          # 사용자 바인딩 전체
bind --function-names # 바인딩에 쓸 편집 함수 이름
```

`bind`는 현재 셸의 상태다. 키가 기대와 다르면 `fish_key_reader`로 터미널이 전달하는 키를 확인한다. **기본 Ctrl-F와 사용자 정의 내용 검색**, **기본 Ctrl-R과 Atuin 검색**을 혼동하지 않는다.

## 2. 명령 구성 — 값은 리스트, 문법은 Fish

### 변수·범위·환경 전달

문법은 `set [범위] [export 여부] 이름 값...`. 모든 변수는 문자열 리스트이며 인덱스는 **1부터**, `-1`은 마지막이다. 공백 포함 값도 확장 시 Bash처럼 다시 단어 분리하지 않는다.

```fish
set -l label 'hello world'
printf '<%s>\n' $label       # <hello world>: 한 인자
set -l colors red blue
printf '%s\n' $colors[1]    # red
count $colors              # 2
set -q colors; and echo exists
set -e colors              # 변수 지우기
```

| 옵션 | 대상·수명 | 용도 |
|---|---|---|
| `-l` / `--local` | 현재 블록 | 함수·반복·조건의 지역 값 |
| `-g` / `--global` | 현재 Fish 프로세스 | 셸 세션 설정 |
| `-U` / `--universal` | 세션 간 공유·디스크 저장 | 재시작 후에도 유지할 값 |
| `-x` / `--export` | 자식 프로세스로 전달 | 범위와 별개로 조합 |
| `-q` / `--query` | 존재 여부 조회 | 조건문에서 사용 |
| `-e` / `--erase` | 변수나 원소 제거 | 설정 해제 |

```fish
set -gx EDITOR nvim
fish_add_path ~/.local/bin  # 기본 universal 저장; 기존 global 설정 시 그 범위 유지
# 파일로 선언적으로 관리하려면 config.fish에서:
# fish_add_path --global ~/.local/bin
```

`set -U`보다 같은 이름의 global 값이 우선할 수 있다. `set --show 이름`으로 범위·export 상태를 확인한다. 토큰·비밀값은 universal 변수에 저장하지 않는다.

### 확장·문자열·경로

| 목적 | Fish 문법 | Bash와의 경계 |
|---|---|---|
| 문자 그대로 | `'$HOME'` | 작은따옴표는 변수 확장 안 함 |
| 값 포함 문자열 | `"home=$HOME"` | 리스트와 빈 값 처리는 공식 명세 참고 |
| 명령 결과 | `(command args)` | 기본적으로 줄바꿈 단위 분할 |
| 공백 보존 결과 | `string split0` | NUL 구분 출력과 조합 |
| 파일 선택 | `*.log`, `**/*.fish` | 재귀 glob 지원; 불일치 처리 주의 |
| 산술 | `math '2 * 3'` | `$((...))` 대신 사용 |
| 문자열 변환 | `string replace`, `string match` | `${var/.../...}` 대신 전용 명령 |
| 경로 변환 | `path basename`, `path dirname` | 문자열과 경로 조작을 구분 |

```fish
set -l branch (string trim -- ' feature/search ')
string replace 'feature/' '' -- $branch  # search
path basename /tmp/example.txt          # example.txt
printf '%s\n' 'a b' 'c' | string join ',' # a b,c
```

Bash의 `export NAME=value`, `arr=(a b)`, `[[ ... ]]`, heredoc은 그대로 옮기지 않는다. Bash 전용 스크립트는 Bash로 실행하고, Fish에서 `source`하지 않는다.

## 3. 실행과 제어 — 종료 상태로 분기하기

파이프는 기본적으로 텍스트·바이트를 전달한다. Fish가 PowerShell처럼 외부 명령 출력을 객체로 변환하지는 않는다.

| 패턴 | 효과 |
|---|---|
| `a; b` | 순차 실행 |
| `a; and b` / `a && b` | a 성공 시 b 실행 |
| `a; or b` / `a \|\| b` | a 실패 시 b 실행 |
| `a \| b` | stdout을 다음 명령 stdin으로 연결 |
| `cmd >out.txt 2>err.txt` | 출력과 오류 분리 |
| `cmd >>out.txt` | 출력 추가 |
| `cmd >all.txt 2>&1` | 출력과 오류를 같은 파일로 |
| `$status` / `$pipestatus` | 마지막 명령 / 파이프 각 명령의 종료 상태 |
| `cmd &`, `jobs`, `fg`, `bg` | 백그라운드 실행·작업 제어 |

```fish
function greet --argument-names name
    if test -z "$name"
        printf 'name required\n' >&2
        return 2
    end
    printf 'hello %s\n' "$name"
end

greet Fish
for item in red blue
    string upper -- $item
end
```

`if 명령 ... end`, `while 명령 ... end`, `for 이름 in 값... ... end`, `switch 값 ... case 패턴 ... end`처럼 블록은 `end`로 닫는다. 함수 인자는 `$argv` 또는 `--argument-names`로 받는다. `return`은 종료 상태, 데이터는 stdout으로 전달한다. 외부 명령을 강제하려면 `command 이름`, 내장을 강제하려면 `builtin 이름`을 쓴다.

## 4. 반복 작업을 설정으로 만들기

### 설치·시작·설정 위치

macOS/Homebrew에서는 `brew install fish` 후 `fish`로 시험하고, `exit`로 이전 셸에 돌아온다. **시험 실행과 로그인 셸 변경은 별개**다. 다른 OS 설치법은 [공식 시작 안내](https://fishshell.com/docs/current/index.html#installation)를 따른다.

설정 루트는 기본 `~/.config/fish/`, `XDG_CONFIG_HOME` 지정 시 `$XDG_CONFIG_HOME/fish/`다. 런타임의 `$__fish_config_dir`로 실제 위치를 확인한다.

| 위치·명령 | 언제·무엇을 적용하는가 |
|---|---|
| `conf.d/*.fish` | 시작 시 설정 조각; `config.fish`보다 먼저 |
| `config.fish` | 시작 시 사용자 설정 |
| `functions/이름.fish` | 해당 함수가 필요할 때 자동 로드 |
| `completions/명령.fish` | 해당 명령의 완성이 필요할 때 로드 |
| `status is-interactive` | 대화형 초기화만 실행할 조건 |
| `status is-login` | 로그인 셸 여부; interactive와 다른 축 |
| `fish_config` | 브라우저 설정 UI |
| `fish_config theme show` | 터미널에서 테마 확인 |
| `fish --no-config` | 설정을 읽지 않고 시작; 충돌 분리용 |
| `fish --no-execute script.fish` | 실행 없이 구문 검사 |

```fish
# config.fish: 출력·위젯·프롬프트 초기화는 대화형 셸에 한정
if status is-interactive
    set -g fish_greeting '' # 시작 인사 출력 끄기
end
```

### 축약·함수·완성·이벤트의 책임

| 기능 | 무엇을 바꾸는가 | 대표 패턴 |
|---|---|---|
| Abbreviation | 실행 전 입력 문자열 | `abbr --add gco 'git checkout'` |
| Function | 이름으로 호출하는 실행 코드 | `function 이름 ... end` |
| Alias | 함수를 생성하는 편의 명령 | `alias ll 'ls -l'` |
| Completion | 특정 명령의 인자 후보 | `complete -c 명령 ...` |
| Binding | 키를 편집 함수·셸 명령에 연결 | `bind 키 동작` |
| Prompt | 프롬프트 출력 | `function fish_prompt ... end` |
| Event handler | 이벤트·변수·시그널에 반응 | `function ... --on-variable 이름` |

`abbr`는 공백·Enter 등으로 입력을 확장하므로 실행할 명령을 눈으로 확인할 수 있다. 지속 설정은 `config.fish`에 선언한다. 함수는 `funced 이름`으로 편집하고 `funcsave 이름`으로 파일에 저장할 수 있다. 이미 파일을 관리 중이면 원본 파일을 수정한다.

```fish
# 외부 의존성 없이 후보 생성 동작 확인
complete -c demo -f -a 'start stop status'
complete -C 'demo st'  # 후보와 설명을 출력; UI를 열거나 실행하지 않음
complete -e -c demo    # 예제 완성 제거
```

`complete`는 **후보 제공**, `commandline`은 **편집 중인 입력 조회·변경**, `bind`는 **키 연결**이다. `complete -C` 결과를 fzf에 넘기는 것만으로 디렉터리·인용·커서 위치 등 모든 완성 동작이 자동 보존되지는 않는다.

## 5. 외부 피커와 기본 키의 경계

| 통합 | 범위 | 주의 |
|---|---|---|
| fzf 공식 Fish 통합 | `fzf --fish \| source`; 파일·디렉터리·히스토리 위젯, 0.74.4에서 확인한 Shift-Tab 문맥 완성 | 일반 Tab은 유지; Shift-Tab으로 Fish 후보를 fzf에서 선택 |
| Atuin | `atuin init fish \| source`; 이력 검색 | Ctrl-R을 맡길 때 fzf 뒤에 초기화 |
| 사용자 검색 함수 | 예: 파일 내용 검색 후 경로 삽입 | 기본 Ctrl-F를 덮으면 제안 수락은 → 사용 |

기본 fzf 위젯과 사용자 함수의 검색 범위·명령·미리보기는 별도 설정이다. **검색 결과를 명령줄에 삽입하는 것과 명령을 실행하는 것은 다르다.** 선택 후 실행 전 입력을 확인한다. fzf와 Atuin의 상세 사용법은 각각의 치트시트로 분리한다.

## 생태계 (Ecosystem)

| 유형 | 프로젝트 | 역할 |
|---|---|---|
| 플러그인 관리자 | [Fisher](https://github.com/jorgebucaran/fisher) | 함수·완성·설정 조각 설치·업데이트·제거 |
| 프레임워크 | [Oh My Fish](https://github.com/oh-my-fish/oh-my-fish) | 플러그인·테마 관리 환경 |
| 프롬프트 | [Tide](https://github.com/IlanCosman/tide) | Fish용 프롬프트 |
| 검색 통합 | [fzf.fish](https://github.com/PatrickF1/fzf.fish) | 파일·Git·이력·프로세스·변수 검색; 일반 Tab 대체 아님 |
| 완성 UI | [fifc](https://github.com/gazorby/fifc) | Fish 후보를 fzf로 선택; 기본 Tab 바인딩 대체 |
| 큐레이션 | [awsm.fish](https://github.com/jorgebucaran/awsm.fish) | 플러그인·테마 발견 목록 |

설치 전 기존 함수 파일·키 바인딩의 소유권을 확인한다. Fisher는 기본적으로 Fish 설정 디렉터리에 파일을 설치하므로 dotfiles 관리 파일과 충돌할 수 있다. Zsh 전용 **fzf-tab은 Fish에서 로드할 수 없다.**

## 문제별 확인 순서와 참고

| 증상 | 먼저 확인 |
|---|---|
| 완성 후보가 너무 많음 | 완성 목록에서 Ctrl-S로 검색 |
| 키가 문서와 다르게 동작 | `bind`, `bind --preset`, `fish_key_reader`; 플러그인 초기화 순서 |
| 재시작 후 변수 값이 예상과 다름 | `set --show 이름`; global/universal과 설정 파일 중복 |
| 설정 변경이 반영되지 않음 | 새 `fish` 세션에서 확인; 무분별한 재-source는 초기화 중복 가능 |
| Bash 설정을 읽다가 오류 | Fish 문법으로 이식하거나 Bash로 해당 스크립트 실행 |

- [공식 Interactive use](https://fishshell.com/docs/current/interactive.html#tab-completion): pager 검색과 기본 편집 키
- [공식 Tutorial](https://fishshell.com/docs/current/tutorial.html), [Fish for Bash users](https://fishshell.com/docs/current/fish_for_bash_users.html): 문법·동작 차이
- [공식 Language](https://fishshell.com/docs/current/language.html), [`set`](https://fishshell.com/docs/current/cmds/set.html), [`bind`](https://fishshell.com/docs/current/cmds/bind.html), [`complete`](https://fishshell.com/docs/current/cmds/complete.html): 상세 명세
- [Shell](shell.md) / [Zsh](zsh.md): 셸 공통 개념과 문법 차이
- [fzf](fzf.md) / [Atuin](atuin.md) / [zoxide](zoxide.md): 선택·이력·디렉터리 점프
- [블로그 — Zsh·Fish 자동완성과 fzf의 연결 구조](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/shell/2026-11-19-shell-completion-and-fzf.md): 후보 제공·키 바인딩·검색 UI를 분리하고 전용 바인딩을 제거한 사례
