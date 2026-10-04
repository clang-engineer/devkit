# cmdtreemap

`cmdtreemap`은 CLI 도구의 관계와 진화 흐름을 tree로 탐색하는 도구다.
같은 `catalog.json`을 기반으로 터미널 TUI와 브라우저 UI를 제공한다.
핵심은 목록이 아니라 `top → htop → btop` 같은 관계 흐름에서 문제·개선점·남은 한계를 파악하는 것이다.
화살표는 데이터에 정의된 대안·보완 등의 관계이며, 실제 출시 연대순을 뜻하지 않는다.

```text
기본 명령어 → 대안 도구 → 문제 → 해결 → 경계 → tldr → 공식 문서
```

## 관계 이유 표시 원칙

웹·터미널 모두 트리에는 도구 이름 뒤에 핵심 개선점을 표시하고, 상세에는 기존 문제와 개선점을 함께 표시한다.

```text
cat
└─ bat — 구문강조 · 줄번호
```

- 트리: `solution`의 쉼표 구분 항목 중 앞의 1~2개를 최대 48자로 요약한다. 개선점이 없으면 이름만 표시한다.
- 상세: `기존 도구의 문제 → 새 도구의 개선점 → 남은 한계` 순서로 전체 내용을 보여준다. 문제가 없으면 `why`를 사용한다.
- 이유나 개선점을 독립 노드로 만들지 않는다. 트리 깊이나 펼치기 단계를 추가하지 않고 도구를 선택한다.
- 이 표시는 데이터에 정의된 대안·보완 관계이며, 실제 탄생 배경이나 계보를 입증하는 것은 아니다.

## 디렉터리 구조

```text
cmdtreemap/
├── catalog.json              # CLI·Web 공통 데이터 원본
├── Makefile                   # 루트에서 web / cli / test 실행
├── main.go                    # CLI 진입점
├── internal/
│   ├── model/                 # 공통 JSON을 읽는 Go 데이터 구조
│   └── tui/                   # Bubble Tea 기반 터미널 UI
├── scripts/
│   └── sync-blog.sh           # 정적 Web 파일·블로그 동기화
└── web/
    ├── index.html             # Web 진입점
    ├── app.js                 # DOM 생성·tree·상세 화면·검색
    └── app.css                # 독립 Web·블로그 공통 스타일
```

## 구현 역할

- `internal/model`: CLI에서 공통 JSON을 읽는 Go 데이터 구조다.
- `internal/tui`: TTY와 Bubble Tea를 사용하는 CLI 화면을 담당한다.
- `web/app.js`: mount point 내부의 markup, tree, 검색, 상세 화면을 담당한다.
- `web/app.css`: 독립 Web 페이지와 블로그 탭이 함께 사용하는 스타일이다.
- `catalog.json`: CLI·Web 공통 데이터의 유일한 원본이다. 로컬 Web은 루트의 JSON을 직접 읽고 CLI는 `main.go`의 `go:embed`로 빌드에 포함한다. 내장용 `catalog.json`은 `go generate` 또는 `make prepare`로 원본에서 생성하며 직접 수정하지 않는다.

공통화 대상은 데이터 원본이다. CLI는 Go·Bubble Tea, Web은 JavaScript·DOM으로 화면을 구현한다.
독립 Web 페이지와 블로그는 같은 `app.js`·`app.css`를 사용한다. Web에는 Go 런타임이나 별도 빌드가 필요 없다.

## CLI 실행

개발 중에는 프로젝트 루트에서 실행한다.

```bash
cd /path/to/cmdtreemap
make cli
```

빌드 후 실행하려면:

```bash
go generate
go build -o cmdtreemap .
./cmdtreemap
```

### CLI 키보드

| 키 | 동작 |
|---|---|
| `↑`/`k`, `↓`/`j` | tree 이동 |
| `Enter` | 명령어 선택·상세 보기 |
| `/` | tree 필터 |
| `Tab` | 상세 패널로 이동 |
| `t` | 상세 화면에서 tldr 표시 |
| `b`, `Esc` | 뒤로 가기 |
| `q`, `Ctrl+C` | 종료 |

## Web 개발 실행

프로젝트 루트에서 빌드 없이 정적 서버를 실행한다. 데이터는 루트의 `catalog.json`을 그대로 사용한다.
필요 도구는 Make·Python 3이며, CLI·테스트에는 Go·Node.js도 필요하다.
`file://`로 직접 열면 JSON을 읽는 `fetch`가 제한될 수 있다.

