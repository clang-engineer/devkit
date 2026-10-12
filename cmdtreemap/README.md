# cmdtreemap

`cmdtreemap`은 CLI 도구의 관계와 변화 흐름을 탐색하는 도구다.
터미널은 tree, 웹은 공통 Devkit 관계도를 사용한다.
같은 `catalog.json`을 기반으로 터미널 TUI와 브라우저 UI를 제공한다.
핵심은 목록이 아니라 `top → htop → btop` 같은 관계 흐름에서 문제·개선점·남은 한계를 파악하는 것이다.
화살표는 데이터에 정의된 대안·보완 등의 관계이며, 실제 출시 연대순을 뜻하지 않는다.

```text
기본 명령어 → 대안 도구 → 문제 → 해결 → 경계 → tldr → 공식 문서
```

도구 변화의 관점, 환경별 선택과 자료 보강 기준은 [CLI reference](../reference/tool-map.md)를 참고한다.

## 관계 이유 표시 원칙

터미널 트리에는 도구 이름 뒤에 핵심 개선점을 표시한다. 웹 지도는 도구와 관계를 선택하면 상세 패널에서 기존 문제·개선점·한계를 확인할 수 있다.

```text
cat
└─ bat — 구문강조 · 줄번호
```

- 트리: `solution`의 쉼표 구분 항목 중 앞의 1~2개를 최대 48자로 요약한다. 개선점이 없으면 이름만 표시한다.
- 상세: `기존 도구의 문제 → 새 도구의 개선점 → 남은 한계` 순서로 전체 내용을 보여준다. 문제가 없으면 `why`를 사용한다.
- 이유나 개선점을 독립 노드로 만들지 않는다. 트리 깊이나 펼치기 단계를 추가하지 않고 도구를 선택한다.
- 이 표시는 데이터에 정의된 대안·보완 관계이며, 실제 탄생 배경이나 계보를 입증하는 것은 아니다.

## 구조와 소유권

Go 모델과 터미널 UI는 `internal/`에서 관리한다. 웹 화면은 저장소 루트의
`src/`를 독립 웹과 블로그가 함께 사용한다. `web/`의 이전 자산 주소는
공통 UI로 이어지는 호환 진입점이며, 별도 렌더러를 유지하지 않는다.

CLI·웹 데이터 원본은 `../reference/catalog.json`이다. Go 내장용
`catalog.json`은 `go generate` 또는 `make prepare`로 생성한다.
치트시트와 문서 링크는 `../reference/catalog.json`에서 연결한다.
전체 디렉터리와 개발 방법은 [저장소 README](../README.md)를 참고한다.

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

```bash
make web
# http://localhost:8080/web/
```

`make web`은 루트 Makefile에 위임한다. 기존 `/cmdtreemap/web/` 주소도 유지하며 두 페이지가
같은 `src/index.js`와 스타일을 사용하며, 별도 프레임워크 빌드는 필요 없다.
지도·검색·확대·축소·상세 패널·tldr·전체 치트시트 링크를 제공한다.
연결선은 정의된 관계이며 출시 순서나 학습 순서가 아니다.

## 블로그 연결

블로그는 공개된 원본 JSON을 브라우저에서 직접 읽는다. 데이터를 블로그에 복제하지 않고 공통 UI의 화면·검색으로 표시한다.

- 공통 카탈로그: `https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json`

원본 변경은 GitHub raw 캐시 갱신 후 다음 페이지 로드에 반영된다. 데이터 변경만으로 블로그를 재배포할 필요는 없다. 네트워크 요청이 실패하면 화면의 다시 시도 버튼을 사용한다. 공통 UI는 `tool_map`과 `cheatsheets`를 하나의 도구 모델로 연결한다. UI 코드는 Devkit에서 관리하며 블로그 빌드가 동일한 소스를 가져간다. JSON 수정은 다음 데이터 조회에 반영되고, JavaScript·CSS 수정은 블로그의 다음 배포에 반영된다. Devkit 커밋만으로 블로그 배포를 자동 실행하지는 않는다.

## 개발 흐름

1. 공통 원본인 `../reference/catalog.json`을 수정한다.
2. CLI TUI에서 관계와 상세 화면을 확인한다.
3. 루트에서 `make test`로 Go·웹·배포 테스트를 실행한다.
4. 로컬 Web 서버에서 관계도, 검색, 상세, tldr를 확인한다.
5. 원본 변경을 devkit에 반영한 뒤 블로그의 `/command-map/`에서 확인한다.

## 배포 전 체크리스트

```text
[ ] go test ./...
[ ] go vet ./...
[ ] make -C .. test-web
[ ] go generate
[ ] go build -o cmdtreemap .
[ ] 공통 src/ 모듈 검사 (CI)
[ ] 로컬 Web 서버에서 tree와 상세 화면 확인
[ ] tldr와 공식 문서 링크 확인
[ ] 블로그 /command-map/ 확인
```

이 문서는 일반 명령어 cheatsheet가 아니라 `cmdtreemap`의 구조, 개발 방법, 실행 방법, 배포 흐름을 기록하는 프로젝트 문서다.
