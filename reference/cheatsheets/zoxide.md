# zoxide Cheatsheet

방문 빈도와 최근성을 학습해 디렉터리 이동을 줄여주는 `cd` 보완 도구. 목적지를 대략 알고 있을 때 빠르다.

## 명령 구조와 선택 기준

```text
cd <정확한 경로>      → 지정 경로로 이동
z <기억나는 단어>     → 방문 기록에서 경로 추정 후 이동
zi                    → 후보를 대화형으로 선택
yazi                  → 파일 트리를 직접 탐색
```

`z`는 방문 이력에 기반한 점프, `zi`는 interactive 선택이다. `fzf`의 `Alt-C`는 파일 시스템에서 후보를 찾는 반면 `zi`는 zoxide가 학습한 경로를 사용한다.

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

## 문제 해결

| 증상 | 확인 |
|---|---|
| `z foo`가 아무 데도 못 감 | 한 번은 해당 디렉터리를 방문하거나 `zoxide add`로 등록한다 |
| 원하지 않는 경로로 감 | `zoxide query -l foo`로 점수를 보고 오래된 경로를 제거한다 |
| `z` 명령이 없음 | shell init이 로드됐는지 확인한다 |

## 관련

- 공식 저장소: <https://github.com/ajeetdsouza/zoxide>
- 비교: `cd`는 정확한 경로, `zoxide`는 기억 기반 점프, `yazi`는 탐색형 이동
