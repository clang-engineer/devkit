# Logstash — 이벤트 파이프라인 치트시트

> Logstash는 입력 이벤트를 수집하고, 필드를 변환한 뒤 목적지로 전달하는 **이벤트 처리 파이프라인**이다. Elasticsearch에만 종속되지 않으며 Input·Filter·Output 플러그인으로 구성된다.

## 전체 작동 모델 — 수집에서 전달까지

```text
File / Beats / HTTP / Kafka 등
            │
            ▼
      Input Plugin
            │ 이벤트 생성·디코딩
            ▼
      Internal Queue
      (Memory / Persistent)
            │
            ▼
      Pipeline Workers
            │
      Filter Plugin(s)
      grok / dissect / mutate / date
            │
            ▼
      Output Plugin(s)
      Elasticsearch / File / Stdout / ...
            │
            ▼
      대상 시스템

설정(.conf) → Pipeline 구성
모니터링 API / Logs → 처리량·오류·지연 관찰
```

**이벤트가 처리 단위**다. Input은 이벤트를 만들고, Filter는 이벤트의 필드를 수정하며, Output은 결과를 내보낸다. Codec은 입력·출력 경계에서 데이터를 인코딩·디코딩한다. Queue는 입력과 처리 사이의 완충 역할이며, Persistent Queue는 설정한 경우에만 사용된다. 위 그림은 대표 경로로, 조건문·여러 파이프라인·플러그인별 재시도 동작은 별도로 확인한다.

## 1. 파이프라인 구성 — Input·Filter·Output

```conf
input {
  stdin { }
}

filter {
  dissect {
    mapping => { "message" => "%{level} %{service} %{detail}" }
  }
  mutate {
    lowercase => ["level"]
  }
}

output {
  stdout { codec => rubydebug }
}
```

**동작 예시:** `INFO api started`를 입력하면 Dissect가 `level=INFO`, `service=api`, `detail=started`로 분리하고 Mutate가 `level`을 `info`로 바꾼다. Stdout에서 변환된 이벤트를 확인한다. 원래 `message` 필드도 별도로 제거하지 않았다면 유지된다.

| 구성 | 무엇을 결정하나? | 대표 플러그인 |
|---|---|---|
| Input | 어디서 이벤트를 받는가 | `file`, `beats`, `http`, `kafka` |
| Filter | 이벤트를 어떻게 바꾸는가 | `grok`, `dissect`, `mutate`, `date` |
| Output | 어디로 보내는가 | `elasticsearch`, `stdout`, `file` |
| Codec | 입력·출력 데이터를 어떤 형식으로 읽고 쓰는가 | `json`, `plain`, `rubydebug` |

## 2. 변환 — Grok·Dissect·Date·Mutate

**Dissect**는 구분자와 고정된 구조를 기준으로 빠르게 분리하고, **Grok**은 패턴·정규식으로 가변적인 텍스트를 추출한다. Date는 시간 문자열을 이벤트 타임스탬프로 해석하며 Mutate는 필드 이름·값·타입을 조정한다.

```conf
filter {
  grok {
    match => { "message" => "%{IP:client_ip} %{WORD:method} %{URIPATHPARAM:path}" }
  }
  if [method] == "GET" {
    mutate { add_tag => ["read-request"] }
  }
}
```

예를 들어 `192.0.2.10 GET /health`는 IP·Method·Path로 추출된다. 패턴이 맞지 않으면 기본적으로 `_grokparsefailure` 태그가 붙을 수 있으므로, **실패 이벤트도 출력에서 관찰**해야 한다. 조건식은 이벤트 필드에 따라 필터·출력을 분기한다.

## 3. 실행·검증 — 설정에서 이벤트까지

```sh
bin/logstash -f pipeline.conf --config.test_and_exit  # 문법·설정 검증
bin/logstash -f pipeline.conf                          # 파이프라인 실행
bin/logstash --config.reload.automatic -f pipeline.conf # 설정 변경 감지
```

`bin/logstash`는 압축 배포판 기준 경로다. 패키지·컨테이너 설치에서는 실행 경로와 설정 디렉터리가 다를 수 있다. **설정 검증 통과는 입력 데이터의 패턴 매칭 성공을 보장하지 않는다.** 위 Stdout 예제로 샘플 이벤트를 먼저 통과시켜 확인한다.

여러 파이프라인은 `pipelines.yml`에서 각 파이프라인의 설정 파일과 Worker·Queue 설정을 분리할 수 있다. `-f` 실행과 `pipelines.yml` 적용 방식은 실행 옵션에 따라 달라진다.

## 4. Queue·오류·운영 관찰

```text
Input → Queue → Filter / Output
          │           │
          │           ├─ 처리 실패·재시도
          │           └─ Dead Letter Queue (지원되는 실패 유형)
          └─ Backpressure : 소비가 느리면 입력에도 영향
```

| 확인할 문제 | 관찰 지점 |
|---|---|
| 이벤트가 안 들어옴 | Input 설정·연결·Codec |
| 필드가 안 나뉨 | Filter 패턴·실패 태그 |
| 처리 속도가 느림 | Pipeline 이벤트 지표·Queue·Worker |
| 출력이 안 됨 | Output 인증·연결·재시도 로그 |
| 재시작 시 유실 우려 | Persistent Queue 설정·내구성 한계 |

Logstash의 모니터링 API는 일반적으로 HTTP `9600` 포트를 사용한다(설정에 따라 다름).

```sh
curl http://localhost:9600/_node/stats/pipelines?pretty
```

Persistent Queue는 장애 시 이벤트 보존 가능성을 높이지만 모든 상황에서 정확히 한 번 처리(exactly once)를 보장하지 않는다. DLQ도 모든 실패를 자동 수집하지 않는다.

**Elasticsearch와의 관계:** Logstash Output은 이벤트를 Elasticsearch에 색인할 수 있다. Index·Mapping·Shard·검색의 원리는 [Elasticsearch 치트시트](elasticsearch.md)에서 다룬다.

공식 문서: [Logstash Reference](https://www.elastic.co/docs/reference/logstash) · [Pipeline Structure](https://www.elastic.co/docs/reference/logstash/configuration-file-structure) · [Monitoring](https://www.elastic.co/docs/reference/logstash/monitoring-logstash)
