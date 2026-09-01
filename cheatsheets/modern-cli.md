# Modern CLI Cheatsheet

> 기본 Unix 도구의 모던 대체품 모음. `cat`/`ls`/`find`/`cd`/`man`/`tree`/`git diff`를 더 빠르고 예쁘게.

## 개념 흐름

```text
기존 도구 → 모던 대체품
  cat    → bat (구문 강조)
  ls     → eza (git + 트리)
  find   → fd (직관 문법)
  cd     → zoxide (빈도 학습)
  man    → tldr (핵심 예시)
```

| 도구 | 대체 대상 | 핵심 |
|------|----------|------|
| `bat` | `cat` | 구문 강조 + 페이저 |
| `eza` | `ls` | 컬러 + git + 트리 (구 `exa`) |
| `fd` | `find` | 직관 문법 + `.gitignore` 반영 |
| `zoxide` | `cd` | 빈도+최근성 학습 점프 |
| `delta` | `git diff` 페이저 | side-by-side + 구문 강조 |

## 연결 도구

| 도구 | 관계 |
|------|------|
| rg | 텍스트 검색과 함께 사용 |
| fzf | 파일 선택과 함께 사용 |
| git | delta가 git diff 페이저로 사용 |

별도 파일 cheatsheet: [rg.md](rg.md), [fzf.md](fzf.md), [jq.md](jq.md), [lazygit.md](lazygit.md), [gh.md](gh.md).

---

## 옛 이름으로 alias를 잡을 것인가

| 패턴 | 빈도 | 안전도 | 비고 |
|------|------|--------|------|
| `ll = eza -l`, `la`, `lt` (ls 그대로) | 매우 흔함 | 안전 | additive — 옛 명령어 깨지지 않음 |
| `ls = eza` | 흔함 | 비교적 안전 | eza가 ls 호환 잘 됨 |
| `cat = bat` | 갈림 | 주의 | 파이프 감지 시 plain 자동 회피, 그래도 SSH 머신·스크립트 surprise 가능 |
| `grep = rg` | **거의 안 함** | 위험 | 옵션 다름 (`-E`, `-l` 등 호환 X) |
| `find = fd` | **거의 안 함** | 위험 | syntax 자체가 다름 — 스크립트·문서 그대로 못 씀 |

> **결론**: 검색 도구(rg/fd)는 **새 이름 그대로**. ls는 그대로 두고 보조 alias(ll/la/lt)만 추가. cat=bat은 시범 도입 — 굳이 한다면 `alias cat='bat --paging=never --style=plain'`로 surprise 최소화하고, 원본은 `\cat`으로 호출 가능.

### 원칙 정리

1. **`ls` 자체는 안 건드림** — `ll`/`la`/`lt` 보조 alias만
2. **검색 도구(`rg`, `fd`)는 절대 override 안 함** — 새 이름 그대로
3. **`cat = bat`만 시범 도입** — surprise 발견 시 제거 또는 옵션 보정

예시 (PowerShell 프로파일):

```powershell
function ll { eza -lh --git --group-directories-first --icons @args }
function la { eza -lah --git --group-directories-first --icons @args }
function lt { eza -T -L 2 --git-ignore --icons @args }

Set-Alias -Name cat -Value bat -Option AllScope
# rg, fd, fzf, jq, gh, delta, lazygit, zoxide — 새 이름 그대로
```

예시 (zsh):

```bash
alias ll='eza -lh --git --group-directories-first --icons'
alias la='eza -lah --git --group-directories-first --icons'
alias lt='eza -T -L 2 --git-ignore --icons'

# 시범 도입 — 도구 호환 문제가 생기면 제거
alias cat='bat --paging=never'
```

---

## 셸 통합 — 전형적인 조합

`zsh` 기준:

```bash
# .zshrc
eval "$(starship init zsh)"            # 프롬프트
eval "$(zoxide init zsh)"              # j <쿼리> 점프
source <(fzf --zsh)                    # Ctrl+R, Ctrl+T, Alt+C
```

