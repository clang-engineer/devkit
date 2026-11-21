# Yazi Cheatsheet

> **터미널 파일 매니저** — Rust로 만든 빠르고 모던한 파일 관리자.
> 3패널 탐색, preview, 비동기 파일 작업, multi-tab을 지원한다.

## 작동 모델 — Manager · 선택 · 작업

```text
Yazi Manager
├─ Tab (각 탭의 현재 디렉터리)
│  └─ 3패널: Parent │ Current │ Preview
│                    ├─ Hover: 커서가 가리키는 항목
│                    └─ Selection: 다중 선택 집합
├─ 탐색·발견: 이동 / Find / Filter / Search / Sort
├─ 파일 작업: Yank / Cut → Paste, Rename / Delete / Link
├─ Tasks: 비동기 파일 작업의 진행·실패 확인
└─ Config / Plugin / Flavor: 동작·확장·외형
```

**Hover는 현재 커서 위치, Selection은 명시적으로 선택한 항목 집합**이다. 파일 작업은 선택 집합이 있으면 이를 대상으로 하고, 없으면 현재 항목을 대상으로 한다. `y`·`x`는 복사·이동 대상을 준비하고 `p`가 목적지 디렉터리에 적용한다.

## 경계

왼쪽은 부모 디렉터리, 가운데는 현재 디렉터리의 항목, 오른쪽은 미리보기다. Yazi를 종료한 뒤 **부모 셸의 작업 디렉터리까지 바꾸려면** 공식 `y` shell wrapper가 필요하다.

## 1. 탐색·선택 — 패널 · 탭 · 정렬

키는 **현재 항목 또는 선택 집합**에 작용한다. 탐색으로 대상을 고른 뒤 선택·파일 작업으로 이어지고, 작업 결과는 디렉터리 목록과 미리보기에 반영된다. 다중 선택 상태에서는 현재 항목 하나가 아니라 선택 집합이 작업 대상이 될 수 있다.

### 기본 키

| 키 | 기능 |
|----|------|
| `j` / `k` | 아래 / 위 이동 |
| `h` / `l` | 상위 폴더 / 폴더 진입 |
| `Enter` 또는 `o` | 파일 열기 |
| `Space` | 파일 선택·해제 |
| `v` | 비주얼 선택 모드 |
| `a` | 파일·폴더 생성 (`폴더명/`이면 폴더) |
| `r` | 이름 변경 |
| `.` | 숨김 파일 표시·숨김 |
| `q` | 종료 (`y` shell wrapper로 실행한 경우 현재 폴더를 셸에 반영) |
| `Q` | cwd-file을 출력하지 않고 종료 |

### 탭·정렬

| 키 | 기능 |
|---|---|
| `tt` / `Ctrl+C` | 현재 디렉터리에서 탭 생성 / 현재 탭 닫기 |
| `1..9` / `[`·`]` | 탭 번호로 전환 / 이전·다음 탭 |
| `{` / `}` | 이전·다음 탭과 순서 교환 |
| `,m` / `,a` / `,s` | 수정 시각 / 이름 / 크기 기준 정렬 |
| `,M` / `,A` / `,S` | 해당 기준 역순 정렬 |

`,` 다음 글자를 누르는 **순차 키 입력**이다. 각 탭은 별도의 탐색 위치를 갖는다.

## 2. 파일 작업 — 복사·이동·삭제

| 키 | 기능 |
|----|------|
| `y` | 복사 대상으로 지정 (yank) |
| `x` | 잘라내기 대상으로 지정 |
| `p` | 붙여넣기 |
| `P` | 대상이 있으면 덮어쓰며 붙여넣기 |
| `Y` / `X` | 복사·잘라내기 상태 취소 |
| `d` | 휴지통으로 이동 |
| `D` | 영구 삭제 |
| `-` / `_` | Yank한 항목의 절대 / 상대 경로 심볼릭 링크 생성 |

> **기억 패턴:** `y → p`는 복사, `x → p`는 이동이다. `y`·`x`는 작업 대상을 보관하는 단계이고 `p`가 대상 디렉터리에 적용한다.

**조합 예시:** 파일에 커서 → `Space`로 여러 항목 선택 → `y` → `h`로 부모 디렉터리 이동 → `p`로 복사. 선택 집합과 현재 디렉터리가 서로 다른 역할을 한다.

## 3. 발견·이동 — 검색과 경로

| 키 | 기능 |
|----|------|
| `/` | 현재 폴더 내 이름 찾기 |
| `n` / `N` | 다음 / 이전 검색 결과 |
| `f` | 현재 목록 필터링 |
| `s` | `fd`로 파일명 검색 |
| `S` | `ripgrep`으로 파일 내용 검색 |
| `z` | `fzf`로 폴더·파일 이동 |
| `Z` | `zoxide`로 폴더 이동 |
| `gg` / `G` | 맨 위 / 맨 아래 |
| `gt` | 휴지통 열기 |

### 경로 복사

| 키 | 기능 |
|----|------|
| `cc` | 전체 파일 경로 복사 |
| `cd` | 현재 디렉터리 경로 복사 |
| `cf` | 파일명 복사 |
| `cn` | 확장자를 제외한 파일명 복사 |

## 4. 작업 상태·설정·확장

`w`는 비동기 작업의 진행·실패를 확인하는 **Task Manager**를 연다. 설정은 파일 관리 동작을 바꾸고 Plugin·Flavor는 기능과 외형을 확장한다.

### 설정과 확장

기본 설정 전체를 복사하지 않아도 된다. 아래 파일에 바꿀 항목만 작성하면 Yazi 기본값 위에 병합된다.

| 파일 | 역할 |
|---|---|
| `~/.config/yazi/yazi.toml` | 파일 관리, 정렬, opener, previewer 등 일반 동작 |
| `~/.config/yazi/keymap.toml` | 키맵 추가·변경 |
| `~/.config/yazi/theme.toml` | 색상과 Flavor 선택 |
| `~/.config/yazi/init.lua` | Lua 플러그인 초기화 |
| `~/.config/yazi/package.toml` | `ya pkg`가 관리하는 패키지 버전 잠금 |

```toml
# ~/.config/yazi/yazi.toml
[mgr]
show_hidden = true
```

기본 키맵을 유지하면서 사용자 키를 추가하려면 `prepend_keymap` 또는 `append_keymap`을 사용한다.

### 플러그인과 Flavor

`ya pkg add <owner/repo:name>`으로 패키지를 추가하고, `ya pkg list` / `ya pkg upgrade` / `ya pkg install`로 조회·업데이트·복원한다. Plugin은 기능, Flavor는 외형을 확장한다. 상세 설치·의존성·버전은 [Yazi 공식 문서](https://yazi-rs.github.io/docs/plugins/overview)를 참고한다.

### 기타

| 키 | 기능 |
|----|------|
| `Tab` | 파일 상세 정보 |
| `O` | 연결 프로그램을 선택해서 열기 |
| `;` | 셸 명령 실행 |
| `:` | 셸 명령을 실행하고 끝날 때까지 대기 |
| `F1` 또는 `~` | 전체 키 도움말 |

## 더 보기

- `yazi --help`, `man yazi`
- 공식: https://yazi-rs.github.io
- Quick Start: https://yazi-rs.github.io/docs/quick-start
- 설정: https://yazi-rs.github.io/docs/configuration/overview
- 플러그인: https://yazi-rs.github.io/docs/plugins/overview
- `ya pkg`: https://yazi-rs.github.io/docs/cli#pm
- Flavor: https://yazi-rs.github.io/docs/flavors/overview
- 키 도움말: Yazi 안에서 `F1` 누르기
