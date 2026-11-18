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

## 기본 사용 — 접속부터 첫 조회까지

외부 서버 없이 연습하려면 기본 프로필을 건너뛰고 메모리 SQLite를 연다. 종료하면 연습 데이터는 사라진다:

```sh
harlequin --profile None -a sqlite
```

1. 오른쪽 위 **Query Editor**에 아래 SQL을 입력한다.
2. `Ctrl+Enter` 또는 `Ctrl+J`로 실행한다. 키가 터미널에 가로채이면 **Run Query** 버튼을 클릭한다.
3. 아래 **Results Viewer**에서 `id = 1`, `label = hello`인 한 행을 확인한다.
4. `F2`로 편집기로 돌아간다. 종료는 `Ctrl+Q`다.

```sql
SELECT 1 AS id, 'hello' AS label;
```

화면은 왼쪽 **Data Catalog**(DB·스키마·테이블 탐색), 오른쪽 위 **Query Editor**(SQL 탭), 오른쪽 아래 **Results Viewer**(결과)로 나뉜다. 편집기와 결과 사이 **Run Query Bar**에서는 실행·행 제한·지원되는 트랜잭션 모드를 조작한다. 하단에는 현재 포커스에서 쓸 수 있는 단축키가 표시된다.

### 자주 쓰는 기본 키

아래는 기본 `vscode` keymap 기준이다. 사용자 keymap이나 버전에 따라 다르면 `F7`로 **현재 포커스의 키 목록**을 확인한다.

| 작업 | 키 |
| --- | --- |
| 도움말 / 현재 영역 키 목록 | `F1` / `F7` |
| 편집기 / 결과 / 카탈로그로 이동 | `F2` / `F5` / `F6` |
| 쿼리 실행 — 편집기에서 | `Ctrl+Enter` 또는 `Ctrl+J` |
| 카탈로그 새로고침 | `Ctrl+R` |
| 사이드바 숨김·표시 | `Ctrl+B` 또는 `F9` |
| 현재 영역 전체 화면·복원 | `F10` |
| 실행 이력 열기 | `F8` |
| 종료 | `Ctrl+Q` |

macOS에서도 위 표는 `Cmd`가 아니라 `Ctrl` 기준이다. 기능 키가 시스템 동작에 잡히면 키보드 설정에 따라 `Fn`을 함께 누르거나 하단 버튼을 사용한다.

### 카탈로그에서 테이블 찾기

1. `F6`으로 이동하고 `↑`·`↓`로 항목을 선택한다.
2. `Enter` 또는 `Space`로 DB → 스키마 → 테이블 → 컬럼을 펼친다. 표시되는 계층은 Adapter마다 다르다.
3. 테이블을 선택하고 `.`으로 **Interactions** 메뉴를 연다. 제공되는 조회·구조 확인 동작은 Adapter마다 다르므로 생성된 SQL을 확인한 뒤 실행한다.
4. 선택한 이름만 편집기에 넣으려면 카탈로그에서 `Ctrl+Enter` 또는 `Ctrl+J`를 누른다. **같은 키라도 편집기에서는 쿼리 실행**이므로 포커스를 확인한다.

DDL 실행 뒤 목록이 오래된 상태면 `Ctrl+R`로 갱신한다. PostgreSQL Manual 모드에서 아직 커밋하지 않은 DDL은 별도 연결을 쓰는 카탈로그에 보이지 않을 수 있다.

### SQL 탭·파일·실행 이력

| 작업 | 키·조작 |
| --- | --- |
| 새 SQL 탭 / 현재 탭 닫기 / 다음 SQL 탭 | `Ctrl+N` / `Ctrl+W` / `Ctrl+K` |
| SQL 파일 열기 / 저장 | `Ctrl+O` / `Ctrl+S` |
| SQL 포맷 / 검색 / 다음 검색 결과 | `F4` / `Ctrl+F` / `F3` |
| 편집기에서 줄 번호로 이동 | `Ctrl+G` |
| 자동완성 선택 / 확정 / 닫기 | `↑`·`↓` / `Tab` 또는 `Enter` / `Esc` |
| 실행 이력에서 SQL 복원 | `F8` → 항목 선택 → `Enter`로 새 SQL 탭에 넣기 |

SQL 탭은 **편집 버퍼**다. 새 탭을 만들어도 다른 DB 연결이 생기지 않는다. 저장한 SQL 파일과 실행 이력에 민감한 조건·리터럴이 남을 수 있으므로 공유 전에 확인한다.

### 결과 탐색·복사·내보내기

1. `F5`로 결과 영역에 이동한다. 방향키로 셀, `PageUp`·`PageDown`으로 화면 단위 이동을 한다.
2. `Shift`와 방향키로 범위를 선택하거나 `Ctrl+A`로 전체를 선택하고 `Ctrl+C`로 복사한다. 복사 형식은 TSV이므로 스프레드시트에 붙여넣기 좋다.
3. 파일로 저장하려면 결과가 표시된 상태에서 `Ctrl+E` → 경로·형식·옵션 선택 → **Export**를 누른다. CSV·Parquet·JSON 등의 형식을 지원한다.