> PowerShell은 `Install-Module PSFzf`로 `Ctrl+T`/`Ctrl+R`/`Alt+C` 동일하게 사용. 프롬프트/점프는 starship·zoxide 그대로.

---

## bat — `cat` 대체

```bash
brew install bat                       # macOS
scoop install bat                      # Windows
sudo apt install bat                   # Ubuntu (실행은 batcat → alias bat=batcat)
```

```bash
bat file.sh                            # 구문 강조 + 행번호
bat -l json data.txt                   # 언어 지정
bat -p file.sh                         # plain 모드 (cat처럼)
bat -A file.txt                        # 비출력 문자 표시
bat --diff file.sh                     # Git 변경분만 표시
bat -r 50:100 long.log                 # 라인 50~100만
bat --paging=never file.txt            # 페이저 끄기
bat --style=numbers,changes file.sh    # 스타일 조합
bat --list-themes                      # 테마 목록
```

활용:

```bash
alias cat='bat --paging=never'
fzf --preview 'bat --color=always --style=numbers --line-range=:200 {}'
echo '{"a":1}' | bat -l json
```

---

## eza — `ls` 대체

```bash
brew install eza               # macOS
scoop install eza              # Windows
cargo install eza              # Rust
```

```bash
eza -l                         # 긴 형식
eza -la                        # 숨김 포함
eza -lh                        # human-readable
eza -l --sort=size             # 크기 순
eza -l --sort=modified         # 수정시각 순
eza --group-directories-first  # 디렉터리 먼저
eza -T -L 2                    # 트리 2단계
eza -T -L 2 --git-ignore       # gitignore 반영
eza -T -I "node_modules|dist"  # 제외
eza -l --git                   # git 상태 컬럼
eza --icons                    # 아이콘 (NerdFont 필요)
```

추천 alias:

```bash
alias ls='eza --group-directories-first'
alias ll='eza -lh --git --group-directories-first --icons'
alias la='eza -lah --git --group-directories-first --icons'
alias lt='eza -T -L 2 --git-ignore --icons'
```

> `exa`는 2023년경 archived. eza가 fork이며 기본 호환.

---

## fd — `find` 대체

```bash
brew install fd                    # macOS
scoop install fd                   # Windows
# 일부 Linux는 fdfind → alias fd=fdfind
```

```bash
fd                             # 현재 디렉터리 전체
fd config                      # 이름에 "config" 포함
fd "^test_.*\.py$"             # 정규식
fd -F "package.json"           # 고정 문자열
fd -e lua                      # .lua만
fd -e ts -e tsx                # 여러 확장자
fd -t f / -t d / -t l / -t x   # 파일/디렉터리/심링크/실행파일
fd "패턴" src/                 # 특정 디렉터리에서
fd -d 2 config                 # 깊이 2까지
fd -E node_modules             # 제외
fd -H                          # 숨김 포함
fd -I                          # .gitignore 무시
```

매칭 항목에 명령 실행:

```bash
fd -e log -X rm                # *.log 전부 삭제 (-X = batch)
fd -e log -x rm                # 매치마다 1회 (-x = each)
fd -e jpg -x mv {} {.}.jpeg    # 확장자 일괄 변경
```

자리표시자: `{}` 전체경로, `{.}` 확장자 제외, `{/}` 파일명만, `{//}` 부모.

LazyVim 진입점:

| 진입점 | 호출 |
|--------|------|
| `<leader>ff` / `<leader>sf` | `fd` |
| `:Telescope find_files` | `fd` |

`fd` 없으면 `find` fallback (느림, gitignore 무시).

---

## tree — 디렉터리 구조 시각화

```bash
brew install tree              # macOS
scoop install tree              # Windows
```

```bash
tree -L 2                      # 2단계까지
tree -d                        # 디렉터리만
tree -a                        # 숨김 포함
tree -f                        # 전체 경로
tree --du -h                   # 디렉터리 크기
tree -I "node_modules|dist|.git"   # 제외
tree --gitignore               # .gitignore 자동 적용
tree -J / -X / -H              # JSON / XML / HTML
tree --noreport                # 요약 라인 제거
```

