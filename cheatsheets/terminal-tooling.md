# Terminal Tooling Guide

> 터미널 중심 개발 환경에서 도구를 겹치지 않게 배치하기 위한 가이드.
> 핵심은 **범용 기반 도구 + 역할별 전용 도구**로 나누는 것이다.

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

Yazi는 fuzzy finder가 아니라 터미널 안에서 사용하는 file manager다.
Finder 같은 탐색을 키보드 중심 TUI로 수행한다.

주요 용도:

- 디렉터리 탐색
- 파일 preview
- rename/copy/move/delete
- 여러 파일을 보면서 작업
- 탐색한 디렉터리를 shell cwd로 넘기기

Vim 스타일의 `h/j/k/l` 이동에 익숙하면 진입 장벽이 낮다.

특히 shell directory handoff를 사용하면 다음 흐름이 가능하다.

```text
~/workspace
    |
    y
    |
Yazi에서 project/backend/src로 이동
    |
Yazi 종료
    |
~/workspace/project/backend/src $
```

역할은 zoxide와 다르다.

```text
zoxide -> 목적지를 알고 있을 때 빠르게 점프
Yazi   -> 구조를 보면서 목적지를 찾고 파일을 관리
```

## fzf — 범용 fuzzy picker

fzf는 file finder 자체가 아니라 **목록에서 항목을 fuzzy search로 선택하는
범용 picker**다.

기본 shell integration은 보통 다음 세 키를 제공한다.

```text
Ctrl-R -> history 선택
Ctrl-T -> 파일/경로 선택 후 현재 command line에 삽입
Alt-C  -> 디렉터리 선택 후 cd
```

하지만 fzf의 진짜 강점은 arbitrary CLI output을 받을 수 있다는 점이다.

```bash
fd | fzf
git branch | fzf
rg "TODO" | fzf
ps aux | fzf
```

전용 도구가 history, directory jump, filesystem browsing을 담당하더라도 fzf는
가벼운 selection infrastructure로 남겨두기 좋다.

자세한 사용법은 [fzf cheatsheet](fzf.md)를 참고한다.

## zoxide — 알고 있는 디렉터리로 빠르게 이동

zoxide는 방문 기록의 frecency를 학습해서 긴 경로를 기억하지 않고도 자주 가는
디렉터리로 이동하게 해준다.

```bash
z nova
z dotfiles
```

목적지를 대략 알고 있을 때는 파일 관리자나 directory picker를 여는 것보다
빠르다. fzf `Alt-C`와 일부 겹치지만 목적이 다르다.

```text
zoxide Alt-C와 비교 -> 기억 기반 빠른 이동
fzf Alt-C           -> 후보 목록에서 직접 선택
Yazi                -> 구조를 보면서 탐색
```

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

Git 자체는 lazygit, 원격 협업 상태는 gh-dash로 역할을 분리할 수 있다.

### Posting / ATAC — HTTP client

REST API를 터미널에서 호출하고 request/response를 인터랙티브하게 다루는 TUI
계열이다. `curl`을 완전히 대체하기보다는 Postman/Insomnia 같은 GUI를 터미널에
가깝게 가져오는 역할이다.

```text
Quick scripting / automation -> curl
Interactive API exploration  -> Posting or ATAC
```

API 테스트를 자주 한다면 후보가 된다.

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
GitHub dashboard              -> gh-dash
Docker TUI                    -> lazydocker
Kubernetes TUI                -> k9s
Logs                          -> lazyjournal
Database TUI                  -> rainfrog
System/process monitor        -> btop
Interactive HTTP client       -> Posting / ATAC
File-change automation        -> watchexec
Test UI inside Neovim         -> Neotest
Shell quality checks          -> ShellCheck + shfmt + prek + typos
```

핵심은 fzf 같은 범용 기반 도구를 없애는 것이 아니라, 자주 하는 작업에는 목적이
명확한 전용 도구를 배치하고 fzf를 필요할 때 재사용하는 selection primitive로
남기는 것이다.
