# Tools Dictionary

> tldr로 대체 가능한 CLI 도구/개념 사전. 상세 사용법은 `tldr <명령어>` 참고.

## CLI 도구

| 도구 | 설명 | tldr |
|------|------|------|
| curl | HTTP/FTP/SCP 요청 CLI | `tldr curl` |
| docker | 컨테이너 + 이미지 + 네트워크/볼륨 + Compose | `tldr docker` |
| fzf | 범용 fuzzy finder (Ctrl+R/T, Alt+C) | `tldr fzf` |
| jq | JSON 셸 파이프라인 가공 | `tldr jq` |
| rg | `grep -r` 대체 (Rust, .gitignore 자동 반영) | `tldr ripgrep` |
| sed & awk | 텍스트 스트림 변환 (라인/필드 단위) | `tldr sed`, `tldr awk` |
| tar/gzip/zip/xz/bzip2/7z | 압축/해제 | `tldr tar` 등 |
| openssl | 인증서·키 발급/변환/검증 | `tldr openssl` |
| kubectl | Kubernetes 클러스터 CLI | `tldr kubectl` |
| make | 빌드 자동화 (Makefile) | `tldr make` |
| gh | GitHub CLI (PR/이슈/Actions) | `tldr gh` |
| gdb | GNU 디버거 (C/C++) | `tldr gdb` |
| bat | `cat` 대체 (구문 강조) | `tldr bat` |
| eza | `ls` 대체 (git + 트리) | `tldr eza` |
| fd | `find` 대체 (직관 문법) | `tldr fd` |
| zoxide | `cd` 대체 (빈도 학습) | `tldr zoxide` |
| delta | `git diff` 페이저 (side-by-side) | `tldr delta` |
| tree | 디렉터리 구조 시각화 | `tldr tree` |
| starship | 크로스 플랫폼 프롬프트 | `tldr starship` |

## Modern CLI Alias 가이드

| 패턴 | 권장 | 비고 |
|------|------|------|
| `ll = eza -l`, `la`, `lt` | 안전 | ls 자체는 건드리지 않음 |
| `ls = eza` | 비교적 안전 | eza가 ls 호환 잘 됨 |
| `cat = bat` | 시범 도입 | `--paging=never`로 surprise 최소화 |
| `grep = rg` | **하지 않음** | 옵션 다름 (`-E`, `-l` 등 비호환) |
| `find = fd` | **하지 않음** | 문법 자체가 다름 |

```bash
# zsh 예시
alias ll='eza -lh --git --group-directories-first --icons'
alias la='eza -lah --git --group-directories-first --icons'
alias lt='eza -T -L 2 --git-ignore --icons'
alias cat='bat --paging=never'

# 셸 통합 (.zshrc)
eval "$(starship init zsh)"
eval "$(zoxide init zsh)"
source <(fzf --zsh)
```

## 개념/참조

| 항목 | 설명 | 참고 |
|------|------|------|
| Regex | 정규표현식 문법 + 도구별 플레이버(BRE/ERE/PCRE) | regex101.com |
| TOML | 설정 파일 형식 (`key = 값`, `[table]`, `[[array]]`) | toml.io |
| Code Review Glossary | PR/MR 리뷰 약어 (LGTM, PTAL, nit:, blocker 등) | GitHub/GitLab 문서 |
| PostgreSQL Snippets | 운영용 쿼리 (세션/슬로우/락/크기/인덱스) | `pg_stat_activity` |
| Terminal Tooling | 터미널 환경 도구 역할 분담 가이드 | 개별 cheatsheet 참조 |

## 관련 cheatsheet

개인 워크플로우·심화 내용은 개별 파일 참조:

- git → git.md (worktree, reflog 복구, stash 등 심화)
- ssh → ssh.md (config 다중 계정 패턴)
- chezmoi → chezmoi.md (dotfiles 관리)
- lazygit, lazyvim, tmux, ghostty, yazi → 에디터 & TUI 그룹
