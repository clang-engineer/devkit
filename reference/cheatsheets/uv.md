# uv — 명령 구조 치트시트

> Python **프로젝트·환경·도구**를 관리하는 CLI. 명령어는 먼저 **무엇을 관리하는지**로 구분한다.

## 세 가지 대상

```text
uv
├─ 프로젝트 (pyproject.toml / uv.lock)
│  ├─ init           프로젝트 시작
│  ├─ add / remove   의존성 선언 변경
│  ├─ lock           의존성 버전 해석·잠금
│  ├─ sync           환경을 잠금 상태에 맞춤
│  └─ run            프로젝트 환경에서 명령 실행
│
├─ 직접 환경 조작 (pip 호환)
│  ├─ venv           가상환경 생성
│  └─ pip
│     ├─ install / uninstall
│     └─ freeze
│
└─ 독립 CLI 도구 (tool)
   ├─ run (= uvx)    도구를 필요할 때 실행
   ├─ install        도구를 지속 설치
   └─ list           설치한 도구 조회
```

## 프로젝트의 상태 변화

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

**구분:** `uv add`는 프로젝트 의존성 선언을 관리한다. `uv pip install`은 선택한 Python 환경에 직접 패키지를 설치한다. 둘을 단순한 동의어로 외우지 않는다.

## 같은 단어, 다른 대상

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

## 문제가 생기면

- 다른 Python이 실행된다 → `uv run python --version`, `.python-version` 및 프로젝트 설정 확인
- 환경이 선언과 다르다 → `uv sync`로 동기화 상태 확인
- `requirements.txt` 기반 프로젝트다 → `uv pip install -r requirements.txt` 사용 가능

전체 옵션·버전별 동작: [uv 공식 문서](https://docs.astral.sh/uv/) · 배포 작업: [PyPI Publishing](python-pypi-publishing.md)
