# Atuin Cheatsheet

구조화된 shell history 검색 도구. `Ctrl-R` 검색을 대체하고 명령, 디렉터리, 시간, exit code를 함께 저장한다.

## 30초 요약

```sh
brew install atuin
atuin search docker
atuin search --cwd
atuin stats
atuin import zsh
```

`~/.zshrc`에서는 fzf 등 기존 key binding을 먼저 초기화한 뒤 Atuin을 마지막에 초기화하면 `Ctrl-R`을 Atuin이 가져간다.

```zsh
eval "$(atuin init zsh)"
```

## Mental model

| 기존 | Atuin |
|---|---|
| plain text history | SQLite 기반 구조화 history |
| 문자열 역검색 | command, cwd, session, time 기반 검색 |
| shell별 분산 | 선택적 sync 가능 |

## 자주 쓰는 명령

| 목적 | 명령 |
|---|---|
| 검색 UI 열기 | `atuin search` |
| 키워드 검색 | `atuin search keyword` |
| 현재 디렉터리 기준 검색 | `atuin search --cwd` |
| 통계 보기 | `atuin stats` |
| zsh history 가져오기 | `atuin import zsh` |
| bash history 가져오기 | `atuin import bash` |
| 설정 확인 | `atuin config` |

## Shell 통합

```zsh
# fzf가 Ctrl+T, Alt+C를 먼저 등록
source <(fzf --zsh)

# Atuin이 마지막에 Ctrl-R history search를 가져감
eval "$(atuin init zsh)"
```

역할 분담 예시:

| 키 | 담당 |
|---|---|
| `Ctrl-R` | Atuin history |
| `Ctrl-T` | fzf file picker |
| `Alt-C` | fzf directory picker |

## Sync 주의

Atuin sync를 켜면 command argument도 동기화 대상이 될 수 있다. 토큰, host, 내부 경로가 명령 인자에 자주 남는 환경에서는 sync 전에 history filtering 정책을 먼저 정한다.

## 문제 해결

| 증상 | 확인 |
|---|---|
| `Ctrl-R`이 fzf history로 열림 | `atuin init`을 fzf 초기화보다 뒤에 둔다 |
| 명령이 검색되지 않음 | 새 shell에서 실행했는지, import가 필요한지 확인 |
| 민감 정보가 걱정됨 | sync 비활성 또는 filtering 설정 검토 |

## 관련

- 공식 문서: <https://docs.atuin.sh/>
- 저장소: <https://github.com/atuinsh/atuin>
