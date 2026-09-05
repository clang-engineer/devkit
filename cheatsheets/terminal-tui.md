# Terminal TUI 도구 선택

> 터미널에서 반복 작업을 화면과 키보드 중심으로 다루는 도구 지도.  
> 평가는 2026-09 기준이며, 이름보다 실제 사용 영역과 성숙도를 우선한다.

## 먼저 구분할 것

`lazy*`는 하나의 공식 제품군이나 공통 프레임워크가 아니다.

- `lazygit`과 `lazydocker`는 같은 개발자(Jesse Duffield)가 만든 별도 애플리케이션이다.
- `LazyVim`은 Neovim 위에 설정·플러그인·기본 키맵을 구성한 배포판이다.
- `lazyjournal`, `lazyssh`, `lazysql` 등은 각기 다른 개발자가 LazyGit식 UX나 이름을 차용한 프로젝트다.
- 따라서 `lazy`라는 이름 자체를 품질이나 호환성의 보증으로 보면 안 된다.

## 영역별 도구 지도

| 영역 | 우선 검토 | 역할 | 판단 |
|------|-----------|------|------|
| Git | [lazygit](https://github.com/jesseduffield/lazygit) | stage, commit, branch, rebase, stash | 대표 선택 |
| 컨테이너 실행 관리 | [lazydocker](https://github.com/jesseduffield/lazydocker) | 컨테이너·이미지·로그·Compose 관리 | 대표 선택 |
| Docker 이미지 분석 | [dive](https://github.com/wagoodman/dive) | 이미지 레이어와 낭비 용량 분석 | lazydocker와 역할이 다름 |
| systemd·파일 로그 | [lazyjournal](https://github.com/Lifailon/lazyjournal) | journald, 파일, Docker·Podman 로그 탐색 | 서버 운영 시 유용 |
| Kubernetes | [k9s](https://github.com/derailed/k9s) | 클러스터 리소스 탐색·관찰·관리 | Kubernetes를 쓸 때만 |
| 파일 관리 | [Yazi](https://github.com/sxyazi/yazi) | 빠른 파일 탐색과 미리보기 | 대표 선택 |
| 시스템 모니터링 | [btop](https://github.com/aristocratos/btop) | CPU·메모리·디스크·프로세스 확인 | 대표 선택 |
| DB | [Harlequin](https://github.com/tconbeer/harlequin) / [Rainfrog](https://github.com/achristmascarl/rainfrog) | SQL 작성과 결과 탐색 | 커넥터와 편집 UX로 선택 |
| HTTP/API | [Posting](https://github.com/darrenburns/posting) / [ATAC](https://github.com/Julien-cpsn/ATAC) | 터미널 기반 API 요청 | Postman 대체가 필요할 때 |
| GitHub | [gh-dash](https://github.com/dlvhdr/gh-dash) | PR·이슈 대시보드 | gh CLI를 자주 쓸 때 |
| JSON | [fx](https://github.com/antonmedv/fx) | JSON 탐색·필터링 | jq 결과를 대화형으로 볼 때 |
| 네트워크 진단 | [trippy](https://github.com/fujiapple852/trippy) | ping과 traceroute 통합 분석 | 장애 진단 시 유용 |

## `lazy*` 이름으로 추가 검토할 만한 것

### lazyssh

`~/.ssh/config`의 호스트를 찾아 접속하고 관리하는 TUI다.

- 여러 서버 주소와 계정을 자주 바꿔 접속한다면 가치가 있다.
- 이미 `ssh config + fzf/sesh` 흐름이 충분하면 기능이 겹친다.
- LazyGit 수준의 사실상 표준 도구로 보기는 아직 이르다.

### lazysql

크로스 플랫폼 DB TUI지만, DB 도구는 이름보다 다음 조건이 중요하다.

1. 실제 사용하는 DB 드라이버 지원
2. SQL 편집기와 자동완성 품질
3. 결과 그리드 탐색
4. 조회 전용·수정 기능과 안전장치

Vertica 같은 커넥터가 필요하면 Harlequin처럼 플러그인 구조가 명확한 도구를 먼저 본다.

## 현재 우선순위

이미 LazyVim, lazygit, Yazi, btop, tmux를 사용하는 환경이라면 추가 도입 순서는 다음 정도가 적절하다.

1. `Posting` — API 요청을 터미널 안에서 반복할 때
2. `dive` — Docker 이미지 크기와 레이어를 분석할 때
3. `lazyssh` 또는 `sshs` — SSH 대상 서버가 많을 때
4. `fx` — JSON 응답을 자주 탐색할 때
5. `trippy` — 네트워크 장애를 자주 분석할 때

필요가 생기기 전에는 `lazyfetch`, `lazycsv`, `lazyide` 같은 신생 도구를 이름만 보고 추가하지 않는다.

## 선택 원칙

1. 이미 쓰는 CLI로 반복 작업이 불편한지 확인한다.
2. 기존 도구와 역할이 겹치는지 확인한다.
3. 지원 플랫폼·프로토콜·DB 커넥터를 확인한다.
4. 최근 릴리스와 이슈 대응 상태를 확인한다.
5. 한동안 직접 사용한 뒤 dotfiles와 cheatsheet에 편입한다.
