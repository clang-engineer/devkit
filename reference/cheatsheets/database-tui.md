# Database TUI Cheatsheet

DB 작업을 터미널이나 Vim/Neovim 안에서 처리할 때 Harlequin, Rainfrog, vim-dadbod-ui를 고르는 기준이다.

## 30초 요약

| 도구 | 맞는 상황 | 경계 |
|---|---|---|
| [Harlequin](https://github.com/tconbeer/harlequin) | 여러 DB를 어댑터로 연결하고 SQL IDE처럼 쓰고 싶을 때 | DB별 공식 CLI의 모든 메타 명령·운영 옵션을 대체하지 않음 |
| [Rainfrog](https://github.com/achristmascarl/rainfrog) | PostgreSQL을 빠른 TUI로 탐색하고 쿼리 결과를 확인할 때 | psql 스크립팅, dump/restore, 운영 자동화 대체 아님 |
| [vim-dadbod-ui](https://github.com/kristijanhusak/vim-dadbod-ui) | Vim/Neovim 안에서 연결·스키마·쿼리 실행을 묶고 싶을 때 | 독립 DB 클라이언트가 아니라 편집기 플러그인 |

## 선택 기준

- **DB 종류가 자주 바뀐다**: Harlequin 우선. 어댑터 중심으로 여러 DB 워크플로를 맞춘다.
- **PostgreSQL 중심이다**: Rainfrog가 단순하고 빠른 선택이다.
- **SQL을 편집기에서 계속 수정한다**: vim-dadbod-ui로 Neovim/Vim 내부 실행 흐름을 만든다.
- **자동화·배포·백업이다**: `psql`, `sqlite3`, `mysql`, `pg_dump` 같은 공식 CLI를 유지한다.

## 기본 사용 흐름

### Harlequin

```sh
harlequin
```

- 연결 문자열이나 어댑터 설정으로 DB에 접속한다.
- 쿼리 편집, 결과 탐색, 스키마 확인을 한 화면에서 처리한다.
- 프로젝트별 연결 정보는 공개 저장소에 커밋하지 않는다.

### Rainfrog

```sh
rainfrog
```

- PostgreSQL 중심의 테이블 탐색과 쿼리 실행에 적합하다.
- 운영 스크립트나 재현 가능한 배치 작업은 `psql` 명령으로 남긴다.

### vim-dadbod-ui

```vim
:DBUI
```

- `vim-dadbod` 연결을 UI로 탐색한다.
- SQL 버퍼에서 쿼리를 실행하고 결과 버퍼를 확인한다.
- LazyVim/Neovim 설정에서는 플러그인 로딩, DB 연결 변수, 비밀정보 저장 위치를 분리한다.

## 관련

- [terminal-tui.md](./terminal-tui.md): 현대적 TUI 도구 지도
- [elasticsearch.md](./elasticsearch.md): Elasticsearch Query DSL과 운영 확인 명령
