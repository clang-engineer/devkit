# systemd & journalctl Cheatsheet

> Linux 서비스/타이머/로그의 표준. 부팅·자동시작·재시작 정책·로그 조회 한 곳.

## 관리 대상과 상태

```text
Unit 정의 (.service / .timer) [1]
        │ daemon-reload : Manager가 정의 다시 읽음
        ▼
systemd Manager
   ├─ Service Unit ── start/stop ──> 프로세스 상태 [2]
   │       ▲
   │       └── Timer Unit ── 일정 도달 ── 활성화 [3]
   └─ enable/disable : 부팅·타깃과의 연결 설정 [2]

실행 결과·로그 ──> Journal ── journalctl 조회 [4]
```
**start와 enable은 다르다.** `start`는 지금 실행하고, `enable`은 자동 시작 연결을 설정한다. `daemon-reload`는 Unit 정의를 다시 읽지만 서비스를 재시작하지 않는다.

```sh
systemctl start app.service
systemctl enable app.service
systemctl status app.service
journalctl -u app.service -f  # -u: unit, -f: follow
```

Timer는 일정에 따라 연결된 Service를 활성화하는 별도 Unit이다. **enable은 지금 실행한다는 뜻이 아니고, daemon-reload는 재시작이 아니다.** `systemctl`은 Unit을 제어하고 `journalctl`은 기록을 읽는다.

## 1. Unit 정의 — 파일과 우선순위

Unit은 서비스·타이머 등의 **선언된 관리 대상**이다. 파일을 수정했다면 `daemon-reload`로 정의를 다시 읽게 하고, 실제 서비스 실행 상태는 별도로 관리한다.

### 서비스 파일 위치

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

### 서비스 파일 구조

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

## 2. Unit 상태 — systemctl

`start`·`stop`은 **지금 실행**, `enable`·`disable`은 **자동 시작 연결**, `status`는 **관찰**이다.

### 대표 명령

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

### 서비스 삭제

서비스가 실제로 이 경로의 **관리자 정의 Unit**인지 먼저 확인한다. 패키지 소유 Unit을 임의로 삭제하지 않는다. 시스템 Unit 수정에는 관리자 권한이 필요하다.

```bash
# 시스템 서비스
systemctl stop <service>
systemctl disable <service>
sudo rm /etc/systemd/system/<service>.service
systemctl daemon-reload
systemctl reset-failed

# 사용자 서비스
systemctl --user stop <service>
systemctl --user disable <service>
rm ~/.config/systemd/user/<service>.service
systemctl --user daemon-reload
systemctl --user reset-failed
```

### 사용자 서비스 유지 (로그아웃 후에도)

```bash
loginctl enable-linger {username}
```

---

## 3. 예약 실행 — Timer

**Timer → Service → Process**의 관계를 기억한다. Timer는 스케줄을 선언하고 연결된 Service를 활성화한다. Timer 자체가 작업 명령을 실행하는 Service를 대체하지는 않는다.

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
# 매일 03:00 (cron: 0 3 * * *)
OnCalendar=*-*-* 03:00:00
# 0~10분 사이 지연
RandomizedDelaySec=10m
# 비활성 기간에 놓친 일정이 있으면 재활성화 시 한 번 보정
Persistent=true
# 생략하면 같은 이름의 .service 사용
Unit=backup.service

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
- `Persistent=true`는 timer 비활성 기간의 누락 실행을 재활성화 시 한 번 보정
- Unit 의존성은 `Requires=` 등으로 표현하며, 실행 순서는 `After=` 등으로 별도 지정
- `OnBootSec=`, `OnUnitActiveSec=` 같은 상대 시간 표현

---

## 4. 기록 관찰 — journalctl

`systemctl`이 Unit의 상태를 제어한다면 `journalctl`은 기록을 조회한다.

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
