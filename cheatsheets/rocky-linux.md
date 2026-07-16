# Rocky Linux Cheatsheet

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
getenforce                                           # 현재 상태 확인
sudo setsebool -P httpd_can_network_connect 1        # httpd → 백엔드 연결 허용
sudo semanage port -a -t http_port_t -p tcp 8080     # 비표준 포트 허용
```

SELinux가 켜진 상태에서 httpd/nginx의 백엔드 프록시 연결을 막으면 502 Bad Gateway가 난다. `httpd_can_network_connect` 불리언으로 허용한다.
