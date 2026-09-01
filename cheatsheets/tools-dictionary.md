# Tools Dictionary

> CLI 도구/개념 사전 + 핵심 명령어. 상세는 `tldr <명령어>` 참고.

## CLI 도구

### 네트워크/요청

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| curl | HTTP/FTP/SCP 요청 | `curl -s URL \| jq`, `-H "Authorization: Bearer $TOKEN"`, `-o file -L`, `-I`(헤더만), `-w '%{http_code}'` |
| openssl | 인증서·키 발급/변환 | `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"` |
| nginx | 웹 서버 + 리버스 프록시 | `nginx -t`(검증), `nginx -s reload`(무중단), `nginx -T`(전체 설정), `/etc/nginx/conf.d/*.conf` |

### 컨테이너/배포

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| docker | 컨테이너 + 이미지 + Compose | `docker run --rm -d -p 8080:80 --name x x`, `docker exec -it x bash`, `docker logs -f x`, `docker compose up -d` |
| kubectl | Kubernetes CLI | `kubectl get pods -A`, `kubectl logs -f x`, `kubectl exec -it x -- bash`, `kubectl apply -f x.yml`, `kubectl rollout undo deploy/x` |

### 검색/필터

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| rg | `grep -r` 대체 (Rust) | `rg "pattern"`, `-t py`(파일타입), `-g '*.js'`(glob), `-C 3`(컨텍스트), `--pcre2`(lookaround) |
| fzf | 범용 fuzzy finder | `Ctrl+R`(히스토리), `Ctrl+T`(파일), `Alt+C`(cd), `... \| fzf`, `-m`(멀티) |
| jq | JSON 가공 | `jq '.key'`, `.items[]`, `select(.active)`, `map({id,name})`, `-r`(raw), `-c`(compact) |

### 텍스트 처리

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| sed | 라인 단위 치환/삭제 | `sed 's/old/new/g' file`, `-i`(원본수정), `/pattern/d`, `-n '5,10p'`, `-E`(ERE) |
| awk | 필드 단위 처리 | `awk '{print $1}'`, `-F,`, `NR>1`, `{sum+=$1} END{print sum}`, `!seen[$0]++` |
| tar/gzip/zip | 압축/해제 | `tar -czf out.tar.gz dir/`, `tar -xzf in.tar.gz`, `-C /target`, `zip -r out.zip dir/` |

### Git/버전 관리

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| gh | GitHub CLI | `gh pr create --fill`, `gh pr merge 123 --squash`, `gh pr status`, `gh run watch`, `gh api` |

### 편집/IDE

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| bat | `cat` 대체 (구문 강조) | `bat file.sh`, `-l json`, `-p`(plain), `--diff`, `-r 50:100` |
| eza | `ls` 대체 (git+트리) | `eza -lh --git`, `-T -L 2`(트리), `--icons`, `--group-directories-first` |
| fd | `find` 대체 | `fd config`, `-e lua`, `-E node_modules`, `-X rm`(batch) |
| gdb | GNU 디버거 | `gdb ./prog`, `run`(r), `break main`(b), `next`(n), `step`(s), `print var`(p), `backtrace`(bt) |
| make | 빌드 자동화 | `make`, `make target`, `make -n`(dry-run), `.PHONY:`, `$@`/`$<`/`$^` |

### 유틸리티

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| tree | 디렉터리 구조 | `tree -L 2`, `-d`(디렉터리만), `-I "node_modules\|.git"` |
| zoxide | `cd` 대체 (빈도 학습) | `z foo`, `-`(직전), `zi`(fzf 선택) |
| delta | `git diff` 페이저 | `side-by-side = true`, `navigate = true`, `line-numbers = true` |
| starship | 크로스 플랫폼 프롬프트 | `starship init zsh`, `starship config` |

