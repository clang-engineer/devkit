# Harlequin — 터미널 SQL IDE와 Adapter 진단

> Harlequin은 Python으로 배포되는 터미널 SQL IDE다. DuckDB·SQLite가 기본 제공되며, 다른 데이터베이스는 별도 Python 패키지인 Adapter를 설치한다. 연결 정보·비밀번호는 공개 설정 예제에 넣지 않는다.

## 30초 요약

```sh
uv tool install harlequin                    # 격리된 Python 환경에 IDE 설치
uv tool install 'harlequin[postgres]'        # Postgres Adapter와 함께 설치
harlequin --version                          # 설치된 Adapter 목록 확인
harlequin --help                             # 실제 설치된 Adapter의 옵션 확인
harlequin -a sqlite                          # SQLite Adapter로 시작
```

**중요:** `command -v harlequin`으로 실행 파일을 확인한다. Homebrew와 uv에 각각 설치돼 있으면, 다른 Python 환경에 설치된 Adapter는 현재 실행 중인 Harlequin에 보이지 않는다.

## 구조 — 실행 파일과 Adapter의 환경은 하나

```text
PATH → harlequin 실행 파일 → 해당 설치의 Python 환경 → Adapter entry point
                                             │
                                        native 라이브러리 (ODBC 등)
```

`Could not load an adapter named ...`는 접속 정보 오류보다 **현재 실행 파일에 연결된 환경에서 Adapter를 로드할 수 있는지** 먼저 확인할 신호다. 예컨대 `harlequin[postgres]`는 PostgreSQL용 extras이며, 추가 패키지는 같은 uv tool 환경에 `--with`로 설치할 수 있다.

```sh
command -v harlequin
harlequin --version
uv tool list
brew list --versions harlequin             # Homebrew도 사용한 경우
```

uv 설치를 쓰기로 했다면 한 환경에 필요한 Adapter를 묶는다:

```sh
uv tool install 'harlequin[postgres]' --with harlequin-odbc
harlequin --version                        # Installed Adapters 확인
```

기존 설치의 환경에 Adapter를 더할 때는 [uv tool install/upgrade 문서](https://docs.astral.sh/uv/guides/tools/)의 설치·업그레이드 동작을 먼저 확인한다. `--force`로 기존 환경을 다시 만들면 이전에 따로 설치한 Adapter가 빠질 수 있으므로 필요한 extras와 `--with` 패키지를 모두 명시한다.

## ODBC의 두 의존성

`harlequin-odbc` 같은 Python Adapter와 ODBC 드라이버 매니저·실제 DB 드라이버는 **별개**다. macOS에서는 드라이버 매니저로 `unixodbc`를 쓰는 구성도 있다. Python Adapter가 설치됐더라도 native 라이브러리나 DSN/드라이버가 없으면 연결에 실패한다. 사용하는 운영체제와 DB 드라이버의 설치 지침을 따른다. `uv tool dir`로 uv 도구 환경을 찾은 뒤 그 환경에서 import 및 드라이버 로드를 점검한다. 시스템 패키지를 정리한 후에는 Python 패키지 목록만 믿지 말고 native 의존성도 재확인한다. [Harlequin ODBC 문서](https://harlequin.sh/docs/odbc).

uv로 설치한 `harlequin-odbc`가 `pyodbc`를 쓴다면 해당 격리 환경에서 native 라이브러리 로드를 확인할 수 있다:

```sh
"$(uv tool dir)/harlequin/bin/python" -c 'import pyodbc; print(pyodbc.version)'
```


## 설정 파일과 연결 프로필

Harlequin은 현재 디렉터리·사용자 설정 디렉터리의 TOML 파일을 읽고 병합한다. 자동 탐색 경로와 별개로 `--config-path`에 지정한 파일이 가장 높은 우선순위다:

```sh
harlequin --config-path /path/to/harlequin.toml
# 또는: HARLEQUIN_CONFIG_PATH=/path/to/harlequin.toml harlequin
```

프로필의 **이름만 공유**한다고 자격증명이 안전해지는 것은 아니다. 공개 예제에는 실제 host·DB 이름·토큰을 넣지 말고, 개인/조직 connection catalog 및 기본 프로필 선택 정책은 비공개 설정에서 관리한다. [공식 설정 발견 순서](https://harlequin.sh/docs/config-file/discovery) · [공식 Adapter 목록](https://harlequin.sh/docs/adapters) · [설치 방법](https://harlequin.sh/docs/getting-started).
