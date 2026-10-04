# devkit

Curated dev cheatsheets and templates I keep handy while working.

**47 cheatsheets** across 11 categories · **5 templates** — only the generic,
reusable pieces, no machine- or project-specific config.

## Cheatsheets

Tool introductions and operational references. Full index with descriptions:
[cheatsheets/README.md](reference/cheatsheets/README.md).

**Editors & TUI** · [vim](reference/cheatsheets/vim.md) · [lazyvim](reference/cheatsheets/lazyvim.md) · [lazygit](reference/cheatsheets/lazygit.md) · [tmux](reference/cheatsheets/tmux.md) · [yazi](reference/cheatsheets/yazi.md) · [ghostty](reference/cheatsheets/ghostty.md)

**Modern CLI** (grep/find/cat/ls replacements) · [ripgrep](reference/cheatsheets/rg.md) · [fzf](reference/cheatsheets/fzf.md) · [jq](reference/cheatsheets/jq.md) · [bat/eza/fd/zoxide/delta…](reference/cheatsheets/modern-cli.md)

**Text processing** · [sed & awk](reference/cheatsheets/sed-awk.md) · [regex](reference/cheatsheets/regex.md) · [compression](reference/cheatsheets/compression.md)

**Shell** · [bash](reference/cheatsheets/shell.md) · [zsh](reference/cheatsheets/zsh.md) · [powershell](reference/cheatsheets/powershell.md)

**System & servers** · [linux](reference/cheatsheets/linux.md) · [process mgmt](reference/cheatsheets/linux-process.md) · [ssh](reference/cheatsheets/ssh.md) · [systemd](reference/cheatsheets/systemd.md) · [nginx](reference/cheatsheets/nginx.md) · [openssl](reference/cheatsheets/openssl.md)

**macOS** · [admin/troubleshoot](reference/cheatsheets/macos-admin.md) · [aerospace](reference/cheatsheets/aerospace.md) · [hammerspoon](reference/cheatsheets/hammerspoon.md)

**Data** · [harlequin](reference/cheatsheets/harlequin.md) · [sql-snippets](reference/cheatsheets/sql-snippets.md) · [vertica](reference/cheatsheets/vertica.md) · [elasticsearch](reference/cheatsheets/elasticsearch.md) · [kibana](reference/cheatsheets/kibana.md)

**Containers & build** · [kubectl](reference/cheatsheets/kubectl.md) · [docker](reference/cheatsheets/docker.md) · [make](reference/cheatsheets/make.md)

**Git & version control** · [git](reference/cheatsheets/git.md) · [gh](reference/cheatsheets/gh.md) · [code review glossary](reference/cheatsheets/code-review-glossary.md) · [chezmoi](reference/cheatsheets/chezmoi.md)

**Security & secrets** · [sops](reference/cheatsheets/sops.md)

**Config formats** · [toml](reference/cheatsheets/toml.md)

**Dev tools** · [terminal tooling](reference/cheatsheets/terminal-tooling.md) · [mise](reference/cheatsheets/mise.md) · [curl](reference/cheatsheets/curl.md) · [taskwarrior](reference/cheatsheets/taskwarrior.md) · [Python PyPI publishing](reference/cheatsheets/python-pypi-publishing.md) · [claude-code](reference/cheatsheets/claude-code.md) · [ccusage](reference/cheatsheets/ccusage.md) · [opencode](reference/cheatsheets/opencode.md) · [gdb](reference/cheatsheets/gdb.md)

## cmdtreemap

CLI 도구의 대안·진화 관계를 터미널 TUI와 Web tree로 탐색합니다. 구조, 개발, 실행, 빌드와 데이터 배포 방법은 [cmdtreemap/README.md](cmdtreemap/README.md)를 참고하세요.

## Templates

Boilerplate starting points — copy and adapt.

| File | What |
|---|---|
| [docker-compose-spring-postgres.yml](templates/docker-compose-spring-postgres.yml) | Docker Compose: Spring Boot + PostgreSQL |
| [Makefile-template](templates/Makefile-template) | Makefile starter (phony targets, help) |
| [pg-dump.sh](templates/pg-dump.sh) | PostgreSQL dump helper |
| [port.sh](templates/port.sh) | Find / free a process by port |
| [swap-jar.sh](templates/swap-jar.sh) | Swap a running JAR in place |

