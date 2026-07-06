---
layout: notes
title: "Claude Code add-dir 동작 — 권한 경계 확장과 제거 불가"
date: 2026-06-19
categories: [tools]
tags: [claude-code, cli, workspace]
---

Claude Code의 `add-dir`는 **작업 디렉터리(권한 경계)를 넓히는** 기능이다. 이미 경계 안에 있는 걸 추가하면 의미가 없고, 한 번 추가한 건 세션 도중 뺄 수 없다.

## 추가 방법

```sh
claude --add-dir /path/to/dir   # 세션 시작 시 플래그
/add-dir /path/to/dir           # 세션 도중 슬래시 커맨드
```

추가하면 그 디렉터리도 권한 경계 안에 들어와 읽기/편집/검색이 가능해진다.

## "자기(또는 하위) 디렉터리를 add-dir"하면 = 무의미한 중복

add-dir는 범위를 **넓히는** 것이라, 이미 범위 안인 걸 또 넣으면 기능적으로 no-op다.

| 케이스 | 효과 |
|---|---|
| cwd 자기 자신을 add-dir | 범위 확장 0 → **no-op** |
| cwd의 하위 디렉터리를 add-dir | 이미 cwd에 포함 → **no-op** |
| cwd의 **상위** 디렉터리를 add-dir | cwd·형제까지 포함 → **실제 확장됨** |

주의: 권한엔 영향 없어도, Claude Code는 입력받은 값을 그대로 `added_dirs`에 담아둔다. 그래서 statusline 등에서 `added_dirs`를 그냥 출력하면 cwd 자기 자신/하위가 **중복 표시**된다.

## 추가한 디렉터리는 세션 도중 제거 불가

`/remove-dir` 같은 명령은 **없다**. `/add-dir`가 의도적으로 "세션 한정 추가"로 설계됨.

- `--add-dir` / `/add-dir`로 넣은 건 → **세션 재시작하면 자연히 사라짐**
- `settings.json`의 `permissions.additionalDirectories`로 영구 추가한 경우 → 거기서 지우고 재시작

표시만 거슬린다면 권한은 못 빼도, statusline 쪽에서 `added_dirs` 중 cwd와 같거나 cwd 하위인 항목을 필터링해 화면에서만 숨길 수 있다(도구 설계를 거스르지 않는 표시 단 처리).

## 2026-07-06 추가 — `/cd`로 주 작업 디렉토리(root) 이동

`/add-dir`는 root를 **안 바꾼다**(경계만 확장). 세션 시작 후 root 자체를 옮기려면 `/cd`가 정답이다.

```sh
/cd /path/to/dir   # 세션의 주 작업 디렉토리(cwd)를 이동
```

- **Claude Code v2.1.169 이상** 필요. 구버전은 `Unknown command: /cd`.
- 대화/prompt cache 유지 — 새 디렉토리의 `CLAUDE.md`를 rebuild 안 하고 메시지로 append하는 방식이라 재시작 없이 옮겨진다.
- 세션이 새 디렉토리의 프로젝트 스토리지로 재배치됨 → 이후 `/resume`·`/continue`도 거기서 찾음.
- 처음 가는 디렉토리면 trust 프롬프트가 뜬다.

| 목적 | 명령 |
|---|---|
| root 자체를 이동 | `/cd` |
| 다른 트리 파일 **접근만** 추가 (root 유지) | `/add-dir` |

구버전(< 2.1.169)이라 `/cd`가 없으면 → 새 디렉토리에서 `claude --continue`(또는 그 디렉토리에서 `/resume`)로 세션을 이어 여는 게 정공법.
