# PostgreSQL Operations Snippets

운영하면서 다시 찾게 되는 PostgreSQL 쿼리 모음. PostgreSQL 13+ 기준.

## 활성 세션 / 슬로우 쿼리

```sql
-- 현재 실행 중인 쿼리 (자기 자신과 idle 제외)
SELECT pid, usename, application_name, client_addr,
       state, wait_event_type, wait_event,
       now() - query_start AS duration,
       query
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND state <> 'idle'
ORDER BY duration DESC;
```

```sql
-- N초 이상 실행 중인 쿼리만
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '10 seconds'
ORDER BY duration DESC;
```

## 록 / 블로킹

```sql
-- 누가 누구를 막고 있나
SELECT
  blocked.pid     AS blocked_pid,
  blocked.usename AS blocked_user,
  blocked.query   AS blocked_query,
  blocking.pid    AS blocking_pid,
  blocking.usename AS blocking_user,
  blocking.query  AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));
```

```sql
-- 대기 중인 록만
SELECT relation::regclass, mode, pid, granted
FROM pg_locks
WHERE NOT granted;
```

## 쿼리 종료

```sql
-- 부드럽게 (SIGINT, cancel)
SELECT pg_cancel_backend(<pid>);

-- 강제 (SIGTERM, terminate)
SELECT pg_terminate_backend(<pid>);

-- 10분 이상 idle in transaction 일괄 종료
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > interval '10 minutes';
```

## 테이블 / 인덱스 크기

```sql
-- 상위 20개 테이블 (데이터 + 인덱스 합산)
SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total,
       pg_size_pretty(pg_relation_size(relid))       AS data,
       pg_size_pretty(pg_indexes_size(relid))        AS indexes
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;
```

```sql
-- 인덱스별 크기 (큰 순)
SELECT schemaname, indexrelname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- DB 전체 크기
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## 인덱스 진단

```sql
-- 한 번도 안 쓰인 인덱스 (idx_scan = 0)
SELECT schemaname, relname, indexrelname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

```sql
-- 테이블별 Seq vs Index 스캔 비율
SELECT relname,
       seq_scan, idx_scan,
       CASE WHEN seq_scan + idx_scan = 0 THEN 0
            ELSE round(100.0 * idx_scan / (seq_scan + idx_scan), 1)
       END AS idx_pct
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 20;
```

> `idx_scan = 0`이라도 야간 배치만 쓰는 인덱스일 수 있음. 통계 리셋 후 충분한 기간을 두고 판단.

## 슬로우 쿼리 통계 (`pg_stat_statements`)

```sql
-- 활성화 확인
SHOW shared_preload_libraries;  -- pg_stat_statements 포함되어야 함
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 누적 시간 TOP 20
SELECT round(total_exec_time::numeric, 2)                 AS total_ms,
       calls,
       round(mean_exec_time::numeric, 2)                  AS mean_ms,
       round((100 * total_exec_time
              / sum(total_exec_time) OVER ())::numeric, 2) AS pct,
       substring(query, 1, 80)                            AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- 통계 초기화
SELECT pg_stat_statements_reset();
```

## VACUUM / 통계

```sql
-- 마지막 vacuum/analyze 시각, dead tuples
SELECT schemaname, relname,
       last_vacuum, last_autovacuum,
       last_analyze, last_autoanalyze,
       n_dead_tup, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

```sql
-- 수동 실행
VACUUM ANALYZE schema.table;
VACUUM FULL schema.table;   -- AccessExclusiveLock, 디스크 회수. 운영 중 주의
```

## 빠른 행 수 추정 (`count(*)` 대신)

```sql
-- 통계 기반 추정 (즉시 반환, 정확도는 ANALYZE 시점에 의존)
SELECT reltuples::bigint AS estimated_rows
FROM pg_class
WHERE oid = 'schema.table'::regclass;
```

## 연결 / 세션 관리

```sql
-- 상태별 연결 수
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- 최대 연결 수
SHOW max_connections;

-- 특정 사용자 연결 일괄 종료
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'someuser'
  AND pid <> pg_backend_pid();
```

## 메타데이터

```sql
-- 스키마 내 테이블 목록
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 특정 테이블의 컬럼 정보
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- 외래키 참조 관계
SELECT tc.table_name, kcu.column_name,
       ccu.table_name  AS foreign_table,
       ccu.column_name AS foreign_column
FROM information_schema.table_constraints  tc
JOIN information_schema.key_column_usage   kcu USING (constraint_name)
JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema    = 'public';
```

## DDL 자동 생성

`information_schema` + `FORMAT()`으로 ALTER 문을 일괄 생성한 뒤 검토하고 실행.

```sql
-- ods 스키마 모든 character varying 컬럼을 varchar 타입으로
SELECT FORMAT(
  'ALTER TABLE %I.%I ALTER COLUMN %I TYPE varchar;',
  table_schema, table_name, column_name
)
FROM information_schema.columns
WHERE table_schema = 'ods'
  AND data_type    = 'character varying';
```

> `%I` = identifier 자리 (자동 quote), `%L` = literal 자리 (자동 escape).

## 문자열 일괄 치환

```sql
UPDATE tbl_test
SET    url = REPLACE(url, 'http://old.example.com', 'http://new.example.com')
WHERE  url LIKE 'http://old.example.com%';
```

> `WHERE`로 영향 행을 좁힐 것. 빈 `WHERE`는 테이블 전체를 치환한다. 큰 테이블이면 `LIMIT` + 배치 처리.

## 실행 계획

```sql
EXPLAIN              SELECT ...;   -- 추정 계획
EXPLAIN ANALYZE      SELECT ...;   -- 실제 실행 (UPDATE/DELETE도 실행됨 — 트랜잭션 안에서)
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;  -- 버퍼 히트/디스크 IO 포함
EXPLAIN (FORMAT JSON) SELECT ...;       -- pg_explain 같은 시각화 도구용
```

쓰기 쿼리를 안전하게 분석:

```sql
BEGIN;
EXPLAIN ANALYZE UPDATE ...;
ROLLBACK;
```
