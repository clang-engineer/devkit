# OpenSSL Cheatsheet

> 인증서·키 발급/변환/검증. CSR·자체서명·만료확인·포맷 변환을 한 곳에.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 자체서명 인증서 한 줄 | `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"` |
| 개인키 + CSR | `openssl req -new -newkey rsa:2048 -nodes -keyout key.pem -out req.csr` |
| 인증서 상세 | `openssl x509 -in cert.pem -text -noout` |
| 유효기간만 | `openssl x509 -in cert.pem -dates -noout` |
| 원격 서버 인증서 | `openssl s_client -connect host:443 -servername host </dev/null \| openssl x509 -text -noout` |
| 만료까지 며칠 | `openssl s_client -connect host:443 -servername host </dev/null 2>/dev/null \| openssl x509 -enddate -noout` |
| PEM ↔ DER | `openssl x509 -in cert.pem -outform DER -out cert.der` |
| PEM → PKCS12 (.p12) | `openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem` |
| 키·인증서 매치 확인 | 두 modulus 비교: `openssl rsa -in key.pem -modulus -noout` vs `openssl x509 -in cert.pem -modulus -noout` |

## 자체 서명 인증서 발급

한 줄 발급은 위 표 참고. 아래는 개인키 → CSR → 서명을 단계별로 나눌 때(CA 제출용 CSR 포함).

### 1. 개인키 생성

```sh
# genpkey 권장 (다양한 알고리즘 지원)
openssl genpkey -algorithm RSA -out private.key -aes256

# genrsa (RSA만 지원, 레거시)
openssl genrsa -out private.key 2048
```

### 2. CSR 생성

```sh
openssl req -new -key private.key -out request.csr

# 한 줄로 subject 지정
openssl req -new -key private.key -out request.csr \
  -subj "/C=KR/ST=Seoul/L=Gangnam/O=MyCompany/OU=Dev/CN=example.com"
```

### 3. 인증서 생성 (CSR 자체 서명)

```sh
openssl x509 -req -days 365 -in request.csr -signkey private.key -out certificate.crt
```

## 인증서 검증

```sh
openssl verify -CAfile ca.crt certificate.crt   # CA로 인증서 검증
```

상세·유효기간·원격 서버 확인은 위 표 참고.

## 포맷 변환

표에 없는 역방향만. (PEM → DER, PEM → PKCS12는 위 표 참고)

```sh
# DER → PEM
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem
```
