---
layout: notes
title: "ORA-12514 리스너 서비스 오류의 원인과 해결"
date: 2026-05-22
categories: [database]
tags: [oracle, listener, tns, jdbc, service-name]
---

ORA-12514는 리스너까지 연결은 됐지만, 접속 문자열의 서비스 이름과 일치하는 서비스가 리스너에 등록되어 있지 않을 때 나는 오류다. 네트워크/방화벽 문제가 아니라 "리스너가 그 서비스를 모른다"는 뜻이다.

## 오류가 말해주는 것

```
ORA-12514, TNS:listener does not currently know of service requested in connect descriptor
```

연결이 리스너까지 도달해서 리스너에게 *거부*당한 상태다. 즉 호스트/포트로 리스너에는 정상 접근했다는 의미이므로 네트워크 계층은 배제할 수 있다. 문제는 그다음 단계 — 리스너가 요청받은 서비스로 세션을 넘겨줄 수 없다는 것이다.

## TNS 연결이 이뤄지는 흐름

Oracle 접속은 세 주체가 있다.

- **리스너(listener)**: 지정 포트(보통 1521)에서 접속 요청을 받는 프로세스. 요청의 서비스 이름을 보고 해당 인스턴스로 세션을 넘긴다.
- **인스턴스(instance)**: 실제 DB 프로세스. 자신이 제공하는 **서비스 이름(service name)**을 리스너에 등록한다.
- **클라이언트**: JDBC URL의 서비스 이름/SID로 "이 서비스에 붙여달라"고 요청한다.

핵심은 **인스턴스가 서비스를 리스너에 동적으로 등록(dynamic registration)**한다는 점이다. 등록은 인스턴스의 백그라운드 프로세스 **PMON**이 담당한다. 리스너는 자신이 켜졌다고 서비스를 아는 게 아니라, 인스턴스가 등록해줘야 비로소 안다. 그래서 리스너와 인스턴스의 기동 순서·타이밍이 어긋나면 "리스너는 살아있는데 서비스는 모르는" 상태가 생긴다.

서비스 이름과 SID는 URL 문법 자체가 다르다.

```
jdbc:oracle:thin:@//host:1521/service_name   ← 서비스 이름 (슬래시)
jdbc:oracle:thin:@host:1521:sid               ← SID (콜론)
```

## 왜 이 오류가 나는가 (원인 3가지)

1. **JDBC URL의 서비스 이름이 틀림.** 가장 흔한 실수는 서비스 이름 자리에 SID를 쓰거나 그 반대. 위 문법 차이(슬래시 vs 콜론)를 혼동하면 리스너가 아는 이름과 매칭이 안 된다. 서비스 이름은 설정에 따라 대소문자도 구분된다.

2. **인스턴스가 내려가 있거나 아직 등록 전.** 리스너가 떠 있어도 PMON이 서비스를 등록하기 전이면 리스너는 모른다. DB가 막 재시작됐다면 등록 완료까지 지연이 있다.

3. **리스너가 재시작됨.** 리스너를 새로 띄우면 등록 정보가 초기화되어, 인스턴스가 다시 등록할 때까지 서비스를 모른다. 재등록은 자동으로 약 60초 정도 걸리거나 `ALTER SYSTEM REGISTER`로 즉시 강제할 수 있다.

멀티테넌트(PDB) 환경이면 **닫힌 PDB**도 원인이다. PDB가 닫혀 있으면 해당 서비스가 리스너에 등록되지 않는다.

## 진단 — DB 서버에서

리스너에 실제로 등록된 서비스 목록을 본다.

```
lsnrctl status
lsnrctl services
```

출력의 **Service** 항목이 리스너가 아는 서비스 이름이다. JDBC URL에서 슬래시 뒤의 값이 이 목록과 정확히 일치해야 한다. 인스턴스 쪽에서도 무엇을 등록하려 하는지 확인할 수 있다.

```sql
SELECT value FROM v$parameter WHERE name = 'service_names';
SELECT value FROM v$parameter WHERE name = 'db_unique_name';
```

### lsnrctl이 "command not found"일 때

`lsnrctl`은 Oracle 서버/클라이언트에 포함된 도구다. 명령을 못 찾는다면 보통 둘 중 하나다.

- **실행 위치가 잘못됨.** 애플리케이션(Spring Boot) 서버가 아니라 **Oracle DB 서버**에서 실행해야 한다. 앱 서버엔 Oracle이 없을 가능성이 크다.
- **PATH에 Oracle 환경변수 미로드.** DB 서버에 들어가도 `oracle` 계정 환경이 안 잡히면 못 찾는다.

```
su - oracle
echo $ORACLE_HOME
$ORACLE_HOME/bin/lsnrctl status
```

`ORACLE_HOME`이 비어 있으면 oratab에서 확인한다.

```
cat /etc/oratab
```

## 해결

- 문제 데이터소스의 JDBC URL 서비스 이름을 `lsnrctl services` 출력과 대조한다. 정상 동작하는 다른 데이터소스 URL과 비교하면 차이가 바로 보인다.
- SID인데 슬래시 문법으로 썼다면 콜론 문법으로 바꾼다 (반대도 마찬가지).
- DB가 방금 시작됐다면 재시도하거나, DB에서 즉시 재등록을 강제한다.

```sql
ALTER SYSTEM REGISTER;
```

- 멀티테넌트면 대상 PDB가 열려 있는지 확인한다.

```sql
ALTER PLUGGABLE DATABASE ... OPEN;
```

### DB 서버 접근 권한이 없을 때

- **tnsping** (Oracle 클라이언트가 있으면): `tnsping <서비스이름>`
- **JDBC URL 직접 점검**: `application.yml` 등에서 문제 데이터소스 URL을 찾아 슬래시/콜론과 서비스 이름을 확인. ORA-12514는 거의 항상 슬래시 뒤 서비스 이름이 틀렸을 때 난다.
- **DBA에게 문의**: "리스너에 등록된 서비스 이름 목록"을 요청하는 게 가장 빠르다.
