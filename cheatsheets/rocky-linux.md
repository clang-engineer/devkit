# Rocky Linux Cheatsheet

> RHEL 계열(Rocky/Alma/RHEL) 전용 요소만. 배포판 무관 명령은 [linux.md](linux.md).

## 패키지 관리 (dnf)

```bash
sudo dnf install <pkg>          # 설치
sudo dnf remove <pkg>           # 제거
dnf search <keyword>            # 패키지 검색
dnf provides */nginx            # 이 파일을 제공하는 패키지 역추적
sudo dnf update [<pkg>]         # 업데이트 (전체 또는 특정)
dnf history                     # 트랜잭션 이력
sudo dnf history undo <id>      # 특정 트랜잭션 되돌리기
sudo dnf install epel-release   # EPEL 저장소 활성화 (추가 패키지 다수)
dnf repolist                    # 활성 저장소 목록
```

> `dnf`는 `yum`의 후속(RHEL 8+). `yum` 명령도 심볼릭으로 대부분 동작. 세부는 `man dnf`.

## 방화벽 (firewalld)

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=5432/tcp   # 특정 포트
sudo firewall-cmd --reload
sudo firewall-cmd --list-all                         # 현재 규칙 확인
```

## SELinux

```bash
getenforce                                           # 현재 상태 (Enforcing/Permissive/Disabled)
sestatus                                             # 모드·로드된 정책 상세
sudo setenforce 0                                    # 임시 Permissive (재부팅 시 원복 — 원인 격리용)
sudo setsebool -P httpd_can_network_connect 1        # httpd → 백엔드 연결 허용 (불리언, -P=영구)
sudo semanage port -a -t http_port_t -p tcp 8080     # 비표준 포트 허용
```

### 막혔을 때 진단

```bash
sudo ausearch -m avc -ts recent                      # 최근 거부(AVC) 로그
sudo restorecon -Rv /path                            # 파일 컨텍스트를 정책 기본값으로 복원
sudo chcon -t httpd_sys_content_t /path              # 컨텍스트 강제 (restorecon/재라벨 시 사라짐 — 임시)
```

> 순서: ① `setenforce 0`으로 임시 해제해 **원인이 SELinux인지** 확인 → ② `ausearch -m avc`로 거부 내역 → ③ 파일 컨텍스트 문제면 `restorecon`(영구는 `semanage fcontext` 등록 후 restorecon), 포트/기능 문제면 `semanage port`/`setsebool`.
>
> 흔한 사례: httpd/nginx가 백엔드 프록시 연결 시 502 Bad Gateway → `httpd_can_network_connect` 불리언으로 허용.
