# zoxide Cheatsheet

방문 빈도와 최근성을 학습해 디렉터리 이동을 줄여주는 `cd` 보완 도구. 목적지를 대략 알고 있을 때 빠르다.

## 명령 구조와 선택 기준

```text
Shell에서 디렉터리 방문
          │ 셸 통합이 방문 경로 기록
          ▼
   zoxide 경로 DB (빈도·최근성)
          │
     z keyword ── 후보 점수 계산 ──> 디렉터리 이동
     zi keyword ── 후보 목록 선택 ──> 디렉터리 이동

정확한 경로 이동은 cd, 파일 탐색은 Yazi의 역할
```

`z`는 방문 이력에 기반한 점프, `zi`는 interactive 선택이다. **셸 통합이 로드되어야 방문 기록 갱신과 디렉터리 이동 함수가 연결된다.** `fzf`의 `Alt-C`는 파일 시스템에서 후보를 찾는 반면 `zi`는 zoxide가 학습한 경로를 사용한다.

## 1. 경로 선택 — 기록 기반 점프

방문 이력을 점수화해 목적지 후보를 고른다. `z`는 바로 이동하고 `zi`는 후보를 선택한다.

### 대표 명령

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

## 2. 셸 통합·진단

### Shell 통합

```zsh
eval "$(zoxide init zsh)"
```

기본 alias/function으로 `z`와 `zi`가 제공된다.

### 문제 해결

| 증상 | 확인 |
|---|---|
| `z foo`가 아무 데도 못 감 | 한 번은 해당 디렉터리를 방문하거나 `zoxide add`로 등록한다 |
| 원하지 않는 경로로 감 | `zoxide query -l foo`로 점수를 보고 오래된 경로를 제거한다 |
| `z` 명령이 없음 | shell init이 로드됐는지 확인한다 |

## 관련

- 공식 저장소: <https://github.com/ajeetdsouza/zoxide>
- 비교: `cd`는 정확한 경로, `zoxide`는 기억 기반 점프, `yazi`는 탐색형 이동
