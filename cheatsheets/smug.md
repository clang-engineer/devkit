# smug Cheatsheet

선언형 YAML로 tmux 세션/윈도우/pane을 부팅하는 매니저 (tmuxinator/tmuxp의 Go 단일 바이너리).
config 파일명 = 세션 이름. config는 `~/.config/smug/<이름>.yml`.

## 명령어

| 명령 | 동작 |
|------|------|
| `smug start <이름>` | 세션 생성 + attach (이미 있으면 그 세션으로 attach) |
| `smug start <이름> --detach` | 세션만 만들고 attach 안 함 (검증용) |
| `smug start <이름> -w win1,win2` | 특정 윈도우만 시작 |
| `smug start <이름> --attach` | tmux 안에서 그 세션으로 클라이언트 전환(switch-client) — `-a` help는 "**Force** switch" |
| `smug stop <이름>` | 세션 종료 |
| `smug list` | `~/.config/smug/`의 config 목록 |
| `smug print > ~/.config/smug/x.yml` | 현재 tmux 세션을 YAML로 역출력 (config 생성) |
| `smug edit <이름>` / `new` / `rm` | config 편집 / 생성 / 삭제 |
| `smug switch <이름>` | `start -a` 별칭 — **tmux 안에서 세션 전환은 이걸로** |
| `smug start <이름> -f <경로>` | 커스텀 config 파일 지정 |

- 버전 확인: `smug --version`은 **없음**. `smug` (인자 없이) 실행하면 상단에 버전 표시.
- **tmux 안에서 전환 함정**: `smug start`는 세션만 만들고 화면을 그 세션으로 **전환하지 않는다**(신규든 기존이든).
  안에서 넘어가려면 `smug switch <이름>`(=`start -a`)을 써야 `switch-client`가 돈다. tmux 밖에선 attach라 전환처럼 보임.

## config 형식

```yaml
session: workspace1
root: ~/                    # 모든 pane 시작 디렉토리
windows:
  - name: server
    layout: main-vertical   # tmux 프리셋 또는 layout 문자열
    panes:
      - {}                  # 빈 pane도 반드시 '- {}' (bare '-'는 null이라 드롭됨)
      - commands:
          - npm run dev      # pane에서 실행할 명령
  - name: editor
    panes:
      - nvim                # 단일 문자열 = 단일 명령 pane
```

- **빈 pane은 `- {}`로.** bare `-`(null)는 smug가 조용히 버려 pane이 안 생긴다.
  (함정 상세: vault `note-smug-empty-pane-trap.md`)
- layout 프리셋: `even-horizontal` `even-vertical` `main-horizontal`
  `main-vertical` `tiled`. 비표준 배치는 tmux layout 문자열로 고정
  (`tmux list-windows`의 `[layout ...]` 문자열을 복사).

## 검증

```sh
smug start x --detach && tmux list-panes -t x:server   # 비대화형에서 구조 확인
```

## 참고

- [smug GitHub](https://github.com/ivaaaan/smug)
- 관련 치트시트: `tmux.md` (세션/윈도우/pane 직접 조작)
