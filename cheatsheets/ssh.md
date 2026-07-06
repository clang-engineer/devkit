# SSH Cheatsheet

> SSH 키·`~/.ssh/config`·SCP/rsync·포트 포워딩·점프 호스트. macOS Keychain 통합 포함.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 처음 키 만들기 | `ssh-keygen -t ed25519 -C "email"` |
| 서버에 키 등록 | `ssh-copy-id user@host` |
| config 한 줄로 접속 | `~/.ssh/config`에 `Host` 정의 → `ssh alias` |
| 점프 호스트 경유 | `ssh -J bastion target` |
| 로컬 포트 → 원격 | `ssh -L 8080:localhost:80 host` |
| 원격 포트 → 로컬 | `ssh -R 9000:localhost:9000 host` |
| 디버그 | `ssh -vvv host` |
| 키 인증 실패 | `ssh-add -l` 확인 → `ssh -vT host`로 어떤 키 시도되는지 |

## ssh-agent + ssh-add

```sh
pgrep -x ssh-agent             # 실행 중인지 확인
eval "$(ssh-agent -s)"         # 시작

ssh-add -l                     # 등록된 키 목록
ssh-add ~/.ssh/id_ed25519      # 키 추가
ssh-add -D                     # 모든 키 삭제
ssh-add -d ~/.ssh/id_ed25519   # 특정 키 삭제
```

**키 순서가 중요**. SSH는 `ssh-add -l` 순으로 시도한다. 서버 `MaxAuthTries`(기본 6)를 넘기면 인증 실패.

### macOS Keychain (재부팅 후에도 유지)

```sh
ssh-add --apple-use-keychain ~/.ssh/id_rsa_github_personal
```

```sshconfig
# ~/.ssh/config
Host *
  AddKeysToAgent yes
  UseKeychain yes
  ServerAliveInterval 60
```

## SSH 키 생성 + 서버 등록

```sh
ssh-keygen -t ed25519 -C "email" -f ~/.ssh/id_ed25519
ssh-keygen -t rsa -b 4096 -C "email" -f ~/.ssh/id_rsa -N ""   # 비밀번호 없음

# 서버 ~/.ssh/authorized_keys에 공개키 추가 (한 줄)
ssh-copy-id user@host
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host                # 키 지정
ssh-copy-id -p 2222 user@host                                  # 비표준 포트
```

| 옵션 | 의미 |
|---|---|
| `-t` | 알고리즘 (`ed25519` 권장, 또는 `rsa`) |
| `-b 4096` | RSA 비트 (보안 강화) |
| `-C "email"` | 주석 (키 식별용) |
| `-f path` | 저장 경로 |
| `-N ""` | 비밀번호 없음 |

> `ssh-copy-id`가 없으면 수동: `cat ~/.ssh/id_ed25519.pub | ssh user@host 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'`

## ~/.ssh/config

```sshconfig
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_personal
  IdentitiesOnly yes        # 이 키만 사용 (다중 계정 필수)

Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_work
  IdentitiesOnly yes

Host bastion
  HostName bastion.example.com
  User ec2-user
  IdentityFile ~/.ssh/id_ed25519
  ServerAliveInterval 60

Host internal
  HostName 10.0.1.50
  User ec2-user
  ProxyJump bastion         # bastion 경유
```

### Host 매칭은 정확 일치

```sh
ssh -T git@github.com           # github.com Host 없으면 매칭 실패
ssh -T git@github.com-personal  # 정확히 일치 → 의도한 키
```

### 다중 계정 함정

`IdentitiesOnly yes` 없으면 ssh-agent에 등록된 다른 키가 먼저 시도됨 → 의도와 다른 계정으로 인증.

```sh
ssh -vT git@github.com 2>&1 | grep "Offering public key"   # 어떤 키 제공되는지
```

## Git remote에 적용

```sh
git remote set-url origin git@github.com-personal:user/repo.git
git clone git@github.com-personal:user/repo.git
```

## 포트 포워딩 (터널링)

| 옵션 | 의미 | 예 |
|---|---|---|
| `-L local:host:port` | **로컬** 포트로 들어오는 트래픽을 **원격에서** `host:port`로 전달 | DB·내부 서비스 접속 |
| `-R remote:host:port` | **원격** 포트로 들어오는 트래픽을 **로컬에서** `host:port`로 전달 | 로컬 개발 서버 노출 |
| `-D local` | 로컬에 **SOCKS 프록시** 띄우기 | 브라우저 전체를 원격 경유 |
| `-N` | 명령 실행 없이 포워딩만 |  |
| `-f` | 인증 후 백그라운드로 |  |
| `-J host1[,host2]` | 점프 호스트 경유 (ProxyJump) |  |

