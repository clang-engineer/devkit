# Claude Code Cheatsheet

> [Claude Code](https://docs.claude.com/en/docs/claude-code) — Anthropic이 만든 터미널용 코딩 에이전트. `npm i -g @anthropic-ai/claude-code` 후 `claude` 실행.

## 30초만 본다면

| 상황 | 명령 |
|------|------|
| 시작 | `claude` |
| 한 줄 요청만 처리 | `claude "git status 정리해줘"` |
| 어제 작업 이어서 | `claude -c` |
| 토큰이 너무 늘었을 때 | 대화 중 `/compact` |
| 권한 모드 전환 (plan/accept 등) | `Shift+Tab` (모드 순환) |
| 작업 중단 | `Esc` (또는 `Ctrl+C`) |
| 파일 첨부 | 프롬프트에 `@경로` 입력 (Tab 자동완성) |
| 셸 명령 직접 실행 | 프롬프트에 `!ls` |
| 작업 비용 확인 | `/cost` |

## 처음 설정할 때

1. `claude` 실행 → `/login`으로 계정 연결
2. `/init`을 프로젝트 루트에서 실행 → `CLAUDE.md` 생성 (프로젝트 컨벤션을 적어두면 매 세션이 좋아짐)
3. 권한 프롬프트가 귀찮으면 `/permissions`로 자주 쓰는 도구 허용

## 명령어·실행 옵션 → `/help`, `claude --help`

전체 슬래시 명령은 `/help`, CLI 플래그는 `claude --help`가 즉시 반환한다. 아래는 그중 놓치기 쉬운 것만:

- `/rewind` — 체크포인트로 대화·파일 복원 / `/context` — 컨텍스트에 뭐가 차 있는지 / `/fast` — 같은 모델 빠른 출력 토글
- `claude -c` 마지막 대화 이어서 / `claude -p "..."` 비대화형 print 모드(스크립트·파이프) / `claude -r <session>` 특정 세션 복원

## 내장 스킬 명령 (깊이 있는 것만)

`/help`가 한 줄로만 요약해서 실물을 과소평가하기 쉬운 **Claude 제공 스킬**들. (`blog`·`notes`처럼 사용자가 만든 커스텀 스킬은 여기 대상 아님 — 그건 `~/.claude/commands/`에 사는 내 것.)

### 코드 리뷰·품질 — 무엇을 찾느냐로 갈린다

| 명령 | 찾는 것 | 대상 |
|------|--------|------|
| `/code-review [effort] [경로]` | **버그** + 재사용·단순화·효율 | 현재 워킹 diff (또는 경로) |
| `/simplify` | 품질만 (재사용·단순화·효율·altitude) — **버그는 안 봄** | 변경된 코드 |
| `/security-review` | 보안 취약점 | 현재 브랜치 pending 변경 |
| `/review <PR#>` | 종합 리뷰 | **GitHub PR** (로컬 diff는 `/code-review`) |

`/code-review` 상세 (헷갈리기 쉬운 레인):
- **effort**: `low`/`medium`(적고 확신 높은 것만) → `high`/`max`(넓게, 불확실한 것도). 생략하면 기본값.
- 기본은 **inline** — Claude가 이 대화 안에서 직접 훑어 findings 보고.
- `--comment` findings를 PR 인라인 코멘트로 게시 / `--fix` 워킹트리에 바로 적용.
- `/code-review ultra` — 클라우드 **대규모 멀티에이전트** 리뷰(현재 브랜치). `ultra <PR#>`로 GitHub PR. **과금·사용자 직접 트리거 전용**(Claude가 대신 못 켬). `/ultrareview`는 폐기된 별칭.

### 실행·검증 — 테스트 말고 "진짜 앱을 돌려서"

- `/run` — 이 프로젝트 앱을 띄워 변경이 실제로 도는지 확인. 프로젝트 스킬 우선, 없으면 타입별(CLI·서버·TUI·Electron 등) 폴백.
- `/verify` — 변경이 의도대로 동작하는지 앱을 돌려 **행동으로** 검증. "PR 검증"·"fix 진짜 되나"·푸시 전 로컬 확인용.

### 리서치·설정

- `/deep-research <질문>` — fan-out 웹서치 → 소스 fetch → adversarial 검증 → 인용 리포트. 질문이 두루뭉술하면 먼저 2~3개 좁히는 질문을 던진다.
- `/update-config` — `settings.json`/hooks 변경. **"앞으로 X할 때마다" 류 자동화는 memory가 아니라 hook**이라 이걸로 건다.
- `/fewer-permission-prompts` — 트랜스크립트를 훑어 자주 뜨는 read-only 호출을 프로젝트 allowlist에 추가.
- `/keybindings-help` — `~/.claude/keybindings.json` 커스터마이즈 (아래 키바인딩 섹션 참조).

## 설정 파일

| 파일 | 위치 | 용도 |
|------|------|------|
| `CLAUDE.md` | 프로젝트 루트 | 프로젝트별 지침/컨텍스트 |
| `~/.claude/settings.json` | 홈 디렉토리 | 전역 설정 |
| `.claude/settings.json` | 프로젝트 | 프로젝트별 설정 |
| `~/.claude/keybindings.json` | 홈 디렉토리 | 키바인딩 커스터마이징 |

## 권한 모드

| 모드 | 설명 |
|------|------|
| `--allowedTools` | 특정 도구만 자동 허용 |
| `--dangerously-skip-permissions` | 모든 권한 체크 스킵 (주의) |
| `/permissions` | 대화 중 권한 설정 변경 |

## Esc / Esc Esc (헷갈리는 것만)

기본 단축키(`Enter` 전송, `Tab` 자동완성 등)는 `/help`. 비자명한 것:

- `Esc` — 실행 중이면 Claude 인터럽트(작업 보존), 다이얼로그 열려있으면 그 창 닫기
- `Esc Esc` — 입력창에 글 있으면 지우되 히스토리 저장(`↑`로 복구), 비어있으면 rewind 메뉴

## MCP (Model Context Protocol)

`/mcp`로 서버 상태 확인. 추가·제거·목록은 `claude mcp add/remove/list` → `claude mcp --help`.

## Custom Agents

프로젝트나 역할별 전용 에이전트를 만들어 도구/모델/시스템 프롬프트를 제한할 수 있다.

| 위치 | 범위 |
|------|------|
| `~/.claude/agents/*.md` | 전역 에이전트 |
| `.claude/agents/*.md` | 프로젝트 에이전트 |

```markdown
---
name: sql-reviewer
model: sonnet
tools: ["Read", "Grep", "Glob"]
---
SQL 쿼리 리뷰 전문 에이전트. 성능, 인덱스 활용, N+1 문제를 중심으로 리뷰한다.
```

관리: 대화 중 `/agents`로 생성·편집. Claude가 관련 작업에 자동 위임하거나 프롬프트에서 직접 지정해 호출한다.

## Project-level CLAUDE.md

프로젝트 루트에 `CLAUDE.md`를 두면 해당 프로젝트에서만 적용되는 지침을 설정할 수 있다.
글로벌 `~/.claude/CLAUDE.md`와 별개로, 프로젝트별 컨벤션/아키텍처를 기술하면 컨텍스트 품질이 올라간다.

```
project-root/
├── CLAUDE.md              # 프로젝트 지침
├── .claude/
│   ├── settings.json      # 프로젝트 설정 (팀 공유, git commit)
│   ├── settings.local.json # 개인 설정 (git ignore)
│   └── agents/            # 프로젝트 전용 에이전트
```

## Worktree (병렬 작업)

`--worktree` 플래그로 격리된 git worktree에서 작업. 메인 브랜치를 건드리지 않고 병렬로 작업 가능.

```bash
claude --worktree    # 별도 worktree에서 세션 시작
```

subagent에도 `isolation: "worktree"` 옵션으로 격리 실행 가능.

## Schedule (Routines)

크론 스케줄로 Claude를 자동 실행하는 클라우드 루틴. `/schedule`은 **대화형** — 플래그가 아니라 자연어로 만든다.

```text
/schedule 매일 오전 9시 PR 현황 정리해서 docs/daily에 저장   # 대화형 생성 (후속 질문으로 상세 확정)
/schedule list      # 루틴 목록
/schedule update    # 기존 루틴 수정 (크론 간격도 자연어로)
/schedule run       # 즉시 실행
```

> 로컬(비클라우드) 반복 실행은 `/loop`.

## 권한 모드 (Shift+Tab 순환)

`Shift+Tab`은 단일 토글이 아니라 **권한 모드를 순환**한다:

```
default → acceptEdits → plan [→ bypassPermissions → auto]
```

(기본 3개는 항상 노출. `bypassPermissions`는 `--dangerously-skip-permissions` 등으로 시작한 경우, `auto`는 계정이 auto 모드 요건을 충족한 경우만 순환에 추가되며 이 순서로 붙는다.)

- `default` — 매번 권한 확인
- `acceptEdits` — 파일 편집 자동 수락
- `plan` — 읽기만, 변경 전 플랜 수립
- `auto` — Claude가 권한을 자동 판단 (아래 `autoMode` 규칙 기반)
- `bypassPermissions` — 모든 체크 스킵 (주의)

`auto` 모드 규칙은 `settings.json`의 `autoMode`로 커스텀:

```json
{
  "autoMode": {
    "environment": [],
    "allow": ["빌드·테스트 실행"],
    "soft_deny": ["$defaults", "terraform apply 금지"],
    "hard_deny": ["프로덕션 DB 수정"]
  }
}
```

- 도구 패턴 문자열(`Bash(npm run test:*)`)이 아니라 **사람이 읽는 설명**으로 기술
- `"$defaults"` = 내장 기본 규칙 포함
- `hard_deny` = 항상 차단. 도구 단위 정밀 허용/거부는 별도 `permissions.allow`/`deny` 키

## 유용한 팁

| 팁 | 설명 |
|----|------|
| `@파일명` | 프롬프트에서 파일 직접 참조 (자동완성 지원) |
| `!명령어` | 프롬프트에서 셸 명령 직접 실행 |
| `#` | 프롬프트 시작 시 코멘트 (Claude에게 전달 안 됨) |
| `/compact` | 컨텍스트 길어지면 압축해서 토큰 절약 |
| `Ctrl+R` | 이전 프롬프트 검색 |
| `Ctrl+O` | 전체 트랜스크립트 보기 |
| `Ctrl+J` | 프롬프트에서 줄바꿈 (Enter 대신) |
| 이미지 드래그앤드롭 | 스크린샷/이미지를 프롬프트에 바로 첨부 |
| `claude -c` | 마지막 세션 이어서 작업 |
| Plan 모드 | 복잡한 작업 전 구조화된 플랜 수립 후 승인 |

## 영속 데이터 위치 (`~/.claude/`)

| 경로 | 내용 |
|------|------|
| `~/.claude/plans/` | ExitPlanMode 결과 (`{slug}.md`, auto-named) |
| `~/.claude/projects/{slug}/*.jsonl` | 프로젝트별 대화 세션 |
| `~/.claude/projects/{slug}/memory/` | 자동 메모리 (`MEMORY.md` + 개별 파일) |
| `~/.claude/sessions/` | 글로벌 세션 메타 |
| `~/.claude/commands/` | 사용자 정의 슬래시 명령 |
| `~/.claude/agents/` | 사용자 정의 에이전트 |
| `~/.claude/shell-snapshots/` | Bash 도구 셸 상태 스냅샷 |
| `~/.claude/file-history/` | 편집된 파일 히스토리 |

## additionalDirectories — 다중 프로젝트 접근

여러 디렉토리를 권한 프롬프트 없이 오갈 때 `~/.claude/settings.json`:

```json
{
  "permissions": {
    "additionalDirectories": [
      "/path/to/blog",
      "/path/to/toolbox",
      "/path/to/dotfiles"
    ]
  }
}
```

- 파일 접근 권한만 부여. 해당 디렉토리의 `.claude/` 설정(hooks 등)은 로드되지 않음
- 설정 로드까지 필요하면 세션별 `--add-dir` 플래그
- JSON은 환경변수 확장 미지원. 머신별 경로가 다르면 setup 스크립트로 치환

## 작업 디렉토리 이동 — `/cd` vs `/add-dir`

세션 시작 후 디렉토리를 다루는 두 방식. `/add-dir`는 경계만 넓히고, `/cd`는 root 자체를 옮긴다.

| 목적 | 명령 |
|---|---|
| 다른 트리 파일 **접근만** 추가 (root 유지) | `/add-dir /path` 또는 `claude --add-dir /path` |
| root(cwd) 자체를 이동 | `/cd /path` |

- `/add-dir`로 넣은 건 세션 도중 **제거 불가** (`/remove-dir` 없음). 재시작하면 사라짐. 영구 추가는 `settings.json`의 `permissions.additionalDirectories`.
- 상위 디렉토리를 add-dir해야 실제 확장. cwd 자기 자신/하위는 no-op (이미 경계 안).
- `/cd`는 **v2.1.169+** 필요. 대화·prompt cache 유지한 채 이동, 세션이 새 디렉토리 스토리지로 재배치됨. 처음 가는 곳이면 trust 프롬프트.

## 키바인딩 커스터마이즈 (`~/.claude/keybindings.json`)

```json
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "bindings": [
    { "context": "Chat", "bindings": { "escape": null } }
  ]
}
```

- `null` = 기본 바인딩 해제. 사용자 바인딩은 기본값에 **additive** (옮기려면 old를 `null` + new 추가).
- chord는 공백 구분: `ctrl+k ctrl+s` (키 사이 1초 타임아웃).
- **적용은 재시작 필요** (시작 시 1회 로드). `/doctor`가 유효성 검사.
- 바인딩은 정해진 `namespace:action`만 가능 — 임의 텍스트 삽입/자동 제출은 불가.
- **예약 키(재바인딩·해제 불가)**: `ctrl+c`(인터럽트/종료), `ctrl+d`(종료), `ctrl+m`(터미널에서 Enter와 동일) 하드코딩. macOS 시스템 키(`cmd+c/v/x/q/w/tab/space`)도 불가.

| action | 기본 키 | context |
|---|---|---|
| `chat:cancel` | `escape` | Chat |
| `app:interrupt` | `ctrl+c` | Global |
| `history:previous` | `up` | Chat |
| `history:search` | `ctrl+r` | Global |

> 함정: ESC를 chord 접두키(`"escape escape"`)로 만들면 화살표·Alt 등 escape 시퀀스가 전부 타임아웃 대기에 걸려 입력이 먹통 → 더블-ESC는 사실상 불가.

## Hooks 이벤트 종류

| 이벤트 | 시점 |
|--------|------|
| `PreToolUse` | 도구 실행 전 (차단 가능) |
| `PostToolUse` | 도구 실행 후 |
| `Stop` | Claude 응답 완료 시 |
| `Notification` | 알림 발생 시 |
| `SessionStart` | 세션 시작 시 |
| `PreCompact` / `PostCompact` | 컨텍스트 압축 전후 |
| `UserPromptSubmit` | 사용자 입력 제출 시 |
