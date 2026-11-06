# OMP — 세션·모델·플랜·도구 핵심 명령

> OMP는 작업 디렉터리의 맥락에서 모델이 도구를 호출하고 결과를 세션에 쌓는 코딩 에이전트다. 설치·인증·모델 선택을 마쳤다면 추가 설정 없이 시작한다. 명령·기본값은 OMP 18.16.0 기준으로 확인했다.

## 작동 모델

```text
입력: 작업 디렉터리 + 요청
  │  프로젝트 지침·설정 발견 / Provider 인증·모델 역할 해석
  ▼
세션 (요청·도구 결과가 이어지는 맥락)
  │  일반 모드: 바로 작업 / 플랜 모드: 읽기·조사 → 계획 검토·승인 → 구현
  ▼
모델이 도구 선택 → 승인 정책 → 내장 도구·확장 도구 → 결과가 세션으로 돌아옴
                              │ 파일·셸·LSP·브라우저·하위 에이전트 등
세션 저장 → 이어하기 / 재개 / 분기
```

화살표는 **요청 → 모델의 도구 호출 → 결과의 세션 반영** 흐름이다. 계획 검토는 그 실행 앞에 넣는 선택 단계이고, 승인 정책은 개별 도구 호출에 적용된다.

## 핵심 개념 — 무엇을 바꾸는가

| 개념 | 조작 대상 | 혼동하지 말 것 |
|---|---|---|
| Provider 인증 / 모델 역할 | 모델 접근 자격 / 작업별 모델 선택 | 로그인은 모델 선택이 아니며 `--plan <모델>`은 플랜 모드를 켜지 않는다. |
| 세션 / 플랜 모드 | 대화·도구 결과의 맥락 / 구현 전 계획 검토 | 플랜 모드가 꺼져도 세션은 저장된다. |
| 도구 / 승인 정책 | 파일·프로세스·외부 서비스에 대한 작업 / 호출 허용 여부 | 승인 정책은 OS 격리가 아니며 플랜 모드와 독립이다. |
| 프로젝트 지침 / 설정 | 에이전트에게 주는 작업 규칙 / 모델·도구 동작 값 | `AGENTS.md`는 지침, `.omp/config.yml`은 설정이다. |

## 핵심 명령 — 시작·모델·세션

CLI 문법은 `omp [하위 명령] [옵션] [메시지...]`이다. 하위 명령을 생략하면 대화 세션을 시작한다.

```sh
omp                              # 현재 디렉터리에서 대화 시작
omp login                        # Provider 인증
omp models find minimax          # 사용 가능한 모델 검색
omp --model 'provider/model-id' '이 함수 설명해줘'  # 모델 ID를 실제 값으로 교체
omp -p '이 함수 설명해줘'        # 비대화형 단일 요청·출력
omp --continue                   # 직전 세션 이어가기
omp --resume                     # 저장 세션 선택
```

첫 요청에 파일을 붙이려면 `omp @파일 '이 코드 설명해줘'`를 쓴다. TUI 안에서는 `/model` 또는 `Alt+M`으로 모델을 고른다. `/model` 같은 슬래시 명령은 셸의 `omp models`와 다르다. 현재 키맵은 `/hotkeys`로 확인한다.

## 플랜 모드와 도구 승인

| 대상 | 조작 | 의미 |
|---|---|---|
| 대화형 플랜 모드 | `Alt+Shift+P` | 현재 세션에서 플랜 모드 전환; 계획은 검토·승인 후 실행 |
| 매번 플랜으로 시작 | `omp config set plan.defaultOnStartup true` | 새 대화형 세션에 적용; 기본값 `false` |
| 계획용 모델 | `omp --plan <모델>` | `plan` 역할 모델만 지정; 플랜 모드를 켜지 않음 |
| 자동 계획·실행 | `omp --plan-yolo "요청"` | 읽기 전용 계획을 자동 승인해 실행 단계로 전환; 사람의 계획 검토 없음 |
| 도구 승인(일회성) | `omp --approval-mode write` | 읽기·파일 수정 자동 허용, 실행 도구는 확인 |
| 도구 승인(지속) | `omp config set tools.approvalMode always-ask` | 읽기 자동 허용, 수정·실행은 확인 |

승인 정책의 기본값은 `yolo`(읽기·수정·실행을 일반적으로 자동 허용)다. `write`도 **파일 수정은 묻지 않으므로**, 수정까지 검토하려면 `always-ask`를 사용한다. 세션 전용 `--approval-mode`는 저장된 정책을 바꾸지 않는다. 플랜 모드는 승인 정책을 대체하지 않는다. `--plan-yolo`는 검토 없이 계획에서 구현까지 진행하므로 결과를 직접 검토할 수 있는 작업에만 사용한다. 대화형 계획 검토 UI가 없는 `-p` 실행에서는 `plan.defaultOnStartup`이 적용되지 않는다.

## 도구·위임·확장 — 작업 대상별 기능

