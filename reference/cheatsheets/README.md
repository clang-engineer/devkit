# Cheatsheets

명령어의 문법·대상·공통 패턴을 이해해, 외우지 않고도 의미를 유추할 수 있도록 만든 압축 레퍼런스.

작성 기준: [Cheatsheet 작성 원칙](../CHEATSHEET_GUIDELINES.md). 전체 명세와 최신 옵션은 각 도구의 공식 문서를 참고한다.

## 사용법

```
1단계: 도구 지도 / tools-dictionary → 어떤 문제를 해결하는가?
2단계: 개별 cheatsheet → 어떤 대상에 어떤 문법을 적용하는가?
3단계: 공식 문서 / tldr → 추가 옵션과 실제 예제가 필요한가?
```

**도구 이름을 모르더라도 작업 목적에서 출발할 수 있도록** tools-dictionary.md가 연결한다. 개별 명령어의 전체 옵션은 공식 문서에서 확인한다.

## 콘텐츠 소유권

명령어 문법·약어·대상·반복 패턴의 압축 설명은 이 디렉터리에서 관리한다.
전체 옵션과 일반 사용법을 공식 문서 대신 복제하지 않는다.

블로그는 내부 원리와 심화 학습, dotfiles는 실제 설정과 재현을 담당한다.
도구 선택과 대체·보완 관계는 Devkit의 공통 도구 지도에서 관리한다.

## 도구 발견 지도

| 파일 | 설명 |
|------|------|
| [tools-dictionary.md](tools-dictionary.md) | 작업 목적별 CLI 발견 지도 — 도구 역할·대체/보완·파이프라인 |

## 에디터 & TUI

| 파일 | 설명 |
|------|------|
| [vim.md](vim.md) | Vim Operator·Motion·Text Object 조합 문법 |
| [lazyvim.md](lazyvim.md) | LazyVim Leader 그룹·키맵 문법 |
| [lazygit.md](lazygit.md) | LazyGit 패널별 키의 의미 |
| [tmux.md](tmux.md) | tmux 대상 계층·명령 문법·세션 유지 |
| [ghostty.md](ghostty.md) | Ghostty 창·탭·분할의 관계 |
| [yazi.md](yazi.md) | Yazi — Rust TUI 파일 매니저 |

## 검색·HTTP·작업 실행·측정

| 파일 | 설명 |
|---|---|
| [rg.md](rg.md) | ripgrep 검색 범위·패턴·출력의 조합 |
| [httpie.md](httpie.md) | HTTPie 요청 구분자·헤더·JSON 필드 |
| [just.md](just.md) | just Recipe·인자·의존성 |
| [hyperfine.md](hyperfine.md) | hyperfine 반복 측정·워밍업·비교 |

## 셸

| 파일 | 설명 |
|------|------|
| [shell.md](shell.md) | Bash 명령 해석·확장·실행·작업 제어 |
| [zsh.md](zsh.md) | Zsh ZLE·History·Glob·환경의 관계 |
| [atuin.md](atuin.md) | Atuin 구조화 shell history 검색 |
| [fzf.md](fzf.md) | fzf 범용 fuzzy finder |
| [zoxide.md](zoxide.md) | zoxide 방문 기반 디렉터리 점프 |
| [powershell.md](powershell.md) | PowerShell 객체 파이프라인·Verb-Noun 문법 |

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
| [logstash.md](logstash.md) | Logstash 이벤트 수집·변환·출력 파이프라인 |
| [elasticsearch.md](elasticsearch.md) | Elasticsearch 분산 저장·검색·운영 |
| [kibana.md](kibana.md) | Kibana 데이터 탐색·KQL·시각화·대시보드 |

## Git & 버전 관리

| 파일 | 설명 |
|------|------|
| [git.md](git.md) | Git Working Tree·Index·Repository 상태 변화 |
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
| [claude-code.md](claude-code.md) | Claude Code CLI |
| [opencode.md](opencode.md) | opencode — 터미널 AI 코딩 에이전트 |


## 문서 경계

명령어 목록을 다시 만들지 않는다. **고유한 문법·상태 모델·조합 규칙**이 없는 내용은 공식 문서나 해당 도구의 개별 문서로 연결한다. Chrome 창 미표시 문제와 PyPI Trusted Publishing 절차는 블로그의 문제 해결·운영 가이드에서 관리한다. ccusage의 상세 명령은 공식 문서를 참고한다.

## 목록 원본

`catalog.json`은 블로그가 사용하는 목록과 참고 링크의 원본이다. 블로그는 이 데이터를 가져와 자체 화면에서 표시한다.
