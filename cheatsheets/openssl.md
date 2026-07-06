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

## 인증서 발행 절차

1. 개인키 생성
2. CSR(Certificate Signing Request) 생성
3. CSR을 CA에 전송
4. CA에서 인증서 발급
5. 인증서 설치

## 자체 서명 인증서 발급

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

### 3. 인증서 생성

```sh
openssl x509 -req -days 365 -in request.csr -signkey private.key -out certificate.crt
```

### 한 줄로 자체 서명 인증서 생성 (키 + 인증서)

```sh
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost"
```

## 인증서 확인

```sh
openssl x509 -in certificate.crt -text -noout      # 인증서 상세 정보
openssl x509 -in certificate.crt -dates -noout      # 유효 기간만 확인
openssl verify -CAfile ca.crt certificate.crt        # CA로 인증서 검증
```

## 원격 서버 인증서 확인

```sh
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | openssl x509 -text -noout
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | openssl x509 -dates -noout
```

## 포맷 변환

```sh
# PEM → DER
openssl x509 -in cert.pem -outform DER -out cert.der

# DER → PEM
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem

# PEM → PKCS12
openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem
```
