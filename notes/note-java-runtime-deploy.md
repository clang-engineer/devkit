---
layout: notes
title: "Java 런타임 배포: 클래스 버전과 OS 이식성"
date: 2026-05-20
categories: [java]
tags: [jvm, deployment, classfile, linux, portability]
---

Java 바이트코드는 OS 중립이지만, 컴파일한 JDK 버전과 실행 JRE 버전은 반드시 맞아야 하고 코드 밖의 환경(경로·인코딩·권한)은 여전히 OS에 종속된다.

## UnsupportedClassVersionError의 원인

```
java.lang.UnsupportedClassVersionError: ... has been compiled by a more recent
version of the Java Runtime (class file version 61.0), this version of the Java
Runtime only recognizes class file versions up to 55.0
```

`.class` 파일 헤더에는 컴파일러가 찍어둔 **major version**이 들어 있고, JRE는 자기가 아는 버전까지만 로드한다. 즉 `61.0`으로 컴파일된 클래스를 `55.0`까지만 아는 런타임에 올리면 로드 자체를 거부한다. 원리상 **컴파일 JDK > 실행 JRE**일 때만 터지고, 그 반대(하위 버전으로 컴파일 → 상위 런타임 실행)는 문제없다.

버전 매핑:

- 52 → Java 8
- 55 → Java 11
- 59 → Java 15
- 61 → Java 17
- 65 → Java 21

위 오류는 **Java 17로 빌드한 것을 Java 11 런타임으로 실행**해서 발생한 것이다.

해결은 두 방향 중 하나다.

- 실행 환경을 올린다: 서버에 JDK 17 설치 후 `update-alternatives --config java`로 기본 버전을 바꾸거나, `JAVA_HOME`을 17로 직접 지정.
- 빌드 타깃을 낮춘다: 서버를 올릴 수 없으면 `pom.xml`/`build.gradle`의 target을 11로 낮춰 재빌드. 결국 핵심은 **빌드 환경과 배포 환경의 JDK 버전을 일치**시키는 것이다.

## Java 프로세스 배포: Windows vs Linux

Java는 JVM 위에서 돌기 때문에 **코드 레벨에서는 OS 중립**이다. 같은 `.jar`를 Windows JVM과 Linux JVM 어디에 올려도 바이트코드는 동일하게 해석된다. 그래서 "이식성"이라는 말이 생기지만, 실제로 발목을 잡는 건 코드 밖의 환경 의존 요소다.

JVM이 흡수해주지 못하고 **OS에 종속되는 지점**:

- 경로 구분자(`\` vs `/`), 줄바꿈(CRLF vs LF), 파일 인코딩 기본값
- 파일 권한 모델 (Linux의 POSIX 권한, umask)
- 외부 명령 호출(`Runtime.exec`)이나 절대 경로 하드코딩
- 폰트·로케일 의존 기능 (서버에서 PDF/이미지 생성 시)

서버 사이드 워크로드가 Linux를 기본으로 삼는 이유도 여기에 있다.

- **프로세스 관리**: `systemd`로 서비스 등록·자동 재시작·`journald` 로그 연동이 깔끔하다. Windows에서는 Java를 서비스로 올리려면 WinSW, NSSM, Apache Procrun 같은 별도 래퍼가 필요하다.
- **컨테이너·리소스**: Docker/K8s 생태계가 사실상 Linux 기반이고, 공식 JDK 이미지(Temurin, Corretto 등)도 Linux를 1차 타깃으로 빌드·테스트한다. JVM의 cgroup 인식, 컨테이너 메모리 한계 감지(`-XX:+UseContainerSupport`)도 Linux에서 가장 잘 동작한다.
- **비용·자동화**: Windows Server는 라이선스 비용이 붙고, Ansible·셸·cron 등 운영 도구가 Linux를 우선 지원한다.

Windows를 고려할 실질적 이유는 환경 종속성이 있을 때다 — AD/Kerberos 통합 인증, Windows 전용 네이티브 라이브러리(DLL)·COM 의존, 운영 인력이 Windows만 다룰 때, Windows만 지원하는 레거시 패키지.

배포에서 가장 중요한 원칙은 **개발 OS와 운영 OS를 통일**하는 것이다. 개발은 Windows, 운영은 Linux처럼 갈리면 인코딩·경로 문제가 배포 시점에 터진다. 컨테이너로 환경을 고정하면 이 문제를 상당 부분 제거할 수 있다.
