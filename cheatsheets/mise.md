# mise Cheatsheet

여러 언어 런타임(node·ruby·java·python…)의 버전을 **하나의 도구**로 관리하는 Rust 단일 바이너리 (`mise` = 프랑스어 요리 용어 *mise en place*, "제자리에 놓기" → 작업 전 도구를 제자리에 세팅). `asdf`의 후속격이며 rbenv/jenv/pyenv/nvm을 한꺼번에 대체한다. shim 대신 **PATH를 직접 갈아끼워** 호출 오버헤드가 없다(asdf shim ~120ms → mise ~5ms).

핵심은 **선언(config)과 활성화(activate)의 분리**: config 파일은 "어떤 버전"이라는 데이터일 뿐이고, 셸 rc의 `mise activate`가 그 데이터를 읽어 PATH에 반영하는 엔진이다. 둘 다 있어야 굴러간다.

## 설치 & 활성화

```sh
brew install mise                       # macOS
eval "$(mise activate zsh)"             # ~/.zshrc 에 추가 (bash면 activate bash)
```

- `activate`는 셸 훅(precmd/chpwd)을 심어, 프롬프트가 뜰 때·디렉토리를 옮길 때 PATH를 재계산한다.
- **이 한 줄이 없으면 config.toml은 무력** — 버전 선언만 있고 PATH가 안 바뀐다.

## 일상 명령어

| 명령 | 동작 |
|------|------|
| `mise use -g node@22` | 설치 + **글로벌** 기본값 지정 (`~/.config/mise/config.toml`에 기록) |
| `mise use node@22` | 설치 + **현재 디렉토리** 지정 (`./mise.toml` 생성) |
| `mise install` | config에 선언된 모든 런타임 설치 (버전 인자 없음 = 전부) |
| `mise install ruby@3.4.2` | 특정 버전만 설치 |
| `mise ls` | 설치된 버전 + 어느 config가 지정했는지 |
| `mise ls-remote node` | 설치 가능한 원격 버전 목록 |
| `mise current` | 현재 디렉토리에서 활성인 버전들 |
| `mise which node` | 실제로 잡히는 바이너리 경로 (`~/.local/share/mise/installs/...`) |
| `mise exec -- node -v` | activate 없이 mise 환경으로 일회성 실행 |
| `mise x node@20 -- node -v` | 특정 버전으로 임시 실행 (설치 안 돼 있으면 자동 설치) |
| `mise uninstall node@22` | 특정 버전 제거 |
| `mise prune` | 어떤 config도 안 쓰는 버전 정리 |
| `mise upgrade` | 지정 범위(`22`) 내 최신으로 올림 |
| `mise settings ruby.compile=false` | 설정 변경 (예: ruby 소스 컴파일 → 프리컴파일 바이너리) |
| `mise doctor` | 환경 진단 |
| `mise trust` | 현재 디렉토리 config 신뢰 (미신뢰 config는 자동 실행 안 됨) |

## config.toml — 선언 문법

`~/.config/mise/config.toml`(글로벌) 또는 프로젝트 루트 `mise.toml`.

```toml
[tools]
node = "22"                          # 22.x 최신 (패치 자동 추적)
ruby = "3.4.2"                       # 정확히 고정
java = ["temurin-21", "temurin-17"]  # 배열이면 첫 항목이 PATH 기본, 나머지는 대기
python = "3.12"

[env]
MY_VAR = "value"                     # direnv처럼 디렉토리 진입 시 환경변수 주입

[tasks.build]                        # 간이 태스크 러너 (make 대체용)
run = "npm run build"
```

- **버전 지정자**: `"22"`(메이저 최신) · `"lts"` · `"latest"` · `"3.4.2"`(고정) · `"prefix:3.4"`.
- java 배포판: `temurin-21`(Eclipse Adoptium, 가장 대중적) · `corretto-21`(Amazon) · `openjdk-21` · `zulu-21`.

## config 우선순위 (가까운 것이 이김)

`mise.local.toml` > `mise.toml` / `.mise.toml` > `~/.config/mise/config.toml`(글로벌).
레거시 파일도 그대로 읽는다: `.tool-versions`(asdf) · `.nvmrc` · `.ruby-version` · `.python-version`.

→ 글로벌은 기본값, 프로젝트 디렉토리에 파일을 두면 cd 하는 순간 그 디렉토리에서만 덮어쓴다 (`nvm use` 수동 호출 불필요).

## Apple Silicon에서 레거시 x64 Node 설치

Node 14처럼 공식 ARM64 바이너리가 없는 버전은 native ARM64 mise가 소스 빌드를 시도한다. Rosetta에서 쓸 별도 x64 mise를 설치하면 기존 x64 바이너리를 바로 받을 수 있다.

```sh
curl -fsSL https://mise.run \
  | MISE_INSTALL_PATH="$HOME/.local/bin/mise-x64" MISE_INSTALL_ARCH=x64 sh

# 현재 mise.toml/.mise.toml의 Node 버전을 x64로 설치
"$HOME/.local/bin/mise-x64" install

# 셸 PATH 갱신을 기다리지 않고 프로젝트 버전으로 실행
mise exec -- node --version
mise exec -- npm ci
```

ARM64 `mise` 바이너리를 `arch -x86_64 mise ...`로 감싸는 방식은 실행 파일 자체의 아키텍처가 달라 실패한다. 공식 권장 방식은 x64 mise를 별도로 두는 것이다.

## 함정

- **activate 없으면 아무 일도 안 일어난다.** config는 데이터일 뿐. `eval "$(mise activate zsh)"`가 엔진.
- **IDE·GUI 앱은 셸 rc를 안 거친다** → activate가 안 먹는다. 이 경우 shim 방식 필요: `~/.local/share/mise/shims`를 PATH에 넣거나 `mise activate --shims`.
- **ruby 등 일부는 소스 컴파일**이라 설치가 느리다 (수 분). `mise settings ruby.compile=false`로 프리컴파일 바이너리 사용.
- **프로젝트 config는 신뢰가 필요**하다 — 낯선 디렉토리의 `mise.toml`을 자동 실행하지 않는다(보안). `mise trust`로 허용.
- 새 버전 설치 직후 PATH 반영이 안 보이면 셸 재진입 또는 `hash -r`.

## 참고

- [mise 공식 문서](https://mise.jdx.dev/)
- 관련 치트시트: `chezmoi.md` (dotfiles로 config.toml 배치 + `mise install` 부트스트랩)
- Python은 mise보다 `uv`가 낫다는 평이 많다 — 통합할지 언어별 최적을 쓸지는 취사선택.
