# git-delta Cheatsheet

`git diff`와 `git show` 출력을 읽기 쉽게 만드는 syntax-highlighting pager. 실행 파일 이름은 `delta`, Homebrew 패키지는 `git-delta`다.

## 30초 요약

```sh
brew install git-delta
git config --global core.pager delta
git config --global interactive.diffFilter 'delta --color-only'
git diff
git show HEAD
```

## 기본 설정

```ini
[core]
    pager = delta
[interactive]
    diffFilter = delta --color-only
[delta]
    navigate = true
    line-numbers = true
    side-by-side = false
```

## Mental model

| Git 기본 | delta |
|---|---|
| 단색 diff | 구문 강조 diff |
| 라인 위치 파악 어려움 | 줄 번호, 파일 헤더, hunk 강조 |
| 큰 diff 읽기 어려움 | pager navigation과 테마 지원 |

## 자주 쓰는 명령

| 목적 | 명령 |
|---|---|
| 일반 diff | `git diff` |
| staged diff | `git diff --staged` |
| 커밋 보기 | `git show HEAD` |
| 두 파일 비교 | `delta old.txt new.txt` |
| no-index 비교 | `git diff --no-index --color=always a b \| delta` |

## 유용한 옵션

| 옵션 | 의미 |
|---|---|
| `--side-by-side` | 좌우 비교 |
| `--line-numbers` | 줄 번호 표시 |
| `--navigate` | hunk/file 단위 이동 지원 |
| `--syntax-theme NAME` | 테마 지정 |
| `--color-only` | Git interactive add 등에서 색상만 적용 |

## 권장 사용 기준

- Git pager로 등록해 평소에는 `git diff`, `git show`를 그대로 쓴다.
- script에서 diff 출력을 파싱해야 하면 delta를 끼우지 않는다.
- 파이프 뒤에서 pager가 억제되면 `--color=always | delta`를 명시한다.

## 문제 해결

| 증상 | 확인 |
|---|---|
| 색이 안 나옴 | `git diff --color=always ... | delta` 사용 |
| interactive add가 깨짐 | `interactive.diffFilter = delta --color-only` 설정 |
| 너무 넓음 | `side-by-side = false`로 단일 컬럼 사용 |

## 관련

- 공식 저장소: <https://github.com/dandavison/delta>
- Git 기본 명령: [git.md](git.md)
