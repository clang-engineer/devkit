# Terminal Tooling Guide

> 터미널 중심 개발 환경에서 도구를 겹치지 않게 배치하기 위한 가이드.
> 핵심은 **범용 기반 도구 + 역할별 전용 도구**로 나누는 것이다.

## 도구 용어집

`packages/Brewfile` 기준으로, 가끔 헷갈리는 도구명을 핵심만 정리한다.
신뢰도: `확인`(공식 근거), `추정`(의미 추론), `미확인`(근거 부족)

| 항목 | 의미 | 신뢰도 |
|---|---|---|
| Atuin | Tasmanian devil(태즈메이니아 악마) | 확인 |
| fzf | fuzzy finder | 추정 |
| rg (ripgrep) | rip + grep | 확인 |
| fd | find 대체 도구 이름의 축약형 | 추정 |
| sesh | session의 준말 | 추정 |
| Yazi | 프로젝트 고유명칭 성격이 강함 | 미확인 |
| delta | 변화량/차이를 뜻하는 delta | 보통 |

## 한눈에 보기

| 도구 | 역할 | 사용 방식 | 성격 |
|---|---|---|---|
| ShellCheck | shell 정적 분석 | 자동화 가능 | 품질 관리 |
| shfmt | shell formatter | 자동화 가능 | 품질 관리 |
| PSScriptAnalyzer | PowerShell 분석/포맷 | 자동화 가능 | 품질 관리 |
| prek | commit 전 검사 runner | 자동 | 자동화 기반 |
| typos | 코드·문서 오타 검사 | 자동화 가능 | 품질 관리 |
| Atuin | 구조화된 shell history | `Ctrl-R` | 일상 도구 |
| Yazi | 터미널 파일 탐색·관리 | `y` 등 | 일상 도구 |
| fzf | 범용 fuzzy picker | 키바인딩/파이프 | 기반 도구 |
| zoxide | 자주 가는 디렉터리 점프 | `z`, `zi` | 일상 도구 |
| watchexec | 파일 변경 시 명령 재실행 | 직접 실행 | 작업 자동화 |
| Neotest | Neovim 테스트 실행/결과 UI | Neovim keymap | 개발 도구 |
| LazyVim chezmoi extra | Neovim에서 chezmoi 편집 | Neovim 명령 | 설정 관리 |
| Mergiraf | syntax-aware Git merge | Git 뒤에서 자동 | Git 보조 |
| JankyBorders | macOS 활성 창 border | 자동 | UI 보조 |
| lazydocker | Docker TUI | `lazydocker` | 운영 도구 |
| hyperfine | CLI benchmark | 직접 실행 | 측정 도구 |

## ShellCheck + shfmt + prek + typos

이 네 도구는 하나의 품질관리 묶음으로 생각하면 쉽다.

### ShellCheck

ShellCheck는 shell 코드를 실행하지 않고 분석해서 quoting, globbing,
portability, shell semantics 등의 실수를 잡는다.

```bash
rm -rf $DIR/*
```

같은 코드는 변수 quoting 문제를 일으킬 수 있다. ShellCheck는 이런 shell
특유의 함정을 정적 분석으로 찾는다.

### shfmt

shfmt는 shell용 formatter다. 역할로 보면 ShellCheck가 linter라면 shfmt는
Prettier에 가깝다.

```bash
if [ "$OS" = "macos" ];then
echo mac
fi
```

같은 코드를 일관된 들여쓰기와 문법 간격으로 정리한다.

### typos

소스, 설정, 문서의 흔한 영문 오타를 빠르게 검사한다.

```text
sucess   -> success
recieve  -> receive
lenght   -> length
```

프로젝트 고유명사나 한국어가 섞인 저장소에서는 작은 allow-list를 유지하는
편이 좋다.

### prek

prek는 검사기가 아니라 검사기들을 실행하는 runner다. pre-commit 설정과
호환되며 ShellCheck, shfmt, typos 같은 검사를 commit 전에 묶어 실행할 수
있다.

```text
git commit
    |
   prek
    |-- ShellCheck
    |-- shfmt
    `-- typos
