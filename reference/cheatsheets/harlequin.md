# Harlequin — 터미널 SQL IDE와 Adapter 진단

> Harlequin은 Python으로 배포되는 터미널 SQL IDE다. DuckDB·SQLite가 기본 제공되며, 다른 데이터베이스는 별도 Python 패키지인 Adapter를 설치한다. 연결 정보·비밀번호는 공개 설정 예제에 넣지 않는다.

## 30초 요약

```sh
uv tool install harlequin                    # 격리된 Python 환경에 IDE 설치
uv tool install 'harlequin[postgres]'        # Postgres Adapter와 함께 설치
harlequin --version                          # 설치된 Adapter 목록 확인
harlequin --help                             # 실제 설치된 Adapter의 옵션 확인
harlequin -a sqlite                          # SQLite Adapter로 시작
harlequin -P local-postgres                  # 저장된 프로필로 접속
harlequin -P local-postgres -d example_db    # 같은 서버·인증 설정으로 DB만 변경
```

`local-postgres`와 `example_db`는 미리 준비한 프로필·DB 이름으로 바꾼다. PostgreSQL에서 다른 DB로 전환하려면 `Ctrl+Q`로 종료한 뒤 `-d`로 다시 접속한다. 카탈로그 선택이나 새 SQL 탭은 DB 전환이 아니다.

접속 후 현재 DB·사용자 확인:

```sql
SELECT current_database(), current_user;
```

**중요:** `command -v harlequin`으로 실행 파일을 확인한다. Homebrew와 uv에 각각 설치돼 있으면, 다른 Python 환경에 설치된 Adapter는 현재 실행 중인 Harlequin에 보이지 않는다.

## 기본 사용 — 접속부터 첫 조회까지

외부 서버 없이 연습하려면 기본 프로필을 건너뛰고 메모리 SQLite를 연다. 종료하면 연습 데이터는 사라진다:

```sh
harlequin --profile None -a sqlite
```

1. `F2`로 오른쪽 위 **Query Editor**에 이동하고 `Ctrl+N`으로 새 SQL 탭을 연 뒤 아래 SQL을 입력한다. `--profile None`으로 시작해도 이전 SQL 탭은 복원될 수 있다.
2. `Ctrl+Enter` 또는 `Ctrl+J`로 실행한다. 키가 터미널에 가로채이면 **Run Query** 버튼을 클릭한다.
3. 아래 **Results Viewer**에서 `id = 1`, `label = hello`인 한 행을 확인한다.
4. `F2`로 편집기로 돌아간다. 종료는 `Ctrl+Q`다.

```sql
SELECT 1 AS id, 'hello' AS label;
```

화면은 왼쪽 **Data Catalog**(DB·스키마·테이블 탐색), 오른쪽 위 **Query Editor**(SQL 탭), 오른쪽 아래 **Results Viewer**(결과)로 나뉜다. 편집기와 결과 사이 **Run Query Bar**에서는 실행·행 제한·지원되는 트랜잭션 모드를 조작한다. 하단에는 현재 포커스에서 쓸 수 있는 단축키가 표시된다.

### 자주 쓰는 기본 키

아래는 기본 `vscode` keymap 기준이다. 사용자 keymap이나 버전에 따라 다르면 `F7`로 **현재 포커스의 키 목록**을 확인한다.

| 작업 | 키 | 사용 위치·주의 |
| --- | --- | --- |
| 쿼리 편집기로 이동 | `F2` | SQL 입력·편집 |
| 결과로 이동 | `F5` | 조회 결과 탐색·복사 |
| 카탈로그로 이동 | `F6` | DB·스키마·테이블 탐색 |
| 현재 영역의 키 목록 | `F7` | 포커스를 옮긴 뒤 확인 |
| 쿼리 실행 | `Ctrl+J` 또는 `Ctrl+Enter` | **편집기**에서 |
| 선택한 이름을 편집기에 삽입 | `Ctrl+J` 또는 `Ctrl+Enter` | **카탈로그**에서 |
| 항목 펼치기·접기 / 동작 메뉴 | `Enter`·`Space` / `.` | 카탈로그에서 |
| 새 SQL 탭 / 현재 SQL 탭 닫기 / 다음 SQL 탭 | `Ctrl+N` / `Ctrl+W` / `Ctrl+K` | 편집기에서 |
| 이전 탭 / 다음 탭 | `j` / `k` | 카탈로그·결과 영역에서. 편집기에서는 문자 입력 |
| 선택한 결과 복사 / 결과 내보내기 | `Ctrl+C` / `Ctrl+E` | 결과에서 복사할 셀·범위를 먼저 선택 |
| 실행 이력 열기 | `F8` | 항목 선택 후 `Enter`로 새 SQL 탭에 복원 |
| 카탈로그 새로고침 | `Ctrl+R` | DDL 실행 후 목록 갱신 |
| 사이드바 숨김·표시 | `Ctrl+B` 또는 `F9` | |
| 현재 영역 전체 화면·복원 | `F10` | |
| 도움말 / 종료 | `F1` / `Ctrl+Q` | |

macOS에서도 위 표는 `Cmd`가 아니라 `Ctrl` 기준이다. 기능 키가 시스템 동작에 잡히면 키보드 설정에 따라 `Fn`을 함께 누르거나 하단 버튼을 사용한다.

**`j`와 `Ctrl+J`는 다르다.** 쿼리 실행은 `F2` → `Ctrl+J`, 테이블 탐색은 `F6` → 방향키 → `Enter`·`.` 순서로 사용한다.

### 카탈로그에서 테이블 찾기

