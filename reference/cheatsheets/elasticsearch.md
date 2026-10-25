# Elasticsearch — 데이터·검색·운영 기능 지도

> Elasticsearch는 **문서를 Index에 저장하고 Query DSL로 검색하는 분산 시스템**이다. REST API의 개별 호출보다 데이터 구조·검색·운영 계층을 먼저 이해한다.

## 전체 기능 영역

```text
Elasticsearch Cluster
├─ 분산 실행     Node / Shard / Replica / Allocation
├─ 데이터 구조   Index / Mapping / Document / Alias
├─ 읽기          Get / Search / Count / Aggregation
├─ 쓰기          Index / Update / Delete / Bulk
├─ 검색 언어     Query DSL / full-text / term-level / bool
├─ 데이터 이동   Reindex / Ingest Pipeline
└─ 운영          Health / Cat / Stats / Recovery / Tasks
```

## 데이터가 저장되는 계층

```text
Cluster
  └─ Index (논리적 데이터 집합)
      ├─ Mapping (필드 타입·분석 방식)
      ├─ Document (_id, _source)
      └─ Primary Shards
           └─ Replica Shards (가용성·읽기 분산)
```

Index와 Shard는 같은 단위가 아니다. Shard는 분산 저장·검색의 물리적 단위이며, Alias는 Index를 가리키는 논리적 이름이다. Mapping은 검색·집계에서 필드가 어떻게 해석되는지 결정한다.

## 검색은 세 단계

```text
Query DSL → 조건에 맞는 Document 선택 → 점수·정렬·집계·응답
               │
               ├─ Full-text: match / match_phrase (분석기 활용)
               ├─ Term-level: term / range (정확한 값·범위)
               └─ Bool: must / filter / should / must_not
```

| Bool 절 | 검색 결과에 미치는 영향 |
|---|---|
| `must` | 반드시 일치하며 점수에 반영 |
| `filter` | 반드시 일치하지만 점수에는 반영하지 않음 |
| `should` | 선택적 일치·점수 보완; 필수 여부는 조건에 따라 달라짐 |
| `must_not` | 일치하는 문서를 제외 |

`should`는 단순히 항상 OR 조건이 아니다. `must`·`filter` 유무에 따라 기본 `minimum_should_match`가 달라진다.

```json
{
  "query": {
    "bool": {
      "must": [{ "match": { "message": "timeout" } }],
      "filter": [{ "range": { "@timestamp": { "gte": "now-1d" } } }]
    }
  }
}
```

`_search`는 결과 문서와 점수·집계, `_count`는 조건에 맞는 문서 수를 반환한다. `track_total_hits` 설정에 따라 검색 결과의 총 건수 정확도가 달라진다.

## 쓰기·재구성·삭제는 영향 범위가 다르다

```text
Document CRUD ── 개별 문서 변경
Bulk          ── 여러 작업을 NDJSON으로 묶어 실행
Reindex       ── 기존 문서를 다른 Index로 복사
Alias swap    ── 애플리케이션이 바라보는 논리적 Index 전환
Delete Query  ── 조건에 맞는 여러 문서 삭제
Delete Index  ── Index 자체 삭제
```

Bulk는 각 작업별 성공·실패를 응답에서 확인해야 한다. Reindex와 Alias 전환은 별개 단계이며, Alias 변경만으로 데이터 복사가 일어나지는 않는다. 파괴적 API는 먼저 검색·건수로 대상 범위를 확인한다.

## 운영 관찰: 무엇을 확인하는가?

| 관찰 대상 | 의미 | 대표 API |
|---|---|---|
| Cluster health | 전체 할당 상태 | `_cluster/health` |
| Nodes | 실행 노드 | `_cat/nodes` |
| Indices | Index 상태·문서 수 | `_cat/indices` |
| Shards | 분산 배치 상태 | `_cat/shards` |
| Allocation | 배치·미할당 원인 | `_cluster/allocation/explain` |
| Recovery | 복구·재배치 진행 | `_cat/recovery` |
| Tasks | 진행 중인 작업 | `_tasks` |

`_cat`은 사람이 읽는 운영 요약에 적합하다. 자동화에서는 구조화된 JSON 응답을 제공하는 API를 우선한다.

## HTTP API와 Kibana Dev Tools

```text
HTTP Client: curl -X GET "HOST/INDEX/_search"
Kibana Console: GET INDEX/_search
                { ... JSON body ... }
```

둘 다 Elasticsearch REST API를 호출한다. Console은 요청 작성·응답 탐색 UI이며 다른 검색 언어가 아니다. 인증·TLS·권한은 배포 환경에 따라 달라진다.

공식 명세: [Elasticsearch Reference](https://www.elastic.co/docs/reference/elasticsearch) · [Query DSL](https://www.elastic.co/docs/reference/query-languages/query-dsl) · [REST APIs](https://www.elastic.co/docs/api/doc/elasticsearch/)
