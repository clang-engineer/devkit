# Cheatsheets

자주 쓰지만 매번 검색하게 되는 명령어/문법 모음.

## 에디터 & TUI

| 파일 | 설명 |
|------|------|
| [vim.md](vim.md) | Vim 모드별 명령어 |
| [lazyvim.md](lazyvim.md) | LazyVim 키맵 |
| [lazygit.md](lazygit.md) | LazyGit TUI 단축키 |
| [tmux.md](tmux.md) | Tmux 세션/윈도우/패널 |

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
| [rocky-linux.md](rocky-linux.md) | Rocky Linux (firewalld, SELinux, certbot) |

## macOS

| 파일 | 설명 |
|------|------|
| [macos-admin.md](macos-admin.md) | macOS troubleshoot (LaunchDaemons, Secure Input 등) |
| [aerospace.md](aerospace.md) | macOS 타일링 WM |
| [hammerspoon.md](hammerspoon.md) | macOS 자동화/윈도우 관리 (Lua) |

## 데이터

| 파일 | 설명 |
|------|------|
| [sql-snippets.md](sql-snippets.md) | PostgreSQL 운영 패턴 (`information_schema` ALTER 자동 생성 등) |
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

> `delta`(git diff 페이저)는 [modern-cli.md](modern-cli.md)에 통합.

## 개발 도구

| 파일 | 설명 |
|------|------|
| [curl.md](curl.md) | curl HTTP 요청 |
| [claude-code.md](claude-code.md) | Claude Code CLI |

## 언어

| 파일 | 설명 |
|------|------|
| [c-cpp.md](c-cpp.md) | C/C++ 스니펫 + Google C++ Style + GDB 디버거 |