## Linux/시스템

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| systemctl | 서비스 관리 | `systemctl start/stop/restart/enable/disable x`, `systemctl status x`, `systemctl list-units --type=service` |
| journalctl | 로그 조회 | `journalctl -u x -f`(follow), `-since "1h"`, `--priority=err`, `-b`(부팅 후) |
| pgrep/pkill | 프로세스 검색/종료 | `pgrep -x nginx`, `pkill -f "python app"`, `pgrep -l`(이름 출력) |
| lsof | 열린 파일/포트 | `lsof -i :80`, `lsof -u alice`, `lsof +D /path`(재귀) |
| fuser | 포트 점유 프로세스 | `fuser 8080/tcp`, `-k`(kill) |
| linux 디렉터리 | FHS | `/etc`(설정), `/var`(로그), `/home`, `/opt`, `/tmp` |
| linux 모니터링 | 자원 확인 | `free -h`, `df -h`, `top`(htop), `iostat`, `ss -tlnp` |

## macOS

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| launchctl | 서비스/데몬 관리 | `launchctl load/unload ~/Library/LaunchAgents/x.plist`, `launchctl list` |
| defaults | 시스템 설정 | `defaults read com.apple.x`, `defaults write com.apple.x key -bool true` |
| 디스크 정리 | 저장공간 | `du -sh *`, `brew cleanup`, `~/Library/Caches` 정리 |

## 데이터베이스

| 도구 | 설명 | 핵심 명령어 |
|------|------|------------|
| harlequin | 터미널 SQL IDE | `harlequin --profile x`, `--config-path`, `hsql -P x -c "select 1"`, `--keys`(키맵 확인) |
| PostgreSQL | 모니터링 쿼리 | `pg_stat_activity`(세션), `pg_size_pretty(pg_database_size())`, `pg_locks`(락) |
| elasticsearch | 검색 엔진 API | `_cat/health`, `_cat/indices`, `_search`, `_count`, `_delete_by_query` |
| kibana | ES 시각화 UI | KQL: `field:value`, `message:"exact"`, `bytes >= 1000`, `not field:x`. Dev Tools: `Ctrl+Enter` |

### Elasticsearch curl↔Dev Tools 변환

| curl | Dev Tools |
|------|-----------|
| `curl -XGET "HOST:9200/INDEX/_search"` | `GET INDEX/_search` |
| `-H 'Content-Type: application/json'` | 생략 (자동) |
| `-d '{...}'` | 다음 줄에 JSON 그대로 |

### KQL 핵심 문법

| 패턴 | 예시 |
|------|------|
| 정확 일치 | `response:200` |
| 구문 매칭 | `message:"quick brown"` |
| 범위 | `bytes >= 1000 and bytes < 5000` |
| 부정 | `not response:200` |
| 그룹 | `response:(200 or 404)` |
| 와일드카드 | `field:value*` (`*`만 지원, `?`는 미지원) |

## 개념/참조

| 항목 | 설명 | 참고 |
|------|------|------|
| Regex | 정규표현식 문법 + 플레이버 | BRE(`grep`), ERE(`grep -E`), PCRE(`rg --pcre2`). `\d \w lookaround`는 PCRE만 |
| TOML | 설정 파일 형식 | `key = 값`, `[table]`(객체), `[[array]]`(객체 배열). toml.io |
| Code Review | PR/MR 약어 | LGTM(승인), PTAL(확인요청), nit:(사소한), blocker(머지차단) |

## Modern CLI Alias 가이드

| 패턴 | 권장 | 비고 |
|------|------|------|
| `ll = eza -l`, `la`, `lt` | 안전 | ls 자체는 건드리지 않음 |
| `cat = bat` | 시범 도입 | `--paging=never`로 surprise 최소화 |
| `grep = rg` | **하지 않음** | 옵션 다름 |
| `find = fd` | **하지 않음** | 문법 자체가 다름 |

```bash
# zsh 예시
alias ll='eza -lh --git --group-directories-first --icons'
alias cat='bat --paging=never'
eval "$(starship init zsh)"
eval "$(zoxide init zsh)"
source <(fzf --zsh)
```

## 관련 cheatsheet

개인 워크플로우·심화 내용은 개별 파일 참조:

- git → git.md (worktree, reflog 복구, stash 등)
- ssh → ssh.md (config 다중 계정 패턴)
- chezmoi → chezmoi.md (dotfiles 관리)
- powershell → powershell.md (Bash→PS 마이그레이션)
- shell/zsh → shell.md, zsh.md (heredoc/배열/확장)
- vim/tmux/lazyvim/lazygit/ghostty/yazi → 에디터 & TUI 그룹
- aerospace/hammerspoon/macos-admin → macOS 그룹
