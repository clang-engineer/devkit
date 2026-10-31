# OpenCode — 코딩 에이전트의 구성·실행 지도

> OpenCode는 모델을 선택하는 UI만이 아니라 **요청을 Agent가 해석하고 도구를 호출해 작업하는 환경**이다. CLI·TUI·설정의 역할을 구분하고, Provider 인증과 MCP 도구 연결을 혼동하지 않는다.

## 전체 작동 모델 — 요청에서 도구 실행까지

```text
사용자 요청 (TUI / CLI)
          │
          ▼
OpenCode Session
          │ Config → Provider / Model 선택 [1]
          ▼
Agent (Build / Plan / 사용자 정의) [2]
          │
          ├─ Model : 추론·다음 동작 선택
          ├─ Permission : 도구 실행 허용·확인·거부
          └─ Tool : 파일·Shell·MCP [3]
                       │
                  외부 작업 실행
                       │
                  결과 → Session에 반영

Config : 모델·Agent·Permission·MCP 연결 정의 [4]
```

**Provider는 모델 접근 경로, Model은 추론 엔진, Agent는 지침·도구·권한을 묶은 작업 역할**이다. MCP는 외부 도구를 추가하며 Provider 인증을 대신하지 않는다. 이 그림은 모든 요청이 반드시 도구를 호출한다는 뜻은 아니다.

## 1. 시작·모델 선택 — CLI·TUI·Provider

| 목적 | 진입점 | 역할 |
|---|---|---|
| 대화형 시작 | `opencode` | TUI에서 세션 진행 |
| 단일 요청 | `opencode run "요청"` | CLI로 요청 실행 |
| Provider 연결 | `opencode auth login` / TUI `/connect` | 모델 접근 인증 |
| 인증 확인 | `opencode auth list` | 연결 상태 조회 |
| 모델 선택 | TUI `/models` / CLI `--model` | 실행할 모델 지정 |

```sh
opencode auth login
opencode auth list
opencode run --model provider/model "코드 구조를 요약해줘"
```

**예시:** Provider 인증 후 `/models`에서 모델을 선택해도 Agent의 파일 수정 권한이 자동으로 바뀌지는 않는다. 모델 선택과 작업 권한은 별개다. 모델 ID·지원 범위는 설치 버전과 공급자에 따라 확인한다.

## 2. Agent — 역할·도구·권한

Primary Agent는 현재 세션의 주 작업을 맡고, Subagent는 특정 작업을 위임받아 수행한다. 대표적으로 Build는 구현, Plan은 분석·계획에 초점을 둔다. <https://opencode.ai/docs/agents/>

```text
Primary Agent (Build / Plan)
       │
       ├─ 지침·모델·권한 설정
       ├─ 내장 Tool 호출
       └─ Subagent에 특정 작업 위임
                     │
                 결과 반환
```

| 요소 | 의미 |
|---|---|
| Agent | 작업별 지침·모델·권한·도구 구성 |
| Permission | `allow` / `ask` / `deny`로 작업 제한 |
| Primary / Subagent | 주 세션 수행 / 하위 작업 위임 |
| Session | 요청과 도구 결과가 이어지는 작업 맥락 |

**예시:** 코드 수정 없이 구조만 조사하려면 Plan Agent를 선택한다. 파일 편집이 필요할 때는 허용된 Agent와 권한을 사용한다. 실제 도구 권한은 설치 버전·사용자 설정에 따라 확인한다.

## 3. Tool·MCP — 실행 범위 확장

```text
Agent
├─ Built-in Tool → 파일 읽기·수정·Shell 등
└─ MCP Client
   ├─ Local Server  → command로 실행
   └─ Remote Server → url로 연결
```

```json
{
  "mcp": {
    "local-server": {
      "type": "local",
      "command": ["my-mcp-server"],
      "enabled": true
    },
    "remote-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "enabled": true
    }
  }
}
```

```sh
opencode mcp list
opencode mcp auth <name>
```

MCP를 등록해도 모든 도구를 항상 호출하는 것은 아니다. Agent의 도구·권한 설정과 서버 연결 상태를 함께 확인한다. 외부 도구가 많아지면 세션 컨텍스트 사용량도 늘 수 있다.

## 4. Config·진단 — 무엇이 동작을 결정하는가?

```text
Provider / Model  → 모델 접근·선택
Agent / Permission → 실행 역할·허용 범위
MCP              → 외부 도구 등록
CLI / TUI        → 요청 입력·세션 조작
```

**진단 예시:** 모델이 목록에 없다면 Provider 연결과 모델 식별자를 확인하고, 모델은 작동하지만 파일을 수정하지 못한다면 Agent의 Permission을 확인한다. MCP 도구가 보이지 않으면 서버 등록·연결·권한을 순서대로 점검한다.

Config의 실제 키·경로·우선순위는 설치된 OpenCode 버전의 공식 문서에서 확인한다. [Agents](https://opencode.ai/docs/agents/) · [Providers](https://opencode.ai/docs/providers/) · [MCP](https://opencode.ai/docs/mcp-servers/) · [Config](https://opencode.ai/docs/config/)
