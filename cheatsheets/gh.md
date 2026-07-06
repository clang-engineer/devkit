# gh Cheatsheet

> GitHub CLI. PR/이슈/리포 작업을 터미널에서. 브라우저 왔다갔다 줄임.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 첫 로그인 | `gh auth login` |
| 현재 브랜치로 PR 만들기 | `gh pr create --fill` |
| PR 체크아웃 | `gh pr checkout 123` |
| PR 머지 + 브랜치 삭제 | `gh pr merge 123 --squash --delete-branch` |
| 내 PR/리뷰 현황 | `gh pr status` |
| 이슈 만들기 | `gh issue create --title "..." --body "..."` |
| 이슈에 연결된 브랜치 | `gh issue develop 42 --checkout` |
| 워크플로 실행 추적 | `gh run watch` |
| 임의 API 호출 | `gh api repos/owner/repo/...` |
| 브라우저로 열기 | `--web` (대부분 명령에 붙음) |

## 설치 & 인증

```bash
brew install gh                # macOS
scoop install gh               # Windows
gh auth login                  # 첫 로그인 (GitHub.com / Enterprise 선택)
gh auth status                 # 인증 확인
gh auth status --show-token    # token 값까지
gh auth refresh -s read:org    # 스코프 추가
gh auth setup-git              # git credential helper에 gh 토큰 등록
```

### 기본 scope 한계

`gh auth login` 후 받는 기본 token: `admin:public_key, gist, read:org, repo`. 다음은 기본에 **없음**:

| 기능 | 필요한 scope | 추가 명령 |
|---|---|---|
| repo 삭제 | `delete_repo` | `gh auth refresh -h github.com -s delete_repo` |
| 이메일 조회 | `user` / `user:email` | `gh auth refresh -s user` |
| org 관리 | `admin:org` | `gh auth refresh -s admin:org` |
| workflow 수정 | `workflow` | `gh auth refresh -s workflow` |

처음부터 한 번에: `gh auth login --scopes "delete_repo,user,workflow"`.


## 리포

```bash
gh repo clone owner/repo
gh repo create my-repo --public
gh repo view --web                       # 브라우저로 열기
gh repo view owner/repo                  # README/메타 보기
gh repo fork owner/repo --clone
gh repo set-default                      # 현재 디렉터리 기본 리포 설정
```

## PR

```bash
gh pr create                             # 인터랙티브
gh pr create --fill                      # 커밋 메시지로 자동 채움
gh pr create --title "..." --body "..."  # 비대화형
gh pr list                               # 열린 PR
gh pr list --state all --author "@me"
gh pr view 123                           # PR 상세
gh pr view 123 --web                     # 브라우저로
gh pr checkout 123                       # PR 브랜치로 체크아웃
gh pr diff 123                           # 변경분
gh pr review 123 --approve -b "LGTM"
gh pr review 123 --request-changes -b "..."
gh pr review 123 --comment -b "..."
gh pr merge 123 --squash --delete-branch
gh pr ready 123                          # draft → ready
gh pr close 123
gh pr status                             # 내 PR/리뷰 요청 한눈에
```

## 이슈

```bash
gh issue create --title "..." --body "..."
gh issue list --assignee "@me"
gh issue list --label bug --state open
gh issue view 42
gh issue close 42
gh issue comment 42 --body "..."
gh issue develop 42 --checkout           # 이슈에 연결된 브랜치 만들고 체크아웃
```

## Actions / Workflows

```bash
gh run list                              # 최근 실행
gh run view <run-id>
gh run view <run-id> --log               # 로그 전체
gh run watch                             # 진행 중인 실행 추적
gh run rerun <run-id>
gh workflow list
gh workflow run deploy.yml -f env=prod
```

## Release

```bash
gh release create v1.0.0 --notes "..." dist/*.tar.gz
gh release list
gh release view v1.0.0
gh release download v1.0.0
```

## 저수준 API (`gh api`)

REST/GraphQL 임의 호출. **GitHub 자동화의 진짜 시작은 여기**.

```bash
gh api repos/owner/repo/pulls/123/comments
gh api -X POST repos/owner/repo/issues/42/comments -f body="..."
gh api graphql -f query='query { viewer { login } }'

# 페이지네이션 자동
gh api --paginate repos/owner/repo/issues
```

## 활용 시나리오

### PR 빠른 리뷰

```bash
gh pr checkout 123
# 코드 보고
gh pr review 123 --approve
```

### 이슈 → 브랜치 → PR 한 흐름

```bash
gh issue develop 42 --checkout
# ... 작업 ...
git push -u origin HEAD
gh pr create --fill
```

### fzf와 조합 (PR 골라서 체크아웃)

```bash
gh pr list --json number,title --jq '.[] | "\(.number)\t\(.title)"' \
  | fzf | awk '{print $1}' | xargs gh pr checkout
```

## 더 보기

- `gh help`, `gh <cmd> --help`
- 공식: https://cli.github.com/manual/
