# OpenCode — 명령 체계 치트시트

> 코딩 에이전트의 **실행 방식·모델 공급자·외부 도구**를 구분한다. 상세한 모델 지원과 인증 정책은 버전·계정에 따라 달라지므로 공식 문서에서 확인한다.

## 세 가지 제어 층

```text
Shell CLI                      OpenCode TUI                 Config
opencode                       /connect                     provider / model
opencode run "요청"             /models                      mcp
opencode auth login            대화·작업                     프로젝트 / 사용자 설정
opencode mcp list
       │                            │                            │
       └──────── 실행·관리 ─────────┴──────── 선택·지속 설정 ────┘
```

**셸의 `opencode auth login`과 TUI의 `/connect`는 입력하는 위치가 다르다.** `opencode`는 대화형 화면을 열고, `opencode run`은 단일 요청을 실행한다.

## Provider와 Model은 다르다

```text
Provider ── 인증·접근 권한 ──> Model ── 추론
   │                            │
   └─ auth login / /connect     └─ /models 또는 --model
```

`provider/model`은 모델 식별 방식이다. **Provider에 인증했다고 모든 모델이 사용 가능한 것은 아니다.** 실제 목록·요금·조직 정책은 공급자 설정에 따른다.

```sh
opencode auth login                    # Provider 인증
opencode auth list                     # 인증 상태 확인
opencode run --model provider/model "요청"
```

TUI에서는 `/connect`로 Provider를 연결하고 `/models`로 모델을 선택한다. 기본 모델은 OpenCode 설정의 `model` 필드로 지정할 수 있다.

## MCP — 모델과 외부 도구의 연결

```text
OpenCode
   └─ MCP Client
       ├─ Local Server  → 로컬 프로세스 실행
       └─ Remote Server → URL로 연결
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
opencode mcp list           # 등록 서버 확인
opencode mcp auth <name>    # 인증 지원 서버의 인증
```

`command`는 인자 배열, `url`은 원격 서버 주소다. MCP 연결은 **모델 선택이나 Provider 인증을 대신하지 않는다.**

## 기억할 경계

- **CLI / TUI / Config**는 명령을 입력하는 위치와 적용 범위가 다르다.
- 인증 정보 파일을 직접 삭제해 초기화하기보다 공식 인증 관리 명령을 사용한다.
- 모델 ID·권한·사용량·설정 경로는 현재 버전에서 확인한다.

공식 문서: [Providers](https://opencode.ai/docs/providers/) · [Models](https://opencode.ai/docs/models/) · [MCP](https://opencode.ai/docs/mcp-servers/)
