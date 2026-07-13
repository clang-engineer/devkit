# Nginx Cheatsheet

> 웹 서버 + 리버스 프록시. 무중단 리로드, 정적 파일 + API 라우팅, 로그 위치까지.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 설정 문법 검사 | `nginx -t` |
| 무중단 리로드 | `nginx -s reload` (또는 `systemctl reload nginx`) |
| 에러 로그 실시간 | `tail -f /var/log/nginx/error.log` |
| 액세스 로그 실시간 | `tail -f /var/log/nginx/access.log` |
| 메인 설정 위치 | `/etc/nginx/nginx.conf` |
| 사이트 설정 | `/etc/nginx/conf.d/*.conf` 또는 `sites-available/` |
| 전체 설정 dump | `nginx -T` (문법검사 + 합쳐서 출력) |
| 즉시 종료 | `nginx -s stop` (정상 종료는 `nginx -s quit`) |

## 파일 위치

| 항목 | 경로 |
|------|------|
| 메인 설정 | `/etc/nginx/nginx.conf` |
| 사이트 설정 | `/etc/nginx/conf.d/` 또는 `/etc/nginx/sites-available/` |
| 액세스 로그 | `/var/log/nginx/access.log` |
| 에러 로그 | `/var/log/nginx/error.log` |

## 서비스 관리

```sh
systemctl start nginx       # 시작
systemctl stop nginx        # 중지
systemctl restart nginx     # 재시작
systemctl reload nginx      # 설정 리로드 (무중단)
systemctl status nginx      # 상태 확인
systemctl enable nginx      # 부팅 시 자동 시작
systemctl disable nginx     # 자동 시작 해제
```

## 설정 관리

```sh
nginx -t                    # 설정 파일 문법 검사
nginx -T                    # 설정 파일 전체 출력 + 문법 검사
nginx -s reload             # 설정 리로드 (systemctl reload와 동일)
nginx -s quit               # 정상 종료 (처리 중인 요청 완료 후)
nginx -s stop               # 즉시 종료
nginx -V                    # 빌드 정보 및 모듈 확인
```

## 기본 설정 예시

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /var/www/html;
        index index.html;
    }

    # 리버스 프록시
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 리버스 프록시 실무 패턴

### upstream + keepalive (커넥션 재사용)

```nginx
upstream backend_app {
    server 127.0.0.1:8700;
    keepalive 32;
}
server {
    listen 443 ssl http2;
    server_name app.example.com;
    location / {
        proxy_pass http://backend_app;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;      # ← 이 두 줄 없으면
        proxy_set_header Connection "";  #   keepalive 32가 무효 (nginx는 기본 HTTP/1.0로 upstream 연결)
    }
}
```

> **함정**: `keepalive`만 걸고 `proxy_http_version 1.1` + `Connection ""`를 빠뜨리면 매 요청마다 커넥션을 새로 맺는다.

### 실제 클라이언트 IP 복원

TCP 출발지는 항상 nginx라서 백엔드의 `getRemoteAddr()`엔 nginx IP만 찍힘. 헤더로 넘기고 **백엔드가 그 헤더를 읽도록** 켜야 복원됨.

```properties
# Spring Boot (내장 톰캣) — 코드 수정 없이 properties만
server.forward-headers-strategy=native   # native=톰캣 RemoteIpValve, framework=Spring
```
```xml
<!-- 순수 톰캣 server.xml -->
<Valve className="org.apache.catalina.valves.RemoteIpValve"
       remoteIpHeader="X-Forwarded-For" protocolHeader="X-Forwarded-Proto"
       internalProxies="10\.0\.0\.\d+|127\.0\.0\.1" />
```

### 도메인별 분기 (server_name 가상호스트)

같은 IP를 가리키는 여러 도메인도 `Host` 헤더로 분기된다. DNS는 A레코드를 같은 IP로 등록만, 분기는 `server_name` 매칭이 담당.

```nginx
server { listen 80; server_name app-a.example.com; location / { proxy_pass http://127.0.0.1:3001; } }
server { listen 80; server_name app-b.example.com; location / { proxy_pass http://127.0.0.1:3002; } }
server { listen 80 default_server; server_name _; return 444; }  # 미등록 Host·IP직접접근 차단
```

### location 매칭 + 접근 제어

```nginx
location = /admin  { proxy_pass http://127.0.0.1:9000; }  # exact: /admin 만
location /admin/   { proxy_pass http://127.0.0.1:9000; }  # prefix: 하위 전체
location / { return 403; }                                # 나머지 차단

location /internal {
    allow 192.168.0.10;
    allow 10.0.0.0/24;   # CIDR 대역 허용
    deny all;            # allow 먼저, deny all 마지막 (위→아래 순서 평가)
    proxy_pass http://127.0.0.1:9000;
}
```

> `location = /p`는 exact, `location /p`는 prefix(`/p`, `/pxyz`, `/p/a` 모두 매칭).

### 413 Request Entity Too Large

기본 본문 제한 1MB. `http`/`server`/`location` 어디든 두면 하위 상속.

```nginx
client_max_body_size 100M;
# 업로드 중 504/끊김도 나면 타임아웃도:
proxy_read_timeout 300s; proxy_send_timeout 300s; client_body_timeout 300s;
```
```properties
# 백엔드(Spring Boot) 자체 제한도 맞춰야 끝까지 통과
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

### TLS 종단 + 백엔드도 https

```nginx
server {
    listen 443 ssl http2;
    server_tokens off;
    server_name app.example.com;
    ssl_certificate     /data/ssl/example.com.crt;
    ssl_certificate_key /data/ssl/example.com.key;
    location / {
        proxy_pass https://10.0.0.59:8080;   # ← server_name과 같은 도메인으로 두면 자기 자신 프록시 루프
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # WebSocket 업그레이드 통과
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_ssl_verify off;          # 백엔드가 self-signed일 때
        proxy_ssl_server_name on;
    }
}
```

> **루프 주의**: `proxy_pass`를 `server_name`과 같은 도메인으로 두면 DNS가 다시 이 nginx의 443으로 해석해 자기 자신에게 프록시한다. 내부 백엔드는 IP로 직접 보낼 것.

## 디버깅

```sh
tail -f /var/log/nginx/error.log      # 에러 로그 실시간 확인
tail -f /var/log/nginx/access.log     # 액세스 로그 실시간 확인
pkill -9 nginx                        # 강제 종료 (최후의 수단)
```

## 참고

- 공식 문서: https://nginx.org/en/docs/
- 설정 검증: `nginx -t`로 항상 reload 전 확인
- SSL은 별도 단원 (인증서 발급은 [openssl.md](openssl.md), 자동 갱신은 [systemd.md](systemd.md) timer)