```

설정 후에는 각 검사 명령을 매번 기억할 필요가 없다. 처음부터 많은 hook을
넣기보다 빠르고 중요한 검사부터 추가한다.

### PSScriptAnalyzer

PowerShell 쪽에서는 ShellCheck와 비슷한 위치다. PowerShell 코드의 규칙,
best practice, 잠재적인 문제를 검사하고 formatting에도 사용할 수 있다.
Windows 스크립트를 실제로 관리할 때 위 품질관리 묶음에 추가한다.

## Atuin — shell history 전담

기본 shell history나 fzf `Ctrl-R`은 주로 명령 문자열을 찾는다. Atuin은
history를 구조화해서 저장한다.

대표적으로 다음 정보를 함께 활용할 수 있다.

- 실행한 command
- directory
- timestamp
- duration
- exit status
- host/session

따라서 "이 프로젝트 디렉터리에서 전에 실행했던 Gradle 명령" 같은 history를
찾기 좋다.

Atuin을 도입한다면 역할은 다음처럼 나누는 것이 깔끔하다.

```text
Ctrl-R -> Atuin history
fzf    -> generic fuzzy picker
```

fzf를 제거하는 것이 아니라 history 역할만 Atuin에 넘긴다. 동기화를 켤 때는
command argument에 token이나 secret이 남을 수 있으므로 history filter를 먼저
검토한다.

## Yazi — 터미널 파일 관리자

Yazi는 탐색/조작/정렬 역할에 집중한다.
목표는 구조를 보면서 파일과 디렉터리를 찾고, 종료 시 현재 경로를 shell에
반영하는 것이다.

- `zoxide`: 목적지가 대략적으로 떠오를 때 빠른 점프
- `Yazi`: 구조를 보며 정확히 찾을 때
- `fzf`: 후보 목록에서 빠르게 선택할 때

자세한 키맵은 [yazi.md](yazi.md).

## fzf — 범용 fuzzy picker
`fzf`는 후보 목록을 fuzzy 검색으로 좁히는 **선택기**다.
파이프 입력과 잘 맞기 때문에, 다른 도구의 출력(파일/브랜치/프로세스)을
중간에서 연결할 때 강하다.

Atuin을 쓰면 `Ctrl-R`은 history로 나누고, `fzf`는 `Ctrl-T/Alt-C`와
파이프 기반 선택에 집중해 쓰는 편이 안정적이다.

핵심 사용 예/키바인딩은 [fzf.md](fzf.md).

## zoxide — 알고 있는 디렉터리로 빠르게 이동
`zoxide`는 frecency 기반으로 기억 기반 점프를 빠르게 처리한다.
주요 사용은 `z`/`zi`로, 상세 커맨드는 [modern-cli.md](modern-cli.md)에
정리되어 있다.

## watchexec — 파일 변경 시 명령 재실행

watchexec은 특정 언어에 종속되지 않는 file watcher다.

```bash
watchexec ./gradlew test
watchexec npm test
watchexec cargo test
```

파일이 바뀌면 지정한 명령을 다시 실행한다. 테스트, formatter, generator,
development server 등 어떤 command에도 붙일 수 있다.

항상 켜두는 서비스라기보다 반복 실행이 필요한 작업에서 직접 시작하는 도구다.

## Neotest — Neovim 테스트 workflow

Neotest는 테스트를 Neovim 안에서 실행하고 결과를 탐색하는 공통 UI를 제공한다.

대표 workflow:

- cursor 위치의 가장 가까운 테스트 실행
- 현재 파일의 테스트 실행
- 실패한 테스트 재실행
- 테스트 tree와 상태 확인
- 실패 output 확인

```text
UserServiceTest
 |-- OK createUser
 |-- FAIL deleteUser
 `-- OK updateUser
```

LazyVim에서는 `test.core` extra로 진입할 수 있다. 실제 가치는 사용하는 언어의
adapter가 안정적으로 동작하는지에 달려 있으므로 필요한 언어 adapter만 둔다.

## LazyVim chezmoi extra

chezmoi에서는 적용된 홈 파일과 source file이 다를 수 있다.

```text
~/.zshrc
    <->
~/dotfiles/chezmoi/dot_zshrc
```

LazyVim의 chezmoi extra는 template highlighting, source picker,
`ChezmoiEdit` 같은 기능으로 이 간접 계층을 Neovim에서 다루기 쉽게 한다.

chezmoi source directory가 기본 위치가 아니라면 source path를 별도로 맞춰야
한다. 큰 설정 디렉터리를 symlink로 직접 편집하는 구성에서는 체감이 상대적으로
작을 수 있다.

## Mergiraf — syntax-aware Git merge

일반적인 Git merge는 기본적으로 line 중심이다. Mergiraf는 지원하는 언어에서
syntax tree를 활용해 코드 구조를 고려한 merge를 시도한다.

