# Linux Cheatsheet

> 디렉터리 구조(FHS) + 자원 모니터링 + 네트워크 명령어 통합.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 메모리 / 디스크 | `free -h` / `df -h` |
| 디렉터리 용량 큰 순 | `du -sh * \| sort -hr \| head` |
| CPU 사용률 | `top` / `htop` |
| 인터페이스 + IP | `ip a` (구식: `ifconfig`) |
| 열린 포트 + 프로세스 | `ss -tulnp` |
| 라우팅 테이블 | `ip r` |
| DNS 직접 질의 | `dig <domain>` |
| OS resolver 경로 (`/etc/hosts` 포함) | `getent hosts <domain>` |
| 포트 열림 확인 | `nc -zv <ip> <port>` |
| 부팅 후 로그 | `journalctl -b` (이전: `-b -1`) |

## 디렉터리 구조

### 최상위

| 디렉터리 | 어원 | 설명 |
|----------|------|------|
| `/` | | 파일 시스템 계층의 루트 |
| `/bin` | **bin**aries | 필수 명령어 실행 파일 (`cat`, `ls`, `cp`) |
| `/boot` | **boot**strap | 부트 로더 파일 (커널, `initrd`) |
| `/dev` | **dev**ices | 장치 파일 (`/dev/null`, `/dev/sda1`) |
| `/etc` | **et c**etera | 시스템 설정 파일 |
| `/home` | **home** directory | 사용자 홈 디렉터리 |
| `/lib` | **lib**raries | `/bin`, `/sbin` 실행 파일용 라이브러리 |
| `/media` | removable **media** | 이동식 미디어 마운트 지점 |
| `/mnt` | **m**ou**nt** | 일시 마운트 |
| `/opt` | **opt**ional | 추가 애플리케이션 패키지 |
| `/proc` | **proc**esses | 프로세스/커널 정보 가상 FS |
| `/root` | **root** home | 루트 사용자 홈 |
| `/run` | **run**time data | 부팅 이후 런타임 정보 |
| `/sbin` | **s**ystem **bin**aries | 시스템 관리자용 (`fsck`, `init`) |
| `/srv` | **s**e**rv**ice data | 서비스 데이터 |
| `/sys` | **sys**tem (sysfs) | 장치/드라이버/커널 정보 |
| `/tmp` | **t**e**mp**orary | 임시 파일 (재부팅 시 삭제 가능) |
| `/var` | **var**iable | 가변 데이터 (로그, DB) |
| `/usr` | **U**nix **S**ystem **R**esources | 사용자 프로그램/라이브러리 |

### `/etc` 하위

| 경로 | 설명 |
|------|------|
| `/etc/opt` | `/opt` 패키지 설정 |
| `/etc/systemd` | systemd 설정 |

### `/usr` 하위

| 경로 | 설명 |
|------|------|
| `/usr/bin` | 비필수 실행 파일 |
| `/usr/lib` | `/usr/bin`, `/usr/sbin`용 라이브러리 |
| `/usr/local` | 호스트 특화 프로그램 |
| `/usr/sbin` | 비필수 시스템 바이너리 |

### `/var` 하위

| 경로 | 설명 |
|------|------|
| `/var/cache` | 응용 프로그램 캐시 |
| `/var/lib` | 응용 프로그램 영구 데이터 (DB 등) |
| `/var/log` | 로그 파일 |
| `/var/run` | 부팅 이후 시스템 정보 (FHS 3.0에서 `/run`으로 대체) |
| `/var/tmp` | 재부팅 후에도 유지되는 임시 파일 |

> [Filesystem Hierarchy Standard](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard)

---

## 자원 모니터링

### CPU

```sh
mpstat | tail -1 | awk '{print 100-$NF}'                   # CPU 사용률 (%)
top -b -n1 | grep -Po '[0-9.]+ id' | awk '{print 100-$1}'  # top 기반
uptime                                                      # 로드 평균
```

### 메모리

```sh
free -h                                # 메모리 사용량
cat /proc/meminfo | grep Mem           # 상세 정보
sar -r 1                               # 통계 (sysstat)
```

### 디스크

```sh
df -h                                  # 파일시스템 사용량
du -sh *                               # 폴더별 용량
du -sh * | sort -hr | head -10         # 용량 큰 순
iostat -x 1                            # 디스크 I/O (sysstat)
```

### 프로세스

```sh
ps aux                                 # 전체 프로세스
ps aux | grep <name>                   # 특정 프로세스
top                                    # 실시간 모니터
htop                                   # 향상 버전
```

> 프로세스 찾기·종료(`pgrep`/`pkill`/`lsof`/시그널 표, TERM→대기→KILL 관행)는
> [linux-process.md](linux-process.md)에서 전담. `kill -9`을 처음부터 쓰지 않는 이유도 거기.

### 종합 모니터링 도구

| 도구 | 설명 |
|------|------|
| `nmon` | CPU/메모리/디스크/네트워크 통합 TUI (`c`/`m`/`d`/`n` 키 전환) |
| `atop` | 상세 모니터링 + 로그 기록/분석 |
| `htop` | 향상된 프로세스 모니터 |
| `Netdata` | 웹 기반 실시간 대시보드 |

### 로그 파일

> 아래는 **RHEL 계열**(Rocky/CentOS/RHEL) 경로. Debian/Ubuntu는 다르다 —
> `messages`→`syslog`, `secure`→`auth.log`, `maillog`→`mail.log`, cron은 syslog로.