| 해결할 문제 | 주 대상·경로 | 진입점 |
|---|---|---|
| 구현 위치 탐색 | 파일 내용·경로 | 에이전트의 `read`·`grep`·`glob`·`find` (행동을 설명해 위치를 찾는 경우 `find`) |
| 코드의 의미 분석 | 정의·참조·진단 | `lsp`; 동작 재현·중단점 조사는 `debug` |
| 실제 변경·검증 | 파일·프로세스·웹 UI | `edit`·`write`·`bash`·`browser` (실행 전 도구 승인 정책 적용) |
| 큰 작업 분담 | 독립된 하위 작업·결과 | `task`로 하위 에이전트 실행; `Alt+A`로 Agent Hub 열기 |
| 작업 절차·규칙 추가 | 재사용 지침·조건부 규칙 | 프로젝트 `AGENTS.md` / `.omp/skills/` / `.omp/rules/` |
| 외부 기능 연결 | Plugin·MCP 서버 | `omp plugin list` / 프로젝트 `.omp/mcp.json` |
| 편집기·클라이언트 연동 | 세션 제어 프로토콜 | `omp acp` 또는 `omp --mode rpc` |

표의 도구 이름은 **세션 안에서 모델이 호출하는 기능**이다. 이름이 같은 셸 하위 명령(예: `omp read`)이 있더라도 실행 맥락과 용도가 다르다. 확장은 기본 도구로 부족할 때 추가한다. 지침 파일은 작업 맥락을 주고, Skill은 필요할 때 절차를 불러오며, Plugin·MCP는 기능이나 외부 서비스를 연결한다. 승인 정책은 도구 호출에 적용되지만 별도의 샌드박스를 만들지는 않는다.

예를 들어 “이 함수의 호출자를 찾아 오류를 고쳐줘”라는 요청에서는 참조 탐색(`lsp`) → 파일 수정(`edit`) → 실행 검증(`bash`) 결과가 같은 세션에 쌓인다. 이때 플랜 모드를 켜면 수정 전에 계획 검토 단계를 거친다.

## 세션과 설정의 범위

| 목적 | 명령 / 파일 | 범위 |
|---|---|---|
| 설정 조회 | `omp config list` / `omp config get <키>` | 기본값과 적용된 설정 확인 |
| 전역 설정 원복 | `omp config reset <키>` | 전역값 제거 후 다른 계층·기본값 적용 |
| 개인 설정 | `~/.omp/agent/config.yml` | 사용자 기본값 (`omp config path`로 실제 경로 확인) |
| 저장소 설정 | `.omp/config.yml` | 해당 작업 디렉터리에서 전역 설정 위에 적용 |
| 프로젝트 지침 | `AGENTS.md` 또는 `.omp/AGENTS.md` | 세션 시작 시 자동 발견·주입 |
| 프로필 격리 | `omp --profile <이름>` | 인증·설정·세션을 별도 프로필로 분리 |

설정 우선순위는 **기본값 < 전역 < 프로젝트 < `--config` 오버레이 < 설정별 환경 변수 < 실행 중 재정의**다. `omp config set`은 원칙적으로 **전역** 설정을 쓴다. 프로젝트에만 필요한 값은 해당 저장소의 `.omp/config.yml`에 둔다. 프로젝트 설정은 실행한 작업 디렉터리의 `.omp/`를 기준으로 읽으므로 하위 디렉터리에서 실행할 때는 위치를 확인한다. 인증 정보를 저장소 설정에 넣지 않는다. 이미 있는 `AGENTS.md`를 OMP용으로 중복 작성할 필요는 없다.

## 문제 진단

| 문제·목적 | 첫 확인 / 진입점 |
|---|---|
| 모델이 보이지 않음 | `omp models`로 목록을 보고 Provider 인증 상태 확인 |
| 도구 실행이 막힘 | 승인 정책과 도구별 허용·거부 설정 확인 |
| 설정이 예상과 다름 | `omp config list --scope global`, `omp config list --scope project`로 계층 확인 |
| 외부 기능이 보이지 않음 | `omp plugin list` 또는 프로젝트 `.omp/mcp.json` 등록·연결 상태 확인 |

전체 옵션과 버전별 동작: [OMP 공식 저장소](https://github.com/can1357/oh-my-pi) · [CLI](https://github.com/can1357/oh-my-pi/blob/main/docs/cli-reference.md) · [키맵](https://github.com/can1357/oh-my-pi/blob/main/docs/keybindings.md) · [설정](https://github.com/can1357/oh-my-pi/blob/main/docs/settings.md) · [도구 승인](https://github.com/can1357/oh-my-pi/blob/main/docs/approval-mode.md) · [하위 에이전트](https://github.com/can1357/oh-my-pi/blob/main/docs/tools/task.md) · [MCP](https://github.com/can1357/oh-my-pi/blob/main/docs/mcp-config.md). 선택·비교의 배경: [OMP와 Pi의 차이](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/ai/2026-11-04-omp-vs-pi-coding-agent.md).