1. `F6`으로 이동하고 `↑`·`↓`로 항목을 선택한다.
2. `Enter` 또는 `Space`로 DB → 스키마 → 테이블 → 컬럼을 펼친다. 표시되는 계층은 Adapter마다 다르다.
3. 테이블을 선택하고 `.`으로 **Interactions** 메뉴를 연다. 제공되는 조회·구조 확인 동작은 Adapter마다 다르므로 생성된 SQL을 확인한 뒤 실행한다.
4. 선택한 이름만 편집기에 넣으려면 카탈로그에서 `Ctrl+Enter` 또는 `Ctrl+J`를 누른다. **같은 키라도 편집기에서는 쿼리 실행**이므로 포커스를 확인한다.

DDL 실행 뒤 목록이 오래된 상태면 `Ctrl+R`로 갱신한다. PostgreSQL Manual 모드에서 아직 커밋하지 않은 DDL은 별도 연결을 쓰는 카탈로그에 보이지 않을 수 있다.

### SQL 탭·파일·실행 이력

| 작업 | 키·조작 |
| --- | --- |
| SQL 탭 생성·닫기·전환 | [자주 쓰는 기본 키](#자주-쓰는-기본-키) 참고 |
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

### 설정 파일 위치

`harlequin --config`로 설정을 만들거나 수정한다. 사용자·프로젝트 설정 파일의 탐색 순서와 병합 우선순위는 [공식 설정 문서](https://harlequin.sh/docs/config-file/discovery)를 참고한다. 특정 파일은 `harlequin --config-path <path>`로 지정한다.

### 프로필 정의

일반 TOML 설정 파일의 최소 예시다. PostgreSQL Adapter와 접속 가능한 DB가 준비되어 있어야 하며, 아래 접속 값은 자신의 환경에 맞게 바꾼다:

```toml
default_profile = "local-postgres"

[profiles.local-postgres]
adapter = "postgres"
host = "localhost"
port = "5432"
username = "example_user"
dbname = "example_db"

[profiles.scratch]
adapter = "sqlite"
```

`[profiles.<이름>]` 하나가 접속 옵션 묶음이다. `default_profile`은 **프로필 테이블 밖, 파일 상단**에 둔다. 비밀번호는 예제처럼 생략하고 PostgreSQL의 `~/.pgpass` 등 별도 인증 수단을 사용한다. `scratch`는 외부 서버 없이 쓰는 메모리 SQLite 프로필이다.

실제 접속 정보가 있는 파일은 공개 저장소에 커밋하지 않는다. `pyproject.toml`에 넣을 때는 별도 `[tool.harlequin]` 구조가 필요하므로 이 예제를 그대로 붙이지 않는다.

### 프로필 선택·일회성 변경

```sh
harlequin -P local-postgres               # 저장된 연결 프로필 선택
harlequin -P local-postgres -d example_db # 프로필은 유지하고 DB만 변경
```

`-P`는 프로필 이름, `-d`는 PostgreSQL 접속 DB 이름이다. CLI 옵션은 해당 실행에만 적용한다. [프로필 공식 문서](https://harlequin.sh/docs/config-file/profiles).

## PostgreSQL — DB 목록과 실제 접속 DB는 다르다

**Data Catalog에 서버의 DB 이름이 여러 개 보여도 PostgreSQL Adapter는 한 번에 DB 하나에만 연결한다.** 다른 DB 이름이 보이는 것은 그 내부 스키마·테이블에 접속했다는 뜻이 아니다. 현재 접속 DB만 하위 항목을 볼 수 있으며, 다른 DB가 펼쳐지지 않는다고 비어 있거나 권한이 없다고 단정하지 않는다.

- SQL로 현재 위치 확인: `SELECT current_database(), current_user;`
- 스키마와 DB 구분: `"public"."example_table"`의 `public`은 **현재 DB 안의 스키마**다. 다른 DB를 지정하는 표현이 아니다.
- 다른 DB 조회: Harlequin을 종료하고 대상 DB로 다시 실행한다. 카탈로그 선택이나 새 SQL 탭은 DB 전환이 아니다.
- 여러 DB 동시 사용: 터미널 탭마다 별도 Harlequin을 실행해 각각 연결한다. PostgreSQL용 DB 이름 옵션은 단일 값이며 배열·반복 지정으로 여러 DB에 동시 연결할 수 없다.

연결 정보를 복제하지 않고 `harlequin -P local-postgres -d example_db`로 DB만 바꿀 수 있다. 데이터베이스 목록 표시와 실제 접속은 다르다. [공식 다중 DB 제약](https://harlequin.sh/docs/postgres/multiple).

## 진단

실행·복사 키는 **현재 포커스**, 테이블 목록은 **카탈로그 갱신·트랜잭션**, 접속 문제는 **Adapter·실제 DB**를 차례로 확인한다. `SELECT current_database();`로 PostgreSQL 연결 대상을 확인할 수 있다.

상세: [키 입력 문제](https://harlequin.sh/docs/troubleshooting/key-bindings) · [복사·붙여넣기 문제](https://harlequin.sh/docs/troubleshooting/copying-and-pasting).

## 관련 문서

- [공식 기본 사용 튜토리얼](https://harlequin.sh/docs/getting-started/usage) · [기본 키 전체 목록](https://harlequin.sh/docs/bindings)
- [Vertica에서 쓸 만한 터미널 DB 클라이언트는 무엇일까?](https://clang-engineer.github.io/posts/opensource/harlequin-vertica-tui-db-client/) — 도구 선택 배경·행 편집 방식 비교
