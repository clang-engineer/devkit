# LazyGit Cheatsheet

> Git TUI. `git add -p`, `git log --graph`, `git rebase -i`, `git stash` 같은 작업을 키 한두 번으로.
> CLI git 명령을 외우지 않아도 거의 모든 워크플로가 가능.
> 공식: https://github.com/jesseduffield/lazygit

## 30초만 본다면

| 상황 | 키 |
|---|---|
| 패널 직접 점프 | `1`~`5` (Status·Files·Branches·Commits·Stash) |
| 현재 패널 도움말 | `?` (가장 좋은 학습 자료) |
| 파일 스테이지 토글 | `Files`에서 `Space` |
| Hunk 단위 스테이지 | 파일에 `Enter` → hunk마다 `Space` |
| 한 줄 커밋 메시지 | `c` |
| 멀티라인 (에디터) | `C` (대문자) |
| amend | `A` |
| 브랜치 만들기 | `Branches`에서 `n` |
| 인터랙티브 리베이스 | `Commits`에서 베이스 위에 `e` |
| squash / fixup / drop / reword | `s` / `f` / `d` / `r` |
| stash 적용 | `Stash`에서 `Space` |
| 종료 | `q` |

## 설치

```sh
brew install lazygit                            # macOS / Linux
scoop install lazygit                           # Windows
go install github.com/jesseduffield/lazygit@latest
```

## 실행

```sh
lazygit         # Git 리포지토리 내부에서
lg              # 흔한 alias
```

LazyVim에서: `<leader>gg` (cwd) / `<leader>gG` (root dir)

## 인터페이스 구성

```
┌──────────┬─────────────┐
│ 1 Status │             │
├──────────┤             │
│ 2 Files  │  Main view  │
├──────────┤  (diff,     │
│ 3 Branch │   commit,   │
├──────────┤   log...)   │
│ 4 Commits│             │
├──────────┤             │
│ 5 Stash  │             │
└──────────┴─────────────┘
```

`1`~`5` 숫자키 또는 `[`/`]`/`←`/`→` 으로 패널 이동.

## 주요 단축키

### 전역

| 키 | 동작 |
|----|------|
| `?` | 현재 패널 도움말 (가장 좋은 학습 자료) |
| `1`~`5` | 패널 직접 점프 |
| `[` `]` / `←` `→` | 이전/다음 패널 |
| `r` | 새로고침 |
| `/` | 검색 |
| `:` | 커스텀 명령(셸) 실행 |
| `+` / `_` | 화면 모드 전환 (normal/half/full) |
| `Esc` | 취소/뒤로 |
| `q` | 종료 |

### Files 패널 (스테이징)

| 키 | 동작 |
|----|------|
| `Space` | 파일 스테이지 토글 |
| `a` | 모든 변경 스테이지 토글 |
| `Enter` | 파일 열어 hunk/line 단위 스테이지 |
| `c` | 커밋 (한 줄 메시지) |
| `C` | $EDITOR로 커밋 (멀티라인) |
| `A` | amend (마지막 커밋에 추가) |
| `d` | 변경 폐기 |
| `D` | reset (전체 폐기) |
| `s` | stash |
| `e` | $EDITOR로 파일 열기 |
| `=` / `-` | 모든 폴더 열기/닫기 |

### Branches 패널

| 키 | 동작 |
|----|------|
| `Space` | 체크아웃 |
| `n` | 새 브랜치 |
| `d` | 브랜치 삭제 |
| `r` | 체크아웃된 브랜치를 선택 브랜치 위로 rebase |
| `M` | 선택 브랜치를 현재로 merge |
| `f` | fast-forward (체크아웃 없이) |
| `R` | 이름 변경 |
| `P` / `p` | Push / Pull (전역 키) |

### Branches 패널 내부 탭 (Local / Remotes / Tags)

Branches 패널(3번)은 안에 탭 3개를 가진다. Local Branches는 **로컬만** 보여준다 (의도된 분리).

| 키 | 동작 |
|----|------|
| `Tab` | 패널 내 탭 순환 (Local ↔ Remotes ↔ Tags) — **remote 브랜치는 여기 있다** |
| `[` `]` | 패널 간 이동 (탭 전환 아님) |

remote 브랜치 checkout: Remotes 탭 → remote(`origin`) 선택 → `Enter` → 브랜치 목록 → `Space`(로컬 tracking 브랜치 생성).
목록에 새 브랜치가 없으면 `f`(선택 fetch) / `F`(fetch all)로 갱신.

> "remote 탭이 안 보인다"는 십중팔구 `]`만 누르고 패널 내 `Tab`을 안 눌러서다.

### Commits 패널

| 키 | 동작 |
|----|------|
| `Enter` | 커밋 상세 / 파일별 diff |
| `Space` | 그 커밋으로 체크아웃 |
| `r` | 메시지 reword (HEAD가 아니어도 됨) |
| `e` | 그 커밋 edit (인터랙티브 리베이스 자동) |
| `d` | 커밋 drop |
| `s` | squash (위 커밋과 합치기) |
| `f` | fixup |
| `Ctrl+J` / `Ctrl+K` | 커밋 위/아래 이동 (재정렬) |
| `g` | reset to (이 커밋으로 reset) |
| `C` | 커밋 복사 (cherry-pick 마크) |
| `V` | 복사한 커밋 붙여넣기 (cherry-pick 적용) |
| `y` | 커밋 정보 복사 |
| `Ctrl+S` | 로그 필터 모드 |

### Stash 패널

| 키 | 동작 |
|----|------|
| `Space` | apply |
| `g` | pop |
| `d` | drop |

## 활용 시나리오

### 1. Hunk 단위 커밋 (가장 자주)

1. Files 패널에서 파일 위에 커서
2. `Enter`로 들어가서 hunk별 `Space`
3. 더 잘게 쪼개고 싶으면 `Enter`(line mode)에서 `Space`
4. `Esc`로 나와서 `c` → 메시지 → Enter

### 2. 인터랙티브 리베이스 (커밋 정리)

1. Commits 패널에서 베이스 커밋 위에 커서 → `e`
2. 각 커밋에 `s`(squash) / `f`(fixup) / `d`(drop) / `r`(reword)
3. `m`으로 merge mode 진입 시 자동 진행

### 3. 충돌 해결

머지/리베이스 중 충돌 → Files 패널에 충돌 파일 → `Enter`로 hunk 보면서
`Space`(커서 위치 hunk 채택) / `b`(양쪽 다 채택), `←`/`→`로 conflict 이동. (`ours`/`theirs` 전용 키는 없음)

### 4. 멀티라인 커밋 메시지

`C` (대문자) → `$EDITOR`(=nvim) 열림 → 정상 커밋 작성.

## 설정 (`~/.config/lazygit/config.yml`)

```yaml
gui:
  showFileTree: true
  expandFocusedSidePanel: true
  nerdFontsVersion: "3"
  theme:
    activeBorderColor: [cyan, bold]
git:
  paging:
    colorArg: always
    pager: delta --dark --paging=never
```

LazyVim 통합 설정은 `dotfiles/nvim/lazy/lua/plugins/lazygit.lua` 참고
(Windows에서 nvim-remote editPreset 비활성화 처리).

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| 실행 안 됨 | Git 리포지토리 내부에서 실행 |
| 한글/아이콘 깨짐 | NerdFont 사용 |
| diff 색상 이상 | `config.yml` pager 설정 (delta 미설치 시 제거) |

## 더 보기

- `?` (lazygit 안에서)
- 키바인딩 전체: https://github.com/jesseduffield/lazygit/blob/master/docs/keybindings/Keybindings_en.md
