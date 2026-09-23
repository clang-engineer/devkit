# cmdtreemap

`cmdtreemap`은 CLI 도구의 관계와 진화 흐름을 tree로 탐색하는 도구다.
같은 `commands.json`을 기반으로 터미널 TUI와 브라우저 UI를 제공한다.

```text
기본 명령어 → 대안 도구 → 문제 → 해결 → 경계 → tldr → 공식 문서
```

## 디렉터리 구조

```text
cmdtreemap/
├── main.go                    # CLI 진입점
├── internal/
│   ├── model/                 # CLI·Web이 공유하는 데이터 구조
│   └── tui/                   # Bubble Tea 기반 터미널 UI
├── scripts/
│   ├── build-web.sh           # Web WASM·런타임 빌드
│   └── sync-blog.sh           # Web 산출물 빌드·블로그 동기화
└── web/
    ├── main.go                # Go WASM 진입점
    ├── index.html             # Web 진입점
    ├── app.js                 # DOM 생성·tree·상세 화면·검색
    ├── app.css                # CLI Web UI 공통 스타일
    ├── commands.json          # CLI·Web 공통 데이터 원본
    ├── wasm_exec.js           # Go WASM 브라우저 런타임
    └── cmdtreemap.wasm        # Web용 WASM 산출물
```

## 구현 역할

- `internal/model`: 데이터 구조를 공유한다.
- `internal/tui`: TTY와 Bubble Tea를 사용하는 CLI 화면을 담당한다.
- `web/main.go`: 브라우저에서 WASM을 로드하기 위한 최소 Go adapter다.
- `web/app.js`: mount point 내부의 markup, tree, 검색, 상세 화면을 담당한다.
- `web/app.css`: 독립 Web 페이지와 블로그 탭이 함께 사용하는 스타일이다.
- `web/commands.json`: CLI·Web 공통 데이터의 유일한 원본이다. Web은 직접 읽고 CLI는 `main.go`의 `go:embed`로 빌드에 포함한다. 데이터 생성·복사 단계는 없다.

Web UI는 Bubble Tea TUI를 브라우저에서 그대로 실행하지 않는다. 브라우저에는 TTY가 없으므로, 데이터와 모델은 공유하고 화면은 DOM으로 별도 구현한다.

## CLI 실행

개발 중에는 프로젝트 루트에서 실행한다.

```bash
cd ~/Desktop/_zero/devkit/cmdtreemap
go run .
```

빌드 후 실행하려면:

```bash
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

WASM과 브라우저 런타임을 준비한다. 데이터는 `web/commands.json`을 그대로 사용한다.

```bash
./scripts/build-web.sh
```

그다음 정적 서버를 실행한다. `file://`로 직접 열면 `fetch`와 WASM 로딩이 제한될 수 있다.

```bash
cd web
python3 -m http.server 8080
```

브라우저에서 [http://localhost:8080](http://localhost:8080)을 연다.
데이터만 수정했다면 Web 재빌드 없이 새로고침한다. CLI 바이너리에 반영하려면 다시 빌드한다.

Web UI의 1차 범위:

- 카테고리·그룹·명령어 tree
- 관계 선택과 상세 정보
- 문제·해결·경계·설치 정보
- 검색
- tldr fetch
- 공식 문서 링크

## WASM 빌드

Web 진입점만 WASM으로 빌드한다. 기존 CLI 빌드와는 별도 대상이다.
빌드 스크립트는 WASM과 런타임만 갱신하며, 블로그 동기화도 같은 스크립트를 사용한다.

```bash
./scripts/build-web.sh
```

빌드 전제:

```text
GOOS=js
GOARCH=wasm
```

현재 WASM adapter는 브라우저와 Go를 연결하는 최소 진입점이다. Bubble Tea의 TTY lifecycle은 Web에서 사용하지 않는다.

## 블로그 배포

개발 원본은 이 저장소의 `web/`에 둔다. 블로그의 `cmdtreemap/`은 GitHub Pages가 제공하는 정적 배포본이다.

```text
 devkit/cmdtreemap/web/
          │
          │ scripts/sync-blog.sh
          ▼
 clang-engineer.github.io/cmdtreemap/
```

블로그 파일을 직접 수정하지 않고 sync script를 사용한다.

```bash
cd ~/Desktop/_zero/devkit/cmdtreemap
./scripts/sync-blog.sh
```

블로그 저장소 경로가 기본값과 다르면 첫 번째 인자로 지정한다.

```bash
./scripts/sync-blog.sh /path/to/clang-engineer.github.io
```

동기화 대상은 Web 실행에 필요한 파일만이다.

```text
index.html
app.js
app.css
commands.json
wasm_exec.js
cmdtreemap.wasm
```

## 개발 흐름

1. 공통 원본인 `web/commands.json`을 수정한다.
2. CLI TUI에서 관계와 상세 화면을 확인한다.
3. `go test ./...`와 `node --test web/app.test.cjs`를 실행한다.
4. WASM·런타임 갱신이 필요하면 `./scripts/build-web.sh`를 실행한다.
5. 로컬 Web 서버에서 tree, 검색, 상세, tldr를 확인한다.
6. `scripts/sync-blog.sh`로 블로그 배포본을 갱신한다.
7. 블로그의 `/cmdtreemap/`에서 다시 확인한다.

## 배포 전 체크리스트

```text
[ ] go test ./...
[ ] go vet ./...
[ ] node --test web/app.test.cjs
[ ] go build -o cmdtreemap .
[ ] ./scripts/build-web.sh
[ ] node --check web/app.js
[ ] 로컬 Web 서버에서 tree와 상세 화면 확인
[ ] tldr와 공식 문서 링크 확인
[ ] scripts/sync-blog.sh 실행
[ ] 블로그 /cmdtreemap/ 확인
```

이 문서는 일반 명령어 cheatsheet가 아니라 `cmdtreemap`의 구조, 개발 방법, 실행 방법, 배포 흐름을 기록하는 프로젝트 문서다.
