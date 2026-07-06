---
layout: notes
title: "PostgreSQL 메이저 버전 업그레이드 (14 → 17)"
date: 2026-05-20
categories: [database]
tags: [postgresql, pg_upgrade, rpm, linux, dba]
---

메이저 업그레이드가 특별한 이유는 버전마다 시스템 카탈로그 구조와 온디스크 데이터 포맷이 바뀌기 때문이다. 그래서 바이너리만 갈아끼우면 기존 데이터 디렉터리를 못 읽는다. 구버전 데이터를 신버전이 이해하는 형태로 변환해야 하는데, 이 변환을 어떻게 하느냐가 곧 업그레이드 방식이다.

## 왜 메이저는 다른가 — 두 가지 변환 방식

마이너 업그레이드(14.1 → 14.9)는 포맷이 호환되어 바이너리 교체만으로 끝난다. 메이저는 포맷 비호환이라 변환이 필수고, 방식은 두 갈래다.

**pg_upgrade (권장)** — 구버전 카탈로그를 읽어 신버전 카탈로그로 옮기고, 실제 테이블 데이터 파일은 그대로 재사용한다.
- 다운타임: 짧음 (수분 ~ 수십분)
- `--link` 옵션 사용 시 데이터 파일을 하드링크로만 연결하므로 거의 즉시 완료, 디스크 추가 공간 불필요

**pg_dumpall + restore** — 전체를 논리적 SQL로 덤프한 뒤 신버전에 다시 넣는다. 포맷 문제를 원천적으로 우회한다.
- 다운타임: 김 (DB 크기에 비례)
- 가장 안전하고 단순
- 덤프본 + 신규 클러스터로 디스크 공간 2배 필요

운영 환경이라면 보통 `pg_upgrade --link`를 쓴다. 단, 뒤에서 보듯 `--link`는 롤백을 포기하는 대가로 속도를 얻는 것이다.

## 폐쇄망 RPM 설치 (RHEL/Rocky 계열)

인터넷 되는 곳에서 PostgreSQL 공식 yum repo의 RPM을 받아 옮긴다. OS 버전·아키텍처를 맞춰야 한다 (예: `https://download.postgresql.org/pub/repos/yum/17/redhat/rhel-8-x86_64/`).

최소 필요 패키지 (PG17용): `postgresql17-libs`, `postgresql17`, `postgresql17-server`, `postgresql17-contrib` (pg_upgrade가 여기 포함), 의존성 `libicu` 등.

핵심: **기존 PG14 패키지는 제거하지 말 것.** pg_upgrade는 구·신 두 바이너리가 동시에 있어야 카탈로그를 옮길 수 있다.

```bash
# 받아온 rpm들을 한 디렉터리에 모은 뒤
sudo dnf install -y ./postgresql17-*.rpm
# 또는
sudo yum localinstall -y ./postgresql17-*.rpm

# 바이너리 위치 확인 — 버전별로 경로가 분리됨
ls /usr/pgsql-14/bin/
ls /usr/pgsql-17/bin/
```

## 사전 점검과 백업

```bash
sudo systemctl status postgresql-14
psql -U postgres -c "SHOW data_directory;"
psql -U postgres -c "SELECT version();"

# link 모드면 공간 거의 불필요, copy 모드면 데이터 크기만큼 필요
df -h /var/lib/pgsql

# 어떤 방식이든 논리 백업 먼저
sudo -u postgres pg_dumpall -f /backup/pg14_full_$(date +%F).sql
```

## 신규 클러스터 초기화 — encoding/locale이 관문

PG17용 빈 클러스터를 만들되, **기존 14의 encoding·locale과 반드시 동일**하게 맞춰야 한다. 다르면 pg_upgrade가 `--check`에서 막힌다 (정렬 규칙이 달라지면 인덱스가 깨지므로 의도된 차단이다).

```bash
# 먼저 14의 값 확인
sudo -u postgres psql -c "SHOW server_encoding; SHOW lc_collate; SHOW lc_ctype;"

# 그 값에 맞춰 초기화
sudo PGSETUP_INITDB_OPTIONS="--encoding=UTF8 --locale=C" \
  /usr/pgsql-17/bin/postgresql-17-setup initdb
```

## --check 후 실행

양쪽 서비스를 모두 내리고 진행한다.

```bash
sudo systemctl stop postgresql-14
sudo systemctl stop postgresql-17
```

먼저 `--check`로 검증만 한다. 여기서 오류가 나면 절대 다음 단계로 넘어가지 않는다.

```bash
sudo -u postgres /usr/pgsql-17/bin/pg_upgrade \
  --old-bindir=/usr/pgsql-14/bin \
  --new-bindir=/usr/pgsql-17/bin \
  --old-datadir=/var/lib/pgsql/14/data \
  --new-datadir=/var/lib/pgsql/17/data \
  --check
```

흔한 이슈:
- `pg_stat_statements` 등 extension 버전 불일치 → 14에서 `ALTER EXTENSION ... UPDATE` 후 재시도
- `--check`는 postgres OS 유저 홈에서 실행해야 권한 문제가 없다 (`cd ~postgres` 후 실행 권장)

체크 통과 시 실제 실행. `--link` 유무가 롤백 가능성을 가른다.

```bash
sudo -u postgres /usr/pgsql-17/bin/pg_upgrade \
  --old-bindir=/usr/pgsql-14/bin \
  --new-bindir=/usr/pgsql-17/bin \
  --old-datadir=/var/lib/pgsql/14/data \
  --new-datadir=/var/lib/pgsql/17/data \
  --link
```

- `--link`: 하드링크로 즉시 완료, 디스크 추가 불필요. **단, 실행 후 PG14 데이터는 손상되어 롤백 불가.** 신버전이 공유 데이터 파일을 건드리는 순간 구버전에서 못 쓰게 된다.
- 안전 우선이면 `--link`를 빼서 copy 모드로. 시간↑ 디스크↑ 대신 구 클러스터가 온전해 롤백 가능.

## 설정 이전 · 후속 작업 · 정리

`postgresql.conf`, `pg_hba.conf`의 커스텀 설정은 **자동 이전되지 않는다.** 데이터는 옮겨져도 설정은 신규 클러스터의 기본값이므로 수동 반영해야 한다.

```bash
diff /var/lib/pgsql/14/data/postgresql.conf /var/lib/pgsql/17/data/postgresql.conf
diff /var/lib/pgsql/14/data/pg_hba.conf     /var/lib/pgsql/17/data/pg_hba.conf
```

기동 후 통계 재수집이 필요하다 (업그레이드는 옵티마이저 통계를 옮기지 않는다).

```bash
sudo systemctl enable postgresql-17
sudo systemctl start postgresql-17

# pg_upgrade가 생성한 스크립트가 있으면 실행
sudo -u postgres /var/lib/pgsql/update_extensions.sql  # 있는 경우
sudo -u postgres /usr/pgsql-17/bin/vacuumdb --all --analyze-in-stages
```

며칠 운영해 문제없으면 구 클러스터 제거. pg_upgrade가 정리 스크립트를 만들어 둔다.

```bash
sudo -u postgres /var/lib/pgsql/delete_old_cluster.sh
sudo dnf remove postgresql14*
```
