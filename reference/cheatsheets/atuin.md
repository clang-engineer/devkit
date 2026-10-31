# Atuin — 명령 구조 치트시트

> 셸 명령 기록을 **명령·디렉터리·시간·실행 결과**와 함께 저장·검색하는 도구. `Ctrl-R` 히스토리 검색을 확장한다.

## 전체 작동 모델 — 명령 기록에서 재실행까지

```text
Shell에서 명령 실행
       │ Shell integration / History import
       ▼
Atuin History DB (명령·경로·시간·종료 상태)
       │
       ├─ search / Ctrl-R → 필터·선택 → 입력줄 재사용
       ├─ stats           → 기록 집계
       └─ 선택적 Sync    → 다른 기기와 기록 동기화

키 바인딩은 Shell 초기화에서 결정
```

```sh
atuin search docker   # 명령 문자열 검색
atuin search --cwd    # 현재 디렉터리 기준 필터
atuin import zsh      # zsh 기록 가져오기
atuin stats           # 기록 집계
```

**예시:** 프로젝트 디렉터리에서 `atuin search --cwd`로 해당 경로의 명령 기록을 좁혀 찾는다. `Ctrl-R` 검색 UI를 사용할 때는 현재 Shell 바인딩이 Atuin에 연결되어 있어야 한다.

`--cwd`는 **current working directory**를 뜻한다. 검색할 기록의 범위를 좁히는 조건이지 디렉터리를 이동하는 명령이 아니다.

## 1. 검색·재사용 — Shell 키 바인딩

```text
Ctrl-R → Atuin : 실행한 명령 기록
Ctrl-T → fzf   : 파일·경로 선택
Alt-C  → fzf   : 디렉터리 선택
```

zsh에서 두 도구를 함께 사용한다면 먼저 fzf를 초기화하고 Atuin을 나중에 초기화해 `Ctrl-R`을 Atuin이 담당하게 할 수 있다.

```zsh
source <(fzf --zsh)
eval "$(atuin init zsh)"
```

## 2. 저장·동기화 — 기록과 비밀정보의 경계

- 로컬 History는 단순 문자열 목록보다 풍부한 메타데이터를 보유한다.
- 동기화를 켜면 명령 인자에 포함된 토큰·내부 경로 등 민감한 내용이 동기화 대상이 될 수 있다. 필터링 정책을 먼저 확인한다.
- 검색 결과가 없다면 셸 초기화 및 기존 History의 `import` 필요 여부를 확인한다.

공식 문서: <https://docs.atuin.sh/>
