# Elasticsearch Cheatsheet

> 분산 검색 엔진. 클러스터·인덱스·쿼리·운영 진단을 한 곳에. Kibana Dev Tools와 curl 형태 모두.

## 30초만 본다면

| 상황 | 명령 (Dev Tools 표기) |
|---|---|
| 클러스터 상태 | `GET _cluster/health` |
| 노드 정보 | `GET _cat/nodes?v` |
| 인덱스 목록 (크기·문서수) | `GET _cat/indices?v&s=store.size:desc` |
| 매핑 보기 | `GET INDEX/_mapping` |
| 단일 문서 | `GET INDEX/_doc/<id>` |
| 전체 검색 (10개) | `GET INDEX/_search` |
| match 검색 | `GET INDEX/_search { "query": { "match": { "field": "value" }}}` |
| 조건부 삭제 | `POST INDEX/_delete_by_query { "query": ... }` |
| 인덱스 삭제 | `DELETE INDEX` |
| 진행 중 task | `GET _tasks?detailed=true&actions=*delete*` |

## curl ↔ Kibana Dev Tools 변환 규칙

Kibana > Management > Dev Tools > Console.

| curl | Dev Tools |
|------|-----------|
| `curl -X GET "http://HOST:9200/INDEX/_search"` | `GET INDEX/_search` |
| `-H 'Content-Type: application/json'` | 생략 (자동) |
| `-d '{...}'` | 다음 줄에 JSON 그대로 |
| `?pretty` | 생략 (자동 포맷) |
| 응답 헤더 | 우측 패널, status code는 우상단 |

```text
# Dev Tools 단축키
Ctrl/Cmd + Enter   # 현재 요청 실행
Ctrl/Cmd + I       # 자동 인덴트
Ctrl + Space       # 자동완성
우측 스패너        # cURL로 복사
```

> 아래 각 섹션에 curl과 Dev Tools 두 형태를 함께 적었다. 평소 운영은 curl, 탐색/디버깅은 Dev Tools가 빠르다.

## 클러스터/노드 정보

| curl | Dev Tools | 설명 |
|------|-----------|------|
| `curl http://HOST:9200` | `GET /` | 버전 및 노드 정보 확인 |
| `curl http://HOST:9200/_cluster/health?pretty` | `GET _cluster/health` | 클러스터 상태 (green/yellow/red) |
| `curl http://HOST:9200/_cluster/stats?pretty` | `GET _cluster/stats` | 클러스터 통계 |
| `curl http://HOST:9200/_cat/nodes?v` | `GET _cat/nodes?v` | 노드 목록 |
| `curl http://HOST:9200/_cat/indices?v` | `GET _cat/indices?v` | 인덱스 목록 |
| `elasticsearch --version` | — | 서버 설치 버전 (쉘에서만) |

## 문서 Count

```bash
# curl
curl -X GET "http://HOST:9200/INDEX/_count"

curl -X GET "http://HOST:9200/INDEX/_count" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "range": {
        "lsh_dtm": {
          "gte": "2026-03-01T00:00:00",
          "lte": "2026-03-01T23:59:59"
        }
      }
    }
  }'
```

```text
# Dev Tools
GET INDEX/_count

GET INDEX/_count
{
  "query": {
    "range": {
      "lsh_dtm": {
        "gte": "2026-03-01T00:00:00",
        "lte": "2026-03-01T23:59:59"
      }
    }
  }
}
```

> `_search`의 `hits.total.value`는 기본 10,000에서 상한(그 이상이면 `"relation": "gte"`). 정확한 전체 수는 `_count` 사용.
> `_search`에서 정확한 수가 필요하면 `"track_total_hits": true` 추가 (느림).

## 문서 조회

```bash
# curl
curl -X GET "http://HOST:9200/INDEX/_search?pretty"

curl -X GET "http://HOST:9200/INDEX/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "range": {
        "lsh_dtm": {
          "gte": "2026-03-01T00:00:00",
          "lte": "2026-03-01T23:59:59"
        }
      }
    }
  }'

curl -X GET "http://HOST:9200/INDEX/_search?size=5&pretty"
```

