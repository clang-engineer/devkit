# Harlequin Cheatsheet

> 터미널 기반 SQL IDE. `--profile`/`--config-path`로 여러 DB를 빠르게 전환한다.

## 1) 기본 사용법

| 상황 | 명령 |
|------|------|
| 시작 | `harlequin` |
| 도움말 | `harlequin --help` |
| 특정 프로필로 실행 | `harlequin --config-path <CONFIG_PATH> --profile <PROFILE_NAME>` |
| 파일(또는 env)로 기본 경로 고정 | `export HARLEQUIN_CONFIG_PATH=<CONFIG_PATH>` |
| 키맵 편집기 실행(단축키 확인/생성) | `harlequin --keys` |
| 설정 파일 검증/출력 (`hsql`) | `hsql --config validate` / `hsql --config show` |
| 바로 한 줄 쿼리 실행 | `hsql -P <PROFILE_NAME> -c "select 1"` |

### 설정 우선순위

- 명시한 설정 파일: `--config-path <CONFIG_PATH>`
- 환경 변수: `HARLEQUIN_CONFIG_PATH`
- 기본 파일 탐색: `./.harlequin.toml` → `~/.harlequin.toml`

### 프로필 구성 파일 분리(추천)

- 런타임은 최종적으로 `harlequin/harlequin_config.toml` 하나만 사용.
- 실제 관리 파일은 `harlequin/config/*.toml` 조각으로 분리.
- 수정 후 병합:
  - `python3 scripts/build-harlequin-config.py`
  - `python3 scripts/build-harlequin-config.py --check` (검증만)

### 최소 `harlequin_config.toml` 템플릿

```toml
default_profile = "default_profile"

[profiles.default_profile]
adapter = "postgres"
conn_str = ["postgresql://<user>@<host>:<port>/<database>"]
keymap_name = ["vscode"]
limit = 1000

[profiles.example_vertica]
adapter = "vertica"
conn_str = ["vertica://<user>@<host>:<port>/<database>"]
keymap_name = ["vscode"]
limit = 1000
```

주의: 비밀번호 같은 민감값은 `password = "${ENV_VAR}"`처럼 환경변수로 주입한다.

## 2) 기본 단축키 (vscode 키맵)

다음은 `--keymap-name vscode` 기준 단축키다.

### 앱 공용

| 키 | 동작 |
|---|---|
| `Ctrl+Q` | 종료 |
| `F1` | 도움말 열기 |
| `F2` | 쿼리 에디터 포커스 |
| `F5` | 결과 뷰어 포커스 |
| `F6` | 데이터 카탈로그 포커스 |
| `F8` | 쿼리 히스토리 |
| `Ctrl+B`, `F9` | 사이드바 토글 |
| `F10` | 전체 화면 토글 |
| `F12` | 디버그 정보 |
| `Ctrl+E` | 데이터 Exporter 열기 |
| `Ctrl+R` | 카탈로그 새로고침 |
| `Tab` / `Shift+Tab` | 패널 포커스 이동 |

### 쿼리 에디터

| 키 | 동작 |
|---|---|
| `Ctrl+N` | 새 버퍼 열기 |
| `Ctrl+W` | 버퍼 닫기 |
| `Ctrl+K` | 다음 버퍼 |
| `Ctrl+Enter`, `Ctrl+J` | 쿼리 실행 |
| `F4` | SQL 포맷 |
| `Ctrl+S` | 버퍼 저장 |
| `Ctrl+O` | 버퍼 불러오기 |
| `Ctrl+F`, `F3` | 찾기 / 다음 찾기 |
| `Ctrl+G` | 지정 라인 이동 |
| 방향키 | 커서 이동 |
| `Ctrl+Left`, `Ctrl+Right` | 단어 단위 이동 |
| `Home`, `End` | 줄 시작/끝 |
| `Ctrl+Home`, `Ctrl+End` | 문서 시작/끝 |
| `PageUp`, `PageDown` | 페이지 이동 |
| `Shift+` + 방향키 | 텍스트 선택 |
| `Ctrl+Shift+Left`, `Ctrl+Shift+Right` | 단어 단위 선택 |
| `Shift+Home`, `Shift+End` | 줄 단위 선택 |
| `Ctrl+Shift+Home`, `Ctrl+Shift+End` | 문서 단위 선택 |
| `Ctrl+A` | 전체 선택 |
| `Ctrl+Z`, `Ctrl+Y` | 실행취소 / 다시실행 |
| `Backspace`, `Delete`, `Shift+Delete` | 삭제 |
| `Ctrl+_` | 주석 토글 |
| `Ctrl+X`, `Ctrl+C`, `Ctrl+U` / `Ctrl+V`, `Shift+Insert` | 잘라내기 / 복사 / 붙여넣기 |

