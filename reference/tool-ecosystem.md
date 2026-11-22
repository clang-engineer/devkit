# 개발자 도구의 확장 생태계 탐색 지도

> 도구를 처음 발견했을 때 **본체 기능뿐 아니라 주변에 어떤 확장·설정·공유 생태계가 있는지** 살펴보기 위한 개념 지도. 특정 프로젝트의 인기 순위나 설치 목록이 아니다.

## 1. Core에서 생태계로

```text
                      새 CLI / TUI 도구
                            │
                    Core: 무엇을 해결하나?
                            │
             외부에서 바꿀 수 있는 경계가 있나?
               ┌────────────┼────────────┐
               ▼            ▼            ▼
         Plugin / API   설정 / Script   외부 명령 / Protocol
               └────────────┼────────────┘
                            ▼
                  주변 프로젝트와 커뮤니티
          ┌──────────┬──────────┬──────────┐
          ▼          ▼          ▼          ▼
       Extension  Configuration Appearance Discovery
          └────────────── Integration ──────────────┘
```

이 그림은 **관계 지도**이며 필수 발전 단계나 실행 순서가 아니다. 작은 Core라도 안정적인 API·스크립트·프로토콜이 있으면 확장될 수 있다. 반대로 확장 기능이 있다고 해서 반드시 큰 커뮤니티가 형성되는 것은 아니다.

## 확장 구조를 이해하는 세 가지 패턴

| 아키텍처 패턴 | 핵심 | 대표적인 이해 사례 |
|---|---|---|
| **Microkernel / Plug-in Architecture** | Core의 확장 API에 플러그인 연결 | Neovim·Yazi 플러그인 |
| **Ports and Adapters** | Core와 외부 시스템을 Port·Adapter로 분리 | Harlequin DB Adapter |
| **Pipes and Filters** | 독립 도구의 입출력을 조합 | `rg | fzf` |

```text
Core Tool
  ├─ 호스트 확장 경계 → Plugin API / Hook → Plugin
  └─ 외부 연결 경계   → Port / CLI / Protocol → Adapter / Tool
```

Microkernel은 **플러그인 호스트**, Ports and Adapters는 **외부 의존성 분리**, Pipes and Filters는 **독립 처리 단계의 조합**에 초점을 둔다. 상호 배타적이지 않고 플러그인이 반드시 호스트와 같은 프로세스에서 실행되는 것도 아니다.

하위 설계 패턴으로 Strategy(동작 교체), Observer(이벤트 구독), Adapter(인터페이스 변환), Dependency Injection(구현 주입)을 연결할 수 있다. GoF Adapter와 Ports and Adapters는 설계 범위가 다르다.

## 2. 탐색할 다섯 영역

| 영역 | 무엇을 발견하나? | 대표 단서 |
|---|---|---|
| **Extension** | Plugin, Plugin Manager, Extension API, Adapter, Channel | `plugins`, `plugin manager`, `extensions` |
| **Configuration** | Oh My, Framework, Distribution, Starter Kit, Dotfiles | `framework`, `distro`, `starter` |
| **Appearance** | Theme, Flavor, Skin, Prompt, Icon | `themes`, `flavors` |
| **Discovery** | Awesome List, Registry, Marketplace, Rankings | `awesome-<tool>`, `registry` |
| **Integration** | 다른 도구와의 연결, Bridge, Protocol, Editor/Shell 연동 | `integration`, `protocol` |

- **Plugin과 Plugin Manager는 함께 탐색**하지만 역할은 다르다. 하나는 기능을 추가하고 다른 하나는 설치·업데이트·로드를 관리한다.
- **Oh My는 표준 기술 분류가 아니라 이름 관습**이다. 프로젝트의 실제 역할이 프레임워크인지 사전 구성 배포판인지 확인한다.
- **Awesome List는 보통 큐레이션 목록**이다. Plugin Registry나 설치 관리자와 혼동하지 않는다.
- 모든 영역이 모든 도구에 존재할 필요는 없다. 해당 도구에 중요한 영역만 소개한다.

## 3. 반복되는 생태계 명명 관습

**역할**은 실제 기능이고 **명명 관습**은 발견을 돕는 검색 단서다. 이름만으로 기술적 역할이나 공식성을 확정하지 않는다.

| 탐색 패턴 | 주로 찾는 것 | 확인할 점 |
|---|---|---|
| `awesome-<tool>` | 큐레이션 목록 | 설치 관리자가 아닌지 |
| `oh-my-<tool>` | 설정·확장 묶음 | Framework인지 설정 모음인지 |
| `<tool>-plugins`, `extensions` | 독립 확장 | 공식 확장 API와 호환성 |
| `plugin-manager` | 설치·업데이트 관리 | 실제 관리 범위; 이름에 manager가 없을 수도 있음 |
| `kickstart`, `starter`, `template` | 시작용 구성 | 완성형 배포판과 차이 |
| `distro`, `distribution` | 통합 배포판 | 구성과 업데이트 방식 |
| `theme`, `flavor`, `skin` | 외형 | 도구별 용어 |
| `dotfiles`, `config` | 설정 공유 | 개인 설정인지 공식 예제인지 |
| `contrib`, `extra`, `community` | 추가·커뮤니티 구성 | 범용 이름이므로 공식성 추정 금지 |

