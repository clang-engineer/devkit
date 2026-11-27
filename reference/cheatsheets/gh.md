# gh — GitHub 리소스 CLI

> `git`은 로컬 변경·커밋·브랜치를 관리하고, `gh`는 GitHub 저장소·PR·이슈·Actions·릴리스를 조회하거나 변경한다. [공식 매뉴얼](https://cli.github.com/manual/gh).

## 작동 모델

```text
현재 디렉터리의 Git remote ──────────────────┐
명시적 OWNER/REPO, -R 또는 GH_REPO ──────────┴──> 대상 GitHub 저장소
gh auth login / GH_TOKEN ─────────────────────────> 인증·권한 확인
                                                   │
                                         대상 + 권한으로 요청
                                                   ├─ repo / issue / pr
                                                   ├─ workflow / run / release
                                                   └─ api (REST / GraphQL)

로컬 파일·Index·Commit·push의 소유자: git (gh가 대체하지 않음)
```

`gh <대상> <동작> [번호·이름] [옵션]`을 읽을 때 **대상**은 GitHub 리소스, **동작**은 `list`·`view`(조회), `create`·`edit`·`merge`(변경) 등이다. 현재 저장소 안에서는 대부분 원격 저장소를 자동 선택한다. 다른 저장소는 명령이 허용하는 `-R OWNER/REPO` 또는 `GH_REPO`를 사용한다. `gh repo view`의 명시적 저장소 인자는 `gh repo view OWNER/REPO`다.

## 시작과 브라우저 열기

```sh
brew install gh          # 이미 설치돼 있으면 생략
gh auth login            # 대화형 GitHub 인증
gh auth status           # 현재 인증 확인
gh browse                # 현재 저장소 홈을 브라우저에서 열기
gh browse --no-browser   # 브라우저 대신 대상 URL 출력
```

`gh browse README.md:10`은 현재 저장소 파일의 특정 줄을, `gh browse 123`은 이슈 또는 PR을 연다. `gh browse --actions`와 `gh browse --releases`는 해당 저장소의 Actions·릴리스 페이지다. 저장소 설명과 README는 `gh repo view`로 터미널에서 읽고, `gh repo view --web`으로 브라우저에서 연다. 인증이 필요하거나 브라우저가 열리지 않으면 `gh auth status` 및 `GH_BROWSER`/`BROWSER` 설정을 확인한다. **`gh auth login`이 성공해도 SSH `git push` 권한과 키는 별개**다.

## 대상별 대표 명령

| 대상 | 조회 | 변경·연동 |
|---|---|---|
| 저장소 | `gh repo view`, `gh repo list`, `gh browse` | `gh repo clone OWNER/REPO`, `gh repo create` |
| 이슈 | `gh issue list`, `gh issue view 123` | `gh issue create`, `gh issue comment 123` |
| PR | `gh pr list`, `gh pr view 123`, `gh pr diff 123`, `gh pr checks 123` | `gh pr create`, `gh pr checkout 123`, `gh pr review 123`, `gh pr merge 123` |
| Actions | `gh workflow list`, `gh run list`, `gh run view RUN_ID` | `gh workflow run WORKFLOW`, `gh run watch RUN_ID` |
| 릴리스 | `gh release list`, `gh release view TAG` | `gh release create TAG`, `gh release download TAG` |
| API | `gh api repos/{owner}/{repo}` | `gh api graphql` 또는 `gh api -X METHOD ENDPOINT` |

`gh pr checkout`은 로컬 브랜치를 가져와 작업 위치를 바꾸며, `gh pr merge`는 원격 PR을 병합한다. `gh workflow run`은 수동 실행을 허용하는 워크플로가 필요하다. `gh release create`는 원격에 릴리스를 게시하므로 태그·자산·권한을 먼저 확인한다. 전체 옵션은 각 명령의 `--help`에서 확인한다.

## 현재 저장소 밖에서 작업하기

```sh
gh pr list -R cli/cli                  # 저장소를 명시적으로 지정
gh repo view cli/cli --web            # 저장소 인자로 브라우저 열기
GH_REPO=cli/cli gh issue list         # 현재 디렉터리와 무관하게 대상 고정
```

`-R`의 지원 여부는 하위 명령마다 다르다. 공개 저장소 조회와 달리 변경 작업에는 해당 계정의 권한이 필요하다. `GH_TOKEN`은 저장된 인증보다 우선하므로 CI에서 사용할 때 권한 범위와 비밀정보 노출을 확인한다. 토큰을 명령 인자로 직접 적지 않는다.

## 스크립트용 출력과 확장

```sh
gh pr list --json number,title,url --jq '.[] | "#\(.number) \(.title) \(.url)"'
gh run list --json databaseId,status,conclusion --jq '.[] | [.databaseId, .status, .conclusion]'
gh api 'repos/{owner}/{repo}' --jq '.default_branch'
```

`--json`은 지원 명령의 구조화 출력, `--jq`는 그 결과의 필드 선택이다. `gh api`에서는 `{owner}`·`{repo}`가 현재 저장소 또는 `GH_REPO`로 치환된다. API 인자를 `-f`/`-F`로 전달하면 기본 요청 메서드가 POST로 바뀔 수 있다. 조회 쿼리라면 [API 명세](https://cli.github.com/manual/gh_api)를 확인하고 `-X GET`을 명시한다. `gh extension list`는 설치된 확장을 보여 준다; 확장은 기본 `gh` 명령과 별도로 설치·관리된다.

## 관련 자료

- [Git 치트시트](git.md) — 로컬 Working Tree·Index·Commit·원격 참조
- [GitHub CLI 명령 매뉴얼](https://cli.github.com/manual/gh) · [브라우저 이동](https://cli.github.com/manual/gh_browse) · [환경 변수](https://cli.github.com/manual/gh_help_environment)
- [GitHub CLI 인증과 SSH push가 다른 이유](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-06-08-gh-cli-ssh-push.md)
