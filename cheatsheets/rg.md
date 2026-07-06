# ripgrep (rg) Cheatsheet

> **rip grep** — `grep -r` 대체. 훨씬 빠르고 직관적이며, 기본적으로 `.gitignore`/숨김 파일을 건너뛴다.

## 왜 rg

| 항목 | grep | rg |
|---|---|---|
| 재귀 검색 | `-r` 옵션 필요 | 기본 |
| `.gitignore` | 무시 (직접 `--exclude`) | **자동 적용** |
| 속도 | 보통 | 가장 빠름 (Rust + 병렬) |
| 정규식 | POSIX (`-E` 확장) | Rust regex (`--pcre2`로 PCRE2) |
| 컬러/그룹화 | 옵션 | 기본으로 보기 좋게 |
| 파일 타입 | `--include='*.py'` | `-t py` |

LazyVim / Telescope / fzf / VSCode가 기본으로 `rg`를 호출한다. PATH에 깔려 있으면 자동 활용.

## 설치

```bash
brew install ripgrep        # macOS
scoop install ripgrep       # Windows
```

## 기본 검색

```bash
rg "패턴"                      # 현재 디렉터리에서 재귀 검색
rg "패턴" src/                  # 특정 디렉터리에서 검색
rg -i "error"                  # 대소문자 무시
rg -w "main"                   # 단어 단위 매칭
rg -F "1.0.0"                  # 고정 문자열 (regex 비활성화)
rg -l "TODO"                   # 매칭된 파일명만 출력
rg -c "TODO"                   # 파일별 매칭 횟수
rg -m 5 "패턴"                 # 파일당 최대 5개 매칭
```

## 파일 필터

```bash
rg "함수명" -t ts              # .ts 파일에서만
rg "함수명" -T test            # 테스트 파일 제외
rg "패턴" --type-list          # 사용 가능한 타입 목록
rg "error" --glob "*.log"      # glob 패턴으로 필터
rg "error" --glob "!node_modules"  # 특정 디렉터리 제외
```

## 컨텍스트

```bash
rg -A 3 "function"             # 매칭 후 3줄 표시
rg -B 2 "error"                # 매칭 전 2줄 표시
rg -C 2 "TODO"                 # 전후 2줄 표시
```

## 숨김 / gitignore

```bash
rg --hidden "패턴"             # 숨김 파일 포함
rg --no-ignore "패턴"          # .gitignore 무시
rg -uu "패턴"                  # 위 둘 동시에 (-u 1단, -uu 2단, -uuu 3단)
```

## 고급

```bash
rg -e "패턴1" -e "패턴2"       # OR 검색
rg --json "패턴"               # JSON 출력 (다른 도구로 파이프)
rg --pcre2 "(?<=\b)foo(?=\b)"  # lookaround 등 PCRE2 기능
rg "from (\w+)" -r '$1'        # replace로 캡처 변환 출력
rg --vimgrep "TODO"            # file:line:col:text — vim quickfix 호환
rg --files-with-matches "TODO"  # = -l
rg --files-without-match "@license"   # 매칭 안 된 파일만
rg --count-matches "TODO"      # 파일당이 아니라 줄당 매칭 수
rg --files | wc -l             # rg가 인식하는 파일 수
rg --debug "패턴" 2>&1 | head  # 어떤 ignore 규칙이 적용됐는지
```

## `.ripgreprc` (전역 기본 옵션)

```sh
# ~/.ripgreprc
--max-columns=150
--max-columns-preview
--smart-case
--hidden
--glob=!.git/*
```

```sh
export RIPGREP_CONFIG_PATH=~/.ripgreprc
```

## 활용 시나리오

### 어떤 환경변수가 코드 어디서 쓰이는지

```bash
rg "DATABASE_URL"
```

### 함수 정의 찾기

```bash
rg "fn parse_url" -t rust
rg "def parse_url\(" -t py
```

### TODO 있는 파일을 골라 nvim으로 열기

```bash
rg -l "TODO" | fzf | xargs nvim
```

### 매칭 줄을 수정하려는 파일들 추리기

```bash
rg -l "deprecated_api" | xargs sed -i 's/deprecated_api/new_api/g'
```

## LazyVim에서

| 진입점 | 내부 호출 |
|--------|-----------|
| `<leader>sg` | live grep (Snacks/Telescope) → `rg` |
| `<leader>/` | 현재 버퍼 grep → `rg` |
| `:Telescope live_grep` | `rg` |

`rg`가 PATH에 없으면 grep fallback으로 느려진다.

## 더 보기

- `rg --help`, `man rg`
- 공식: https://github.com/BurntSushi/ripgrep
