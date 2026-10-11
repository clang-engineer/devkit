# devkit

Curated dev cheatsheets and templates I keep handy while working.

**31 cheatsheets** across 9 categories · **6 templates** — generic,
reusable references and starting points, not machine- or project-specific config.

## Cheatsheets

Tool introductions and operational references. Full index with descriptions:
[reference/cheatsheets/README.md](reference/cheatsheets/README.md).

**Editors & TUI** · [vim](reference/cheatsheets/vim.md) · [lazyvim](reference/cheatsheets/lazyvim.md) · [lazygit](reference/cheatsheets/lazygit.md) · [tmux](reference/cheatsheets/tmux.md) · [yazi](reference/cheatsheets/yazi.md) · [ghostty](reference/cheatsheets/ghostty.md) · [terminal TUI](reference/cheatsheets/terminal-tui.md)

**Shell** · [bash](reference/cheatsheets/shell.md) · [zsh](reference/cheatsheets/zsh.md) · [atuin](reference/cheatsheets/atuin.md) · [fzf](reference/cheatsheets/fzf.md) · [zoxide](reference/cheatsheets/zoxide.md) · [powershell](reference/cheatsheets/powershell.md)

**System & servers** · [ssh](reference/cheatsheets/ssh.md) · [systemd](reference/cheatsheets/systemd.md)

**macOS** · [aerospace](reference/cheatsheets/aerospace.md) · [hammerspoon](reference/cheatsheets/hammerspoon.md)

**Data** · [elasticsearch](reference/cheatsheets/elasticsearch.md)

**Git & version control** · [git](reference/cheatsheets/git.md) · [jujutsu/jj](reference/cheatsheets/jj.md) · [git-delta](reference/cheatsheets/git-delta.md) · [chezmoi](reference/cheatsheets/chezmoi.md)

**Security & secrets** · [sops](reference/cheatsheets/sops.md)

**Dev tools** · [mise](reference/cheatsheets/mise.md) · [uv](reference/cheatsheets/uv.md) · [taskwarrior](reference/cheatsheets/taskwarrior.md) · [Python PyPI publishing](reference/cheatsheets/python-pypi-publishing.md) · [claude-code](reference/cheatsheets/claude-code.md) · [ccusage](reference/cheatsheets/ccusage.md) · [opencode](reference/cheatsheets/opencode.md)

**Tools dictionary** · [CLI concepts and quick commands](reference/cheatsheets/tools-dictionary.md)

## cmdtreemap

CLI 도구의 대안·진화 관계를 터미널 TUI와 Web tree로 탐색합니다. 구조, 개발, 실행, 빌드와 데이터 배포 방법은 [cmdtreemap/README.md](cmdtreemap/README.md)를 참고하세요.

## Templates

Boilerplate starting points — copy and adapt. Prerequisites and usage:
[templates/README.md](templates/README.md).

| File | What |
|---|---|
| [docker-compose-spring-postgres.yml](templates/docker-compose-spring-postgres.yml) | Docker Compose: Spring Boot + PostgreSQL |
| [Makefile-template](templates/Makefile-template) | Makefile starter (phony targets, help) |
| [pg-dump.sh](templates/pg-dump.sh) | PostgreSQL dump helper |
| [port.sh](templates/port.sh) | Find / free a process by port |
| [preview-loader.sh](templates/preview-loader.sh) | Preview an HTML boot loader before JavaScript mounts |
| [swap-jar.sh](templates/swap-jar.sh) | Swap a running JAR in place |
