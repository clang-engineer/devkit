# zoxide Cheatsheet

방문 빈도와 최근성을 결합한 **Frecency** 점수로 디렉터리 이동을 줄여주는 `cd` 보완 도구. 목적지를 대략 알고 있을 때 빠르다.

## 명령 구조와 선택 기준

```text
Shell에서 디렉터리 방문
          │ 셸 통합이 방문 경로 기록
          ▼
   zoxide 경로 DB (빈도·최근성)
          │
     z keyword ── 키워드 순서대로 경로 후보 매칭 ──> Frecency 최상위 경로로 이동
     zi keyword ── 매칭 후보 대화형 선택(fzf) ──> 디렉터리 이동

정확한 경로 이동은 cd, 파일 탐색은 Yazi의 역할
```

`z`는 방문 이력에 기반한 점프, `zi`는 interactive 선택이다. **셸 통합이 로드되어야 방문 기록 갱신과 디렉터리 이동 함수가 연결된다.** `fzf`의 `Alt-C`는 파일 시스템에서 후보를 찾는 반면 `zi`는 zoxide가 학습한 경로를 사용한다.

## 1. 경로 선택 — 기록 기반 점프

키워드는 경로 안에서 **입력 순서대로** 매칭되고, 마지막 키워드는 경로의 마지막 구성 요소에 매칭된다. 후보는 Frecency(방문 빈도 + 최근성)로 순위가 결정된다. `z`는 최상위 후보로 바로 이동하고 `zi`는 후보를 대화형으로 선택한다.

### 대표 명령

| 목적 | 명령 |
|---|---|
| 경로 일부로 이동 | `z repo` |
| 여러 단어로 좁히기 | `z work api` |
| 이전 디렉터리 | `z -` |
| 대화형 선택 | `zi` |
| 등록된 경로 조회 | `zoxide query keyword` |
| 전체 매칭 경로 조회 | `zoxide query -l keyword` |
| 점수 포함 조회 | `zoxide query -ls keyword` |
| 경로 추가 | `zoxide add /path/to/dir` |
| 경로 제거 | `zoxide remove /path/to/dir` |

## 2. 셸 통합·진단

### Shell 통합

```zsh
eval "$(zoxide init zsh)"
```

기본 alias/function으로 `z`와 `zi`가 제공된다.

**역할 구분:** `zoxide init zsh`는 방문 기록용 셸 훅과 `z`·`zi` 함수를 생성한다. `zoxide query`는 DB 검색만, `add`·`remove`는 경로 DB 변경을 수행한다. 기록되지 않은 경로는 직접 방문하거나 `zoxide add`로 등록한다.

## 관련

- 공식 저장소: <https://github.com/ajeetdsouza/zoxide>
- 비교: `cd`는 지정 경로 이동, `zoxide`는 방문 기록 기반 점프, [Yazi](./yazi.md)는 탐색형 파일 관리 (`Z`로 zoxide 호출)
