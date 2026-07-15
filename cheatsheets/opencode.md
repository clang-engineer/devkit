# opencode Cheatsheet

> [opencode](https://opencode.ai) — 터미널용 오픈소스 AI 코딩 에이전트(sst/Anomaly). provider-agnostic(75+ provider)라 모델을 골라 붙인다. `curl -fsSL https://opencode.ai/install | bash` 후 `opencode` 실행.

## 30초만 본다면

| 상황 | 명령 |
|------|------|
| 시작 (TUI) | `opencode` |
| provider 인증 추가 | TUI에서 `/connect` (또는 `opencode auth login`) |
| 모델 바꾸기 | TUI에서 `/models` |
| 한 번만 다른 모델로 실행 | `opencode run --model <provider>/<model> "..."` |
| 인증된 provider 확인 | `opencode auth list` |
| 인증 해제 | `opencode auth logout` |

## 인증 (provider 연결)

opencode의 모델 목록 = **인증/등록한 provider들이 주는 모델의 합집합**. 통로를 열수록 선택지가 는다.

| 명령 | 설명 |
|------|------|
| `/connect` | TUI 안에서 provider 검색·인증 (가장 쉬움) |
| `opencode auth login` | CLI로 provider 골라 인증 |
| `opencode auth list` | 현재 인증된 provider 목록 |
| `opencode auth logout` | provider 선택해 인증 해제 (다른 인증은 유지) |

인증 방식 2종:
- **OAuth device flow** (GitHub Copilot·Anthropic 등): 안내 페이지(`github.com/login/device` 등)에서 **코드 입력**.
- **API 키** (OpenAI·DeepSeek 등): 발급 키를 붙여넣기.

저장 위치: `~/.local/share/opencode/auth.json` (전체 초기화하려면 이 파일 삭제)

## 모델 선택

| 방법 | 명령 |
|------|------|
| TUI 피커 | `/models` → provider 아래 모델 선택 |
| 기본 모델 고정 | config에 `"defaultModel": "<provider>/<model>"` |
| 단발 실행 | `opencode run --model <provider>/<model> "프롬프트"` |

모델 id는 `provider/model` 형식 (예: `github-copilot/gpt-5.3-codex`).

config 위치: `.opencode/opencode.json`(프로젝트) 또는 글로벌 config.
```json
{ "defaultModel": "github-copilot/gpt-5.3-codex" }
```

## GitHub Copilot으로 붙이기

Copilot 유료 구독(Pro/Pro+/Business/Enterprise)으로 opencode 인증 가능 — **GitHub 공식 지원**(2026-01), 추가 AI 라이선스 불필요.

1. `/connect` → GitHub Copilot 선택 → 코드 입력(device flow)
2. `/models`에 Copilot 카탈로그 모델이 뜸

주의:
- 모델 목록은 **Copilot entitlement**를 따름 → 조직에서 안 켠 모델(예: Gemini)은 안 뜬다. admin이 Copilot 정책에서 켜야 함.
- 조직 정책 바꾼 뒤 반영하려면 **재인증**: `opencode auth logout`(Copilot) → `/connect` 다시.
- base 모델(Business에선 GPT-5.3-Codex)은 프리미엄 요청 안 씀. premium 모델(Opus·Gemini 등)은 배수만큼 소모.
  → 과금·라우팅 개념은 vault note `note-opencode-copilot-모델-라우팅` 참고.

## 참고 링크
- [opencode Providers 문서](https://opencode.ai/docs/providers/)
- [opencode Models 문서](https://opencode.ai/docs/models/)
