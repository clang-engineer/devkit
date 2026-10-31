# Kibana — 데이터 탐색·시각화·운영 치트시트

> Kibana는 Elasticsearch에 저장된 데이터를 **찾고, 해석하고, 시각화하고, 공유하는 인터페이스**다. 데이터를 직접 저장하는 검색 엔진이 아니며, Discover·Lens·Dashboard·Dev Tools의 역할이 다르다.

## 전체 작동 모델 — 데이터에서 대시보드까지

```text
Elasticsearch Index / Data Stream
              │
              ▼
       Data View (데이터 범위·필드)
              │
       Query / Filter / Time Range
              │
        ┌─────┼──────────┐
        ▼     ▼          ▼
     Discover Lens    Dev Tools
     문서 탐색  집계·차트  API 요청
              │
              ▼
          Dashboard
       시각화·필터·공유

Saved Objects : Data View·Dashboard·Visualization 등 구성 저장
Space / Role : 콘텐츠 분리·접근 권한
```

**Data View는 데이터를 복사한 저장소가 아니라 Elasticsearch 데이터에 접근할 논리적 범위**다. Discover는 개별 문서·필드 탐색, Lens는 집계·시각화, Dashboard는 여러 시각화를 결합한다. Dev Tools Console은 Elasticsearch API를 실행하는 인터페이스다. UI 메뉴 이름은 Kibana 버전에 따라 달라질 수 있다.

## 1. 데이터 접근 — Data View·시간 범위·필터

먼저 Elasticsearch에 Index 또는 Data Stream이 있어야 한다. 그다음 Kibana에서 해당 데이터에 맞는 Data View(예: `logs-*`)를 구성한다. 시간 기반 로그라면 올바른 Timestamp 필드를 선택하고, 우측 상단 시간 범위를 확인한다.

| 대상 | 역할 | 흔한 문제 |
|---|---|---|
| Index / Data Stream | 실제 데이터 저장 | 문서 자체가 없음 |
| Data View | 대상 패턴과 필드 정의 | Index 패턴 불일치 |
| Time Range | 조회 시간 제한 | 데이터가 있어도 결과 0건 |
| Filter | 구조화된 조건 | 다른 필터와 결합되어 결과 제외 |
| KQL | Kibana의 검색 조건 | Query DSL과 문법 혼동 |

**예시:** Discover에서 `service.name: "api" and http.response.status_code >= 500`을 입력하면 API 서비스의 5xx 응답을 찾는다. 실제 필드 이름과 매핑은 데이터셋에 따라 다르며, 시간 범위도 맞아야 한다.

## 2. 탐색 — Discover와 KQL

```text
Data View + Time Range
          │
          ▼
KQL / Filter → Elasticsearch 조회
          │
          ▼
문서 목록·필드·히스토그램
          │
          └─ 관심 필드 확인 → Lens·Dashboard로 확장
```

| 목적 | 대표 KQL |
|---|---|
| 특정 서비스 | `service.name: "api"` |
| 오류 코드 범위 | `http.response.status_code >= 500` |
| 필드 존재 여부 | `user.id: *` |
| 두 조건 결합 | `service.name: "api" and event.dataset: "access"` |
| 제외 | `not log.level: "debug"` |

KQL은 **필터링 중심의 언어**이며, Elasticsearch Query DSL의 모든 기능을 표현하지는 않는다. 검색창의 언어 모드(KQL·Lucene 등)를 확인한다. 필드 타입(`keyword`·`text`·숫자·날짜)에 따라 매칭 결과가 달라진다.

## 3. 시각화 — Lens에서 Dashboard까지

**Lens는 필드를 차트로 집계하는 곳**, Dashboard는 여러 시각화와 필터를 한 화면에서 사용하는 곳이다.

**대표 작업 흐름:** Discover에서 오류 이벤트의 필드를 확인 → Lens에서 X축을 `@timestamp`, Y축을 문서 수로 설정 → `service.name`으로 분할 → Dashboard에 추가 → 시간 범위와 필터를 조정한다.

| 표현 | 질문 |
|---|---|
| 시간별 Line / Area | 언제 증가했나? |
| Bar / Breakdown | 어떤 서비스·상태 코드가 많은가? |
| Metric | 총 요청·오류 건수는? |
| Table | 상위 서비스·호스트는? |

시각화는 집계 결과다. **Dashboard에서 보이는 값은 필터·시간 범위·집계 방식에 따라 달라진다.** 저장된 차트 자체가 원본 데이터를 복제하는 것은 아니다.

## 4. Dev Tools — Elasticsearch API와의 경계

```http
GET logs-*/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": { "gte": "now-1h" }
    }
  },
  "aggs": {
    "by_service": {
      "terms": { "field": "service.name" }
    }
  }
}
```

Console에서는 HTTP 메서드·경로·JSON Body를 작성한다. 위 예시는 최근 한 시간의 데이터를 서비스별로 집계한다. `service.name`은 집계 가능한 필드여야 하며, 실제 환경에서는 `service.name.keyword` 같은 별도 필드를 사용해야 할 수도 있다.

**KQL과 Query DSL은 다르다.** KQL은 Kibana의 검색창 필터 언어이고, Query DSL은 Elasticsearch에 전달하는 JSON 검색 언어다. [Elasticsearch 치트시트](elasticsearch.md)에서 Query DSL과 Shard 실행을 다룬다.

## 5. Saved Objects·Space·권한·진단

| 구성 | 역할 |
|---|---|
| Saved Objects | Dashboard·Data View·Visualization 등 구성 관리 |
| Space | 콘텐츠·기능의 논리적 분리 |
| Role / Privilege | Elasticsearch 데이터·Kibana 기능 접근 권한 |
| Alerting | 조건에 따른 탐지·알림 (설치 기능·권한 의존) |

**데이터가 안 보일 때:** Elasticsearch에서 문서 존재 확인 → Data View 범위 확인 → 시간 필드·시간 범위 확인 → KQL·Filter 확인 → 사용자 권한 확인 순으로 좁힌다. Kibana 화면에 결과가 없다고 곧바로 Logstash 수집 실패로 단정하지 않는다.

**Elastic Stack 연결:** [Logstash](logstash.md)는 이벤트를 수집·변환해 Elasticsearch로 전달하고, [Elasticsearch](elasticsearch.md)는 저장·검색하며, Kibana는 그 데이터를 탐색·분석한다. 세 도구를 반드시 함께 설치해야 하는 것은 아니다.

공식 문서: [Kibana Guide](https://www.elastic.co/docs/explore-analyze) · [Discover](https://www.elastic.co/docs/explore-analyze/discover) · [KQL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/kql)