```bash
make web
# 포트 변경: make web PORT=8081
```

브라우저에서 [http://localhost:8080/cmdtreemap/web/](http://localhost:8080/cmdtreemap/web/)을 연다.
서버는 로컬 루프백 주소에만 바인딩된다. 루트 디렉터리를 제공하므로 외부 공개용 서버로 사용하지 않는다.
`cat` 아래 `bat` 옆에 핵심 개선점이 표시되는지 확인한다. `bat`을 선택하면 상세에 `cat의 문제`, `bat의 개선점`, `남은 한계`가 함께 표시되어야 한다.
JS·CSS·데이터 수정은 Web 재빌드 없이 새로고침하면 된다. 이전 화면이 남아 있으면 강력 새로고침한다. CLI 바이너리에 반영하려면 다시 빌드한다.

Web UI의 1차 범위:

- 카테고리별 시작 도구 → 대안·후속 도구의 중첩 tree
- 분기·공유 목적지 지원, 순환 관계는 반복 도구에서 종료(`↩`)
- 검색 결과의 상위 경로를 유지해 관계 맥락 표시
- 중간 도구·말단 도구의 관계 선택과 상세 정보
- 문제·해결·경계·설치 정보
- 검색
- tldr fetch
- 공식 문서 링크

## 블로그 배포

독립 웹 화면은 `web/`, 공통 데이터 원본은 `../reference/cli/catalog.json`에 둔다. 블로그의 화면은 블로그 저장소에서 관리하며, devkit에서는 데이터만 가져간다.

```text
 devkit/cmdtreemap/{web/, catalog.json}
          │
          │ scripts/sync-blog.sh
          ▼
 clang-engineer.github.io/cmdtreemap/
```

데이터를 갱신할 때만 sync script를 사용한다. 블로그 화면 수정은 블로그 저장소에서 수행한다.

```bash
cd /path/to/cmdtreemap
./scripts/sync-blog.sh
```

블로그 저장소 경로가 기본값과 다르면 첫 번째 인자로 지정한다.

```bash
./scripts/sync-blog.sh /path/to/clang-engineer.github.io
```

동기화 대상은 치트시트 메타와 CLI 관계 데이터만이다. 아래 웹 파일 목록은 독립 웹 도구의 구성이다.

```text
index.html
app.js
app.css
catalog.json
```

블로그의 `tools/sync-devkit.py`가 `reference/cheatsheets/catalog.json`과 `reference/cli/catalog.json`만 가져온다. HTML·JS·CSS는 덮어쓰지 않는다.
동기화 시 치트시트 경로와 관계의 도구 참조를 검증한다.
그 외 파일은 삭제하지 않는다.

## 개발 흐름

1. 공통 원본인 `../reference/cli/catalog.json`을 수정한다.
2. CLI TUI에서 관계와 상세 화면을 확인한다.
3. 루트에서 `make test`로 Go·웹·배포 테스트를 실행한다.
4. 로컬 Web 서버에서 tree, 검색, 상세, tldr를 확인한다.
5. `scripts/sync-blog.sh`로 블로그 배포본을 갱신한다.
6. 블로그의 `/cmdtreemap/`에서 다시 확인한다.

## 배포 전 체크리스트

```text
[ ] go test ./...
[ ] go vet ./...
[ ] node --test web/*.test.cjs scripts/*.test.cjs
[ ] go generate
go build -o cmdtreemap .
[ ] node --check web/app.js
[ ] 로컬 Web 서버에서 tree와 상세 화면 확인
[ ] tldr와 공식 문서 링크 확인
[ ] scripts/sync-blog.sh 실행
[ ] 블로그 /cmdtreemap/ 확인
```

이 문서는 일반 명령어 cheatsheet가 아니라 `cmdtreemap`의 구조, 개발 방법, 실행 방법, 배포 흐름을 기록하는 프로젝트 문서다.


## 원본 경로

CLI 데이터 원본은 `../reference/cli/catalog.json`이다. 이 디렉터리의 `catalog.json`은 Go 내장용 생성본이다. 테스트와 실행 전 `make prepare`, 직접 빌드 전 `go generate`로 갱신한다. 웹은 원본을 직접 읽는다. 블로그는 자체 화면과 검색을 유지하며 데이터만 가져간다.