큰 테이블은 먼저 SQL의 `LIMIT`으로 범위를 줄인다. **조회 SQL의 제한**, Run Query Bar의 행 제한, Results Viewer에 적재하는 최대 행 수는 구분한다. 화면의 행 수만 보고 테이블 전체를 조회·내보냈다고 판단하지 않는다. 상세 형식과 옵션은 [공식 내보내기 문서](https://harlequin.sh/docs/export)를 따른다.

### 변경 쿼리 주의

Harlequin은 조회 전용 도구가 아니다. 계정 권한이 있으면 `INSERT`·`UPDATE`·`DELETE`·DDL도 실행한다. Results Viewer의 셀을 직접 고쳐 저장하는 방식이 아니라 SQL로 변경한다.

PostgreSQL Adapter의 **Auto** 모드는 문장을 자동 커밋한다. **Manual** 모드는 `COMMIT;` 또는 `ROLLBACK;`으로 끝내며 Run Query Bar에서도 처리할 수 있다. 다른 Adapter도 같은 방식이라고 가정하지 말고 [Adapter별 트랜잭션 동작](https://harlequin.sh/docs/transactions)을 확인한다.


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

기존 Harlequin 프로필을 선택하거나 기본 프로필 없이 시작하려면:

```sh
harlequin --profile local-postgres
harlequin --profile None -a sqlite
harlequin --config                          # 설정 생성·수정 마법사
```

`local-postgres`는 미리 만들어 둔 프로필의 예시 이름이다. Harlequin 자체 TOML은 `[profiles.<이름>]` 구조이며, CLI 옵션이 프로필의 같은 옵션보다 우선한다. 외부 연결 선택기가 사용하는 TOML은 별도 형식일 수 있으므로 그대로 `--config-path`에 넘길 수 있다고 가정하지 않는다. [공식 프로필 선택 문서](https://harlequin.sh/docs/config-file/profiles).

## PostgreSQL — DB 목록과 실제 접속 DB는 다르다

**Data Catalog에 서버의 DB 이름이 여러 개 보여도 PostgreSQL Adapter는 한 번에 DB 하나에만 연결한다.** 다른 DB 이름이 보이는 것은 그 내부 스키마·테이블에 접속했다는 뜻이 아니다. 현재 접속 DB만 하위 항목을 볼 수 있으며, 다른 DB가 펼쳐지지 않는다고 비어 있거나 권한이 없다고 단정하지 않는다.

- SQL로 현재 위치 확인: `SELECT current_database(), current_user;`
- 스키마와 DB 구분: `"public"."example_table"`의 `public`은 **현재 DB 안의 스키마**다. 다른 DB를 지정하는 표현이 아니다.
- 다른 DB 조회: Harlequin을 종료하고 대상 DB로 다시 실행한다. 카탈로그 선택이나 새 SQL 탭은 DB 전환이 아니다.
- 여러 DB 동시 사용: 터미널 탭마다 별도 Harlequin을 실행해 각각 연결한다. PostgreSQL용 DB 이름 옵션은 단일 값이며 배열·반복 지정으로 여러 DB에 동시 연결할 수 없다.

### 연결 정보는 유지하고 DB만 바꾸기

**기존 PostgreSQL 프로필이 있다면 접속 정보를 통째로 복제할 필요가 없다.** `-d`(긴 옵션 `--dbname`)로 DB만 덮어쓴다:

```sh
# local-postgres 프로필의 서버·포트·인증 설정은 유지하고 DB만 변경
harlequin --profile local-postgres -d example_db

# 기존 DSN으로 접속할 때도 DB 이름만 재정의 가능
# PG_DSN은 비공개 환경에서 준비한 접속 문자열이다.
harlequin -a postgres "$PG_DSN" -d example_db
```

`example_db`는 예시 이름이며 해당 계정에 대상 DB의 접속·조회 권한이 있어야 한다. DSN에 비밀번호를 넣으면 확장된 값이 프로세스 인자에 노출될 수 있으므로 PostgreSQL의 passfile 등 적절한 인증 방식을 사용한다.

외부 연결 선택기를 거쳐 실행한다면 **추가 CLI 옵션 전달 지원을 별도로 확인**한다. Harlequin 자체의 `-d` 지원이 선택기의 지원을 뜻하지는 않는다. [공식 다중 DB 제약](https://harlequin.sh/docs/postgres/multiple) · [PostgreSQL 접속 옵션](https://harlequin.sh/docs/postgres).

## 문제 해결 — 키·결과·접속 구분

| 증상 | 먼저 확인할 것 |
| --- | --- |
| 실행 키가 동작하지 않음 | `F2`로 편집기 포커스 확인 → `Ctrl+J` 또는 Run Query 버튼. 터미널 키 가로채기도 확인 |
| 복사·붙여넣기가 안 됨 | 현재 영역과 선택 범위 확인. 원격 세션·터미널의 클립보드 지원 확인 |
| 테이블을 만들었는데 목록에 없음 | `Ctrl+R`로 갱신. PostgreSQL Manual 모드라면 커밋 여부도 확인 |
| DB 이름은 있는데 하위 스키마가 안 열림 | `SELECT current_database();`로 실제 접속 DB 확인. 다른 DB라면 재접속 |
| 변경 SQL이 즉시 반영됨 | 접속 계정 권한과 Adapter의 Auto/Manual 모드 확인. 편집기 자체는 조회 전용이 아님 |
| Adapter 로드 실패 | [설치 환경 진단](#구조--실행-파일과-adapter의-환경은-하나)부터 확인 |

키·클립보드 상세: [키 입력 문제](https://harlequin.sh/docs/troubleshooting/key-bindings) · [복사·붙여넣기 문제](https://harlequin.sh/docs/troubleshooting/copying-and-pasting).

## 관련 문서

- [공식 기본 사용 튜토리얼](https://harlequin.sh/docs/getting-started/usage) · [기본 키 전체 목록](https://harlequin.sh/docs/bindings)
- [Vertica에서 쓸 만한 터미널 DB 클라이언트는 무엇일까?](https://clang-engineer.github.io/posts/opensource/harlequin-vertica-tui-db-client/) — 도구 선택 배경·행 편집 방식 비교
