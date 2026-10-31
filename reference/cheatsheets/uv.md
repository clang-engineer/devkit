# uv — 명령 구조 치트시트

> Python **프로젝트·환경·도구**를 관리하는 CLI. 명령어는 먼저 **무엇을 관리하는지**로 구분한다.

## 전체 작동 모델 — 선언에서 실행까지

```text
Python Project
  pyproject.toml (의존성 선언)
       │ uv lock / uv add
       ▼
  uv.lock (해결된 버전)
       │ uv sync
       ▼
  .venv (실제 설치 환경) ── uv run ──> 실행

별도 관리 대상
├─ uv pip  : 선택한 환경에 직접 설치
├─ uv tool : 독립 CLI 도구 실행·설치
└─ uv python : Python 런타임 설치·관리
```

**선언·잠금·설치·실행은 서로 다른 상태**다. 아래 명령은 어느 상태를 변경하는지 기준으로 읽는다.

## 1. 프로젝트 — 선언·잠금·동기화·실행

```text
uv add requests
     │
     ├─ pyproject.toml 의존성 선언 변경
     ├─ uv.lock 갱신
     └─ 프로젝트 환경 동기화

uv lock  → lockfile을 갱신 (환경 설치 자체는 아님)
uv sync  → lockfile에 맞춰 환경 동기화
uv run   → 프로젝트 환경에서 명령 실행
```

```sh
uv init
uv add requests
uv add --dev pytest   # --dev: 개발 의존성 그룹
uv remove requests
uv run pytest
```

**예시:** `uv add requests`로 선언·잠금·환경을 갱신한 뒤 `uv run python -c 'import requests; print(requests.__version__)'`로 프로젝트 환경에서 확인한다.

**구분:** `uv add`는 프로젝트 의존성 선언을 관리한다. `uv pip install`은 선택한 Python 환경에 직접 패키지를 설치한다. 둘을 단순한 동의어로 외우지 않는다.

## 2. 별도 환경과 도구 — pip·tool·python

| 명령 패턴 | 대상·의미 |
|---|---|
| `uv venv` | 가상환경 생성 |
| `uv pip install -r requirements.txt` | requirements를 환경에 설치 |
| `uv pip freeze` | 환경에 설치된 패키지 출력 |
| `uv tool run ruff check .` | 독립 CLI 도구 실행 |
| `uvx ruff check .` | `uv tool run`의 별칭 |
| `uv tool install ruff` | CLI 도구를 지속 설치 |
| `uv tool list` | 설치한 CLI 도구 목록 |

`uv`는 Python 설치·버전 관리도 지원한다. `mise`·`pyenv` 등과 병행한다면 **누가 Python 버전을 선택하는지**를 먼저 정한다.

## 3. 진단 — 선언과 실행 환경의 불일치

- 다른 Python이 실행된다 → `uv run python --version`, `.python-version` 및 프로젝트 설정 확인
- 환경이 선언과 다르다 → `uv sync`로 동기화 상태 확인
- `requirements.txt` 기반 프로젝트다 → `uv pip install -r requirements.txt` 사용 가능

전체 옵션·버전별 동작: [uv 공식 문서](https://docs.astral.sh/uv/) · 배포 작업: [PyPI Trusted Publishing 가이드](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-10-25-pypi-trusted-publishing-github-oidc.md)