활용:

```bash
# 깔끔한 마크다운용 트리
tree -L 3 -I "node_modules|dist|.git" --noreport

# fzf 미리보기
fzf --preview 'tree -L 2 {}'
```

비슷한 도구: `eza --tree`, `lsd --tree`.

---

## zoxide — `cd` 대체

```bash
brew install zoxide            # macOS
scoop install zoxide           # Windows
sudo apt install zoxide        # Ubuntu 24.04+
```

셸 통합 (필수):

```bash
eval "$(zoxide init zsh)"      # zsh / bash / fish
eval "$(zoxide init zsh --cmd cd)"   # cd를 통째로 대체
```

```bash
z foo                          # "foo" 포함 디렉터리로 점프
z foo bar                      # foo + bar 둘 다 매칭
z -                            # 직전 디렉터리
zi foo                         # fzf로 후보 선택
zi                             # 전체 후보 fzf

zoxide query foo               # 미리보기 (cd 안 함)
zoxide query -ls               # 점수와 함께 목록
zoxide remove /old/path        # 삭제
zoxide edit                    # $EDITOR로 db 편집
```

---

## delta — `git diff` 페이저

```bash
brew install git-delta          # macOS (패키지: git-delta, 실행: delta)
scoop install delta             # Windows
```

`~/.gitconfig`:

```ini
[core]
    pager = delta
[interactive]
    diffFilter = delta --color-only
[delta]
    navigate = true               # n / N 으로 hunk 이동
    side-by-side = true
    line-numbers = true
    syntax-theme = Dracula
[merge]
    conflictStyle = zdiff3
[diff]
    colorMoved = default
```

```bash
delta --show-syntax-themes     # 테마 목록
delta --show-config            # 현재 적용 설정
git --no-pager diff            # delta 우회 (복붙용)
```

lazygit과 조합 (`~/.config/lazygit/config.yml`):

[lazygit.md의 delta 페이저 설정](lazygit.md)을 참조.

---

## grep 계보 — grep → ack → ag → rg

새 코드 저장소 검색은 `.gitignore`를 기본 반영하는 **`rg`**가 주역이다. `grep`은 설치를 기대하기 어려운 최소·레거시 환경과 POSIX 파이프라인용이고, `ack`·`ag`는 `rg` 이전 세대의 코드 검색 도구다. 옵션과 정규식 엔진은 서로 완전히 호환되지 않는다.

### grep 자주 쓰는 옵션 (legacy 환경)

레거시 환경의 `grep` 옵션은 해당 시스템의 `man grep`을 기준으로 확인한다. 저장소 검색용 `rg` 옵션은 [rg.md](rg.md)에 정리되어 있다.

### ack / ag도 위 옵션 대부분 동일

비슷한 단축 옵션이 있어도 도구 간 완전한 호환을 가정하지 않는다. 새 설정과 스크립트에는 `rg`를 우선한다.

### 어디서 어떤 걸 쓰나

- **개발 환경**: `rg`. `.gitignore` 자동 무시, 가장 빠름.
- **서버·최소 환경**: `grep`. 설치 불필요.
- **기존 ack/ag 환경**: 그대로 유지할 수 있지만 새로 도입할 이유는 적음.

자세한 `rg` 사용법은 [rg.md](rg.md).

---

## tldr — `man` 페이지의 핵심 예시

```bash
brew install tlrc              # macOS (Rust, 권장)
scoop install tealdeer         # Windows
npm install -g tldr            # Node (느리지만 보편적)
```

```bash
tldr tar                       # tar 사용 예
tldr docker run
tldr git commit
tldr -u                        # 캐시 업데이트
tldr -l                        # 전체 페이지 목록
tldr --search "compress"       # 키워드 검색
tldr -p osx brew               # 플랫폼별 (osx/linux/windows/common)
```

활용:

```bash
alias t='tldr'
tldr -l | fzf | xargs tldr     # 페이지를 fzf로
```
