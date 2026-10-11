# devkit

Curated dev cheatsheets and templates I keep handy while working.

**31 cheatsheets** across 9 categories · **6 templates** — generic,
reusable references and starting points, not machine- or project-specific config.

## Shared explorer

도구 데이터와 웹 UI의 원본은 이 저장소가 소유한다. 블로그는 빌드할 때
이 저장소의 `src/manifest.json`에 명시된 파일을 가져와 정적 자산으로 배포한다.
블로그에 두 번째 렌더러나 수동 동기화용 복사본을 두지 않는다.
데이터는 지금처럼 브라우저에서 Devkit 원본 JSON을 직접 읽는다.
JSON 변경은 다음 조회에, UI 코드 변경은 블로그의 다음 빌드·배포에 반영된다.
Devkit 커밋만으로 블로그 배포를 자동 실행하지는 않는다.

```text
reference/cli/catalog.json         관계·명령 데이터 (기존 경로 유지)
reference/cheatsheets/catalog.json  치트시트 목록·문서 링크
reference/cheatsheets/*.md          긴 문서 원본
src/core/                         로딩·검증·공통 도구 ID·검색
src/graph/                        관계도 배치
src/integrations/                 tldr 페이지·예시 처리
src/ui/                           탐색·상세 패널
src/styles/                       블로그 테마와 독립적인 UI 스타일
web/                              독립 웹 진입점
cmdtreemap/                       Go TUI (데이터 계약 유지)
tests/                            공통 UI·데이터 보존 테스트
```

`make web` 후 `/web/`을 연다. 기존 `/cmdtreemap/web/`도 같은 UI를 사용한다.
`make test`는 Go 테스트와 공통 웹 테스트를 실행한다. 새 필드를 추가하기 전에는
공통 도구 모델과 두 기존 카탈로그의 호환성을 먼저 확인한다.

현재 두 JSON은 **기능별 원본을 유지**한다. 공통 모델에서 도구 ID로 연결하며,
모든 필드를 단일 JSON으로 물리적으로 이전한 상태는 아니다. 기존 CLI, 문서 링크,
외부 소비자와의 호환성을 유지한 채 단계적으로 정리한다.

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

CLI 도구의 대안·보완 관계를 터미널 TUI와 공통 웹 지도로 탐색합니다. 구조, 개발, 실행, 빌드와 데이터 배포 방법은 [cmdtreemap/README.md](cmdtreemap/README.md)를 참고하세요.

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
