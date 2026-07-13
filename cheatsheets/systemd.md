# systemd & journalctl Cheatsheet

> Linux 서비스/타이머/로그의 표준. 부팅·자동시작·재시작 정책·로그 조회 한 곳.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 서비스 시작·정지·재시작 | `systemctl start/stop/restart <svc>` |
| 무중단 리로드 | `systemctl reload <svc>` |
| 상태·최근 로그 | `systemctl status <svc>` |
| 부팅 자동 시작 | `systemctl enable [--now] <svc>` |
| 서비스 파일 수정 후 | `systemctl daemon-reload` |
| 실시간 로그 | `journalctl -f -u <svc>` |
| 에러만 | `journalctl -p err -u <svc>` |
| 어제 이후 | `journalctl --since yesterday` |
| 부팅별 로그 | `journalctl -b` (직전 부팅: `-b -1`) |
| 사용자 서비스 | `systemctl --user ...` |
| 등록된 타이머 + 다음 실행 | `systemctl list-timers --all` |

## 서비스 파일 위치

### 시스템 유닛 (우선순위 높은 순)

| 경로 | 용도 |
|------|------|
| `/etc/systemd/system/` | 관리자가 직접 정의/오버라이드 |
| `/run/systemd/system/` | 런타임 유닛 (재부팅 시 사라짐) |
| `/usr/lib/systemd/system/` | 패키지 매니저가 설치하는 벤더 기본값 |

### 사용자 유닛 (우선순위 높은 순)

| 경로 | 용도 |
|------|------|
| `~/.config/systemd/user/` | 해당 사용자만 |
| `/etc/systemd/user/` | 모든 사용자 대상 (관리자 설정) |
| `/usr/lib/systemd/user/` | 패키지 제공 사용자 유닛 |

## 서비스 파일 구조

```ini
[Unit]
Description=Service Description
After=network.target

[Service]
ExecStart=/home/{username}/{path_to_script}
WorkingDirectory=/home/{username}
User={username}
Group={groupname}
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## systemctl 명령어

| 명령어 | 설명 |
|--------|------|
| `systemctl start <service>` | 서비스 시작 |
| `systemctl stop <service>` | 서비스 종료 |
| `systemctl restart <service>` | 서비스 재시작 |
| `systemctl status <service>` | 서비스 상태 확인 |
| `systemctl enable <service>` | 부팅 시 자동 시작 |
| `systemctl disable <service>` | 자동 시작 해제 |
| `systemctl daemon-reload` | 서비스 파일 변경 시 데몬 리로드 |
| `systemctl is-enabled <service>` | 자동 시작 여부 확인 |
| `systemctl reset-failed` | 실패한 서비스 상태 초기화 |

> 사용자 서비스: `systemctl --user start myapp.service`

## 서비스 삭제

```bash
# 시스템 서비스
systemctl stop <service>
systemctl disable <service>
rm /etc/systemd/system/<service>.service
systemctl daemon-reload
systemctl reset-failed

# 사용자 서비스
systemctl --user stop <service>
systemctl --user disable <service>
rm ~/.config/systemd/user/<service>.service
systemctl --user daemon-reload
systemctl --user reset-failed
```

## 사용자 서비스 유지 (로그아웃 후에도)

```bash
loginctl enable-linger {username}
```

---

## Timer (cron 대체)

`.service` + `.timer` 파일 한 쌍. `.timer`가 일정에 맞춰 `.service`를 실행.

### 파일 구조

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Daily Backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup daily

[Timer]
OnCalendar=*-*-* 03:00:00         # 매일 03:00 (cron의 `0 3 * * *`)
RandomizedDelaySec=10m             # 0~10분 사이 랜덤 지연 (서버 부하 분산)
Persistent=true                    # 머신 꺼져 있던 시간의 누락분 다음 부팅 시 실행
Unit=backup.service                # 생략하면 동일 이름의 .service

[Install]
WantedBy=timers.target
```

### 등록 / 관리

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer       # 등록 + 즉시 활성

systemctl list-timers --all                    # 등록된 모든 타이머 + 다음 실행 시각
systemctl status backup.timer                  # 상태
journalctl -u backup.service                   # 실행 로그
```

### OnCalendar 표현 (cron 비교)

| cron | systemd OnCalendar |
|---|---|
| `0 3 * * *` | `*-*-* 03:00:00` |
| `*/15 * * * *` | `*:0/15` |
| `0 9 * * 1-5` | `Mon-Fri 09:00` |
| `0 0 1 * *` | `*-*-01 00:00:00` |

검증: `systemd-analyze calendar "Mon-Fri 09:00"` — 다음 실행 시각 계산.

### cron 대비 장점

- 로그가 `journalctl -u <name>`로 다른 systemd 유닛과 동일 위치
- `Persistent=true`로 머신 꺼져있던 시간 보정
- `Requires=`로 의존성 표현
- `OnBootSec=`, `OnUnitActiveSec=` 같은 상대 시간 표현

---

## journalctl

systemd 로그 조회 도구.

### 기본 조회

```bash
journalctl                       # 전체 로그
journalctl -n 20                 # 최근 20개
journalctl -x -e                 # 마지막 로그부터 상세히
journalctl --no-pager            # 페이저 없이 출력
```

### 실시간 로그

```bash
journalctl -f                    # tail -f 처럼
journalctl -f -u <service>       # 특정 서비스
```

### 필터링

```bash
# 특정 서비스
journalctl -u <service>

# 특정 PID
journalctl _PID=872

# 로그 우선순위 (emerg, alert, crit, err, warning, notice, info, debug)
journalctl -p err

# 날짜/시간
journalctl --since "2024-01-09"
journalctl --since "2024-01-09" --until "2024-01-11"
journalctl --since yesterday
journalctl --since "-2hour"
```

### 조합 예시

```bash
# 특정 서비스 + 최근 50개 + 오류만
journalctl -u my-service -n 50 -p err
```