```text
# Dev Tools
GET INDEX/_search

GET INDEX/_search
{
  "query": {
    "range": {
      "lsh_dtm": {
        "gte": "2026-03-01T00:00:00",
        "lte": "2026-03-01T23:59:59"
      }
    }
  }
}

GET INDEX/_search?size=5
```

## 검색 쿼리

### match (부분 매칭)

단어 단위로 분석 후 매칭. 순서 무관, OR 조건.

```bash
# curl
curl -X GET "http://HOST:9200/INDEX/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": { "match": { "exrs_cnte": "mild as" } }
  }'
```

```text
# Dev Tools
GET INDEX/_search
{
  "query": { "match": { "exrs_cnte": "mild as" } }
}

GET INDEX/_count
{
  "query": { "match": { "exrs_cnte": "mild as" } }
}
```

### match_phrase (정확한 구문 매칭)

단어 순서까지 일치해야 매칭.

```bash
# curl
curl -X GET "http://HOST:9200/INDEX/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": { "match_phrase": { "exrs_cnte": "Mild As" } }
  }'
```

```text
# Dev Tools
GET INDEX/_search
{
  "query": { "match_phrase": { "exrs_cnte": "Mild As" } }
}
```

### match vs match_phrase 비교

| 쿼리 | `"mild as"` 입력 시 매칭 | 용도 |
|------|--------------------------|------|
| `match` | "mild" 또는 "as" 포함하면 매칭 (OR) | 넓은 검색 |
| `match` + `"operator": "and"` | "mild"과 "as" 모두 포함 (순서 무관) | 교집합 검색 |
| `match_phrase` | "mild as" 구문 그대로 매칭 (순서 일치) | 정확한 문구 검색 |

### bool 쿼리 (복합 조건)

```bash
# curl
curl -X GET "http://HOST:9200/INDEX/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "bool": {
        "must": [
          { "match_phrase": { "exrs_cnte": "Mild As" } }
        ],
        "filter": [
          { "range": { "lsh_dtm": { "gte": "2024-01-01", "lte": "2024-12-31" } } }
        ]
      }
    }
  }'
```

```text
# Dev Tools
GET INDEX/_search
{
  "query": {
    "bool": {
      "must": [
        { "match_phrase": { "exrs_cnte": "Mild As" } }
      ],
      "filter": [
        { "range": { "lsh_dtm": { "gte": "2024-01-01", "lte": "2024-12-31" } } }
      ]
    }
  }
}
```

| bool 절 | 설명 |
|---------|------|
| `must` | AND 조건 (스코어 반영) |
| `should` | OR 조건 (스코어 반영) |
| `must_not` | NOT 조건 |
| `filter` | AND 조건 (스코어 무시, 캐싱됨 → 빠름) |

## Bulk 적재

```bash
# curl (대용량은 curl 권장 — Dev Tools는 한 줄 요청 단위라 파일 스트리밍 불가)
curl -X POST "http://HOST:9200/_bulk?timeout=1m" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @bulk_data.json
```

```text
# Dev Tools (소량 테스트용)
# 각 액션과 문서는 줄바꿈으로 구분. 마지막 줄도 개행 필수.
POST _bulk
{ "index": { "_index": "INDEX", "_id": "1" } }
{ "field1": "value1" }
{ "index": { "_index": "INDEX", "_id": "2" } }
{ "field1": "value2" }
```

### Bulk 적재 확인 방법

```bash
# curl
curl -X GET "http://HOST:9200/INDEX/_count"

curl -X GET "http://HOST:9200/INDEX/_count" \
  -H 'Content-Type: application/json' \
  -d '{"query":{"range":{"lsh_dtm":{"gte":"2026-03-01T00:00:00","lte":"2026-03-01T23:59:59"}}}}'
```

```text
# Dev Tools
GET INDEX/_count

GET INDEX/_count
{ "query": { "range": { "lsh_dtm": { "gte": "2026-03-01T00:00:00", "lte": "2026-03-01T23:59:59" } } } }
```

## Delete by Query

```bash
# curl
curl -X POST "http://HOST:9200/INDEX/_delete_by_query?refresh=true&conflicts=proceed" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "range": {
        "lsh_dtm": {
          "gte": "2026-03-01T00:00:00",
          "lte": "2026-03-01T23:59:59"
        }
      }
    }
  }'
```

