# Jujutsu (jj) Cheatsheet

> Git의 CLI를 그대로 감싼 도구가 아니라, change/revision 중심 작업 모델을 제공하는 버전 관리 시스템.

- 공식 문서: https://docs.jj-vcs.dev/latest/
- 코드: https://github.com/jj-vcs/jj
- GUI/TUI: [jjui](https://github.com/idursun/jjui)
- 개념 소개: https://clang-engineer.github.io/posts/jujutsu-git-alternative/ (블로그 퍼머링크가 다르면 블로그 검색에서 글 제목 확인)

## 핵심 모델

| 요소 | 의미 |
|---|---|
| Working-copy commit (`@`) | 현재 파일 작업의 변경을 나타내는 수정 가능한 commit |
| Change ID | 논리적 변경을 추적하는 식별자 |
| Commit ID | 특정 스냅샷(revision)의 식별자 |
| Bookmark | 이름이 붙은 참조; Git 원격과 동기화할 때 중요 |
| Operation log | jj 저장소를 조작한 이력 |

jj의 기본 작업에는 Git처럼 매번 `git add`로 index를 채우는 단계가 없다.

## 설치·기존 저장소에서 실험

```sh
brew install jj
jj version

# Git 저장소를 별도 디렉터리에 복제해 안전하게 실험
jj git clone https://github.com/jj-vcs/jj.git jj-playground
cd jj-playground

jj status
jj log
```

처음에는 실제 업무 저장소보다 테스트 복제본을 권장한다.

## 일상 명령

| 목적 | 예시 |
|---|---|
| 현재 상태 | `jj status` |
| 그래프 보기 | `jj log` |
| 차이 확인 | `jj diff` |
| 새 change 시작 | `jj new` |
| 설명 작성 | `jj describe -m "변경 설명"` |
| 이전 revision 수정 | `jj edit <revision>` |
| 자식 변경을 부모에 합침 | `jj squash` |
| 변경을 둘로 나누기 | `jj split` |
| revision 요약 보기 | `jj show <revision>` |
| operation 이력 | `jj op log` |
| 마지막 조작 취소 | `jj undo` |

명령 실행 전에 `jj help <command>`로 사용 중인 버전의 옵션을 확인한다.

## Git과의 비교

| Git | jj | 주의 |
|---|---|---|
| `git status` | `jj status` | 둘의 상태 모델은 다름 |
| `git diff` | `jj diff` | 기본 비교 대상과 출력 확인 |
| `git log` | `jj log` | jj의 revision graph 중심 |
| `git commit --amend` | `jj describe` / `jj edit` | 목적과 revision에 따라 선택 |
| `git rebase -i` | `jj rebase`, `jj squash`, `jj split` | 1:1 문법 대응 아님 |
| `git reflog` | `jj op log` | 서로 다른 기록 모델 |

## 원격 저장소와 bookmark

```sh
jj git fetch
jj bookmark list
jj bookmark create feature-demo -r @
jj git push --bookmark feature-demo
```

원격으로 보내기 전, push 대상 bookmark와 revision을 반드시 확인한다. 공유한 이력의 재작성은 협업자에게 영향을 준다. GitHub PR과 CI는 여전히 Git 원격의 참조를 중심으로 동작한다.

## 자주 하는 실수

- `jj new`를 `git switch -c`와 같은 명령으로 이해하지 않는다.
- 자동 스냅샷이 자동 push를 의미한다고 생각하지 않는다.
- `jj undo`가 이미 전송한 원격 변경이나 외부 시스템 조작까지 되돌린다고 가정하지 않는다.
- 충돌을 가진 revision을 보존할 수 있지만, 원격 통합 전에는 충돌 해결이 필요할 수 있다.
- jj와 Git 도구를 섞어 쓰기 전에 Git 백엔드 및 working copy 연동 조건을 확인한다.

관련 글: [Git cheatsheet](git.md) · [Devkit CLI 지도](../cli/README.md).
