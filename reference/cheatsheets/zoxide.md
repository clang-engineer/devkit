# zoxide Cheatsheet

방문 빈도와 최근성을 학습해 디렉터리 이동을 줄여주는 `cd` 보완 도구. 목적지를 대략 알고 있을 때 빠르다.

## 30초 요약

```sh
brew install zoxide
eval "$(zoxide init zsh)"
z project
zi
z -
```

## Mental model

| 상황 | 도구 |
|---|---|
| 경로를 알고 있음 | `cd` |
| 이름 일부만 기억함 | `zoxide`의 `z` |
| 후보를 보며 고름 | `zi` 또는 `fzf` |
| 파일 구조를 둘러봄 | `yazi` |

## 자주 쓰는 명령

| 목적 | 명령 |
|---|---|
| 경로 일부로 이동 | `z repo` |
| 여러 단어로 좁히기 | `z work api` |
| 이전 디렉터리 | `z -` |
| 대화형 선택 | `zi` |
| 등록된 경로 조회 | `zoxide query keyword` |
| 점수 포함 조회 | `zoxide query -l` |
| 경로 추가 | `zoxide add /path/to/dir` |
| 경로 제거 | `zoxide remove /path/to/dir` |

## Shell 통합

```zsh
eval "$(zoxide init zsh)"
```

기본 alias/function으로 `z`와 `zi`가 제공된다.

## fzf와 함께 쓰기

`zi`는 후보가 여러 개일 때 대화형으로 고르는 흐름에 적합하다. fzf shell integration의 `Alt-C`는 파일 시스템을 직접 훑고, zoxide는 방문 이력을 기준으로 후보를 만든다.

## 문제 해결

| 증상 | 확인 |
|---|---|
| `z foo`가 아무 데도 못 감 | 한 번은 해당 디렉터리를 방문하거나 `zoxide add`로 등록한다 |
| 원하지 않는 경로로 감 | `zoxide query -l foo`로 점수를 보고 오래된 경로를 제거한다 |
| `z` 명령이 없음 | shell init이 로드됐는지 확인한다 |

## 관련

- 공식 저장소: <https://github.com/ajeetdsouza/zoxide>
- 비교: `cd`는 정확한 경로, `zoxide`는 기억 기반 점프, `yazi`는 탐색형 이동
