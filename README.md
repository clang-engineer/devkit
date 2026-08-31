# devkit

Curated dev cheatsheets and templates I keep handy while working.

**48 cheatsheets** across 11 categories · **5 templates** — only the generic,
reusable pieces, no machine- or project-specific config.

## Cheatsheets

Tool introductions and operational references. Full index with descriptions:
[cheatsheets/README.md](cheatsheets/README.md).

**Editors & TUI** · [vim](cheatsheets/vim.md) · [lazyvim](cheatsheets/lazyvim.md) · [lazygit](cheatsheets/lazygit.md) · [tmux](cheatsheets/tmux.md) · [smug](cheatsheets/smug.md) · [ghostty](cheatsheets/ghostty.md)

**Modern CLI** (grep/find/cat/ls replacements) · [ripgrep](cheatsheets/rg.md) · [fzf](cheatsheets/fzf.md) · [jq](cheatsheets/jq.md) · [bat/eza/fd/zoxide/delta…](cheatsheets/modern-cli.md)

**Text processing** · [sed & awk](cheatsheets/sed-awk.md) · [regex](cheatsheets/regex.md) · [compression](cheatsheets/compression.md)

**Shell** · [bash](cheatsheets/shell.md) · [zsh](cheatsheets/zsh.md) · [powershell](cheatsheets/powershell.md)

**System & servers** · [linux](cheatsheets/linux.md) · [process mgmt](cheatsheets/linux-process.md) · [ssh](cheatsheets/ssh.md) · [systemd](cheatsheets/systemd.md) · [nginx](cheatsheets/nginx.md) · [openssl](cheatsheets/openssl.md) · [rocky-linux](cheatsheets/rocky-linux.md)

**macOS** · [admin/troubleshoot](cheatsheets/macos-admin.md) · [aerospace](cheatsheets/aerospace.md) · [hammerspoon](cheatsheets/hammerspoon.md)

**Data** · [harlequin](cheatsheets/harlequin.md) · [sql-snippets](cheatsheets/sql-snippets.md) · [vertica](cheatsheets/vertica.md) · [elasticsearch](cheatsheets/elasticsearch.md) · [kibana](cheatsheets/kibana.md)

**Containers & build** · [kubectl](cheatsheets/kubectl.md) · [docker](cheatsheets/docker.md) · [make](cheatsheets/make.md)

**Git & version control** · [git](cheatsheets/git.md) · [gh](cheatsheets/gh.md) · [code review glossary](cheatsheets/code-review-glossary.md) · [chezmoi](cheatsheets/chezmoi.md)

**Config formats** · [toml](cheatsheets/toml.md)

**Dev tools** · [terminal tooling](cheatsheets/terminal-tooling.md) · [mise](cheatsheets/mise.md) · [curl](cheatsheets/curl.md) · [taskwarrior](cheatsheets/taskwarrior.md) · [Python PyPI publishing](cheatsheets/python-pypi-publishing.md) · [claude-code](cheatsheets/claude-code.md) · [ccusage](cheatsheets/ccusage.md) · [opencode](cheatsheets/opencode.md) · [gdb](cheatsheets/gdb.md)

## Templates

Boilerplate starting points — copy and adapt.

| File | What |
|---|---|
| [docker-compose-spring-postgres.yml](templates/docker-compose-spring-postgres.yml) | Docker Compose: Spring Boot + PostgreSQL |
| [Makefile-template](templates/Makefile-template) | Makefile starter (phony targets, help) |
| [pg-dump.sh](templates/pg-dump.sh) | PostgreSQL dump helper |
| [port.sh](templates/port.sh) | Find / free a process by port |
| [swap-jar.sh](templates/swap-jar.sh) | Swap a running JAR in place |