```text
Git       -> line-aware merge
Mergiraf  -> syntax-aware merge
```

서로 다른 함수 수정, 코드 이동 등에서 발생하는 불필요한 conflict를 줄이는 것이
목적이다. Git merge driver로 설정한 뒤에는 평소처럼 `git merge`, `git rebase`
등을 사용하면 된다.

복잡한 conflict가 드문 환경에서는 선제 설치보다 필요가 생겼을 때 도입하는 편이
낫다.

## JankyBorders — macOS focus 표시

JankyBorders는 현재 focus된 macOS window에 border를 표시한다. AeroSpace처럼
창을 tile해서 여러 개 띄우는 환경에서 현재 keyboard focus가 어느 창인지 빠르게
구분하는 용도다.

로그인 시 자동 실행하도록 구성하면 평소 직접 조작할 일은 거의 없다. layout이나
window management를 대신하는 도구가 아니라 시각적 보조 도구다.

## lazydocker — Docker용 TUI

lazydocker는 lazygit과 비슷한 방식으로 Docker/Compose 리소스를 터미널에서
관리하는 TUI다.

주요 대상:

- containers
- images
- volumes
- networks
- logs
- container restart/stop
- shell/exec

Docker GUI가 충분하면 필수는 아니다. tmux 안에서 Docker 작업까지 키보드로
처리하고 싶을 때 가치가 커진다.

## 추가로 볼 만한 TUI 도구

`lazy*`라는 이름이 붙었다고 같은 프로젝트 계열은 아니다. 공통점은 복잡한 CLI
작업을 키보드 중심 TUI로 묶어 주는 경우가 많다는 점이다. 아래 도구들은 같은
맥락에서 추가 후보로 볼 만하다.

### lazyjournal — logs

systemd journal, 파일 로그, Docker/Podman/Compose/Kubernetes 로그를 TUI에서
탐색하고 필터링하는 도구다. `journalctl`, `docker logs`, `grep`을 오가며 보는
작업이 많을수록 가치가 커진다.

```text
Logs -> lazyjournal
```

서버 운영이나 장애 대응이 잦다면 lazydocker보다 더 자주 쓰게 될 수도 있다.

### k9s — Kubernetes

이름에 `lazy`는 없지만 Kubernetes 영역에서는 lazydocker와 가장 비슷한 포지션의
대표 TUI다. pod, deployment, service 등 리소스를 탐색하고 logs, exec, describe,
delete 같은 작업을 키보드 중심으로 처리한다.

```text
Docker      -> lazydocker
Kubernetes  -> k9s
```

Kubernetes를 실제로 자주 다루지 않는다면 선제 설치할 필요는 없다.

### rainfrog — database

터미널에서 DB를 탐색하고 SQL을 실행하는 TUI다. database/table/schema를 보면서
쿼리할 수 있어 GUI DB client와 raw `psql`/`mysql` 사이에 있는 느낌이다.

```text
Database -> rainfrog
```

rainfrog 자체에 connection picker가 있다. 설정 파일의 `[db]` 아래에 여러 연결을
등록하고 `default = true`를 지정하지 않으면 시작할 때 선택 목록이 나타난다.

```toml
[db]
local = { host = "localhost", driver = "postgres", port = 5432, database = "app", username = "app" }
staging = { connection_string = "postgresql://app@db.example.com:5432/app", driver = "postgres" }
```

기본 OS 경로 대신 설정 위치를 고정하려면 `RAINFROG_CONFIG`에 **파일이 아니라
설정 파일이 들어 있는 디렉터리**를 지정한다.

```bash
export RAINFROG_CONFIG="$HOME/.config/rainfrog"
rainfrog
```

연결 문자열과 TOML에는 비밀번호를 넣지 않는다. 연결을 선택한 뒤 입력한
비밀번호는 macOS Keychain 등 플랫폼 keychain에 저장할 수 있다. 최초 접속에서는
비밀번호를 입력해야 하지만, 이후에는 rainfrog가 선택한 연결에 대응하는 값을
keychain에서 조회한다. 이 저장소는 `psql`이나 Dadbod이 사용하는 `.pgpass`와
별개이며, 저장된 값을 바꾸려면 `rainfrog --reenter-password`로 다시 입력한다.

