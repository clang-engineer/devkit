# Git Cheatsheet

> 분산 버전 관리의 표준. 일상 워크플로 + 자주 망치는 작업을 한 곳에.

## 개념 흐름

```text
Working Tree → Staging Area → Local Repo → Remote Repo
     ↑              ↑              ↑              ↑
  restore        add           commit          push/pull
                                ↓
                    branch ← merge/rebase
```

핵심 명령어:

| 단계 | 명령 | 설명 |
|------|------|------|
| 변경 확인 | `git status -sb` / `git diff` | 어떤 파일이 바뀌었는지 |
| 스테이징 | `git add -p` | 조각 단위로 선택 (안전) |
| 커밋 | `git commit -m "msg"` | 이력 남기기 |
| 브랜치 | `git switch -c feat/x` | 새 작업 가지 만들기 |
| 병합 | `git merge --no-ff <branch>` | 브랜치 병합 (merge 커밋 유지) |
| 원격 동기화 | `git pull --ff-only` | fast-forward만 허용 |
| 되돌리기 | `git restore <file>` | 파일 변경사항 취소 |

## 연결 도구

| 도구 | 관계 |
|------|------|
| gh | GitHub CLI - PR/이슈/Actions/API |
| lazygit | Git TUI 프론트엔드 |
| delta | diff 페이저 (syntax highlighting) |
| git-filter-repo | 히스토리 재작성 |
| chezmoi | dotfiles 관리 (Git 기반) |

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
| `git reflog show <branch>` | 특정 브랜치의 commit·reset 등 포인터 이동 기록 |
| `git checkout <reflog-sha>` | reflog에서 본 SHA로 가서 브랜치 다시 만들기 |

### 위급 복구 시나리오

```bash
# 1. 하드 리셋으로 날린 커밋 복구
git reflog                            # HEAD가 어디 갔는지 시간 역순
# 예: a1b2c3d HEAD@{2}: commit: 잃은 작업
git branch recovered a1b2c3d         # 브랜치로 보존
git reset --hard recovered           # 또는 현재 브랜치를 거기로

# 2. 브랜치를 실수로 다른 브랜치/커밋에 reset
git reflog show <branch>              # reset 직전 SHA 확인
git reset --hard <reset-직전-sha>     # 현재 브랜치 포인터 복구 (작업 트리가 깨끗할 때)

# 3. 브랜치 삭제했는데 복구
git reflog --all                      # 모든 ref의 reflog
git checkout -b restored <sha>

# 4. 특정 파일만 N커밋 전 상태로
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

## Worktree

하나의 `.git`(히스토리·오브젝트)를 공유하면서 워킹 트리를 여러 폴더로 분리 — 세션마다 다른 브랜치를 물리적으로 격리해 작업.

| 명령어 | 설명 |
|--------|------|
| `git worktree add ../dir -b <branch>` | 새 브랜치 만들며 새 워크트리 생성·체크아웃 |
| `git worktree add ../dir -b <branch> <base>` | 특정 base(예: `origin/main`)에서 새 브랜치 생성 |
| `git worktree add ../dir <branch>` | 기존 브랜치를 새 워크트리에 체크아웃 |
| `git worktree add ../feat-x` | 경로만 주면 폴더명으로 브랜치 자동 생성 |
| `git worktree add --detach ../dir <commit>` | 브랜치 없이 특정 커밋만 detached로 확인 |
| `git worktree list` | 워크트리 목록 (경로·커밋·브랜치) |
| `git worktree remove ../dir` | 워크트리 삭제 (미커밋 변경 있으면 거부, `--force`로 강제) |
| `git worktree prune` | 폴더를 수동 삭제한 워크트리 등록정보 정리 |

- 같은 브랜치는 동시에 한 워크트리에서만 체크아웃 가능 (안전장치).
- 경로는 레포 바깥(`../`)에 두는 게 깔끔.
- 워크트리를 지워도 브랜치는 남음 → `git branch -d <branch>` 별도.

## 설정

| 명령어 | 설명 |
|--------|------|
| `git config --global user.name "name"` | 이름 설정 |
| `git config --global user.email "email"` | 이메일 설정 |
| `git config --global alias.<name> <cmd>` | Alias 설정 |
| `git config --global pull.rebase true` | Pull 시 기본 rebase |
| `git config --list` | 설정 확인 |

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

## 위험한 명령어 (주의)

| 명령어 | 설명 | 주의사항 |
|--------|------|---------|
| `git reset --hard` | 변경사항 완전 삭제 | 복구 불가 |
| `git push --force` | 강제 푸시 | 팀 히스토리 파괴 |
| `git push --force-with-lease` | 안전한 강제 푸시 | 원격 변경 확인 후 푸시 |
| `git filter-branch` | 히스토리 재작성 | 전체 히스토리 변경 |
