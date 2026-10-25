# Cheatsheets

명령어의 문법·대상·공통 패턴을 이해해, 외우지 않고도 의미를 유추할 수 있도록 만든 압축 레퍼런스.

작성 기준: [Cheatsheet 작성 원칙](../CHEATSHEET_GUIDELINES.md). 전체 명세와 최신 옵션은 각 도구의 공식 문서를 참고한다.

## 사용법

```
1단계: 도구 지도 / tools-dictionary → 어떤 문제를 해결하는가?
2단계: 개별 cheatsheet → 어떤 대상에 어떤 문법을 적용하는가?
3단계: 공식 문서 / tldr → 추가 옵션과 실제 예제가 필요한가?
```

**"명령어를 몰라서 검색하는데, 검색하려면 명령어를 알아야 하는" 간극**을 tools-dictionary.md가 메운다. 도구 이름은 알지만 명령어를 모를 때 먼저 훑어보는 용도.

## 콘텐츠 소유권

명령어 문법·약어·대상·반복 패턴의 압축 설명은 이 디렉터리에서 관리한다.
전체 옵션과 일반 사용법을 공식 문서 대신 복제하지 않는다.

블로그는 내부 원리와 심화 학습, dotfiles는 실제 설정과 재현을 담당한다.
도구 선택과 대체·보완 관계는 Devkit의 공통 도구 지도에서 관리한다.

## 도구 사전

| 파일 | 설명 |
|------|------|
| [tools-dictionary.md](tools-dictionary.md) | 50+ CLI 도구/개념 사전 + 핵심 명령어 (도구 발견용; tldr·공식 문서와 역할 분리) |

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
| [atuin.md](atuin.md) | Atuin 구조화 shell history 검색 |
| [fzf.md](fzf.md) | fzf 범용 fuzzy finder |
| [zoxide.md](zoxide.md) | zoxide 방문 기반 디렉터리 점프 |
| [powershell.md](powershell.md) | PowerShell — Bash와 다른 점 위주 |

## 시스템 & 서버

| 파일 | 설명 |
|------|------|
| [ssh.md](ssh.md) | ssh-agent/ssh-add, ~/.ssh/config, scp/rsync |
| [systemd.md](systemd.md) | systemd 서비스/타이머 관리 + journalctl 로그 |

## macOS

| 파일 | 설명 |
|------|------|
| [chrome.md](chrome.md) | Chrome 창 미표시 복구·headless 테스트 프로세스 정리 |
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
| [jj.md](jj.md) | Jujutsu(jj) — change, revision, operation log 및 Git 원격 연동 |
| [git-delta.md](git-delta.md) | git-delta — Git diff pager |
| [chezmoi.md](chezmoi.md) | chezmoi — dotfiles 관리 |

## 보안 & 비밀정보

| 파일 | 설명 |
|------|------|
| [sops.md](sops.md) | SOPS + age로 설정 파일을 암호화해 Git에서 관리 |

## 개발 도구

| 파일 | 설명 |
|------|------|
| [mise.md](mise.md) | mise — 다언어 런타임 버전 관리 |
| [uv.md](uv.md) | uv — Python package/project manager |
| [taskwarrior.md](taskwarrior.md) | Taskwarrior 3.5 — 태스크 관리 |
| [python-pypi-publishing.md](python-pypi-publishing.md) | Python PyPI Trusted Publishing |
| [claude-code.md](claude-code.md) | Claude Code CLI |
| [ccusage.md](ccusage.md) | ccusage 사용량 집계와 임계치 경보 |
| [opencode.md](opencode.md) | opencode — 터미널 AI 코딩 에이전트 |


## 목록 원본

`catalog.json`은 블로그가 사용하는 목록과 참고 링크의 원본이다. 블로그는 이 데이터를 가져와 자체 화면에서 표시한다.