PostgreSQL은 최우선 지원 대상이지만 Vertica는 공식 지원 대상이 아니고 Oracle
지원은 실험적이므로, 여러 DBMS를 한 도구로 통합할 목적이라면 지원 범위를 먼저
확인한다. 또한 프로젝트는 아직 breaking change 가능성과 쓰기 권한이 있는
production DB 사용에 대한 주의를 명시하고 있다.

H2는 직접 지원하지 않는다. H2의 실험적인 PostgreSQL protocol server를 거치면
테이블 목록까지 보일 수 있지만, rainfrog가 쿼리마다 호출하는
`pg_backend_pid()`와 쿼리 취소용 `pg_cancel_backend()`, PostgreSQL catalog가 H2와
호환되지 않아 일반적인 사용 경로로 삼기 어렵다. 호환 함수를 DB에 추가해
우회하기보다 H2만 공식 Shell로 분리하는 편이 안정적이다.

```bash
java -cp "$(brew --prefix h2)/libexec/bin/*" org.h2.tools.Shell \
  -url 'jdbc:h2:./build/h2db/app;MODE=PostgreSQL;AUTO_SERVER=TRUE' \
  -user sa
```

즉 PostgreSQL/MySQL/SQLite 탐색은 rainfrog, H2는 H2 Shell처럼 DBMS의 native
접속 경로를 사용한다. Harlequin이나 lazysql 같은 다른 풀스크린 TUI도 H2/JDBC를
직접 지원하지 않으므로, H2 하나 때문에 기본 TUI를 교체할 필요는 없다.

Neovim의 dadbod workflow가 편하면 겹칠 수 있으므로, DB 작업을 editor 밖에서도
자주 하는지가 도입 기준이다.

### btop — process/system monitor

CPU, memory, disk, network, process를 한 화면에서 보는 시스템 모니터다. `top`,
`htop`, `ps`를 더 시각적으로 묶은 TUI에 가깝다.

```text
Processes / system metrics -> btop
```

운영 서버에 들어가 상태를 빠르게 훑는 용도로 유용하다.

### gh-dash — GitHub dashboard

GitHub PR과 issue를 터미널에서 대시보드처럼 보는 TUI다. 브라우저를 열지 않고
review 대기 PR, 내 PR, issue 등을 빠르게 훑을 수 있다.

```text
Local Git -> lazygit
GitHub    -> gh-dash
```

Git 자체의 commit/branch/rebase 작업은 lazygit, GitHub 원격 협업 상태는 gh-dash로
나누면 역할이 겹치지 않는다. PR/issue를 자주 보지 않는다면 `gh` CLI만으로도
충분하다.

### Posting / ATAC — HTTP API

Postman 같은 HTTP client를 터미널에서 쓰고 싶을 때 보는 TUI 계열이다. request,
headers, body, response를 한 화면에서 다룬다.

```text
HTTP API -> Posting or ATAC
```

둘을 동시에 둘 필요는 없다. curl/httpie 또는 editor의 REST client가 충분하다면
추가하지 않고, terminal-first API testing이 반복될 때 하나를 선택한다.

## hyperfine — CLI benchmark

hyperfine은 command 실행 시간을 여러 번 측정해서 평균과 편차를 비교한다.

```bash
hyperfine 'rg foo .' 'grep -R foo .'
```

shell startup, build command, CLI 대안 등을 감으로 비교하지 않고 반복 가능한
수치로 확인할 때 사용한다. 일상 도구보다는 필요할 때 꺼내는 측정기다.

## 역할 분담 예시

터미널 중심 환경에서는 다음처럼 역할을 나누면 겹침이 적다.

```text
Shell history                 -> Atuin
Known/frequent directory jump -> zoxide
Filesystem browse/manage      -> Yazi
Search while editing          -> Neovim/LazyVim picker
Arbitrary list selection      -> fzf
Git UI                        -> lazygit
Docker TUI                    -> lazydocker
Logs                          -> lazyjournal
Kubernetes                    -> k9s
Database                      -> rainfrog
Processes/system metrics      -> btop
GitHub PR/issues              -> gh-dash
HTTP API                      -> Posting or ATAC
File-change automation        -> watchexec
Test UI inside Neovim         -> Neotest
Shell quality checks          -> ShellCheck + shfmt + prek + typos
```

핵심은 fzf 같은 범용 기반 도구를 없애는 것이 아니라, 자주 하는 작업에는 목적이
명확한 전용 도구를 배치하고 fzf를 필요할 때 재사용하는 selection primitive로
남기는 것이다.
