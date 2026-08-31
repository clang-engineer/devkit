# Cheatsheets

자주 쓰지만 매번 검색하게 되는 명령어/문법 모음.

## 콘텐츠 소유권

도구의 일반적인 소개, 설치, 설정, 명령, 옵션, 사용 예와 문제 해결은 이
디렉터리의 도구별 문서를 원본으로 관리한다.

블로그는 도구의 선택 이유, 비교, 적용 경험과 workflow를 중심으로 작성한다. 글을
독립적으로 이해하는 데 필요한 짧은 소개와 대표 명령은 포함할 수 있지만, 전체
사용법을 중복 관리하지 않고 해당 cheatsheet를 연결한다.

## 에디터 & TUI

| 파일 | 설명 |
|------|------|
| [vim.md](vim.md) | Vim 모드별 명령어 |
| [lazyvim.md](lazyvim.md) | LazyVim 키맵 |
| [lazygit.md](lazygit.md) | LazyGit TUI 단축키 |
| [tmux.md](tmux.md) | Tmux 세션/윈도우/패널 |
| [smug.md](smug.md) | smug — 선언형 YAML로 tmux 세션 부팅 |
| [ghostty.md](ghostty.md) | Ghostty 터미널 탭/분할/키맵 |

## 모던 CLI 도구 (grep/find/cat/ls 대체)

| 파일 | 설명 |
|------|------|
| [rg.md](rg.md) | ripgrep — 텍스트 검색 (`grep` 대체) |
| [fzf.md](fzf.md) | fzf — 퍼지 파인더 (Ctrl+R/T, 파이프 조합) |
| [jq.md](jq.md) | jq — JSON 파이프라인 가공 |
| [modern-cli.md](modern-cli.md) | bat / eza / fd / tree / zoxide / delta / tldr 통합 |

## 텍스트 처리

| 파일 | 설명 |
|------|------|
| [sed-awk.md](sed-awk.md) | sed (치환·삽입·삭제) + awk (필드·집계·보고서) |
| [regex.md](regex.md) | 정규표현식 문법 + 도구별 플레이버(BRE/ERE/PCRE) 차이 |
| [compression.md](compression.md) | tar / gzip / zip / xz / bzip2 / 7z |

## 셸

| 파일 | 설명 |
|------|------|
| [shell.md](shell.md) | Bash `set` 옵션, `&`/`&&`/`;`/`\|\|`, job 관리 |
| [zsh.md](zsh.md) | Zsh 단축키, glob, alias |
| [powershell.md](powershell.md) | PowerShell — Bash와 다른 점 위주 (PS 5.1 vs 7, 서비스 관리 sc/nssm 포함) |

## 시스템 & 서버

| 파일 | 설명 |
|------|------|
| [linux-process.md](linux-process.md) | 프로세스 찾기·종료 (`pgrep`/`pkill`/`lsof`/`kill` 시그널) |
| [linux.md](linux.md) | Linux 디렉터리 구조 + 자원 모니터링 + 네트워크 |
| [ssh.md](ssh.md) | ssh-agent/ssh-add, ~/.ssh/config, scp/rsync |
| [systemd.md](systemd.md) | systemd 서비스 관리 + journalctl 로그 |
| [nginx.md](nginx.md) | Nginx 설정/명령어 |
| [openssl.md](openssl.md) | 인증서/암호화 |
| [rocky-linux.md](rocky-linux.md) | Rocky Linux / RHEL 계열 (dnf, firewalld, SELinux) |

## macOS

| 파일 | 설명 |
|------|------|
| [macos-admin.md](macos-admin.md) | macOS troubleshoot (LaunchDaemons, Secure Input 등) |
| [aerospace.md](aerospace.md) | macOS 타일링 WM |
| [hammerspoon.md](hammerspoon.md) | macOS 자동화/윈도우 관리 (Lua) |

## 데이터

| 파일 | 설명 |
|------|------|
| [harlequin.md](harlequin.md) | Harlequin 기본 사용법 (`--config-path`, `--profile`) |
| [sql-snippets.md](sql-snippets.md) | PostgreSQL 운영 패턴 (`information_schema` ALTER 자동 생성 등) |
| [vertica.md](vertica.md) | Vertica — 계정 만료 해제(chage) + v_catalog/v_monitor 용량·이력 조회 |
| [elasticsearch.md](elasticsearch.md) | Elasticsearch 쿼리/관리 |
| [kibana.md](kibana.md) | KQL, Dev Tools, Discover, 운영 진단 |

## 컨테이너 & 빌드

| 파일 | 설명 |
|------|------|
| [kubectl.md](kubectl.md) | Kubernetes CLI — get/logs/exec/port-forward/apply/rollout |
| [docker.md](docker.md) | Docker / Compose 명령어 + 오프라인 바이너리 설치 |
| [make.md](make.md) | Makefile — 자동변수, 패턴 룰, .PHONY, 함수 |

## Git & 버전 관리

| 파일 | 설명 |
|------|------|
| [git.md](git.md) | Git 명령어 (브랜치, stash, rebase, tag 등) |
| [gh.md](gh.md) | GitHub CLI — PR/이슈/Actions/API |
| [code-review-glossary.md](code-review-glossary.md) | 리뷰 약어/용어 (LGTM, PTAL, nit:, Draft PR 등) |
| [chezmoi.md](chezmoi.md) | chezmoi — dotfiles 관리 (source/target 모델, 네이밍 규칙, 템플릿) |

## 설정 파일 형식

| 파일 | 설명 |
|------|------|
| [toml.md](toml.md) | TOML 문법 — 값, 배열, 테이블 `[ ]`, 테이블 배열 `[[ ]]` |

> `delta`(git diff 페이저)는 [modern-cli.md](modern-cli.md)에 통합.

## 개발 도구

| 파일 | 설명 |
|------|------|
| [terminal-tooling.md](terminal-tooling.md) | 터미널 도구 역할 분담과 선택 가이드 |
| [mise.md](mise.md) | mise — 다언어 런타임 버전 관리 (rbenv/jenv/pyenv/nvm 통합, config+activate) |
| [curl.md](curl.md) | curl HTTP 요청 |
| [taskwarrior.md](taskwarrior.md) | Taskwarrior 3.5 — 태스크 관리, 필터, 날짜, JSON export, TaskChampion 동기화 |
| [python-pypi-publishing.md](python-pypi-publishing.md) | Python PyPI Trusted Publishing — uv 빌드, GitHub OIDC 배포, 검증·문제 해결 |
| [claude-code.md](claude-code.md) | Claude Code CLI |
| [ccusage.md](ccusage.md) | ccusage 사용량 집계와 임계치 경보 |
| [opencode.md](opencode.md) | opencode — provider-agnostic 터미널 AI 코딩 에이전트 (인증·모델 선택) |
| [gdb.md](gdb.md) | GDB — GNU 디버거 (중단점·스택·변수·메모리 조사) |
