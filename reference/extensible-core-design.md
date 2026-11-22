# 확장 가능한 코어 설계: Extension Point와 디자인 패턴

> 새로운 기능을 추가할 때 Core를 매번 수정하지 않으려면 무엇을 고정하고 무엇을 열어 두어야 하는지 설명하는 설계 지도. [확장 생태계 탐색 지도](tool-ecosystem.md)와 연결된다.

## 1. 핵심은 변하는 부분의 경계

```text
Application
  ├─ Core: 상태·정책·실행 흐름·생명주기
  ├─ Extension Contract: Interface / Hook / Event / Protocol
  └─ Extensions: Plugin / Adapter / External Tool
```

코어는 **공통 정책과 안정적인 계약**을 책임지고, 변화 가능성이 높은 기능은 계약 뒤로 분리한다. 플러그인을 위해 모든 것을 추상화하면 오히려 복잡성이 커진다. 실제로 교체·추가할 필요가 있는 지점부터 열어 둔다.

## 2. 확장 방식과 아키텍처

| 확장 목표 | 아키텍처·패턴 | 설계 질문 |
|---|---|---|
| 호스트에 새 기능 추가 | Microkernel / Plug-in Architecture | 확장을 등록·로드·호출할 계약은 무엇인가? |
| 외부 구현을 교체 | Ports and Adapters | 코어가 의존할 Port는 무엇인가? |
| 독립 프로그램 조합 | Pipes and Filters | 입출력 형식과 오류 전달 규약은 무엇인가? |
| 알고리즘 교체 | Strategy | 어떤 동작을 인터페이스로 추출할 것인가? |
| 이벤트 반응 확장 | Observer / Event Bus | 이벤트 순서·오류·구독 해제를 어떻게 처리할까? |
| 구현체 생성·연결 | Factory / Dependency Injection | 누가 인스턴스와 생명주기를 소유할까? |
| 기존 동작에 기능 덧붙이기 | Decorator | 실행 전후에 어떤 책임을 추가할까? |

이들은 배타적인 대안이 아니다. Microkernel 구조 안에서도 Strategy·Observer·Factory를 사용할 수 있다. GoF Adapter는 객체 인터페이스 변환 패턴이고 Ports and Adapters는 아키텍처 경계에 관한 개념이다.

## 3. 코어의 최소 책임과 확장 계약

```text
Startup
  → Discover (선택)
  → Validate Contract / Version
  → Register
  → Initialize
  → Run / Dispatch
  → Shutdown / Cleanup
```

플러그인 매니저가 반드시 필요한 것은 아니다. 정적 등록만으로 충분한 작은 시스템도 있다. 코어 설계에서는 다음을 먼저 결정한다.

- **계약:** 입력·출력·오류·버전·권한·상태 소유권
- **등록:** 정적 구성, Registry, 동적 발견 중 선택
- **실행:** 동기/비동기, 같은 프로세스/별도 프로세스, 격리 수준
- **생명주기:** 초기화 순서, 실패 처리, 해제·재시작
- **호환성:** API 변경, 버전 범위, 폐기 정책

## 4. 예시: SQL TUI의 DB 확장

```text
SQL TUI Core
  │
  └─ Database Port
       ├─ PostgreSQL Adapter
       ├─ SQLite Adapter
       └─ New DB Adapter
```

코어는 `connect / execute / close` 같은 계약을 호출하고 DB별 드라이버·연결 설정·결과 변환은 Adapter가 담당한다. DB를 추가할 때는 새 구현을 등록하면 된다. 단, DB별 기능 차이가 커지면 capability 협상이나 선택적 인터페이스가 필요할 수 있다.

## 5. 확장성을 평가하는 기준

- 새 확장 추가 시 코어 수정이 필요한가?
- 외부 개발자가 공개 계약만으로 구현할 수 있는가?
- 잘못된 확장이 코어를 중단시키지 않도록 실패를 격리할 수 있는가?
- API 버전·권한·성능·테스트 경계가 명확한가?
- 플러그인 없이도 코어의 주요 기능이 성립하는가?

**원칙:** 확장 가능성은 추상화 개수보다 **안정적인 계약과 책임 분리**에서 나온다.

## 관련 문서

- [개발자 도구 확장 생태계 탐색 지도](tool-ecosystem.md)
- [도구별 플러그인 생태계 사례](tool-plugin-ecosystems.md)
