# Cheatsheets

자주 쓰지만 매번 검색하게 되는 명령어/문법 모음.

## 사용법

```
1단계: tools-dictionary.md → "이 도구에 이 명령어가 있다"
2단계: tldr → "이 명령어의 사용법이 이렇다"
3단계: 개별 cheatsheet → "이 도구로 이런 워크플로우를 한다"
```

**"명령어를 몰라서 검색하는데, 검색하려면 명령어를 알아야 하는" 간극**을 tools-dictionary.md가 메운다. 도구 이름은 알지만 명령어를 모를 때 먼저 훑어보는 용도.

## 콘텐츠 소유권

도구의 일반적인 소개, 설치, 설정, 명령, 옵션, 사용 예와 문제 해결은 이
디렉터리의 도구별 문서를 원본으로 관리한다.

블로그는 도구의 선택 이유, 비교, 적용 경험과 workflow를 중심으로 작성한다. 글을
독립적으로 이해하는 데 필요한 짧은 소개와 대표 명령은 포함할 수 있지만, 전체
사용법을 중복 관리하지 않고 해당 cheatsheet를 연결한다.

## 도구 사전

| 파일 | 설명 |
|------|------|
| [tools-dictionary.md](tools-dictionary.md) | 50+ CLI 도구/개념 사전 + 핵심 명령어 (tldr 대체) |

## 에디터 & TUI

| 파일 | 설명 |
|------|------|
| [vim.md](vim.md) | Vim 모드별 명령어 |
| [lazyvim.md](lazyvim.md) | LazyVim 키맵 |
| [lazygit.md](lazygit.md) | LazyGit TUI 단축키 |
| [tmux.md](tmux.md) | Tmux 세션/윈도우/패널 |
| [ghostty.md](ghostty.md) | Ghostty 터미널 탭/분할/키맵 |
| [yazi.md](yazi.md) | Yazi — Rust TUI 파일 매니저 |
| [terminal-tui.md](terminal-tui.md) | 현대적 TUI 도구 지도와 선택 기준 |

## 셸

| 파일 | 설명 |
|------|------|
| [shell.md](shell.md) | Bash `set` 옵션, `&`/`&&`/`;`/`\|\|`, job 관리 |
| [zsh.md](zsh.md) | Zsh 단축키, glob, alias |
| [powershell.md](powershell.md) | PowerShell — Bash와 다른 점 위주 |

## 시스템 & 서버

| 파일 | 설명 |
|------|------|
| [ssh.md](ssh.md) | ssh-agent/ssh-add, ~/.ssh/config, scp/rsync |
| [systemd.md](systemd.md) | systemd 서비스/타이머 관리 + journalctl 로그 |

## macOS

| 파일 | 설명 |
|------|------|
| [aerospace.md](aerospace.md) | macOS 타일링 WM |
| [hammerspoon.md](hammerspoon.md) | macOS 자동화/윈도우 관리 (Lua) |

## 데이터

| 파일 | 설명 |
|------|------|
| [elasticsearch.md](elasticsearch.md) | Elasticsearch 쿼리/관리 |

## Git & 버전 관리

| 파일 | 설명 |
|------|------|
| [git.md](git.md) | Git 명령어 (브랜치, stash, rebase, tag 등) |
| [chezmoi.md](chezmoi.md) | chezmoi — dotfiles 관리 |

## 보안 & 비밀정보

| 파일 | 설명 |
|------|------|
| [sops.md](sops.md) | SOPS + age로 설정 파일을 암호화해 Git에서 관리 |

## 개발 도구

| 파일 | 설명 |
|------|------|
| [mise.md](mise.md) | mise — 다언어 런타임 버전 관리 |
| [taskwarrior.md](taskwarrior.md) | Taskwarrior 3.5 — 태스크 관리 |
| [python-pypi-publishing.md](python-pypi-publishing.md) | Python PyPI Trusted Publishing |
| [claude-code.md](claude-code.md) | Claude Code CLI |
| [ccusage.md](ccusage.md) | ccusage 사용량 집계와 임계치 경보 |
| [opencode.md](opencode.md) | opencode — 터미널 AI 코딩 에이전트 |
