# CLI 도구 발견 지도

> **무엇을 하려는가 → 어떤 종류의 도구가 필요한가?** 명령어·옵션 사전은 공식 문서와 `tldr`에 맡긴다. 여기서는 선택 기준과 서로 다른 책임을 기억한다.

## 작업을 기준으로 찾기

```text
입력·탐색
├─ 파일명·경로 찾기  → fd
├─ 파일 내용 검색    → rg
├─ 결과 중 선택      → fzf
├─ 방문 경로로 이동  → zoxide
├─ 명령 기록 검색    → Atuin
├─ 터미널에서 편집   → micro / Neovim
└─ 에디터 안에서 선택 → Neovim + Telescope / fzf-lua

데이터 처리
├─ JSON 구조 추출    → jq
├─ 행·필드 처리      → awk
├─ 문자열 치환       → sed
└─ 보기 좋은 출력    → bat / delta

전송·도움말
├─ 파일 증분 전송    → rsync
└─ 명령 사용 예시    → tldr (tealdeer 클라이언트 → tldr-pages 자료)

실행·운영
├─ HTTP 요청         → curl
├─ 프로세스·포트     → pgrep / lsof / ss
├─ Linux 서비스      → systemctl / journalctl
├─ 컨테이너 실행     → docker
├─ 이미지 레이어 분석 → dive
└─ Kubernetes 운영   → kubectl / k9s

개발·재현
├─ 소스 이력         → Git / jj
├─ GitHub 작업       → gh
├─ 런타임 버전       → mise
├─ Python 프로젝트  → uv
├─ 설정 파일 배포    → chezmoi
├─ 비밀값 관리       → SOPS
└─ 코딩 에이전트     → Codex CLI / Gemini CLI
```

## 비슷한 도구를 구분하는 기준

| 작업 | 선택 | 차이 |
|---|---|---|
| 파일 찾기 | `fd` / `find` | 간결한 탐색 / 범용 POSIX·시스템 탐색 |
| 내용 검색 | `rg` / `grep` | 프로젝트 검색 / 널리 제공되는 텍스트 필터 |
| 목록에서 고르기 | `fzf` | 후보 생성은 다른 도구의 역할 |
| JSON 처리 | `jq` / `fx` | 파이프라인 변환 / 대화형 탐색 |
| 파일 출력 | `cat` / `bat` | 원문 스트림 / 사람이 읽기 좋은 출력 |
| Git diff | `git diff` / `delta` | 차이 계산 / 결과 렌더링 |
| GitHub 협업 | `git` / `gh` | 로컬 커밋·브랜치 / GitHub PR·이슈·워크플로 작업 |
| 파일 관리 | `Yazi` / `cd` | 탐색·조작 TUI / 셸 작업 디렉터리 변경 |
| 서비스 | `systemctl` / `journalctl` | Unit 상태 제어 / 로그 조회 |
| Kubernetes | `kubectl` / `k9s` | 명시적 명령·스크립트 / 대화형 리소스 탐색·조작 |
| DB 작업 | `psql` 등 / DB TUI | 스크립트·자동화 / 대화형 탐색 |
| 설정·암호화 | `chezmoi` / `SOPS` | 배포·재현 / 비밀값 보호 |

**동일한 이름의 명령이나 유사한 UX가 동일한 문법을 뜻하지 않는다.** 예를 들어 `grep`과 `rg`, `find`와 `fd`는 옵션을 일대일로 치환할 수 없다.

