# Git Cheatsheet

> 분산 버전 관리의 표준. 일상 워크플로 + 자주 망치는 작업을 한 곳에.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 변경 확인 | `git status -sb` / `git diff` |
| 스테이지 | `git add .` / `git add -p` (조각 단위) |
| 커밋 | `git commit -m "..."` / `git commit -v` (diff 보면서) |
| 마지막 커밋 수정 | `git commit --amend` (push 전에만) |
| 브랜치 만들고 이동 | `git switch -c feat/x` |
| 브랜치 전환 | `git switch main` |
| 변경 임시 보관 | `git stash` / 복구 `git stash pop` |
| 원격 받기 | `git pull --ff-only` |
| 원격 보내기 | `git push -u origin HEAD` |
| 마지막 커밋 되돌리기 (이력 보존) | `git revert HEAD` |
| 작업 디렉터리 되돌리기 | `git restore <file>` |
| 그래프 보기 | `git log --oneline --graph --all` |

## 상태 확인 & 변경 비교

| 명령어 | 설명 |
|--------|------|
| `git status` | 변경사항 확인 |
| `git status -sb` | 짧은 형식 |
| `git diff` | 변경 내용 상세 |
| `git diff --staged` | 스테이징된 변경사항 |
| `git diff <branch1>..<branch2>` | 브랜치 간 비교 |

## 브랜치

| 명령어 | 설명 |
|--------|------|
| `git branch` | 브랜치 목록 |
| `git switch <branch>` | 브랜치 이동 |
| `git switch -c <branch>` | 새 브랜치 생성 + 이동 |
| `git branch -d <branch>` | 브랜치 삭제 |
| `git branch -m <new-name>` | 브랜치 이름 변경 |
| `git branch -r` | 원격 브랜치 목록 |

## 스테이징 & 커밋

| 명령어 | 설명 |
|--------|------|
| `git add <file>` | 파일 스테이징 |
| `git add .` | 모든 변경사항 스테이징 |
| `git commit -m "msg"` | 커밋 |
| `git commit -am "msg"` | add + commit (이미 추적 중인 수정 파일만, 신규 파일 제외) |
| `git commit --amend` | 마지막 커밋 수정 |
| `git commit --amend --no-edit` | 스테이징분을 이전 커밋에 합침 (메시지 유지) |

## 원격 동기화

| 명령어 | 설명 |
|--------|------|
| `git pull` | 원격 변경사항 가져오기 + 병합 |
| `git pull --ff-only` | Fast-forward만 허용 |
| `git push` | 푸시 |
| `git push -u origin <branch>` | 브랜치 최초 푸시 |
| `git fetch origin` | 원격 변경사항만 가져오기 |
| `git remote -v` | 원격 저장소 확인 |
| `git remote set-url origin <url>` | 원격 주소 변경 |
| `git push origin --delete <branch>` | 원격 브랜치 삭제 |

## 되돌리기 & 복구

| 명령어 | 설명 |
|--------|------|
| `git restore <file>` | 파일 변경사항 취소 |
| `git restore --staged <file>` | 스테이징 취소 |
| `git restore --source=<commit> <file>` | 특정 커밋의 파일을 현재로 가져오기 |
| `git reset HEAD <file>` | 스테이징 취소 (구 문법) |
| `git reset --soft HEAD~1` | 커밋 취소 (변경사항 유지) |
| `git reset --hard HEAD~1` | 커밋 취소 (변경사항 삭제) |
| `git revert <commit>` | 특정 커밋 되돌리기 (revert 커밋 생성) |
| `git reflog` | HEAD 이동 기록 — **잃었다고 생각한 커밋 찾는 마지막 수단** |
| `git checkout <reflog-sha>` | reflog에서 본 SHA로 가서 브랜치 다시 만들기 |

### 위급 복구 시나리오

```bash
# 1. 하드 리셋으로 날린 커밋 복구
git reflog                            # HEAD가 어디 갔는지 시간 역순
# 예: a1b2c3d HEAD@{2}: commit: 잃은 작업
git branch recovered a1b2c3d         # 브랜치로 보존
git reset --hard recovered           # 또는 현재 브랜치를 거기로

# 2. 브랜치 삭제했는데 복구
git reflog --all                      # 모든 ref의 reflog
git checkout -b restored <sha>

# 3. 특정 파일만 N커밋 전 상태로
git restore --source=HEAD~3 path/to/file.txt
```

## 로그 & 검색

| 명령어 | 설명 |
|--------|------|
| `git log --oneline` | 커밋 히스토리 (한 줄) |
| `git log --graph --oneline --decorate` | 그래프 형태 히스토리 |
| `git log -p` | 커밋별 diff 보기 |
| `git log --grep="pattern"` | 커밋 메시지 검색 |
| `git log -S"text"` | 코드 내용 검색 |
| `git show <commit>` | 커밋 상세 |
| `git blame <file>` | 줄별 커밋 정보 |
| `git bisect start` | 이진 탐색으로 버그 찾기 |

