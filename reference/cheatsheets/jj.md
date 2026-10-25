# Jujutsu (jj) — 변경 모델 치트시트

> jj는 Git 명령어의 별칭 집합이 아니다. **Change(논리적 변경)**와 **Revision(그 변경의 특정 상태)**을 구분하는 버전 관리 시스템이다.

## 먼저 이해할 대상

```text
Change (논리적 작업)
   ├─ Change ID  : 수정·재작성 후에도 작업을 추적
   └─ Revision   : 특정 시점의 스냅샷
        └─ Commit ID

Working-copy commit @ : 현재 작업의 revision
Bookmark              : 이름 붙은 참조 (Git 원격 연동)
Operation log          : jj 저장소 조작 이력
```

Git의 index에 매번 `add`하는 모델과 달리 jj는 working copy 변경을 자동으로 스냅샷한다. **스냅샷은 원격 push가 아니다.**

## 명령어를 동작별로 조합하기

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

`-m`은 message, `-r`은 revision을 지정할 때 쓰는 옵션이다. 상세 인자와 대상 선택은 `jj help <command>`에서 확인한다.

## Git 원격과 만나는 지점

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
