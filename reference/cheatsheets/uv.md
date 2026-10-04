# uv Cheatsheet

Rust 기반 Python package/project manager. `pip`, `venv`, `pip-tools`, `pipx` 역할 일부를 빠른 단일 CLI로 묶는다.

## 30초 요약

```sh
brew install uv
uv init
uv add requests
uv run python main.py
uv sync
uv lock
uv tool run ruff --version
```

## Mental model

| 기존 조합 | uv |
|---|---|
| `python -m venv` | `uv venv` |
| `pip install` | `uv pip install` 또는 `uv add` |
| `pip-tools` lock | `uv lock` |
| `pipx run` | `uv tool run` / `uvx` |
| 프로젝트 실행 | `uv run ...` |

## 프로젝트 명령

| 목적 | 명령 |
|---|---|
| 새 프로젝트 | `uv init` |
| 의존성 추가 | `uv add requests` |
| 개발 의존성 추가 | `uv add --dev pytest` |
| 의존성 제거 | `uv remove requests` |
| lockfile 생성/갱신 | `uv lock` |
| 환경 동기화 | `uv sync` |
| 프로젝트 명령 실행 | `uv run pytest` |
| Python 실행 | `uv run python` |

## pip 호환 명령

| 목적 | 명령 |
|---|---|
| venv 생성 | `uv venv` |
| 패키지 설치 | `uv pip install requests` |
| requirements 설치 | `uv pip install -r requirements.txt` |
| freeze | `uv pip freeze` |
| 패키지 제거 | `uv pip uninstall requests` |

## Tool 실행

```sh
uv tool run ruff check .
uvx ruff check .
uv tool install ruff
uv tool list
```

`uvx`는 `uv tool run`의 짧은 alias로 볼 수 있다.

## Python 버전과 경계

uv는 Python 설치와 프로젝트 환경 관리도 지원한다. 다만 조직이나 개인 dotfiles에서 `mise`, `pyenv`, 시스템 Python 등 별도 runtime manager를 이미 쓰는 경우에는 다음처럼 역할을 나누면 충돌이 적다.

```text
runtime version 선택 -> mise/pyenv/시스템 정책
package, venv, tool 실행 -> uv
```

## 문제 해결

| 증상 | 확인 |
|---|---|
| 예상과 다른 Python 사용 | `uv run python --version`, `.python-version`, project 설정 확인 |
| venv가 꼬임 | `.venv` 삭제 후 `uv sync` |
| requirements 기반 프로젝트 | `uv pip install -r requirements.txt`부터 사용 |

## 관련

- 공식 문서: <https://docs.astral.sh/uv/>
- PyPI 배포: [python-pypi-publishing.md](python-pypi-publishing.md)
