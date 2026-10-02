# fzf Cheatsheet

범용 fuzzy finder. 직접 검색 도구라기보다 `fd`, `rg`, `git`, `zoxide` 같은 명령이 만든 목록을 대화형으로 고르게 해주는 선택 UI다.

## 30초 요약

```sh
brew install fzf
source <(fzf --zsh)
find . -type f | fzf
rg -n "TODO" | fzf
```

기본 shell integration:

| 키 | 동작 |
|---|---|
| `Ctrl-T` | 파일/경로 선택 |
| `Alt-C` | 디렉터리 선택 후 이동 |
| `Ctrl-R` | history 검색. Atuin을 쓰면 Atuin이 가져가게 둔다 |

## Mental model

```text
목록 생성(fd/rg/git/ps/...) -> fzf로 고르기 -> 선택값을 다음 명령에 전달
```

fzf는 목록을 잘 만드는 도구가 아니라, 이미 만들어진 목록을 빠르게 좁히고 선택하는 도구다.

## 자주 쓰는 패턴

### 파일 선택

```sh
fd --type f | fzf
nvim "$(fd --type f | fzf)"
```

### ripgrep 결과 선택

```sh
rg -n "pattern" | fzf
```

### Git branch checkout

```sh
git branch --all \
  | grep -v HEAD \
  | fzf \
  | tr -d ' *' \
  | sed 's|remotes/origin/||' \
  | xargs git checkout
```

### 다중 선택

```sh
fd --type f | fzf -m
```

### Preview 붙이기

```sh
fd --type f \
  | fzf --preview 'bat --style=numbers --color=always --line-range :200 {}'
```

## 유용한 옵션

| 옵션 | 의미 |
|---|---|
| `-m`, `--multi` | 여러 항목 선택 |
| `--preview CMD` | 선택 항목 미리보기 |
| `--height 40%` | 화면 일부만 사용 |
| `--layout=reverse` | 입력창을 위쪽에 둠 |
| `--bind KEY:ACTION` | 키 동작 정의 |
| `--delimiter` / `--nth` | 특정 필드 기준 검색 |

## 경계

- 검색 자체는 `rg`, 파일 목록은 `fd`, 이동 학습은 `zoxide`가 더 적합하다.
- script에서 비대화형 처리가 필요하면 fzf를 끼우지 않는다.

## 관련

- 공식 저장소: <https://github.com/junegunn/fzf>
- 함께 쓰기 좋은 도구: `fd`, `rg`, `bat`, `zoxide`, `atuin`