```text
# Dev Tools
POST INDEX/_delete_by_query?refresh=true&conflicts=proceed
{
  "query": {
    "range": {
      "lsh_dtm": {
        "gte": "2026-03-01T00:00:00",
        "lte": "2026-03-01T23:59:59"
      }
    }
  }
}
```

| 파라미터 | 설명 |
|----------|------|
| `refresh=true` | 삭제 후 즉시 검색 반영 |
| `conflicts=proceed` | 충돌 무시하고 계속 |
| `wait_for_completion=true` | 완료까지 대기 |
| `slices=auto` | 병렬 삭제 (성능 향상) |
| `timeout=1m` | 타임아웃 설정 |

## 로그 확인

```bash
# 실시간 로그 (기본 경로)
tail -f /var/log/elasticsearch/elasticsearch.log

# 에러만 필터
tail -f /var/log/elasticsearch/elasticsearch.log | grep -i error

# bulk 관련만
tail -f /var/log/elasticsearch/elasticsearch.log | grep -i bulk

# systemd 서비스 로그
journalctl -u elasticsearch -f

# Docker 환경
docker logs -f <container_name>

```

## 인덱스 관리

```bash
# curl
curl -X PUT "http://HOST:9200/INDEX"
curl -X DELETE "http://HOST:9200/INDEX"
curl -X GET "http://HOST:9200/INDEX/_settings?pretty"
curl -X GET "http://HOST:9200/INDEX/_mapping?pretty"
curl -X GET "http://HOST:9200/_cat/indices?v&s=index"
```

```text
# Dev Tools
PUT INDEX
DELETE INDEX
GET INDEX/_settings
GET INDEX/_mapping
GET _cat/indices?v&s=index
```

### Reindex · Alias 무중단 교체

```text
# 매핑을 바꿔 새 인덱스로 재적재
POST _reindex
{ "source": { "index": "old" }, "dest": { "index": "new" } }

# alias를 원자적으로 교체 (다운타임 없이 old→new 스위치)
POST _aliases
{ "actions": [
  { "remove": { "index": "old", "alias": "live" } },
  { "add":    { "index": "new", "alias": "live" } }
]}
```

## _cat API (운영 모니터링)

Dev Tools에서는 `GET` 붙이고 그대로 실행.

| 엔드포인트 | 설명 |
|------------|------|
| `GET _cat/health?v` | 클러스터 상태 |
| `GET _cat/nodes?v` | 노드 목록 |
| `GET _cat/indices?v` | 인덱스 목록 |
| `GET _cat/shards?v` | 샤드 배치 상태 |
| `GET _cat/allocation?v` | 디스크 할당 |
| `GET _cat/thread_pool?v` | 스레드풀 상태 |
| `GET _cat/pending_tasks?v` | 대기 작업 |

> curl로는 `curl http://HOST:9200/_cat/health?v` 형태. `?format=json` 붙이면 JSON 출력.

> 샤드가 yellow/red면 `GET _cluster/allocation/explain`으로 미할당 원인을, `GET _cat/recovery?v&active_only=true`로 복구 진행을 본다.

## Logstash JDBC tracking column 주의점

`use_column_value => true`로 tracking column 사용 시, **ORDER BY 없이 적재하면 `last_run` 파일에 마지막 row의 값이 저장**된다. DB 반환 순서가 비결정적이므로 `MAX(tracking_column)`이 아닌 엉뚱한 값이 기록될 수 있다.

### 증상

- 초기적재에서 성능을 위해 ORDER BY와 paging 제거
- 적재는 정상 완료되었지만 `last_run`에 과거 날짜가 기록됨

### 해결

적재 후 수동으로 실제 MAX 값을 써넣는다:

```bash
# KST → UTC 변환 필요 (jdbc_default_timezone: Asia/Seoul)
echo "--- !ruby/object:DateTime '2026-04-09 02:23:32.000000000 Z'" \
  > /tmp/logstash-data/.logstash_jdbc_last_run_INDEX_NAME
```

### 근본 대책

초기적재 스크립트에서 적재 완료 후 `SELECT MAX(tracking_column)`로 `last_run` 파일을 자동 갱신하는 로직 추가.
