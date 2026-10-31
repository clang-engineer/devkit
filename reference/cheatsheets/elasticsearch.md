# Elasticsearch — 분산 저장·색인·검색의 작동 지도

> Elasticsearch는 **문서를 Index로 논리적으로 묶고 Shard에 분산 저장한 뒤 검색 요청을 병렬 실행**하는 시스템이다. 기능 이름보다 **논리적 데이터 구조, 실제 배치, Write/Read 경로**를 먼저 이해한다.

## 전체 작동 모델 — Write와 Read는 별도 경로

```text
                    Elasticsearch Cluster
                (여러 Node가 Shard를 담당)
                              │
           Index : 논리적 문서 집합 / Mapping
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
              WRITE 경로              READ 경로
            Index / Bulk              _search
                   │                     │
            Primary Shard          Coordinating Node
                   │                     │
             Replica에 복제         대상 Shard에 Query
                   │                     │
              응답 / Refresh        결과 수집·병합
                   │                     │
          검색 가능 시점 결정      필요 문서 Fetch
                                         │
                                      Response

관리·관찰: Allocation / Health / Recovery / Tasks
```

**Index는 논리적 집합, Shard는 분산 실행·저장 단위, Node는 Shard Copy를 배치하는 실행 주체**다. Replica는 Primary의 자식이 아니라 **동일한 Shard의 별도 복제본**이다. 검색은 색인의 다음 단계로 자동 실행되는 것이 아니라 독립적인 요청이다. 위 그림은 대표 흐름을 단순화한 것으로, 복제 승인·Refresh·Query/Fetch의 세부 시점은 설정에 따라 달라진다.

## 1. 저장 구조 — Index·Mapping·Shard·Replica

```text
Cluster
├─ Node A
│  └─ Shard 0 (Primary)
└─ Node B
   └─ Shard 0 (Replica)

Index "logs" (논리적 이름)
├─ Mapping : 필드 타입·분석 방식
├─ Document : _id / _source
└─ Shard 0 : Primary + Replica Copy
```

**Node와 Index는 포함 관계가 아니다.** 하나의 Index에 속한 Shard Copy들이 여러 Node에 분산 배치된다. Primary와 Replica는 동일한 Shard의 복제 관계이고, 같은 Shard의 Primary·Replica는 정상적인 할당에서 같은 Node에 놓지 않는다.

| 개념 | 역할 | 확인 지점 |
|---|---|---|
| Index / Alias | 데이터 집합 / 논리적 접근 이름 | `GET _cat/indices?v`, `GET _alias` |
| Mapping | 필드 타입·분석 규칙 | `GET logs/_mapping` |
| Document | ID를 가진 JSON 문서 | `GET logs/_doc/1` |
| Primary / Replica | 쓰기 기준 복제본 / 가용성·검색 분산 | `GET _cat/shards?v` |

**예시 — Index 생성과 문서 색인** (Kibana Dev Tools Console):

```http
PUT logs
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "service": { "type": "keyword" },
      "message": { "type": "text" },
      "status": { "type": "integer" }
    }
  }
}

PUT logs/_doc/1?refresh=wait_for
{
  "@timestamp": "2026-10-31T09:00:00Z",
  "service": "api",
  "message": "request timeout",
  "status": 504
}
```

`refresh=wait_for`는 검색 가능해질 때까지 기다리는 옵션이며, 매 색인마다 강제 Refresh하는 것과 다르다. **단일 Node에서는 Replica가 할당되지 않아 Health가 Yellow일 수 있다.** 위 요청은 실습용으로, 기존 `logs` Index가 있으면 생성이 실패한다.

## 2. 색인 — Routing·Primary·Replica·Refresh

```text
Index Request (_id / routing)
        │
        ▼
담당 Primary Shard
        │ 변경 기록·복제
        ├──────────────> Replica Shard Copy
        │
        └─ 응답
             │
Refresh 이후 검색에서 새 문서 관찰 가능
```

Routing은 문서가 들어갈 Shard를 결정한다. Primary는 쓰기를 처리하고 Replica로 변경을 복제한다. **쓰기 성공 응답과 검색 가능 시점은 구분**해야 한다. Refresh는 검색 가능한 Segment를 열어 주는 과정이고, Flush나 영속성 보장과 같은 개념이 아니다.

여러 문서를 보낼 때는 Bulk를 사용한다. Bulk는 NDJSON 형식이며 요청 전체가 HTTP 성공이어도 **개별 작업은 실패할 수 있다.**

```http
POST _bulk
{"index":{"_index":"logs","_id":"2"}}
{"@timestamp":"2026-10-31T09:01:00Z","service":"api","message":"slow query","status":200}
{"index":{"_index":"logs","_id":"3"}}
{"@timestamp":"2026-10-31T09:02:00Z","service":"worker","message":"request timeout","status":500}
```

Bulk 응답의 `errors`와 `items[*].index.status`를 함께 확인한다. Console은 줄 단위 NDJSON을 작성하기 편하지만, 실제 HTTP 요청에서는 줄바꿈과 Content-Type을 맞춰야 한다.

## 3. 분산 검색 — Query·Fetch·Aggregation

