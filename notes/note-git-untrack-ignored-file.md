---
layout: notes
title: "이미 추적 중인 파일을 .gitignore로 무시하기"
date: 2026-07-03
categories: [git]
tags: [git, gitignore, cache]
---

`.gitignore`는 **아직 추적되지 않은** 파일에만 적용된다. 이미 커밋된 적 있는 파일은 `.gitignore`에 넣어도 계속 추적되므로, 캐시에서 명시적으로 제거해야 한다.

## 확인

```bash
git ls-files nohup.out    # 출력 있으면 = 추적 중
git check-ignore nohup.out # 출력 있으면 = 이미 무시됨
```

## 해제

```bash
# .gitignore에 패턴 추가한 뒤
git rm --cached nohup.out   # 인덱스에서만 제거 (로컬 파일은 유지)
```

- `--cached` 없이 `git rm`하면 **로컬 파일까지 삭제**되니 주의.
- 디렉토리 전체면 `git rm -r --cached path/`.
- 이후 `git status`에 `D`(삭제)로 잡히고, 커밋하면 추적이 끊긴다. 로컬 파일은 그대로 남아 있고 `.gitignore` 덕분에 다시 올라오지 않는다.
