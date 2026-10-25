# Terminal TUI 도구 선택

> 터미널에서 반복 작업을 화면과 키보드 중심으로 다루는 도구 지도.  
> 이름보다 실제 작업 대상과 기존 CLI와의 역할 차이를 우선한다.

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
| DB | [Harlequin](https://github.com/tconbeer/harlequin) / [Rainfrog](https://github.com/achristmascarl/rainfrog) / [vim-dadbod-ui](https://github.com/kristijanhusak/vim-dadbod-ui) | SQL 작성과 결과 탐색 | 커넥터, PostgreSQL 특화, 편집기 통합 기준으로 선택 |
| HTTP/API | [Posting](https://github.com/darrenburns/posting) / [ATAC](https://github.com/Julien-cpsn/ATAC) | 터미널 기반 API 요청 | Postman 대체가 필요할 때 |
| GitHub | [gh-dash](https://github.com/dlvhdr/gh-dash) | PR·이슈 대시보드 | gh CLI를 자주 쓸 때 |
| JSON | [fx](https://github.com/antonmedv/fx) | JSON 탐색·필터링 | jq 결과를 대화형으로 볼 때 |
| 네트워크 진단 | [trippy](https://github.com/fujiapple852/trippy) | ping과 traceroute 통합 분석 | 장애 진단 시 유용 |

## DB TUI — 선택과 실행의 경계

```text
여러 DB / adapter → Harlequin (SQL IDE)
PostgreSQL 탐색   → Rainfrog (독립 TUI)
Neovim 안에서 SQL  → vim-dadbod-ui (편집기 플러그인)
자동화·백업       → psql / pg_dump 등 공식 CLI
```

| 도구 | 시작 | 구분할 점 |
|---|---|---|
| [Harlequin](https://github.com/tconbeer/harlequin) | `harlequin` | DB별 adapter·연결 설정 |
| [Rainfrog](https://github.com/achristmascarl/rainfrog) | `rainfrog` | PostgreSQL 중심 탐색·쿼리 |
| [vim-dadbod-ui](https://github.com/kristijanhusak/vim-dadbod-ui) | `:DBUI` | Vim/Neovim 플러그인; 독립 CLI 아님 |

연결 문자열·비밀번호는 공개 저장소에 넣지 않는다. 배치·백업은 DB 공식 CLI로 남긴다.

## 이름이 아닌 작업으로 선택하기

```text
무엇을 반복하는가?
├─ Git 이력·스테이징        → lazygit
├─ 컨테이너 실행·로그       → lazydocker
├─ 이미지 레이어 분석       → dive
├─ SSH 호스트 탐색          → lazyssh 또는 ssh config + fzf
├─ DB 탐색·SQL 작성         → Harlequin / Rainfrog / vim-dadbod-ui
├─ API 요청                 → Posting / ATAC
└─ JSON 결과 탐색           → fx (비대화형 처리라면 jq)
```

`lazy*`는 공통 명령 체계나 공식 제품군이 아니다. 비슷한 이름보다 **대상 리소스·조작 방식·기존 CLI와의 역할 중복**을 비교한다. 새 도구의 지원 플랫폼·커넥터·릴리스 상태는 도입 시점에 공식 저장소에서 확인한다.

## 선택 원칙

1. 이미 쓰는 CLI로 반복 작업이 불편한지 확인한다.
2. 기존 도구와 역할이 겹치는지 확인한다.
3. 지원 플랫폼·프로토콜·DB 커넥터를 확인한다.
4. 최근 릴리스와 이슈 대응 상태를 확인한다.
5. 한동안 직접 사용한 뒤 dotfiles와 cheatsheet에 편입한다.
