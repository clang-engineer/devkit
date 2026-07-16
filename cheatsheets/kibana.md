# Kibana Cheatsheet

> KQL·Discover·Dev Tools·대시보드 운영. Elasticsearch 위에 얹는 시각화/탐색 UI.

## 30초만 본다면

| 상황 | 명령 / 위치 |
|---|---|
| 정확 일치 | `field:value` |
| 부분 매칭 (text) | `message:quick brown fox` (analyzer 토큰) |
| 구문 매칭 | `message:"quick brown fox"` |
| 와일드카드 | `field:value*` |
| 범위 | `bytes >= 1000 and bytes < 5000` |
| 부정 | `not response:200` |
| 필드 존재 | `field:*` |
| 그룹 | `response:(200 or 404)` |
| Dev Tools 실행 | `Ctrl/Cmd + Enter` |
| cURL로 복사 | Dev Tools 우측 스패너 |
| Discover에서 컬럼 추가 | 좌측 필드 목록의 `+` |
| 시간 범위 변경 | 우상단 캘린더 |

## KQL (Kibana Query Language) 기본 문법

Discover, Dashboard, Visualize의 검색창 기본 언어. Elasticsearch 인덱스의 필드를 직접 질의한다.

| 패턴 | 예시 | 설명 |
|------|------|------|
| 필드 존재 | `response:*` | 필드가 존재하는 문서 |
| 정확 일치 | `response:200` | 키워드/숫자 정확 매칭 |
| 부분 매칭 | `message:quick brown fox` | text 필드에서 토큰 매칭 (AND 아님, analyzer 기반) |
| 구문 매칭 | `message:"quick brown fox"` | 구문 그대로 매칭 |
| 와일드카드 | `machine.os:win*` | `*` 다중 문자만 지원 (KQL은 단일문자 `?` 미지원) |
| 범위 | `bytes >= 1000 and bytes < 5000` | 숫자/날짜 비교 |
| AND/OR/NOT | `response:200 and extension:php` | 대소문자 무관, 소문자 권장 |
| 그룹화 | `response:(200 or 404)` | 같은 필드 OR 축약 |
| NOT | `not response:200` | 부정 |
| 중첩 필드 | `user.names:(john or jane)` | dot 표기 |
| 이스케이프 | `field:"with \"quote\""` | 백슬래시로 이스케이프 |

```text
# 복합 예시
response:200 and (extension:php or extension:html) and bytes > 5000

# 음수
not (response:200 or response:304)

# 와일드카드 + 범위 + 구문
url.path:/api/* and @timestamp >= "2026-05-01" and message:"timeout"
```

> KQL은 인덱싱된 필드(역인덱스·doc values)를 대상으로 매칭한다. text 필드는 analyzer를 따르고, keyword는 정확 일치.
> 한 필드를 여러 번 비교할 땐 `field:(a or b)` 가 가독성 좋다.

## KQL vs Lucene

오른쪽 위 KQL 토글을 끄면 Lucene 모드. 둘은 문법이 다르다.

| 기능 | KQL | Lucene |
|------|-----|--------|
| 필드 매칭 | `field:value` | `field:value` |
| 범위 | `bytes >= 1000` | `bytes:[1000 TO *]` |
| AND | `and` (소문자) | `AND` (대문자) |
| NOT | `not response:200` | `-response:200` 또는 `NOT response:200` |
| 구문 | `field:"quick brown"` | `field:"quick brown"` |
| 정규식 | 미지원 | `field:/joh?n/` |
| Fuzziness | 미지원 | `field:quikc~` |
| 부스팅 | 미지원 | `field:quick^2` |

> KQL은 사용성에 집중, Lucene은 ES 풀 문법 노출. 정규식/유사도 필요하면 Lucene.

## Discover

| 단축키 / 동작 | 설명 |
|---------------|------|
| 좌측 필드 패널 `+` | 컬럼 추가/제거 |
| 필드 클릭 후 돋보기 | 해당 값으로 filter for/out |
| 우측 상단 시계 아이콘 | 시간 범위 (Quick select / Absolute) |
| 우측 상단 Refresh | 자동 새로고침 (5s ~) |
| 검색바 옆 `Save` | Saved search로 저장 (Dashboard에서 재사용) |
| `Share → CSV Reports` | 현재 검색 결과 CSV 내보내기 |
| `Inspect` | 실제 ES 요청 / 응답 확인 |

