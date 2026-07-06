# Rocky Linux 서버 구축 Cheatsheet

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
sudo setsebool -P httpd_can_network_connect 1        # Nginx → 백엔드 연결 허용
sudo semanage port -a -t http_port_t -p tcp 8080     # 비표준 포트 허용
```

SELinux를 안 풀면 Nginx에서 502 Bad Gateway 나온다.

## Nginx 리버스 프록시 (HTTPS + Spring Boot)

### 설치

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
```

### 설정 (`/etc/nginx/conf.d/redirect.conf`)

```nginx
# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HTTPS → Java 8080으로 proxy
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/cert.key;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 자체 서명 인증서 (임시용)

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/cert.key \
  -out /etc/nginx/ssl/cert.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MyOrg/CN=localhost"
```

### Let's Encrypt 인증서 (certbot)

```bash
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx
```

#### 발급

```bash
sudo certbot --nginx -d your-domain.com
```

> `server_name _;`(catch-all)로 되어 있으면 certbot이 매칭 실패한다. 반드시 `server_name your-domain.com;`으로 명시해야 함.

#### nginx conf에 적용

```nginx
ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

> `cert.pem`이 아니라 **`fullchain.pem`** 써야 한다. `cert.pem`만 쓰면 중간 인증서가 빠져서 self-signed처럼 보임.

#### 자동 갱신: webroot 방식 (추천)

nginx 플러그인 방식은 갱신 때 nginx 설정을 건드려서 불안정할 수 있다. webroot가 더 안정적.

```bash
sudo mkdir -p /var/www/letsencrypt
```

nginx 80 블록에 챌린지 경로 추가:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

renewal conf 수정 (`/etc/letsencrypt/renewal/your-domain.com.conf`):

```ini
[renewalparams]
authenticator = webroot
key_type = ecdsa
renew_hook = systemctl reload nginx

[[webroot_map]]
your-domain.com = /var/www/letsencrypt
```

갱신 테스트:

```bash
sudo certbot renew --dry-run
```

#### 자동 갱신 스케줄 (Rocky 9는 certbot.timer 자동 등록 안 됨)

**crontab 방식 (간단)**

```bash
crontab -e
# 매일 새벽 3시 갱신 체크, 갱신되면 nginx reload
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

**systemd timer 방식**

```bash
cat <<'EOF' | sudo tee /etc/systemd/system/certbot-renew.service
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
EOF

cat <<'EOF' | sudo tee /etc/systemd/system/certbot-renew.timer
[Unit]
Description=Run certbot twice daily

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now certbot-renew.timer
```

#### 트러블슈팅

| 증상 | 원인 |
|---|---|
| 발급 성공했지만 브라우저에서 self-signed | `cert.pem` 대신 `fullchain.pem` 써야 함 |
| certbot이 nginx server block 매칭 실패 | `server_name _;` → 도메인명으로 변경 |
| `certbot renew --dry-run` 무한 대기 | `authenticator = nginx` → `webroot`로 전환 |
| Chrome만 not secure (Safari OK) | HSTS 캐시 → `chrome://net-internals/#hsts`에서 Delete |

### 최종 구조

```
외부 HTTP(80)   → 301 → HTTPS(443)
외부 HTTPS(443) → nginx → Java(8080)
```

## PostgreSQL 소스 컴파일 (EOL 버전)

공식 repo에 없는 EOL 버전(9.5 등)은 소스 빌드 필요.

```bash
# 의존성
sudo dnf install -y gcc make readline-devel zlib-devel openssl-devel

# 소스 다운로드 및 컴파일
wget https://ftp.postgresql.org/pub/source/v9.5.25/postgresql-9.5.25.tar.gz
tar -xzf postgresql-9.5.25.tar.gz && cd postgresql-9.5.25

./configure --prefix=/usr/local/pgsql-9.5
make
sudo make install
```

### 초기화 및 실행

```bash
sudo useradd postgres  # 이미 있으면 skip
sudo mkdir -p /usr/local/pgsql-9.5/data
sudo chown postgres /usr/local/pgsql-9.5/data

sudo -u postgres /usr/local/pgsql-9.5/bin/initdb -D /usr/local/pgsql-9.5/data
sudo -u postgres /usr/local/pgsql-9.5/bin/pg_ctl -D /usr/local/pgsql-9.5/data start
```

### DB/유저 생성

```sql
CREATE USER shine WITH PASSWORD 'yourpassword';
CREATE DATABASE shine OWNER shine;
```

### 참고

- NCP 폐쇄망에서는 `wget` 안 될 수 있음 → 로컬에서 받아 `scp`로 전송
- PATH 등록: `export PATH=/usr/local/pgsql-9.5/bin:$PATH`

## 사용자 인증 정책 (chage 트랩)

`passwd` 후 `su`가 `Authentication failure`로 실패하는 함정은 별도 글: [passwd로 비밀번호 바꾼 직후 su가 실패할 때 — chage 트랩](https://clang-engineer.github.io/posts/rocky-linux-chage-su-authentication-failure/)

핵심 한 줄:

```bash
sudo chage -m 0 -M -1 username   # 최소 일수 0, 만료 없음
```
