# ccusage Cheatsheet

`ccusage`는 AI 코딩 도구의 사용 로그를 집계해 보여주는 CLI 모듈이다. 잔여량이 아닌 사용량 기반 리포팅에 유리하다.

## 30초 가이드

| 상황 | 명령 |
|---|---|
| OpenCode 사용량 일별 보기 | `ccusage opencode daily --compact` |
| OpenCode 사용량 JSON 보기 | `ccusage opencode daily --json` |
| OpenCode 7일 임계치 점검 | `ccusage-budget --days 7 --warn 100 --critical 200 --service opencode` |
| OpenCode 최근 주간 보기 | `ccusage opencode weekly --compact` |
| Copilot 사용량 보기 | `ccusage copilot daily --compact` |
| Codex 사용량 보기 | `ccusage codex daily --compact` |

## 자주 쓰는 조합

```bash
ccusage opencode daily --json --since 2026-07-20 --compact
ccusage opencode weekly --compact
ccusage copilot session --compact
```

## `ccusage-budget` 래퍼(운영용)

개인 환경에서 사용량 임계치 경보를 위해 만든 얇은 래퍼다.

```bash
ccusage-budget                               # 기본(7일, warn 100, critical 200, service opencode)
ccusage-budget --days 14 --warn 80 --critical 150
ccusage-budget --service opencode --days 1 --warn 20 --critical 40
ccusage-budget --budget 200 --token-price 0.000002  # 비용 잔액 기준으로 대략적 남은 토큰 추정
ccusage-budget --period day --budget 200                    # 금일 usage 대비 잔여 비율
ccusage-budget --period week --budget 500                   # 금주 usage 대비 잔여 비율
ccusage-budget --period month --budget 2000                 # 금월 usage 대비 잔여 비율
ccusage-budget --period week --remaining 95                   # 웹에서 보인 remaining(%)로 한도 추정
```

기간별 기본 예산을 고정하려면 환경변수로 지정하면 편합니다.

```bash
export CCUSAGE_BUDGET_DAY=200
export CCUSAGE_BUDGET_WEEK=500
export CCUSAGE_BUDGET_MONTH=2000

ccusage-budget --period day
ccusage-budget --period week
ccusage-budget --period month

# UI에서 남은 비율만 확인됐을 때: remaining=95이면 다음으로 역산
ccusage-budget --period week --remaining 95
```

`ccusage-budget` 동작 포인트:

- `ccusage ... daily --json`을 받아서 비용/토큰 총합 계산
- 모델별 비용을 집계해 상위비중 확인
- 총비용이 임계치를 넘으면 경보 레벨 표시(`OK/WARN/CRITICAL`)

## 용어 정리(짧게)

- `remaining`(남은량): 현재 계약에서 남은 사용 가능량. `ccusage`는 보통 기본적으로 직접 제공하지 않음.
- `임계치`: 허용 범위를 넘었는지 판단하는 경계값. 보통 `warn/critical` 두 단계로 둔다.
- `모듈`: 단일 목적의 독립 실행 단위. 여기선 `ccusage`가 집계 모듈.
- `wrapper`: 모듈 위에 정책만 추가한 얇은 스크립트. 여기선 `ccusage-budget`.

## 참고

- `alias ccb='ccusage-budget'` (원하면 편의용으로 별도 alias 가능)