> `Inspect → Request`에서 실제 발사된 DSL을 그대로 복사해 Dev Tools에 붙여 디버깅 가능.

## Dev Tools (Console)

좌측 메뉴 → Management → Dev Tools.

```text
# 클러스터 헬스
GET _cluster/health

# 인덱스 목록
GET _cat/indices?v&s=index

# 매핑 확인
GET my-index/_mapping

# 검색
GET my-index/_search
{
  "query": { "match": { "message": "timeout" } },
  "size": 5
}

# count
GET my-index/_count
{
  "query": { "range": { "@timestamp": { "gte": "now-1h" } } }
}

# 인덱스 삭제
DELETE my-index

# 별칭 확인
GET _cat/aliases?v
```

| 단축키 | 설명 |
|--------|------|
| `Ctrl/Cmd + Enter` | 현재 요청 실행 |
| `Ctrl/Cmd + I` | 자동 인덴트 |
| `Ctrl/Cmd + /` | 줄 주석 |
| `Ctrl + Space` | 자동완성 |
| 우측 스패너 | 요청을 cURL로 복사 |

> Console은 `kbn:` 프리픽스로 Kibana API도 호출 가능. 예: `GET kbn:/api/status`

## Data Views (구 Index Patterns)

7.x까지는 "Index Pattern", 8.x부터 "Data View"로 명칭 변경. 와일드카드(`logs-*`)로 여러 인덱스를 하나로 묶고 시간 필드(`@timestamp`)를 지정하는 Discover/시각화의 데이터 소스 단위. Stack Management → Data Views에서 생성/관리.

> 매핑 변경 없이 즉석 필드가 필요하면 Runtime field (8.x 권장, 구 Scripted field 대체).

## 시간 필터

```text
# Quick select 예시
Last 15 minutes / Last 24 hours / Today / This week / Year to date

# Relative
now-1h, now-7d/d (오늘 시작), now/w (이번주 시작)

# Absolute
2026-05-14 00:00:00.000 ~ 2026-05-14 23:59:59.999
```

> URL `_g=(time:(from:now-1h,to:now))` 형태로 시간 범위가 인코딩됨. 북마크/공유 시 자동 포함.

## 필터 vs 검색바

> 검색바 KQL과 Add filter는 둘 다 검색을 좁히지만, **Pinned filter는 앱 간(Discover ↔ Dashboard) 이동에도 살아남는다** — 여러 화면에 공통으로 걸고 싶으면 KQL이 아니라 필터를 Pin 한다.

## 대시보드 단축키 / 팁

| 동작 | 설명 |
|------|------|
| 패널 우상단 `...` → Inspect | 해당 패널의 ES 요청 보기 |
| URL `embed=true` | 헤더/사이드바 없는 임베드 뷰 |

## 자주 쓰는 URL 패턴

```text
# Discover (특정 data view + 시간 + 쿼리)
/app/discover#/?_g=(time:(from:now-24h,to:now))&_a=(index:'logs-*',query:(language:kuery,query:'status:500'))

# 대시보드 임베드
/app/dashboards#/view/<DASHBOARD_ID>?embed=true&_g=(time:(from:now-1h,to:now))
```

> `_g`는 globally shared state (시간/refresh), `_a`는 app state (쿼리/필터/컬럼). 링크 공유 시 `_g`만 넘기면 상대는 같은 시간창으로, `_a`까지 넘기면 쿼리/컬럼까지 재현된다.

## 운영 진단 빠른 경로

| 증상 | 확인 위치 |
|------|-----------|
| Kibana 안 뜸 | `GET kbn:/api/status` 또는 `/api/status` 직접 호출 |
| 검색이 빈 결과 | Data View의 time field 매칭, 시간 범위 확인 |
| "shards failed" 경고 | Discover Inspect → Response의 `_shards.failures` |
| 느린 대시보드 | 패널별 Inspect → Statistics의 `Request duration` 확인 |
| 매핑 폭발 (too many fields) | Stack Monitoring → Indices → mapping field count |

## 참고

- `_search` 결과의 `took`은 ES 검색만의 시간. Kibana UI 렌더링 시간은 Inspect의 Request duration이 포함값.
- KQL 자동완성은 매핑 캐시 기반. 새 필드 안 보이면 Data View 새로고침 (Refresh field list).
- Discover에서 노출 컬럼은 saved search에 저장되지만, 대시보드 추가 시 동일하게 적용됨.
