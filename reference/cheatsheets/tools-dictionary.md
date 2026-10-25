# CLI 도구 발견 지도

> **무엇을 하려는가 → 어떤 종류의 도구가 필요한가?** 명령어·옵션 사전은 공식 문서와 `tldr`에 맡긴다. 여기서는 선택 기준과 서로 다른 책임을 기억한다.

## 작업을 기준으로 찾기

```text
입력·탐색
├─ 파일명·경로 찾기  → fd
├─ 파일 내용 검색    → rg
├─ 결과 중 선택      → fzf
├─ 방문 경로로 이동  → zoxide
└─ 명령 기록 검색    → Atuin

데이터 처리
├─ JSON 구조 추출    → jq
├─ 행·필드 처리      → awk
├─ 문자열 치환       → sed
└─ 보기 좋은 출력    → bat / delta

실행·운영
├─ HTTP 요청         → curl
├─ 프로세스·포트     → pgrep / lsof / ss
├─ Linux 서비스      → systemctl / journalctl
├─ 컨테이너          → docker
└─ Kubernetes        → kubectl

개발·재현
├─ 소스 이력         → Git / jj
├─ GitHub 작업       → gh
├─ 런타임 버전       → mise
├─ Python 프로젝트  → uv
├─ 설정 파일 배포    → chezmoi
└─ 비밀값 관리       → SOPS
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
| 파일 관리 | `Yazi` / `cd` | 탐색·조작 TUI / 셸 작업 디렉터리 변경 |
| 서비스 | `systemctl` / `journalctl` | Unit 상태 제어 / 로그 조회 |
| DB 작업 | `psql` 등 / DB TUI | 스크립트·자동화 / 대화형 탐색 |
| 설정·암호화 | `chezmoi` / `SOPS` | 배포·재현 / 비밀값 보호 |

**동일한 이름의 명령이나 유사한 UX가 동일한 문법을 뜻하지 않는다.** 예를 들어 `grep`과 `rg`, `find`와 `fd`는 옵션을 일대일로 치환할 수 없다.

## 조합을 읽는 법

```sh
rg -l TODO | fzf                # 내용 검색 → 파일 후보 선택
fd -e md | fzf                  # 확장자 기준 목록 → 선택
git diff | delta                # Git이 계산 → delta가 렌더링
curl -s URL | jq '.items[]'     # HTTP 응답 → JSON 구조 추출
```

`|`는 왼쪽의 표준 출력을 오른쪽 표준 입력으로 전달한다. **생성 → 선택 → 소비**의 순서로 보면 새로운 도구도 쉽게 조합할 수 있다.

## 어디에서 더 배우는가

- [Shell](shell.md) / [Zsh](zsh.md) / [PowerShell](powershell.md): 명령 해석·확장·파이프라인
- [fzf](fzf.md) / [zoxide](zoxide.md) / [Atuin](atuin.md): 탐색·선택·이력
- [Git](git.md) / [jj](jj.md) / [git-delta](git-delta.md): 변경 관리·출력
- [uv](uv.md) / [mise](mise.md) / [chezmoi](chezmoi.md) / [SOPS](sops.md): 환경 재현
- [systemd](systemd.md) / [SSH](ssh.md) / [Terminal TUI](terminal-tui.md): 운영·접속·도구 선택

개별 명령의 정확한 인자·옵션은 `tldr <command>`, `<command> --help`, `man <command>` 또는 공식 문서를 참고한다.
