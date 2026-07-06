---
layout: notes
title: "Vertica 스키마 용량·증가 이력 조회"
date: 2026-06-19
categories: [database]
tags: [vertica, monitoring, storage, projection_storage, license_audits]
---

Vertica에서 스키마별 디스크 용량과 "과거 증가량"을 조회하는 방법. 시스템 테이블이 무엇을 측정하는지(압축/raw, 시점/이력)를 구분하는 게 핵심.

## 스키마별 현재 용량 (압축 후 디스크)

```sql
SELECT anchor_table_schema AS schema_name,
       ROUND(SUM(used_bytes) / (1024^3), 2) AS used_gb
FROM v_monitor.projection_storage
GROUP BY anchor_table_schema
ORDER BY used_gb DESC;
```

- `used_bytes` = **압축·인코딩 후 실제 디스크 점유량** (버디 프로젝션·노드 복제본 포함). 디스크 용량 관점에선 이게 정답.
- 시점 스냅샷일 뿐, 시계열 이력은 따로 저장 안 됨.

## 함정 1: COUNT(*)가 뻥튀기된다

`projection_storage`는 테이블 1개당 1행이 아니라 **(프로젝션 × 노드)마다 1행**. `v_catalog.tables`와 JOIN 후 `COUNT(*)` 하면 fan-out으로 과대 집계됨 (3노드 버디 = 약 6배).

```sql
-- 실제 테이블 수는 COUNT(DISTINCT)로
SELECT t.create_time::DATE AS created_day,
       COUNT(DISTINCT t.table_name)          AS table_count,  -- O
       ROUND(SUM(ps.used_bytes)/(1024^3), 2) AS used_gb       -- SUM은 복제본 합산이라 디스크 기준 OK
FROM v_catalog.tables t
LEFT JOIN v_monitor.projection_storage ps
       ON ps.anchor_table_schema = t.table_schema
      AND ps.anchor_table_name   = t.table_name
WHERE t.table_schema = 'REX' AND t.table_name ILIKE 'UR%'
GROUP BY t.create_time::DATE
ORDER BY created_day;
```

## 함정 2: 과거 "증가량"은 대부분 복구 불가

- `create_time` 기준 일별 생성량은 **현재 살아있는 테이블만** 잡힘. 주기적으로 drop되는 임시 테이블은 보존 기간 지나면 카탈로그에서 사라져 과거 용량 복구 불가.
- drop된 테이블의 크기는 어디에도 로그되지 않음.

## 과거 전체 DB 크기 이력: license_audits

라이선스 감사가 주기적으로 전체 DB **raw(압축 전) 크기**를 측정해 누적 보관.

```sql
SELECT audit_day, db_size_gb,
       db_size_gb - LAG(db_size_gb) OVER (ORDER BY audit_day) AS delta_gb
FROM (
    SELECT audit_start_timestamp::DATE AS audit_day,
           MAX(ROUND(database_size_bytes/(1024^3), 2)) AS db_size_gb  -- 하루 여러 행 → MAX로 dedup
    FROM v_catalog.license_audits
    GROUP BY audit_start_timestamp::DATE
) d ORDER BY audit_day;
```

- 주의: (a) **raw 크기** — `projection_storage`(압축 후)와 절대값 다름, 추세용. (b) **전체 DB 합계** — 스키마별 분리 불가. (c) 감사 1회당 여러 행(일부 `0`) → dedup 필요. (d) **자동 감사가 꺼져 있으면 기록이 끊김** → `MIN/MAX(audit_start_timestamp)`로 범위 먼저 확인.

## 과거 SQL/DDL 이력: dc_requests_issued

Data Collector가 실행된 SQL을 텍스트째 보관. 과거 테이블 **생성 건수**(용량 X)는 여기서 셀 수 있음. 단 DC 보존 기간(보통 며칠~몇 주)까지만.

```sql
SELECT MIN(time), MAX(time) FROM dc_requests_issued;   -- 보존 범위 확인 먼저
SELECT time::DATE AS day, COUNT(*) AS creates
FROM dc_requests_issued
WHERE request ILIKE 'CREATE TABLE%' AND request ILIKE '%UR%'
GROUP BY 1 ORDER BY 1;
```

## 정리

| 원하는 것 | 테이블 | 한계 |
|---|---|---|
| 현재 스키마별 용량 | `projection_storage` (압축 후) | 시점 스냅샷 |
| 과거 전체 DB 크기 추세 | `license_audits` (raw) | 전체 합계만, 감사 꺼지면 끊김 |
| 과거 DDL/생성 건수 | `dc_requests_issued` | 건수만, DC 보존 기간 내 |
| 과거 스키마별 용량 이력 | **없음** | 직접 스냅샷 적재해야 생김 |
