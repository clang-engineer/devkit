---
layout: notes
title: "Git/GitHub 잔디밭·hunk·활동 모아보기"
date: 2026-06-07
categories: [git]
tags: [github, contribution-graph, hunk, git-add-p, review]
---

잔디밭(contribution graph)은 커밋이 소속된 레포에 귀속되므로 레포를 지우면 함께 사라진다. hunk는 diff의 최소 변경 단위이고, 본인 활동 모아보기는 UI보다 검색 필터가 정확하다.

## 레포 삭제 시 잔디밭이 사라지는 이유와 유지 방법

contribution graph의 근거는 각 레포에 남은 커밋 기록이다. 커밋은 독립적으로 프로필에 저장되는 게 아니라 레포에 귀속돼 있어서, 레포를 삭제하면 그 커밋들이 통째로 사라지고 잔디도 함께 날아간다. "잔디 유지 = 목록에 남음, 목록에서 제거 = 잔디 날아감"은 같이 못 가져가는 트레이드오프다.

유지하고 싶다면:

- **아카이브(archive)** — 삭제하지 않고 읽기 전용으로 보관. 잔디 유지되고 "Archived" 뱃지만 붙는다. 단 목록에는 계속 뜬다. `gh repo archive owner/repo --yes`.
- **private 전환** — 남이 보는 프로필 목록에서는 안 보이면서 본인은 보이고 잔디도 유지(프로필에서 private contribution 표시 옵션 켜기).
- **삭제 후 90일 이내 복원** — Settings → Repositories에서 복원 가능하나 fork 등 조건이 있어 항상 되진 않는다.
- **subtree로 합치기** — 여러 레포를 하나의 아카이브 레포로 흡수하면 잔디 살리고 목록도 준다. `git subtree`/`read-tree --prefix`로 각 레포를 하위 폴더로 병합하면 과거 커밋이 날짜까지 그대로 따라와 잔디가 보존되고, 원본은 삭제해도 된다. 단 **본인이 author인 커밋만** 카운트되고, 커밋 author 이메일이 GitHub 계정에 등록돼 있어야 한다.

정리가 목적이고 학습/테스트용이라 잔디가 안 아까우면 그냥 삭제도 합리적이다. 아까우면 삭제 전 `git clone --mirror`로 백업해두면 나중에 다시 push해 복구할 수 있다.

## hunk란 무엇인가

hunk는 diff에서 연속적으로 바뀐 코드 블록 한 덩어리다. `git diff` 출력에서 `@@ -10,7 +10,9 @@` 같은 줄로 시작하는 각 구간이 하나의 hunk다. 한 파일에서 10번째 줄 근처와 200번째 줄 근처를 각각 고쳤다면, 떨어진 두 변경은 보통 별개의 hunk로 나뉜다.

`git add -p`는 파일 전체가 아니라 hunk 단위로 골라 스테이징하게 해준다. 한 파일에 성격이 다른 변경이 섞였을 때 커밋을 깔끔하게 나누는 데 쓴다. Neovim gitsigns에서는 `]c`/`[c`로 hunk 사이를 이동하고 `:Gitsigns stage_hunk`로 커서가 있는 hunk만 스테이징한다.

## GitHub에서 본인 활동 모아보기

전용 UI로 "내가 댓글 단 것 전부"를 깔끔하게 보는 화면은 없다. 그 부분은 검색 필터가 사실상 유일하다.

- `commenter:내아이디` — 내가 댓글 단 모든 이슈/PR
- `involves:내아이디` — 작성·할당·멘션·댓글 등 내가 관여한 모든 것 (`sort:updated-desc`와 조합하면 편함)
- `author:내아이디 type:pr` — 내가 연 PR
- `review-requested:내아이디 type:pr` / `reviewed-by:내아이디 type:pr` — 리뷰 요청받은/내가 리뷰한 PR

UI로는 상단 **Pull requests** 메뉴(Created / Assigned / Review requests / Mentioned 탭)와 **Issues** 메뉴가 PR·이슈 몰아보기엔 제일 낫다. `github.com/issues`, `github.com/pulls`로 바로 접근 가능. 프로필의 contribution activity에서 월별로 접힌 활동도 펼쳐 볼 수 있다.

참고로 Star는 알림을 만들지 않는다. 레포 릴리스 알림이 계속 뜨는 건 **Watch** 설정 때문이며, `github.com/watching`에서 필요 없는 걸 Unwatch 하면 된다.

## Claude로 GitHub 레포 전체 검토가 되는가

채팅 인터페이스의 Claude는 GitHub 레포에 자동 연결돼 전체를 스캔하는 기능이 없다. 파일을 압축해 업로드하거나 public 레포의 특정 파일 URL을 주면 읽을 수 있지만, 레포 전체를 자동 순회하진 못한다.

레포 "전체 검토"에는 **Claude Code**가 사실상 유일하게 적합하다. 로컬에 클론한 레포 안에서 실행하는 명령줄 에이전트로, 코드베이스 전체를 탐색하며 검토·리팩토링·버그 수정을 한다.

## 2026-07-03 추가

### "push 안 됨"과 "커밋 안 됨"은 다른 상태다

일괄 push 스크립트에서 흔한 함정: ahead 커밋만 검사하면 **아직 커밋조차 안 한 변경**은 조용히 빠진다. 두 상태는 감지 명령이 다르다.

- **커밋했지만 push 안 됨 (ahead)** — 로컬 브랜치가 upstream보다 앞섬.
  ```bash
  git rev-parse "@{u}" &>/dev/null || continue   # upstream 없으면 스킵
  ahead=$(git log "@{u}..HEAD" --oneline)         # 있으면 push 대상
  ```
- **아직 커밋 안 됨 (dirty working tree)** — 스테이징/미스테이징 변경이 남음.
  ```bash
  [ -n "$(git status --porcelain)" ] && echo "dirty"
  ```

`git status --porcelain`은 변경이 있으면 파일 목록을, 없으면 빈 문자열을 출력해 스크립트에서 dirty 판정에 그대로 쓴다(사람이 읽는 `git status`와 달리 안정적 포맷). ahead 검사(`@{u}..HEAD`)만으로는 dirty를 못 잡으므로, 일괄 push 루프에 dirty 검사를 별도로 넣어 "커밋 안 된 repo"를 마지막에 경고로 모아 알려주면 누락이 없다.