## Merge & Rebase

| 명령어 | 설명 |
|--------|------|
| `git merge <branch>` | 브랜치 병합 |
| `git merge --no-ff <branch>` | Merge 커밋 강제 |
| `git merge --squash <branch>` | Squash 병합 |
| `git merge --abort` | 병합 중단 |
| `git rebase <branch>` | 브랜치에 rebase |
| `git rebase -i HEAD~3` | 인터랙티브 rebase |
| `git rebase --continue` | 충돌 해결 후 계속 |
| `git rebase --abort` | Rebase 취소 |
| `git rebase --skip` | 현재 커밋 건너뛰기 |

### Rebase 인터랙티브 명령어

| 명령 | 설명 |
|------|------|
| `pick` | 커밋 유지 |
| `reword` | 커밋 메시지 수정 |
| `edit` | 커밋 수정 (멈춤) |
| `squash` | 이전 커밋과 합치기 (메시지 유지) |
| `fixup` | 이전 커밋과 합치기 (메시지 버림) |
| `drop` | 커밋 삭제 |

## Stash

| 명령어 | 설명 |
|--------|------|
| `git stash` | 작업 중인 내용 임시 저장 |
| `git stash list` | Stash 목록 |
| `git stash apply stash@{n}` | 특정 stash 적용 (유지) |
| `git stash pop stash@{n}` | 특정 stash 적용 (삭제) |
| `git stash drop stash@{n}` | Stash 삭제 |
| `git stash clear` | 모든 stash 삭제 |
| `git stash show -p` | Stash 내용 상세 |
| `git stash push -m "msg"` | 메시지와 함께 저장 |

## Tag

| 명령어 | 설명 |
|--------|------|
| `git tag` | 태그 목록 |
| `git tag <name>` | 현재 커밋에 태그 |
| `git tag -a <name> -m "msg"` | Annotated 태그 |
| `git tag -d <tag>` | 로컬 태그 삭제 |
| `git push origin <tag>` | 태그 푸시 |
| `git push origin --tags` | 모든 태그 푸시 |

## Clean & 유지보수

| 명령어 | 설명 |
|--------|------|
| `git clean -n` | 삭제될 untracked 파일 미리보기 |
| `git clean -fd` | untracked 파일/폴더 삭제 |
| `git clean -fdx` | .gitignore 포함 모두 삭제 |
| `git gc` | 로컬 저장소 최적화 |
| `git prune` | 참조 없는 객체 정리 |
| `git reflog expire --expire=now --all` | Reflog 정리 |

## Submodule

| 명령어 | 설명 |
|--------|------|
| `git submodule add <url>` | Submodule 추가 |
| `git submodule update --init` | Submodule 초기화 |
| `git submodule update --remote` | Submodule 업데이트 |
| `git submodule foreach git pull` | 모든 submodule pull |

## 설정

| 명령어 | 설명 |
|--------|------|
| `git config --global user.name "name"` | 이름 설정 |
| `git config --global user.email "email"` | 이메일 설정 |
| `git config --global alias.<name> <cmd>` | Alias 설정 |
| `git config --global pull.rebase true` | Pull 시 기본 rebase |
| `git config --list` | 설정 확인 |

## 커밋 메시지 컨벤션 (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| type | 의미 |
|---|---|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 |
| `style` | 포맷·세미콜론 등 (동작 변경 없음) |
| `refactor` | 리팩토링 |
| `test` | 테스트 코드 |
| `chore` | 빌드·패키지 매니저 |
| `revert` | 이전 커밋 되돌리기 |

Subject 규칙: 50자 이내, 마침표 X, 명령문(현재 시제), 소문자.

Body: 72자 폭, **무엇/왜** 중심 (어떻게보다는).

### Footer

| 키 | 용도 |
|---|---|
| `BREAKING CHANGE:` | 호환성 깨지는 변경 |
| `Closes #N` / `Refs #N` | 이슈 참조 |
| `Co-authored-by: name <email>` | 공동 작업자 |
| `Signed-off-by: ...` | DCO 서명 |

### Breaking change 표기 (`!`)

```
feat!: send email to customer
feat(api)!: drop old endpoint

BREAKING CHANGE: legacy /v1 removed
```

### 예시

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Reviewed-by: Z
Refs: #123
```

### `.gitmessage` 템플릿

```sh
git config --global commit.template ~/.gitmessage
```

```
# <type>: subject (50자 이내, 명령문, 마침표 X)

# Body — 무엇/왜 (72자 폭)
```

## 자주 쓰는 패턴

```bash
# 작업 시작 루틴
git status
git pull --ff-only
git switch -c feature/new-feature

# 커밋 후 실수했을 때
git add forgotten-file
git commit --amend --no-edit

