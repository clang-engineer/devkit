# cmdtreemap

CLI 명령어의 진화 관계를 인터랙티브 TUI로 탐색하는 도구.

## 실행

```bash
cd ~/Desktop/_zero/devkit/cmdtreemap
go run .
```

또는 빌드 후 실행:

```bash
go build -o cmdtreemap .
./cmdtreemap
```

## 키보드 단축키

| 키 | 동작 |
|---|---|
| `↑`/`k`, `↓`/`j` | 이동 |
| `Enter` | 상세 보기 |
| `/` | 검색 |
| `t` | tldr 보기 (상세 화면) |
| `b`, `Esc` | 뒤로 |
| `q`, `Ctrl+C` | 종료 |
