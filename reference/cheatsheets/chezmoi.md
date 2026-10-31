# chezmoi — Dotfiles 상태·변환·배포 지도

> chezmoi는 여러 컴퓨터의 설정 파일을 **관리 원본(Source)에서 원하는 결과(Target)로 해석하고 실제 홈(Destination)에 적용**한다. 단순 복사 도구가 아니라 상태 변환·검증·재현 도구다.

## 전체 작동 모델 — Source → Target → Destination

```text
                 Git Repository (버전·공유)
                         │ init / update
                         ▼
Destination (~) ── add / re-add ──> Source State [1]
    실제 파일                         │
       ▲                       이름 규칙·Template·Data [2]
       │                              │
       │                              ▼
       │                         Target State
       │                         (원하는 파일 상태)
       │                              │
       │                     diff / status / verify
       │                              │
       └──────────── apply ───────────┘ [3]

별도 실행: run_ / run_once_ / run_onchange_ → 적용 과정의 Script [3]
경계: Git = Source 버전 관리 / Secret = 암호화·접근 권한 [4]
```

**Source는 관리 원본, Target은 해석·렌더링된 원하는 상태, Destination은 현재 실제 파일**이다. `apply`는 Target을 Destination에 반영하며 `add`·`re-add`는 반대 방향으로 실제 파일의 내용을 Source에 가져온다. 자동 양방향 동기화는 아니다. 아래 절 번호는 모델의 확대 설명이다.

## 1. Source 관리 — 등록·편집·재현

| 목적 | 명령 | 상태 변화 |
|---|---|---|
| 관리 시작 | `chezmoi init` | Source 디렉터리 초기화 |
| 기존 파일 등록 | `chezmoi add ~/.zshrc` | Destination → Source |
| Source 편집 | `chezmoi edit ~/.zshrc` | Source 변경 |
| 실제 파일 재수집 | `chezmoi re-add ~/.zshrc` | Destination → Source 갱신 |
| Source 경로 확인 | `chezmoi source-path ~/.zshrc` | 해당 파일의 관리 원본 위치 조회 |
| 새 컴퓨터 초기화 | `chezmoi init <repository-url>` | 원격 저장소를 Source로 가져옴 |
| 원격 변경 반영 | `chezmoi update` | Source 갱신 후 Destination 적용 |

**대표 흐름:** `chezmoi add ~/.zshrc` → `chezmoi edit ~/.zshrc` → `chezmoi diff` → `chezmoi apply`. 다른 컴퓨터에서는 Source 저장소를 `init`으로 가져와 적용한다. `update`는 로컬 파일을 Git에 자동 업로드하는 명령이 아니다.

### 파일 이름이 배포 속성을 결정한다

```text
Source                         Destination
dot_zshrc                  →   ~/.zshrc
private_dot_ssh/config     →   ~/.ssh/config (권한 제한)
executable_script          →   ~/script (실행 권한)
symlink_dot_vimrc          →   ~/.vimrc (심볼릭 링크)
dot_zshrc.tmpl             →   ~/.zshrc (템플릿 렌더링)
exact_dot_config/          →   ~/.config/ (불필요 항목 제거 가능)
```

`dot_`·`private_`·`executable_`·`symlink_` 같은 접두어는 대상의 이름·권한·종류를 지정한다. `exact_`는 관리하지 않는 파일을 제거할 수 있으므로 적용 전에 반드시 차이를 확인한다. 속성 변경에는 `chezmoi chattr`를 사용한다.

## 2. Target 생성 — Template·Data·Secret

```text
Source (.tmpl) ───────┐
Data (OS·사용자 설정) ├──> Template 렌더링 ──> Target
Secret Store ────────┘
```

같은 Source라도 OS나 컴퓨터별 Data에 따라 다른 Target을 만들 수 있다. `chezmoi data`로 입력값을, `chezmoi cat ~/.zshrc`로 렌더링된 결과를 확인한다.

```gotmpl
{{ if eq .chezmoi.os "darwin" }}
export EDITOR=nvim
{{ else }}
export EDITOR=vim
{{ end }}
```

이 템플릿은 macOS와 다른 OS에서 서로 다른 설정을 생성한다. `.chezmoitemplates`는 여러 파일에서 재사용할 템플릿 조각을 담는다. Secret은 템플릿에 주입할 수 있지만 렌더링된 Destination의 평문 노출과 권한은 별도로 관리해야 한다.

## 3. Destination 적용 — 비교·적용·스크립트

| 명령 | 역할 |
|---|---|
| `chezmoi status` | Destination과 Target의 상태 차이 확인 |
| `chezmoi diff` | 실제 내용 차이 확인 |
| `chezmoi apply --dry-run` | 적용할 작업 미리보기 |
| `chezmoi apply` | Target을 Destination에 반영 |
| `chezmoi verify` | Destination이 Target과 일치하는지 검사 |

```sh
chezmoi diff                 # 변경 내용 확인
chezmoi apply --dry-run      # 적용 동작 미리보기
chezmoi apply                # 실제 적용
chezmoi verify               # 적용 후 확인
```

**파일 적용과 Script 실행은 다르다.** 관리 파일은 Target 상태로 배포되고, Script는 적용 과정에서 명령을 수행한다.

| Source 접두어 | 실행 의미 |
|---|---|
| `run_` | 적용할 때 실행하는 Script |
| `run_once_` | 실행 상태·내용을 기준으로 한 번만 실행 |
| `run_onchange_` | Script 내용·관련 입력 변화에 따라 재실행 |

예를 들어 패키지 설치나 초기 설정은 Script로 자동화할 수 있다. 하지만 `run_once_`는 시간 기반 스케줄러가 아니며, 실패·재실행 조건은 공식 명세를 확인해야 한다. Script의 실행 결과는 Target 파일 자체와 구분한다.

## 4. Git·비밀값·안전한 재현

```text
Git          : Source의 버전·원격 동기화
chezmoi      : Source → Target → Destination
age / GPG    : Source 비밀값 암호화
Secret Store : 렌더링 시 필요한 비밀값 제공
```

**다른 컴퓨터에 재현하는 흐름**은 Source를 Git에 저장 → 새 컴퓨터에서 `chezmoi init <repository-url>` → `chezmoi diff` → `chezmoi apply`다. 환경별 Template·Data가 다르면 Target도 달라진다.

개인키·Secret Store 인증 정보는 저장소 밖에서 보호하고, 복호화된 Destination·실행 로그도 별도로 관리한다. `exact_`·`destroy`처럼 삭제가 발생할 수 있는 기능은 반드시 대상과 미리보기를 확인한다.

공식 명세: [chezmoi User Guide](https://www.chezmoi.io/user-guide/) · [Reference](https://www.chezmoi.io/reference/)
