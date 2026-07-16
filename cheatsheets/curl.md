# curl Cheatsheet

> **Client URL** — URL로 HTTP/FTP/SCP 요청을 보내는 CLI. API 테스트·다운로드·디버깅의 표준 도구.

## 설치

```sh
brew install curl       # macOS (시스템 기본 있음)
sudo apt install curl   # Ubuntu, Debian
sudo dnf install curl   # Fedora, RHEL
```

## 자주 쓰는 3줄

```sh
curl https://api.example.com/users                                  # GET
curl -H 'Content-Type: application/json' -d '{"x":1}' URL           # POST JSON
curl -o file.tar.gz -L https://example.com/release.tar.gz           # 다운로드 (리다이렉트 따라감)
```

## 메서드와 데이터

| 옵션 | 의미 |
|------|------|
| `-X METHOD` | 메서드 명시 (생략 시 GET, `-d` 있으면 POST 자동) |
| `-d 'key=value'` | 폼 데이터 (`application/x-www-form-urlencoded`) |
| `-d '@body.json'` | 파일에서 본문 읽기 (`@` 접두) |
| `--data-binary @file` | 바이너리 그대로 (개행 보존) |
| `--data-urlencode 'q=hello world'` | 쿼리/값 자동 인코딩 |
| `-F 'file=@/path/to/x.pdf'` | multipart 파일 업로드 |
| `-F 'image=@x.png;type=image/png'` | multipart + Content-Type 지정 |
| `--json '{"x":1}'` | curl 7.82+ 단축: 자동으로 `Content-Type`·`Accept`·`-d` 세팅 |

```sh
# JSON POST
curl -H 'Content-Type: application/json' \
     -d '{"name":"alice"}' \
     https://api.example.com/users

# 파일에서 JSON 읽기
curl -H 'Content-Type: application/json' --data-binary @payload.json URL

# 멀티파트 업로드 + 필드
curl -F "file=@report.pdf" -F "title=2026 Q2" https://example.com/upload
```

## 헤더와 인증

```sh
# 헤더 여러 개
curl -H 'Accept: application/json' -H 'X-Trace: abc' URL

# Bearer 토큰
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/me

# Basic Auth (계정:비번)
curl -u alice:s3cret https://api.example.com
curl -u alice https://api.example.com   # 비번 프롬프트

# API Key (헤더형)
curl -H "X-API-Key: $API_KEY" URL

# User-Agent 변경
curl -A "MyClient/1.0" URL
```

## 응답 보기

| 옵션 | 의미 |
|------|------|
| `-i` | 응답 헤더 + 본문 |
| `-I` | 헤더만 (HEAD 요청) |
| `-D -` | 헤더를 파일(또는 `-`=stdout)로 덤프, 본문은 stdout |
| `-v` | 상세 로그 (요청/응답 모두) |
| `--trace-ascii -` | `-v`보다 더 자세히 (디버깅) |
| `-s` | 진행률 숨김 |
| `-S` | `-s`와 같이 쓰되 에러는 표시 |
| `-w '...'` | 끝에 메타 정보 출력 |
| `-o file` / `-O` | 본문 저장 (-O는 원본 파일명) |
| `--fail` | 4xx/5xx에서 종료코드 22, stdout 비움 (스크립트 안전) |

```sh
curl -s https://api.example.com/users | jq .
curl -sS URL | jq .                       # 에러는 보이게
curl -fsSL https://example.com/install.sh | bash    # 스크립트 표준 조합
curl -I https://example.com               # 헤더만 (캐시/리다이렉트 확인용)
```

## 리다이렉트 / 쿠키

```sh
curl -L URL                                # 리다이렉트 따라가기
curl -L --max-redirs 3 URL                 # 최대 3번

# 쿠키 저장 → 다음 요청에 사용
curl -c cookies.txt -d 'user=alice&pass=x' https://example.com/login
curl -b cookies.txt https://example.com/dashboard

# 인라인 쿠키
curl -b 'session=abc123' URL
```

## TLS / 검증

```sh
curl -k URL                                # 인증서 검증 무시 (테스트만)
curl --cacert ca.pem URL                   # CA 인증서 지정
curl --cert client.pem --key client.key URL    # 클라이언트 인증
curl --http2 URL                           # HTTP/2 강제
```

고급: `--resolve`(DNS 우회, 롤아웃 전 검증)·`--http3`(QUIC, 빌드 의존) 등 → `man curl`

## 타임아웃 / 재시도

```sh
curl --connect-timeout 5 URL               # 연결까지 5초
curl --max-time 30 URL                     # 전체 30초
curl --retry 3 --retry-delay 2 URL         # 실패 시 3회 재시도 (네트워크 에러 + 5xx 일부)
curl --retry 3 --retry-all-errors URL      # 모든 에러에 재시도
```

## 측정 (`-w`)

`-w`는 응답 직후 변수들을 포맷팅. 본문 안 보고 메타만 쓰려면 `-o /dev/null`.

```sh
# 상태 코드만
curl -s -o /dev/null -w '%{http_code}\n' URL

# 단계별 응답 시간
curl -o /dev/null -s -w '
DNS:      %{time_namelookup}s
Connect:  %{time_connect}s
TLS:      %{time_appconnect}s
TTFB:     %{time_starttransfer}s
Total:    %{time_total}s
' https://example.com
```

자주 쓰는 변수: `http_code`, `time_total`, `time_namelookup`, `time_connect`, `time_appconnect`, `time_starttransfer`, `size_download`, `speed_download`, `redirect_url`, `url_effective`.

## 자주 쓰는 시나리오

```sh
# REST API 한 줄 호출
curl -s -H "Authorization: Bearer $TOKEN" https://api.example.com/users | jq .

# 응답 시간 측정 (반복)
for i in 1 2 3; do
  curl -o /dev/null -s -w '%{http_code} %{time_total}s\n' https://example.com
done

# 큰 파일 이어받기
curl -C - -O https://example.com/big.iso

# GitHub raw 파일
curl -fsSL https://raw.githubusercontent.com/user/repo/main/script.sh | bash

# 멀티파트 업로드 후 응답 JSON 파싱
curl -s -F "file=@x.zip" https://api.example.com/upload | jq -r '.url'

# 디버그 모드로 헤더 송수신 확인
curl -v -H 'Authorization: Bearer xxx' URL 2>&1 | grep '^[<>]'
```

## 참고

- `man curl` / `curl --help all`
- `curl --version` — 빌드된 기능 확인 (HTTP/2, HTTP/3, brotli 등)
- 복잡한 요청은 브라우저 DevTools → Network → "Copy as cURL"로 시작하는 게 빠르다