| 경로 | 설명 | 확인 |
|------|------|------|
| `/var/log/messages` | 시스템 전반 메시지 | `tail -f` |
| `/var/log/secure` | 인증 로그 (ssh, sudo) | `tail -f` |
| `/var/log/boot.log` | 부팅 로그 | `cat` |
| `/var/log/cron` | cron 작업 로그 | `tail -f` |
| `/var/log/maillog` | 메일 로그 | `tail -f` |
| `/var/log/wtmp` | 로그인/로그아웃 (바이너리) | `last` |
| `/var/log/btmp` | 로그인 실패 (바이너리) | `lastb` |
| `/var/log/lastlog` | 최종 로그인 (바이너리) | `lastlog` |
| `/var/run/utmp` | 현재 로그인 사용자 (바이너리) | `who` |

---

## 네트워크

### 연결 확인

| 명령어 | 설명 |
|---|---|
| `ping <주소>` | 호스트 응답 확인 |
| `traceroute <주소>` | 경로 확인 |
| `mtr <주소>` | ping + traceroute, 실시간 패킷 손실 |
| `dig <도메인>` | DNS 조회 (권장) |
| `nslookup <도메인>` | DNS 조회 (구식) |
| `whois <도메인>` | 도메인 등록 정보 |
| `curl -I <URL>` | 응답 헤더 확인 |
| `nc -zv <IP> <포트>` | 포트 열림 확인 |
| `telnet <IP> <포트>` | 포트 접속 시도 |

### 상태 확인

| 명령어 | 설명 |
|---|---|
| `ip a` / `ip addr` | 인터페이스 및 IP |
| `ip r` / `ip route` | 라우팅 테이블 |
| `ss -tulnp` | 열린 포트 + 프로세스 |
| `arp -a` | ARP 테이블 |
| `hostname -I` | 현재 호스트 IP |
| `lsof -i :<port>` | 포트 사용 프로세스 |
| `ifstat` | 인터페이스 입출력 통계 |
| `netstat -i` | 인터페이스 통계 (레거시) |

### DNS 조회 도구의 차이

| 도구 | 참조 대상 | `/etc/hosts` 사용 |
|---|---|---|
| `nslookup`, `dig` | DNS 서버 직접 질의 | ❌ |
| `ping`, `curl`, 브라우저 | OS resolver | ✅ |

내부 전용 도메인을 `/etc/hosts`에만 등록한 경우, `nslookup`/`dig`로는 확인 불가.

```bash
# OS resolver 경로로 조회 (hosts/캐시 포함)
dscacheutil -q host -a name <도메인>      # macOS
getent hosts <도메인>                      # Linux
```

### dig 자주 쓰는 패턴

```bash
dig example.com                          # 기본 A 레코드
dig example.com +short                   # IP만 한 줄로
dig example.com MX                       # 메일 서버
dig example.com TXT                      # SPF / DKIM 등
dig example.com NS                       # 네임서버
dig example.com ANY                      # 전부 (점점 제한적)
dig @8.8.8.8 example.com                 # 특정 DNS 서버에 질의
dig +trace example.com                   # 루트부터 위임 추적 (디버그)
dig -x 8.8.8.8                           # reverse (IP → 도메인)
dig +noall +answer example.com           # 답변 섹션만
dig example.com +tcp                     # UDP 대신 TCP

# DNSSEC 확인
dig example.com +dnssec
```

> 동일 기능 모던 대안: `kdig` (knot-dnsutils 패키지), `delv` (DNSSEC 검증 우선).

### curl vs wget

| 특징 | curl | wget |
|---|---|---|
| 기본 목적 | 데이터 전송 (요청/응답) | 파일 다운로드 |
| 프로토콜 | HTTP/HTTPS/FTP/SCP/SFTP 등 | HTTP/HTTPS/FTP |
| 재시도 | `--retry` 옵션 필요 | 기본 자동 재시도 |
| 이어받기 | `-C -` 옵션 | 기본 지원 |
| POST | `-X POST -d "data"` | 제한적 |
| 백그라운드 | 직접 설정 | `-b` 옵션 |

---

## sudo 권한 부여

두 갈래 — 관리 그룹에 넣거나, sudoers에 직접 규칙을 쓴다.

### 그룹에 추가 (간단, 사실상 root 전권)

배포판 기본 sudoers에 "특정 그룹 = 모든 명령" 규칙이 들어 있어 그룹만 넣으면 열린다.

```bash
sudo usermod -aG sudo username    # Debian/Ubuntu
sudo usermod -aG wheel username   # RHEL/CentOS/Rocky/Alma
```

- `-a`(append) 빼면 기존 그룹이 날아가니 항상 `-aG`.
- 반영은 **재로그인** 후.

### sudoers 직접 명시 (최소 권한)

편집은 반드시 `visudo` — 저장 시 문법 검사로 잠김 사고를 막는다.

```bash
sudo visudo
sudo visudo -f /etc/sudoers.d/username   # sudoers.d에 두면 관리·롤백 쉬움
```

```
username    ALL=(ALL:ALL) ALL                      # 전체 권한
username    ALL=(ALL:ALL) NOPASSWD: ALL             # 비밀번호 없이
username    ALL=(ALL) /usr/bin/systemctl restart nginx   # 특정 명령만
```

- `sudoers.d` 파일은 권한 `0440`, 파일명에 `.`이나 `~`가 들어가면 무시된다.

### 확인

```bash
sudo -l -U username    # 해당 사용자의 실제 권한 출력
```