```sh
# 로컬 5432 → 원격 서버의 DB
ssh -L 5432:localhost:5432 user@dbhost
psql -h localhost -p 5432

# 로컬 8080 → 내부망 web 서비스 (포워딩은 bastion 기준 해석)
ssh -L 8080:web.internal:80 bastion
# web.internal에 또 다른 점프가 필요하면: ssh -J bastion -L 8080:web.internal:80 finalhost

# 로컬 개발 서버를 외부에 임시 노출 (원격 9000 → 로컬 3000)
ssh -R 9000:localhost:3000 user@public-host
# 원격 sshd_config에 GatewayPorts yes 필요 (0.0.0.0에 바인딩하려면)

# SOCKS 프록시 (브라우저에서 localhost:1080 SOCKS5 지정)
ssh -D 1080 -N -f user@host

# 점프만, 명령 없이 백그라운드로
ssh -fNL 8080:localhost:80 user@host
```

### 영속 터널 (autossh)

연결 끊기면 자동 재연결.

```sh
brew install autossh
autossh -M 0 -fN -L 5432:localhost:5432 user@dbhost
```

- `-M 0` 모니터 포트 안 씀 (대신 `ServerAlive*` 사용 — `~/.ssh/config`):

```sshconfig
Host dbhost
  ServerAliveInterval 30
  ServerAliveCountMax 3
  ExitOnForwardFailure yes   # 포워딩 실패 시 즉시 종료 → autossh가 재시도
```

## SCP — SSH 채널 위 파일 복사

```sh
scp ./local user@host:/remote/path/        # 로컬 → 원격
scp user@host:/remote/file ./              # 원격 → 로컬
scp -r ./localdir user@host:/remote/       # 디렉토리 재귀
scp -P 2222 file user@host:/path/          # 포트 (대문자 P, ssh -p와 다름)
scp -i ~/.ssh/key file user@host:/path/    # 키 지정
```

| 옵션 | 의미 |
|---|---|
| `-P {port}` | SSH 포트 (대문자) |
| `-r` | 디렉토리 재귀 |
| `-i {keyfile}` | 개인키 |
| `-C` | 전송 중 압축 |
| `-l {Kbit/s}` | 대역폭 제한 |
| `-v` / `-q` | 디버그 / 진행률 숨김 |

### OpenSSH 8.x+ 노트

- OpenSSH 8.0+ scp 프로토콜은 "권장하지 않음", 9.0+은 내부적으로 SFTP 사용.
- 새 코드라면 `sftp`나 `rsync` 우선 고려.

## rsync — 큰 디렉토리·재전송

```sh
rsync -az -e ssh ./src/ user@host:/dst/         # 압축 + 아카이브 모드
rsync -avz --progress ./src/ user@host:/dst/    # 진행률
rsync -avz --delete ./src/ user@host:/dst/      # 원본에 없는 파일 삭제
rsync -avz --exclude='node_modules' ./src/ user@host:/dst/
```

scp와 달리 변경분만 보내고, 중단 시 이어받기 됨.

## 트러블슈팅

### Permission denied (publickey)

```sh
ssh-add -l                              # 키 등록 확인
ssh-add ~/.ssh/id_ed25519               # 없으면 추가
ssh -vT git@github.com-personal         # 상세 로그
```

### 의도하지 않은 키로 인증됨

`IdentitiesOnly yes` 추가 또는 `ssh-add -D` 후 원하는 순서로 재등록.

### 너무 많은 키

```sh
ssh-add -D
ssh-add ~/.ssh/id_main                  # 자주 쓰는 것만
```

또는 Host별 `IdentitiesOnly yes`.

## SSH 동작 순서 요약

```
1. ~/.ssh/config에서 Host 매칭 찾기
   ├─ 매칭 성공 → IdentityFile의 키 사용
   └─ 매칭 실패 → ssh-add -l의 키를 순서대로 시도 (최대 5개)
2. 각 키로 인증 시도, 첫 성공 시 그 키로 로그인
```

## 참고

- `man ssh`, `man ssh_config`
- 자세한 config 옵션: `Match` 디렉티브, `Include`, `ControlMaster`(연결 재사용으로 속도 향상)
- 보안 강화: [Mozilla OpenSSH Guidelines](https://infosec.mozilla.org/guidelines/openssh)
