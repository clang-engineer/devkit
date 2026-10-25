# ccusage — 사용 기록과 예산 경계

> **기록된 사용량**과 **서비스가 제공하는 실제 잔여 한도**는 다르다. ccusage는 사용 기록을 집계하고, 예산 판단은 별도 정책으로 처리한다.

## 명령의 대상

```text
AI 코딩 도구의 로컬 사용 기록
              │
         ccusage 집계
         ├─ Service : opencode / copilot / ... (지원 범위 확인)
         ├─ Period  : daily / weekly / session
         └─ Output  : --compact / --json
              │
         사용량·비용 리포트
              │
     별도 정책·개인 Wrapper
         └─ 예산 / 경고 임계치
```

```sh
ccusage opencode daily --compact
ccusage opencode weekly --json
ccusage copilot session --compact
```

`--json`은 기계가 읽는 출력, `--compact`는 간결한 표시를 위한 옵션이다. 실제로 지원하는 서비스·기간·플래그는 설치된 ccusage 버전의 `--help`에서 확인한다.

## 임계치와 잔여 한도를 혼동하지 않는다

```text
사용량 집계 ──> 사용 비용·토큰
                    │
          사용자 지정 예산과 비교
                    │
               OK / WARN / CRITICAL

공급자의 실제 사용 제한·리셋 시점 → 별도 정보
```

개인 환경의 `ccusage-budget`은 **ccusage의 공식 하위 명령이 아닌 별도 Wrapper**다. 예산·토큰 가격을 바탕으로 계산한 추정치를 공급자의 실제 잔여 할당량으로 표시하지 않는다. Wrapper의 구현·기본 임계치·환경변수는 해당 스크립트에서 확인한다.

## 확인 순서

1. 기록이 존재하는지와 집계 대상 기간을 확인한다.
2. `--json` 출력의 금액·토큰 단위를 확인한다.
3. 예산과 비교하는 경우 사용자 정의 임계치인지 공급자 한도인지 구분한다.

공식 도구·개인 Wrapper의 옵션을 혼합해 암기하지 않는다.