```text
Search Request (Query DSL)
           │
    Coordinating Node
           │ 대상 Shard Copy마다 요청
           ▼
      Query Phase
   매칭·점수·정렬 후보
           │
    결과 병합·상위 후보 선택
           │
      Fetch Phase
    필요한 문서 내용 조회
           │
      Hits / Aggregations
           │
        Response
```

**Query DSL은 조건을 기술하고, Coordinating Node는 분산 실행과 결과 수집을 맡는다.** Aggregation은 대상 Shard의 부분 결과를 결합한다. 요청 종류에 따라 `size: 0`처럼 문서 Fetch가 필요하지 않을 수도 있다.

| 조건 | 역할 |
|---|---|
| `match` | 분석된 Text에 대한 Full-text 검색 |
| `term` | 분석을 거치지 않은 정확한 Term 매칭(Keyword 등에 적합) |
| `range` | 숫자·날짜 등의 범위 |
| `bool.must` | 필수 조건, 점수에 참여 |
| `bool.filter` | 필수 조건, 점수에 영향 없음 |
| `bool.should` | 점수·선택 조건, 기본 필수 여부는 다른 절에 의존 |
| `bool.must_not` | 제외 조건 |

```http
GET logs/_search
{
  "query": {
    "bool": {
      "must": [{ "match": { "message": "timeout" } }],
      "filter": [{ "term": { "service": "api" } }]
    }
  },
  "aggs": {
    "by_status": { "terms": { "field": "status" } }
  }
}
```

이 검색은 `api` 서비스의 `timeout` 문서를 찾고 상태 코드별 건수를 집계한다. `_count`는 건수 조회, `_search`는 문서·점수·집계 결과 조회에 사용한다. `track_total_hits` 설정에 따라 Hits 총건수의 정확도가 달라질 수 있다.

## 4. 데이터 변경 — Update·Reindex·Alias·Delete

```text
기존 Index ── _reindex ──> 새 Index
                                │
                         검증 후 Alias 변경
                                │
                         애플리케이션 조회 전환
```

`_reindex`는 문서를 복사하지만 Mapping·설정까지 자동 복제하지는 않는다. Alias 변경은 데이터 복사가 아니라 **논리적 접근 이름을 바꾸는 작업**이다.

```http
POST _reindex
{
  "source": { "index": "logs" },
  "dest": { "index": "logs-v2" }
}

POST _aliases
{
  "actions": [
    { "remove": { "index": "logs", "alias": "logs-current" } },
    { "add": { "index": "logs-v2", "alias": "logs-current" } }
  ]
}
```

**주의:** 위 명령은 `logs-v2` Index와 기존 `logs-current` Alias가 준비된 상황의 예시다. 실제 전환 전에 새 Index의 Mapping·문서 수·검색 결과를 검증하고, 원본 삭제는 별도 단계로 다룬다.

`_update`는 개별 문서 변경, `_delete_by_query`는 조건에 맞는 여러 문서 삭제, `DELETE index`는 Index 전체 삭제다. 파괴적 작업 전에는 `_search`·`_count`로 대상을 확인한다.

## 5. 운영 — Health·Allocation·Recovery·Tasks

| 질문 | 대표 API | 읽는 관점 |
|---|---|---|
| Cluster가 정상인가? | `GET _cluster/health` | Green: 모두 할당 / Yellow: 일부 Replica 미할당 / Red: 일부 Primary 미할당 |
| Shard가 어디에 있나? | `GET _cat/shards?v` | Primary·Replica와 Node 배치 |
| 왜 할당되지 않나? | `GET _cluster/allocation/explain` | 미할당 원인 |
| Node 상태는? | `GET _cat/nodes?v` | 노드·자원 현황 |
| 복구 진행 중인가? | `GET _cat/recovery?v` | 복구·재배치 |
| 오래 걸리는 작업은? | `GET _tasks?detailed=true` | 진행 중 작업 |

**진단 예시:** 단일 Node에서 Replica 1개를 요청하면 Yellow일 수 있다. 이는 Primary가 정상일 수 있다는 뜻이지, 모든 상황에서 무시해도 된다는 뜻은 아니다. Red라면 Primary 미할당을 우선 확인한다. `_cat`은 사람이 읽는 운영용이며 자동화에는 JSON API를 우선한다.

## 6. 요청 인터페이스 — REST API와 Kibana Console

```text
curl / HTTP Client ─┐
                    ├──> Elasticsearch REST API
Kibana Console ─────┘
```

Console은 별도 검색 엔진이 아니라 같은 REST API를 작성·호출하는 UI다. 실제 클러스터에서는 인증·TLS·권한이 필요할 수 있다.

**Elastic Stack 연결:** [Logstash](logstash.md)는 이벤트를 수집·변환해 Elasticsearch에 전달하고, [Kibana](kibana.md)는 저장된 데이터를 탐색·시각화한다. Elasticsearch는 두 도구 없이도 REST API로 색인·검색할 수 있다.

공식 명세: [Elasticsearch Reference](https://www.elastic.co/docs/reference/elasticsearch) · [Query DSL](https://www.elastic.co/docs/reference/query-languages/query-dsl) · [REST APIs](https://www.elastic.co/docs/api/doc/elasticsearch/)