# 변경사항 임시 저장
git stash
git stash pop

# 브랜치 전환 전 확인
git status
git switch main
```

## History 재작성 (filter-repo)

`git filter-branch`는 deprecated. `git-filter-repo`가 표준.

```bash
brew install git-filter-repo
```

### Author/committer 통일하면서 날짜는 보존

```bash
git filter-repo --force --commit-callback '
commit.author_name = b"Your Name"
commit.author_email = b"you@example.com"
commit.committer_name = b"Your Name"
commit.committer_email = b"you@example.com"
'
```

- `author_date`/`committer_date`는 건드리지 않으면 원본 유지
- bytes 리터럴(`b"..."`) 필수 (내부 표현이 bytes)
- `--force`는 freshly cloned가 아닌 repo 안전 검사 건너뜀
- 한 번 rewrite하면 SHA가 다 바뀌므로 외부 참조 깨짐
- **본인 archive 같은 사적 정리 용도에만**. 공개 협업 history에는 금지

검증:
```bash
git log --pretty=format:"%ae" | sort -u
git log --pretty=format:"%ai %s" | tail -3   # 원본 날짜 보존 확인
```

## 이미 추적 중인 파일을 .gitignore로 무시하기

`.gitignore`는 **아직 추적 안 된** 파일에만 적용. 이미 커밋된 파일은 캐시에서 명시 제거해야 한다.

```bash
git ls-files <file>       # 출력 있으면 = 추적 중
git check-ignore <file>   # 출력 있으면 = 이미 무시됨

git rm --cached <file>    # 인덱스에서만 제거 (로컬 파일 유지) — .gitignore 추가 후
git rm -r --cached path/  # 디렉토리 전체
```

- `--cached` 없이 `git rm`하면 **로컬 파일까지 삭제**되니 주의.
- 이후 `status`에 `D`로 잡히고, 커밋하면 추적이 끊긴다. 로컬 파일은 남고 `.gitignore` 덕에 재추가 안 됨.

## push 안 됨 vs 커밋 안 됨 (일괄 스크립트)

두 상태는 감지 명령이 다르다. ahead만 검사하면 dirty를 놓친다.

```bash
# 커밋했지만 push 안 됨 (ahead)
git rev-parse "@{u}" &>/dev/null || continue   # upstream 없으면 스킵
git log "@{u}..HEAD" --oneline                  # 있으면 push 대상

# 아직 커밋 안 됨 (dirty working tree)
[ -n "$(git status --porcelain)" ] && echo "dirty"
```

`--porcelain`은 변경 있으면 파일 목록, 없으면 빈 문자열 → 스크립트에서 안정적으로 dirty 판정.

## GitHub 활동 검색 필터

전용 UI가 없는 "내 활동 모아보기"는 검색 필터가 사실상 유일하다.

| 필터 | 대상 |
|---|---|
| `commenter:<id>` | 내가 댓글 단 이슈/PR |
| `involves:<id>` | 작성·할당·멘션·댓글 등 관여한 전부 (`sort:updated-desc` 조합) |
| `author:<id> type:pr` | 내가 연 PR |
| `review-requested:<id> type:pr` | 리뷰 요청받은 PR |
| `reviewed-by:<id> type:pr` | 내가 리뷰한 PR |

- UI: `github.com/pulls`, `github.com/issues` (Created/Assigned/Review requests/Mentioned 탭).
- 릴리스 알림이 계속 뜨면 **Watch** 때문 → `github.com/watching`에서 Unwatch. (Star는 알림 안 만듦.)

## Contribution graph (잔디밭) 보존

잔디는 커밋이 소속된 레포에 귀속 → 레포를 지우면 함께 사라진다. 유지하려면:

| 방법 | 효과 |
|---|---|
| `gh repo archive owner/repo --yes` | 읽기 전용 보관, 잔디 유지 (목록엔 계속 뜸) |
| private 전환 | 남의 프로필 목록에서 숨김 + 잔디 유지 (private contribution 표시 옵션 ON) |
| 삭제 후 90일 내 복원 | Settings → Repositories (fork 등 조건부) |
| `git subtree`로 하나의 아카이브 레포에 흡수 | 과거 커밋 날짜 보존 → 잔디 살고 목록 준다 (본인 author 커밋만 카운트) |

- 삭제 전 백업: `git clone --mirror` → 나중에 재 push로 복구 가능.

## 위험한 명령어 (주의)

| 명령어 | 설명 | 주의사항 |
|--------|------|---------|
| `git reset --hard` | 변경사항 완전 삭제 | 복구 불가 |
| `git push --force` | 강제 푸시 | 팀 히스토리 파괴 |
| `git push --force-with-lease` | 안전한 강제 푸시 | 원격 변경 확인 후 푸시 |
| `git filter-branch` | 히스토리 재작성 | 전체 히스토리 변경 |
