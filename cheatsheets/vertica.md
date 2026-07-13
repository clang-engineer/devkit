# Vertica Cheatsheet

> 컬럼형 분석 DB. OS 계정 관리(chage) + `v_catalog`/`v_monitor` 시스템 테이블로 메타데이터·용량 조회.

## OS `vertica` 서비스 계정 만료 해제

데몬이 쓰는 리눅스 서비스 계정에 패스워드/계정 만료가 걸리면 서비스가 끊길 수 있다. `chage`(change age)로 만료를 전부 해제.

```bash
sudo chage -E -1 -M -1 -I -1 -m 0 vertica
sudo chage -l vertica   # 확인: Password/Account expires, Password inactive 모두 never면 정상
```

| 옵션 | 의미 |
|---|---|
| `-E -1` | 계정 만료일 없음 |
| `-M -1` | 패스워드 최대 사용 기간 없음 |
| `-I -1` | 만료 후 비활성화 기간 없음 |
| `-m 0` | 패스워드 최소 사용 기간 0일 |

> `-1`은 "제한 없음" sentinel 값.

## 카탈로그에서 테이블/컬럼 찾기

메타데이터는 `v_catalog` 스키마의 시스템 테이블로 노출. 이름 매칭은 대소문자 무시하는 `ILIKE`가 실무에서 편하다.

```sql
-- 테이블 이름으로 검색
SELECT table_schema, table_name FROM v_catalog.tables
WHERE table_name ILIKE '%order%';

-- 스키마·테이블 동시 검색
SELECT table_schema, table_name FROM v_catalog.tables
WHERE table_schema ILIKE '%sales%' OR table_name ILIKE '%sales%';

-- 컬럼명만 알 때 역추적
SELECT table_schema, table_name, column_name FROM v_catalog.columns
WHERE column_name ILIKE '%code%';
```

vsql 메타 커맨드: `\dt`(테이블), `\dt schema.*`(특정 스키마), `\dv`(뷰).

## 스키마별 현재 용량 (압축 후 디스크)

```sql
SELECT anchor_table_schema AS schema_name,
       ROUND(SUM(used_bytes) / (1024^3), 2) AS used_gb
FROM v_monitor.projection_storage
GROUP BY anchor_table_schema
ORDER BY used_gb DESC;
```

- `used_bytes` = **압축·인코딩 후 실제 디스크 점유량**(버디 프로젝션·노드 복제본 포함). 디스크 관점의 정답.
- 시점 스냅샷일 뿐, 시계열 이력은 저장 안 됨.

> **함정**: `projection_storage`는 테이블당 1행이 아니라 **(프로젝션 × 노드)마다 1행**. `v_catalog.tables`와 JOIN 후 `COUNT(*)` 하면 fan-out으로 과대 집계(3노드 버디 ≈ 6배). 테이블 수는 `COUNT(DISTINCT table_name)`으로.

```sql
SELECT t.create_time::DATE AS created_day,
       COUNT(DISTINCT t.table_name)          AS table_count,
       ROUND(SUM(ps.used_bytes)/(1024^3), 2) AS used_gb   -- SUM은 복제본 합산이라 디스크 기준 OK
FROM v_catalog.tables t
LEFT JOIN v_monitor.projection_storage ps
       ON ps.anchor_table_schema = t.table_schema
      AND ps.anchor_table_name   = t.table_name
WHERE t.table_schema = 'SALES' AND t.table_name ILIKE 'TXN%'
GROUP BY t.create_time::DATE ORDER BY created_day;
```

## 과거 이력 조회

| 원하는 것 | 테이블 | 한계 |
|---|---|---|
| 현재 스키마별 용량 | `v_monitor.projection_storage` (압축 후) | 시점 스냅샷 |
| 과거 전체 DB 크기 추세 | `v_catalog.license_audits` (raw) | 전체 합계만, 감사 꺼지면 끊김 |
| 과거 DDL/생성 건수 | `dc_requests_issued` | 건수만, DC 보존 기간 내 |
| 과거 스키마별 용량 이력 | **없음** | 직접 스냅샷 적재해야 생김 |

```sql
-- 전체 DB raw 크기 추세 (라이선스 감사가 주기적으로 누적)
SELECT audit_day, db_size_gb,
       db_size_gb - LAG(db_size_gb) OVER (ORDER BY audit_day) AS delta_gb
FROM (
    SELECT audit_start_timestamp::DATE AS audit_day,
           MAX(ROUND(database_size_bytes/(1024^3), 2)) AS db_size_gb  -- 하루 여러 행 → MAX dedup
    FROM v_catalog.license_audits
    GROUP BY audit_start_timestamp::DATE
) d ORDER BY audit_day;
```

- 주의: (a) **raw 크기**라 `projection_storage`(압축 후)와 절대값 다름 — 추세용. (b) 전체 DB 합계라 스키마 분리 불가. (c) 감사 1회당 여러 행(일부 `0`) → dedup. (d) 자동 감사 꺼져 있으면 기록 끊김 → `MIN/MAX(audit_start_timestamp)`로 범위 먼저 확인.

```sql
-- 과거 CREATE TABLE 건수 (Data Collector, 보존 기간 내만)
SELECT MIN(time), MAX(time) FROM dc_requests_issued;   -- 보존 범위 먼저
SELECT time::DATE AS day, COUNT(*) AS creates FROM dc_requests_issued
WHERE request ILIKE 'CREATE TABLE%' GROUP BY 1 ORDER BY 1;
```
