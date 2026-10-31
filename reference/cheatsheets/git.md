# Git — 상태·참조·이력의 개념 지도

> Git은 명령어 모음보다 **스냅샷과 참조를 관리하는 모델**로 이해한다. 아래는 기능 전체를 조망하기 위한 지도이며 세부 옵션은 공식 문서에서 확인한다.

## 전체 작동 모델 — 변경에서 협업까지

```text
Working Tree ── add ──> Index ── commit ──> Commit DAG
     │                    │                    │
     │  restore / diff    │  diff --staged     ├─ HEAD / Branch / Tag
     └────────────────────┘                    ├─ merge / rebase / cherry-pick
                                               └─ push / fetch ↔ Remote

주변 기능
├─ stash / worktree / submodule : 작업 분리
├─ restore / reset / revert / reflog : 복구
└─ config / ignore / hooks / attributes : 동작 설정
```

**기록 대상(파일·Index·Commit)과 참조(HEAD·Branch·Tag)는 다르다.** 아래 본문은 이 모델에서 각 명령이 무엇을 변경하는지 설명한다.

## 1. 변경 기록 — Working Tree·Index·Commit

```text
Working Tree ── git add ──> Index ── git commit ──> Commit (Repository)
     ▲                       │                          │
     └── git restore ────────┘                       Branch / HEAD
          (기본 복원 대상)                            │
                                                push / fetch
                                                     │
                                                   Remote
```

- **Working Tree**는 실제 편집 파일, **Index**는 다음 Commit에 넣을 스냅샷, **Commit**은 부모 참조와 트리 정보를 가진 기록이다.
- `git diff`는 기본적으로 Working Tree와 Index, `git diff --staged`는 Index와 HEAD를 비교한다.
- `git status`는 이 세 상태의 차이를 관찰한다.

**대표 흐름:** 파일 수정 → `git add file`로 Index에 선택 → `git diff --staged`로 확인 → `git commit -m "message"`로 스냅샷 기록. 수정한 모든 파일이 자동으로 Commit되는 것은 아니다.

## 2. 이력과 참조 — Commit DAG·HEAD·Branch

```text
Commit DAG (변경 이력)
A ── B ── C
          ▲
        main (Branch: 움직이는 참조)
          ▲
         HEAD (현재 체크아웃 위치)
        v1.0 (Tag: 이름 붙인 참조)
```

`branch`는 이력의 끝을 가리키는 움직이는 이름, `tag`는 특정 객체에 붙이는 이름이다. `switch`는 작업 위치를 바꾸고 `log`는 이력을 관찰한다. `blame`은 줄의 변경 이력을 추적하고 `bisect`는 문제를 도입한 커밋을 이진 탐색한다.

## 3. 이력 통합 — Merge·Rebase·Cherry-pick

| 기능 | 개념 | 대표 명령 |
|---|---|---|
| Merge | 두 개발 이력의 합류; 필요 시 Merge Commit | `git merge feature` |
| Rebase | 변경을 다른 기반 위에서 다시 적용해 새 Commit 생성 | `git rebase main` |
| Cherry-pick | 특정 Commit의 변경만 현재 이력에 적용 | `git cherry-pick <commit>` |
| Squash | 여러 변경을 하나의 Commit으로 묶음 | `git rebase -i` 등 |

**공유한 Commit을 재작성하면 다른 사람의 참조와 충돌할 수 있다.** Merge·Rebase의 선택은 이력의 모양뿐 아니라 협업 정책의 문제다.

## 4. 원격 협업 — Fetch·Pull·Push

```text
Remote ── fetch ──> Remote-tracking refs (origin/main)
                             │
                         merge / rebase
                             │
                      Local branch (main)
                             │
                            push ──> Remote
```

`fetch`는 원격 정보를 가져오지만 현재 브랜치를 자동 통합하지 않는다. `pull`은 fetch 후 설정·옵션에 따라 merge 또는 rebase 등을 수행한다. `push`는 원격 참조를 갱신한다.

## 5. 작업 분리 — Stash·Worktree·Submodule

| 기능 | 분리하는 대상 | 기억할 차이 |
|---|---|---|
| Stash | 미완료 작업의 임시 스냅샷 | `push`·`apply`·`pop` |
| Worktree | 하나의 저장소에 연결된 별도 작업 디렉터리 | 각 Worktree의 HEAD·Index·작업 파일이 별개 |
| Submodule | 다른 저장소를 특정 Commit으로 참조 | 부모 저장소는 하위 저장소의 Commit을 기록 |

Worktree를 삭제해도 해당 Branch가 자동 삭제되는 것은 아니다.

## 6. 복구 — 어떤 상태를 되돌리는가?

| 기능 | 바꾸는 것 | 위험 경계 |
|---|---|---|
| `restore` | 파일의 Working Tree 또는 Index 내용 | 미커밋 변경 덮어쓰기 |
| `reset` | Branch/HEAD, 경우에 따라 Index·Working Tree | `--hard`는 작업 파일까지 덮어씀 |
| `revert` | 기존 변경을 상쇄하는 새 Commit | 공유 이력 유지에 적합 |
| `reflog` | 로컬 참조 이동 기록 조회 | 기록 만료·GC 이후 복구 보장 안 됨 |
| `clean` | 추적되지 않는 파일·디렉터리 삭제 | 삭제 전 `-n` 미리보기 |

`reset --soft`는 참조만, `reset --mixed`는 참조와 Index, `reset --hard`는 Working Tree까지 갱신한다. <https://git-scm.com/docs/git-reset>

## 7. 설정·무시 규칙

`.gitignore`는 기본적으로 **추적되지 않는 파일**에 적용된다. 이미 추적하는 파일은 Index에서 추적을 해제해야 한다. `config`는 동작 설정, `hooks`는 이벤트에 연결된 스크립트, `attributes`는 경로별 처리 규칙을 맡는다.

공식 명세: [Git Reference](https://git-scm.com/docs) · [Git User Manual](https://git-scm.com/docs/user-manual)
