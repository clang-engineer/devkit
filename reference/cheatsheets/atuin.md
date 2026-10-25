# Atuin — 명령 구조 치트시트

> 셸 명령 기록을 **명령·디렉터리·시간·실행 결과**와 함께 저장·검색하는 도구. `Ctrl-R` 히스토리 검색을 확장한다.

## 명령이 다루는 대상

```text
Shell 명령 실행
     │
     ▼
Atuin History (command / cwd / time / exit code)
     │
     ├─ search [query] [filter] → 기록 탐색
     ├─ stats                   → 사용 통계
     ├─ import <shell>          → 기존 기록 가져오기
     └─ config                  → 설정 확인·관리
```

```sh
atuin search docker   # 명령 문자열 검색
atuin search --cwd    # 현재 디렉터리 기준 필터
atuin import zsh      # zsh 기록 가져오기
atuin stats           # 기록 집계
```

`--cwd`는 **current working directory**를 뜻한다. 검색할 기록의 범위를 좁히는 조건이지 디렉터리를 이동하는 명령이 아니다.

## Shell 키 바인딩의 관계

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

## 저장·동기화 경계

- 로컬 History는 단순 문자열 목록보다 풍부한 메타데이터를 보유한다.
- 동기화를 켜면 명령 인자에 포함된 토큰·내부 경로 등 민감한 내용이 동기화 대상이 될 수 있다. 필터링 정책을 먼저 확인한다.
- 검색 결과가 없다면 셸 초기화 및 기존 History의 `import` 필요 여부를 확인한다.

공식 문서: <https://docs.atuin.sh/>
