---
layout: notes
title: "SQL Injection 분류 체계 — Union은 Blind의 하위 유형인가"
date: 2026-06-07
categories: [security]
tags: [sql-injection, union-based, blind-sqli, classification, security]
---

Union-based SQL Injection은 Blind SQL Injection의 하위 유형이 아니라 대등한(병렬) 분류다. 두 축(결과 획득 방식 vs 주입 기법)을 구분하지 못하면 이 관계가 헷갈린다.

## 핵심 질문: Union SQLi를 Blind SQLi로 볼 수 있는가

답은 "아니오"다. 어떤 분류 체계에서도 Union-based를 Blind의 하위 유형으로 넣지 않는다.

분류의 핵심 기준은 **"결과가 응답에 직접 노출되는가"**다.

- **Union-based** — `UNION SELECT`로 추출한 데이터가 정상 응답(화면)에 그대로 실려 나온다 → 직접 노출됨
- **Blind** — 데이터가 응답에 직접 드러나지 않아, 참/거짓 추론으로 한 글자씩 알아낸다 → 직접 노출 안 됨

Union은 데이터가 바로 보이므로 In-band 쪽이고, Blind는 추론에 의존한다. 획득 방식 자체가 반대라서 둘은 형제 관계지 상하 관계가 아니다.

## 공격 유형(결과 획득 방식)에 의한 분류

"결과를 어떻게 받아오는가"가 기준. SQL Injection 종류를 단순히 "나열하라"고 하면 보통 이 축으로 답하는 게 무난하다.

- **In-band (Classic)** — 공격 채널과 결과 수신 채널이 동일
  - **Error-based** — DB 에러 메시지를 통해 데이터 추출
  - **Union-based** — `UNION SELECT`로 결과를 정상 응답에 실어 직접 추출
- **Blind (Inferential)** — 응답에 직접 노출 없이 추론
  - **Boolean-based** — 조건의 참/거짓에 따른 응답 차이로 추론
  - **Time-based** — 응답 지연 시간으로 추론
- **Out-of-band (OOB)** — DNS/HTTP 등 별도 채널로 데이터 유출

체계 차이: OOB를 Blind 하위로 두는 곳도, 독립 카테고리로 두는 곳도 있다. 크게 In-band vs Blind(=Inferential) 2분류로만 나누기도 한다. 출처마다 묶는 위치가 갈리지만, Union을 Blind 밑에 넣는 경우는 없다.

## 또 다른 축: 공격 방식(주입 위치·기법)

"어디에/어떻게 구문을 끼워넣는가"가 기준. 위의 결과 획득 방식과는 **직교(orthogonal)**하는 별개 축이다.

- Form(폼 입력값) 기반
- URL/파라미터 기반
- Cookie 기반
- HTTP Header 기반
- Second-order(저장형) 등

**Form SQLi는 주입 지점 축, Union/Blind는 결과 획득 방식 축**이다. 축이 다르기 때문에 "Form, Union을 Blind의 유형으로 묶을 수 있나"라는 질문은 애초에 성립하지 않는다. 실제 공격은 두 축이 조합된다 — 예: "폼 입력값을 통한 Union-based SQLi", "URL 파라미터를 통한 Time-based Blind SQLi".

## 주의: 교재마다 Union의 위치가 다르다

일부 교재는 **Form·Union을 공격 방식 예시**로, **Error-based·Blind를 공격 유형 예시**로 나눠 놓는다. 이 체계에서는 Union이 "주입 기법" 축에 들어간다. 반면 일반 보안 문헌은 Union을 결과 확인 방식(In-band) 축에 넣는 경우가 많다. 답안을 쓸 때는 보고 있는 자료의 분류를 따르는 게 안전하다.

## 시험 답안 팁: 축을 섞지 말 것

`Error, Form, Union, Blind`처럼 나열하면 두 축이 한 줄에 섞여 감점 요소가 될 수 있다(Error·Blind는 획득 방식, Form·Union은 주입 기법). 안전하게 가려면:

1. **한 축으로 통일** — Error-based, Union-based, Boolean-based Blind, Time-based Blind (모두 결과 획득 방식)
2. **축을 명시해 구분** — "공격 방식: Form, Union / 공격 유형: Error-based, Blind"
