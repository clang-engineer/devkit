---
layout: notes
title: "Vertica 운영: 계정 만료 해제와 카탈로그 테이블 검색"
date: 2026-05-14
categories: [database]
tags: [vertica, linux, chage, catalog]
---

Vertica 서버를 돌리는 OS 계정의 패스워드 만료를 없애는 것과, `v_catalog` 시스템 테이블로 DB 안의 테이블을 찾는 것은 서로 다른 계층의 작업이다. 전자는 리눅스 계정 관리, 후자는 Vertica 카탈로그 조회다.

## OS `vertica` 계정 패스워드 만료 설정 제거

Vertica 데몬이 사용하는 리눅스 서비스 계정(`/etc/passwd`의 `vertica`)은 일반 사용자 계정처럼 패스워드/계정 만료 정책이 걸려 있을 수 있다. 만료가 되면 서비스가 중단될 수 있으므로 서비스 계정에는 만료를 걸지 않는 게 안전하다. 만료 정책은 `chage`(change age)로 관리한다.

```bash
sudo chage -E -1 -M -1 -I -1 -m 0 vertica
```

각 옵션의 의미:

- `-E -1` : 계정 만료일 없음
- `-M -1` : 패스워드 최대 사용 기간 없음 (만료 안 됨)
- `-I -1` : 패스워드 만료 후 비활성화 기간 없음
- `-m 0` : 패스워드 최소 사용 기간 0일

`-1`은 "제한 없음"을 뜻하는 sentinel 값이다. 적용 후 확인:

```bash
sudo chage -l vertica
```

출력에서 `Password expires`, `Account expires`, `Password inactive`가 모두 `never`면 정상이다.

## 전체 테이블 목록에서 특정 테이블 검색

Vertica는 카탈로그 메타데이터를 `v_catalog` 스키마의 시스템 테이블로 노출한다. 테이블 목록은 `v_catalog.tables`를 조회하면 된다.

```sql
SELECT table_schema, table_name
FROM v_catalog.tables
ORDER BY table_schema, table_name;
```

이름 패턴으로 찾을 때는 대소문자를 무시하는 `ILIKE`를 쓴다. Vertica의 식별자는 기본적으로 대소문자 구분이 애매할 수 있어 `LIKE`보다 `ILIKE`가 실무에서 편하다.

```sql
SELECT table_schema, table_name
FROM v_catalog.tables
WHERE table_name ILIKE '%patient%';
```

스키마명까지 함께 훑으려면:

```sql
SELECT table_schema, table_name
FROM v_catalog.tables
WHERE table_schema ILIKE '%clinical%'
   OR table_name ILIKE '%clinical%';
```

테이블 이름을 모르고 컬럼명만 알 때는 `v_catalog.columns`로 역추적한다. 뷰까지 찾으려면 `v_catalog.views`도 함께 본다.

```sql
-- 특정 컬럼명을 가진 테이블 찾기
SELECT table_schema, table_name, column_name
FROM v_catalog.columns
WHERE column_name ILIKE '%mrn%';
```

vsql 안에서는 메타 커맨드가 빠르다. `\dt`는 테이블 목록, `\dt schema.*`는 특정 스키마의 테이블, `\dv`는 뷰 목록을 보여준다.