`awesome-*`·`oh-my-*`는 상대적으로 식별력이 높은 이름 관습이고, `community`·`extra`는 넓게 쓰이는 일반 단어다.

```text
tmux    → TPM(Manager) / Oh My Tmux(Configuration)
Neovim  → lazy.nvim(Manager) / kickstart.nvim(Starter) / LazyVim(Distribution)
Yazi    → ya pkg(Manager) / Flavor(Appearance) / awesome-yazi(Discovery)
```

새 도구는 **공식 문서 → 확장 API → 독립 프로젝트 → Awesome/Manager/Starter → Theme/Integration** 순서로 살펴본다. 검색 결과는 저장소 설명과 유지보수 상태로 검증하며, 존재하지 않는 유형을 억지로 채우지 않는다.

## 4. 확장 생태계가 형성되는 방식

```text
기본 도구
  ├─ 내장 기능만 제공               → 작은 전문 유틸리티
  ├─ 설정·스크립트·외부 명령 허용    → 사용자별 워크플로 확장
  └─ 안정적인 확장 인터페이스 제공   → 독립 확장 프로젝트
                                         │
                                관리·배포·큐레이션 수요
                                         │
                            Manager / Registry / Awesome
```

외부 개발자가 **본체를 수정하지 않고 새로운 동작을 배포**할 수 있는지가 중요한 관찰 지점이다. 다만 관리 도구·커뮤니티 목록은 기술적 필수 구성 요소가 아니라 수요에 따라 등장한다.

## 5. 확장 방식별 실제 사례

| 도구 | 외부 확장 단위 | 생태계 관찰 포인트 |
|---|---|---|
| [Yazi](https://yazi-rs.github.io/) | Lua Plugin, Flavor | [`ya pkg`](https://yazi-rs.github.io/docs/cli/), [awesome-yazi](https://github.com/AnirudhG07/awesome-yazi) 등 확장 발견·관리 |
| [OpenCode](https://opencode.ai/docs/plugins/) | Plugin, Agent, Skill 등 | 본체 밖의 에이전트 구성·플러그인 프로젝트 |
| [Pi](https://github.com/badlogic/pi-mono) | TypeScript Extension | 작고 조합 가능한 코어에 확장 기능 추가 |
| [Harlequin](https://harlequin.sh/) | Python Database Adapter | 독립 패키지로 데이터베이스 지원 확장 |
| [Television](https://github.com/alexpasmantier/television) | Channel, Action | 검색 소스와 동작을 외부 설정·커뮤니티 공유로 확장 |
| [Atuin](https://atuin.sh/) | 셸 연동·워크플로·외부 인터페이스 | 독립 플러그인 생태계보다 제품 기능과 연동 범위의 확대 |

**주의:** 위 사례들은 같은 성숙도를 뜻하지 않는다. Yazi의 플러그인, Harlequin의 어댑터, Television의 채널은 확장 단위가 다르다. Atuin은 확장 가능한 제품으로 발전하는 사례이지, 동일한 수준의 플러그인 생태계가 확인된 사례로 분류하지 않는다.

## 6. 새 도구를 살펴볼 때

1. **Core:** 무엇을 해결하며 기본 기능의 경계는 어디인가?
2. **Extension:** API·플러그인·어댑터·스크립트 등 외부 확장 지점이 있는가?
3. **주변 생태계:** 대표적인 관리자·프레임워크·테마·Awesome·연동 프로젝트가 있는가?
4. **실제 활용:** 기본 기능으로 충분한가, 확장이 해결하는 문제가 분명한가?
5. **문서 연결:** 공식 문서와 대표 프로젝트만 남기고 설치 세부 사항은 해당 자료에 맡긴다.

탐색은 **완전한 체크리스트 채우기**가 목적이 아니다. 도구를 사용한 뒤에야 주변 생태계를 뒤늦게 발견하는 일을 줄이고, 확장할 수 있는 방향을 초기에 이해하기 위한 습관이다.

## 관련 문서

- [확장 가능한 코어 설계](extensible-core-design.md) — Extension Point·생명주기·설계 패턴
- [도구별 플러그인 생태계 사례](tool-plugin-ecosystems.md) — Neovim·tmux·Yazi 등 비교

- [도구 관계 지도](tool-map.md) — 서로 대체·보완하는 도구의 역할
- [치트시트 작성 원칙](CHEATSHEET_GUIDELINES.md) — 한 도구의 기능과 확장 생태계를 압축해 설명하는 방법
- [Yazi 치트시트](cheatsheets/yazi.md) · [Zsh 치트시트](cheatsheets/zsh.md) — 개별 도구 사례
