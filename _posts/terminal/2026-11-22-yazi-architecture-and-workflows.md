---
title: "Yazi — 터미널 파일 관리자의 구조와 활용"
date: 2026-11-22
categories: [Terminal, Tools]
tags: [yazi, tui, rust, terminal, file-manager]
---

Yazi는 단순한 3열 파일 탐색기가 아니라 **탐색·선택·비동기 작업·미리보기·원격 저장소·플러그인**을 묶은 터미널 파일 관리 환경이다. 이 글은 기능의 큰 그림을 먼저 설명하고, 실전 사용 흐름과 확장 경계를 정리한다.

## 전체 구조

```text
사용자 입력 (키보드·마우스)
          │
          ▼
Yazi Manager ─── 탭 / Parent·Current·Preview
   │       │
   │       ├── Find·Filter / fd·rg·fzf·zoxide
   │       ├── Hover / Selection
   │       └── Opener / Previewer
   ▼
Task Scheduler ── 복사·이동·삭제·미리보기 생성
   │
   ├── Local FS / VFS (원격 저장소)
   └── DDS (이벤트 전달·인스턴스 통신)
             │
        Lua Plugins / Flavor
```

핵심 구분은 **Hover(커서가 가리키는 항목)**와 **Selection(명시적으로 선택한 집합)**이다. 복사·이동 등은 선택 집합이 있으면 그 집합을 대상으로 수행한다.

## 1. 탐색과 파일 작업

`h/j/k/l`로 이동하고 `Space` 또는 `v`로 여러 파일을 선택한다. `y → p`는 복사, `x → p`는 이동이다. `tt`로 탭을 추가하고 `1..9`로 전환한다. 다중 선택 후 `r`을 누르면 편집기에서 파일명 목록을 수정하는 Bulk Rename을 사용할 수 있다.

```text
탐색 → 선택 → 작업 지정 → 대상 경로 이동 → 적용
         Space/v       y/x                  p
```

파일 삭제 시 `d`(휴지통)와 `D`(영구 삭제)를 구분한다. 파일 작업은 비동기 스케줄러로 처리되며 `w`로 Task Manager를 확인할 수 있다.

## 2. 검색 도구의 역할

| 키 | 도구 | 역할 |
|---|---|---|
| `/` | Yazi | 현재 목록 내 이름 찾기 |
| `f` | Yazi | 현재 목록 필터 |
| `s` | fd | 하위 경로의 파일명 검색 |
| `S` | ripgrep | 파일 내용 검색 |
| `z` | zoxide | 방문 기록 기반 폴더 이동 |
| `Z` | fzf | 퍼지 검색으로 파일·폴더 이동 |

`fzf`는 후보를 퍼지 매칭하고 `zoxide`는 방문 빈도와 최근성을 바탕으로 경로를 찾는다. 두 도구는 역할이 다르다.

## 3. 미리보기와 Opener

```text
파일 선택
  ├─ Previewer → 텍스트·코드 표시
  │              이미지·SVG·PDF·동영상 → 렌더링/썸네일 → 터미널 표시
  └─ Opener    → 편집기·뷰어 등 외부 프로그램 실행
```

SVG는 `resvg`, PDF는 Poppler의 `pdftoppm`, 동영상 썸네일은 `ffmpeg` 등 외부 도구가 필요할 수 있다. Ghostty에서는 이미지 프로토콜을 활용하며 tmux 사용 시 passthrough 설정과 호환성을 확인한다. 파일을 **미리 보는 것**과 **열어서 편집하는 것**은 다른 경로다.

## 4. VFS와 DDS

VFS는 로컬 파일시스템 외의 저장소를 동일한 탐색 UI로 다루기 위한 추상화다. SFTP 같은 원격 제공자의 지원 범위는 로컬 파일 작업과 완전히 같지 않을 수 있다.

DDS는 인스턴스와 플러그인 간 이벤트를 전달한다. tmux의 여러 창에서 Yazi를 실행할 때 인스턴스 간 상태 동기화나 외부 제어를 구현하는 기반이다. tmux가 터미널 세션을 관리하는 것과는 계층이 다르다.

## 5. 플러그인과 설정

| 파일 | 책임 |
|---|---|
| `yazi.toml` | Manager·Opener·Previewer·패널 비율 |
| `keymap.toml` | 키 조합 |
| `theme.toml` | 색상·Flavor |
| `init.lua` | Lua 플러그인 초기화 |
| `package.toml` | 설치 패키지 기록 |

```toml
[mgr]
ratio = [1, 3, 5]
```

`ya pkg`로 플러그인과 Flavor를 관리한다. 예를 들어 `git.yazi`는 Git 상태 표시, `toggle-pane.yazi`는 패널 배치 전환을 담당한다. 플러그인 설치·키맵은 해당 README와 Yazi 버전을 확인한다.

## 6. tmux · LazyVim · Lazygit과 역할 분리

```text
tmux     작업 세션·창 유지
 ├─ Yazi     파일 탐색·정리·미리보기
 ├─ LazyVim  코드 편집·진단
 └─ Lazygit  diff·stage·commit·rebase
```

Yazi에 Git 조작 기능을 중복 구현하기보다 변경 상태만 표시하고, 실제 Git 작업은 Lazygit에 맡기는 편이 단순하다.

## 7. 더 알아볼 기능

File Chooser는 외부 CLI에 선택한 경로를 전달한다. Mount/Trash/Drag & Drop은 운영체제·터미널·프로토콜의 지원 여부를 구분해서 확인한다. Bulk Create는 기본 파일 생성(`a`)과 별도 일괄 생성 워크플로를 혼동하지 않는다.

## 참고

- [Yazi 공식 저장소](https://github.com/sxyazi/yazi)
- [Yazi 공식 문서](https://yazi-rs.github.io/docs/)
- [공식 플러그인](https://github.com/yazi-rs/plugins)
- [Yazi Cheatsheet](/reference/cheatsheets/yazi/)