[rsync](https://rsync.samba.org/)는 로컬·원격 파일을 반복해서 맞추는 증분 전송 도구다. 파일 관리 TUI나 버전 이력·보존 정책을 갖춘 백업을 대신한다고 보지 않는다.

프로세스 이름을 찾는 `pgrep`과 달리 [lsof](https://github.com/lsof-org/lsof)는 어떤 프로세스가 파일을 열고 있는지 연결해 보여준다. 프로세스 목록만으로 원인이 보이지 않을 때 열린 파일·소켓 관점으로 좁힌다. `ss`는 Linux 소켓 조사 경로이므로 macOS에서도 같은 명령이 제공된다고 가정하지 않는다.

터미널·셸·데스크톱 창 관리, Neovim 플러그인과 외부 개발 도구 설치는 [책임별 비교](tool-map.md#같은-화면에-있어도-책임은-다르다)에서 구분한다. 같은 화면에 보인다는 이유만으로 대체 관계를 만들지 않는다.

## 조합을 읽는 법

```sh
rg -l TODO | fzf                # 내용 검색 → 파일 후보 선택
fd -e md | fzf                  # 확장자 기준 목록 → 선택
git diff | delta                # Git이 계산 → delta가 렌더링
curl -s URL | jq '.items[]'     # HTTP 응답 → JSON 구조 추출
```

`|`는 왼쪽의 표준 출력을 오른쪽 표준 입력으로 전달한다. **생성 → 선택 → 소비**의 순서로 보면 새로운 도구도 쉽게 조합할 수 있다.

## 대화형 TUI를 선택할 때

```text
Git 변경·이력        → lazygit
컨테이너·로그        → lazydocker
Docker 이미지 분석   → dive (레이어 분석, 컨테이너 실행 관리 아님)
파일 탐색            → Yazi
서버 로그            → lazyjournal
Kubernetes 리소스    → k9s
DB SQL 탐색          → Harlequin (adapter) / Rainfrog (PostgreSQL)
Neovim 내부 DB 탐색  → vim-dadbod-ui
HTTP 요청            → Posting / ATAC
GitHub PR·이슈       → gh-dash
JSON 대화형 탐색     → fx
네트워크 경로 진단   → trippy
```

DB TUI는 드라이버 지원·읽기 전용 여부·SQL 편집 기능을 확인한다. 반복 가능한 배치·백업은 `psql`·`pg_dump` 같은 DB 공식 CLI를 사용한다. `lazy*`라는 이름은 공통 프레임워크나 품질 보증이 아니다.

[dive](https://github.com/wagoodman/dive)는 이미지가 커진 레이어를 찾는 분석 도구이고, [k9s](https://k9scli.io/)는 실행 중인 클러스터 리소스를 관찰하고 조작하는 도구다. 이미지 문제와 배포 문제를 먼저 나눈다. k9s도 변경 작업을 할 수 있으므로 단순 읽기 전용 모니터로 취급하지 않는다.

## 코딩 에이전트를 선택할 때

[Codex CLI](https://github.com/openai/codex)와 [Gemini CLI](https://github.com/google-gemini/gemini-cli)는 터미널에서 코드 작업을 수행하는 에이전트다. 에디터 플러그인 설치 여부와 별도로 실행할 수 있지만, 계정·모델 접근 조건과 파일·명령 실행 권한을 확인해야 한다. 생성된 변경의 검토와 프로젝트 검증 절차를 대신하지 않는다.

Gemini CLI의 공식 안내(2026-11-23 확인)는 기업 Code Assist 워크플로와 기존 유료 API·Vertex 키를 대상으로 한다. 개인 무료·Google AI Pro/Ultra 접근은 Antigravity CLI로 이전되었으므로, 과거 Gemini CLI 소개의 무료 사용 조건을 그대로 적용하지 않는다.

## 어디에서 더 배우는가

- [Shell](cheatsheets/shell.md) / [Zsh](cheatsheets/zsh.md) / [Fish](cheatsheets/fish.md) / [PowerShell](cheatsheets/powershell.md): 명령 해석·확장·파이프라인
- [fzf](cheatsheets/fzf.md) / [zoxide](cheatsheets/zoxide.md) / [Atuin](cheatsheets/atuin.md): 탐색·선택·이력
- [Git](cheatsheets/git.md) / [gh](cheatsheets/gh.md) / [jj](cheatsheets/jj.md) / [git-delta](https://github.com/dandavison/delta): 로컬 변경·GitHub 협업·출력
- [uv](cheatsheets/uv.md) / [mise](cheatsheets/mise.md) / [chezmoi](cheatsheets/chezmoi.md) / [SOPS](cheatsheets/sops.md): 환경 재현
- [systemd](cheatsheets/systemd.md) / [SSH](cheatsheets/ssh.md): 운영·접속·도구 선택

개별 명령의 빠른 예시는 `tldr <command>`로 찾고, 정확한 인자·옵션은 `<command> --help`, `man <command>` 또는 공식 문서로 확인한다. [tealdeer](https://github.com/tealdeer-rs/tealdeer)는 지도에 등록한 `tldr` 클라이언트이며 [tldr-pages](https://github.com/tldr-pages/tldr)는 예제 자료 원본이다.
