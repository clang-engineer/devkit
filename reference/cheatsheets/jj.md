# Jujutsu (jj) — 변경 모델 치트시트

> jj는 Git 명령어의 별칭 집합이 아니다. **Change(논리적 변경)**와 **Revision(그 변경의 특정 상태)**을 구분하는 버전 관리 시스템이다.

## 전체 작동 모델 — Change·Revision·Operation

```text
Working Copy (현재 작업)
      │ 자동 스냅샷
      ▼
Working-copy Revision (@) ── Change ID (논리적 변경 추적)
      │
      ├─ describe / edit / squash / rebase → 새 Revision
      │                                     └─ Commit ID 변경 가능
      └─ new → 다음 작업 Revision

Operation Log ── undo → 저장소 조작 되돌리기
Bookmark ── git fetch / push → Git 원격 참조
```

**Change ID는 논리적 작업의 식별자이고 Commit ID는 특정 Revision의 식별자**다. 변경을 재작성해도 Change ID를 통해 같은 작업을 추적할 수 있다. Working Copy의 자동 스냅샷은 원격 Push와 다르다.

## 1. Revision 조작 — 관찰·작성·재구성·복구

```text
jj
├─ 관찰    status / log / diff / show
├─ 작업    new / edit / describe
├─ 재구성  squash / split / rebase
├─ 복구    op log / undo
└─ 원격    git fetch / git push / bookmark
```

```sh
jj status                 # 현재 상태
jj log                    # revision graph
jj new                    # 새 작업 revision 시작
jj describe -m "설명"     # revision 설명 변경
jj edit <revision>        # 기존 revision 편집
jj squash                 # 변경을 부모 쪽으로 합침
jj split                  # 변경 분할
jj op log                 # jj 조작 이력
jj undo                   # 직전 jj 조작 취소
```

**작업 예시:** `jj new`로 새 Revision을 시작하고 파일을 수정한 뒤 `jj diff`로 변경을 확인한다. `jj describe -m "작업 설명"`으로 메시지를 붙이고 `jj log`로 Revision 관계를 살핀다.

`-m`은 message, `-r`은 revision을 지정할 때 쓰는 옵션이다. 상세 인자와 대상 선택은 `jj help <command>`에서 확인한다.

## 2. 협업 — Bookmark와 Git 원격

```text
jj revision graph
       │
    Bookmark ──> Git remote refs
       │
 jj git fetch / push
```

```sh
jj git fetch
jj bookmark list
jj bookmark create feature-demo -r @
jj git push --bookmark feature-demo
```

`jj new`는 `git switch -c`와 동일하지 않으며, `jj op log`도 Git reflog와 같은 기록 모델이 아니다. `jj undo`는 이미 push한 원격 변경까지 되돌리지 않는다. 공유 이력을 재작성할 때는 협업 영향을 확인한다.

공식 문서: <https://docs.jj-vcs.dev/latest/> · [Git 치트시트](git.md) · [jjui](https://github.com/idursun/jjui)