### 데이터 카탈로그

| 키 | 동작 |
|---|---|
| `J` | 이전 탭 |
| `K` | 다음 탭 |
| `Ctrl+Enter`, `Ctrl+J` | 선택 항목 SQL에 삽입 |
| `Ctrl+C` | 객체 이름 복사 |
| `Enter` | 현재 항목 선택/열기 |
| `Space` | 노드 펼침/접힘 |
| `.` | 컨텍스트 메뉴 |
| `Esc` | 컨텍스트 메뉴 닫기 |
| `Up`, `Down` | 노드 이동 |

### 결과 뷰어

| 키 | 동작 |
|---|---|
| `J` | 이전 탭 |
| `K` | 다음 탭 |
| `Ctrl+C` | 선택 영역 복사 |
| `Enter` | 셀 선택 |
| `Space` | 셀 상세 보기 |
| `Up`, `Down`, `Left`, `Right` | 셀 이동 |
| `Ctrl+Left`, `Ctrl+Right` | 행 시작/끝 |
| `Ctrl+Up`, `Home` | 열 시작 |
| `Ctrl+Down`, `End` | 열 끝 |
| `PageUp`, `PageDown` | 페이지 이동 |
| `Ctrl+Home`, `Ctrl+End` | 테이블 시작/끝 |
| `Shift+` + 이동키 | 셀 범위 선택 |
| `Ctrl+Shift+Left`, `Ctrl+Shift+Right` | 행 범위 선택 |
| `Ctrl+Shift+Up`, `Shift+Home` | 열 시작 선택 |
| `Ctrl+Shift+Down`, `Shift+End` | 열 끝 선택 |
| `Shift+PageUp`, `Shift+PageDown` | 페이지 단위 선택 |
| `Ctrl+Shift+Home`, `Ctrl+Shift+End` | 테이블 시작/끝 선택 |
| `Ctrl+A` | 전체 선택 |

### 히스토리 화면

| 키 | 동작 |
|---|---|
| `Enter` | 쿼리 선택 및 적용 |
| `Esc` | 닫기/취소 |

### 단축키 직접 커스터마이즈

```toml
[[keymaps.my_shortcuts]]
keys = "ctrl+shift+r"
action = "refresh_catalog"
```

프로필에서 적용:

```toml
keymap_name = ["vscode", "my_shortcuts"]
```

적용 후 실행:

- 키맵 확인/등록 앱: `harlequin --keys`
- 즉시 실행: `harlequin --config-path <CONFIG_PATH> --profile <PROFILE_NAME>`

## 3) 자주 보는 실패 케이스

- `profile not found`
  - `--profile` 이름 철자와 config의 `[profiles.<name>]` 존재 여부 확인
- 연결 설정 파일 로드 실패
  - `--config-path` 경로 오탈자/권한/접근 권한
- 단축키가 먹지 않음
  - 기본값은 `vscode`; 실행 시 `--keymap-name`이 오버라이드되는지 확인
- 키 동작이 기대와 다름
  - `harlequin --keys`에서 키맵 충돌을 점검하거나, 사용자 키맵을 우선순위 뒤로 이동
