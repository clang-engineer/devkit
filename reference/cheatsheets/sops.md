# SOPS Cheatsheet

SOPS(Secrets OPerationS)는 YAML, JSON, dotenv, INI, binary 파일의 값을 암호화한 채
Git으로 관리할 수 있게 해주는 도구다. 파일을 통째로 알아볼 수 없게 만드는 대신 구조와
key 이름은 유지하고 값만 암호화하므로 diff와 코드 리뷰가 가능하다.

SOPS는 password manager나 runtime secret server가 아니다. 사람이 자동 완성으로
비밀번호를 쓰려면 1Password나 Bitwarden이, 애플리케이션에 중앙에서 secret을 공급하려면
Vault나 cloud secret manager가 더 적합하다. 설정 파일을 Git에 안전하게 보관하고 배포하는
용도에는 SOPS가 잘 맞는다.

## 동작 원리

```text
age/KMS 공개키 ── encrypt ──┐
                            v
평문 값 ── data key로 암호화 ── SOPS 파일 ── Git
                            ^
age/KMS 개인키 ── decrypt ──┘
```

SOPS는 파일마다 임의의 data key를 만들고 실제 값을 이 키로 암호화한다. data key는 age,
AWS KMS, GCP KMS, Azure Key Vault 등의 master key로 다시 암호화되어 파일의 `sops`
metadata에 저장된다. MAC(Message Authentication Code)은 암호문의 위변조를 검증한다.

- Git에 저장: 암호화된 값, key 이름, 암호화 recipient, SOPS metadata
- 저장소 밖에 보관: age 개인키나 KMS 접근 권한
- 기본적으로 숨겨지지 않음: 파일명, YAML/JSON key 이름, 전체 구조

## 설치

```sh
# macOS
brew install sops age

# 설치 확인
sops --version
age-keygen --version
```

## age 키 준비

로컬이나 소규모 팀에서는 별도 cloud 없이 쓸 수 있는 age가 간단하다.

```sh
# macOS 기본 경로
mkdir -p "$HOME/Library/Application Support/sops/age"
umask 077
age-keygen -o "$HOME/Library/Application Support/sops/age/keys.txt"

# 공개 recipient 확인
age-keygen -y "$HOME/Library/Application Support/sops/age/keys.txt"
```

Linux에서는 보통 `${XDG_CONFIG_HOME:-$HOME/.config}/sops/age/keys.txt`를 사용한다. 다른
경로를 쓰려면 명시한다.

```sh
export SOPS_AGE_KEY_FILE="$HOME/secure/age-keys.txt"
```

`age1...`로 시작하는 recipient는 공개해도 되지만 `AGE-SECRET-KEY-...` 개인키는 절대
Git에 commit하지 않는다. 개인키를 잃으면 파일을 복구할 수 없으므로 password manager나
별도의 안전한 매체에 백업한다.

## .sops.yaml

저장소 root에 암호화 규칙을 둔다. SOPS는 대상 경로와 처음 일치하는 `creation_rules`를
새 파일 암호화에 사용한다.

```yaml
creation_rules:
  - path_regex: '(^|/)secrets/.*\.sops\.ya?ml$'
    age: age1example_public_recipient
```

여러 사람이 각자 복호화해야 한다면 recipient를 여러 개 지정한다.

```yaml
creation_rules:
  - path_regex: '(^|/)secrets/.*\.sops\.ya?ml$'
    age:
      - age1alice_public_recipient
      - age1bob_public_recipient
```

기본 구성에서는 등록된 개인키 중 하나만 있어도 data key를 복호화할 수 있다. 여러 키를
동시에 요구하는 정책이 필요하면 SOPS key group과 Shamir threshold를 별도로 구성한다.

## 파일 만들기

처음 한 번은 평문 파일을 만든 뒤 즉시 암호화한다. 암호화 전에 add나 commit하지 않는다.

```yaml
# secrets/app.sops.yaml
database:
  username: app
  password: CHANGE_ME
```

```sh
sops encrypt --in-place secrets/app.sops.yaml
sops filestatus secrets/app.sops.yaml
# {"encrypted":true}
```

`--in-place`를 빼면 암호화 결과를 stdout으로 출력한다.

```sh
sops encrypt plain.yaml > secrets/app.sops.yaml
```

## Neovim으로 편집

암호화된 파일은 일반 editor로 직접 고치지 않고 SOPS를 통해 연다.

```sh
SOPS_EDITOR=nvim sops secrets/app.sops.yaml
```

SOPS가 임시 파일을 복호화해 Neovim으로 열고, `:wq`로 종료하면 다시 암호화한다.
반복해서 쓴다면 shell 설정에 editor를 지정한다.

```sh
export SOPS_EDITOR=nvim
sops secrets/app.sops.yaml
```

`SOPS_EDITOR`가 없으면 `EDITOR`를 사용하며, 둘 다 없으면 설치된 `vim`, `nano`, `vi`
중 하나를 찾는다.

## 조회

```sh
# 전체 내용을 stdout으로 복호화
sops decrypt secrets/app.sops.yaml

# YAML/JSON 경로 하나만 추출
sops decrypt \
  --extract '["database"]["password"]' \
  secrets/app.sops.yaml

# 복호화하지 않고 암호화 상태만 검사
sops filestatus secrets/app.sops.yaml
```

stdout 출력은 terminal scrollback, pipe 대상, CI log에 남을 수 있다. 필요한 값만
`--extract`로 읽고 출력 결과를 log에 기록하지 않는다.

## 프로세스에 전달

dotenv 파일은 복호화한 값을 환경 변수로 넣어 명령을 실행할 수 있다.

```sh
sops exec-env secrets/app.env 'my-app'
sops exec-env --pristine secrets/app.env 'env'
```

`--pristine`은 현재 환경을 전달하지 않고 복호화한 변수만 제공한다. 설정 파일 경로를
요구하는 프로그램에는 `exec-file`을 사용한다. `{}`가 임시 파일 경로로 치환된다.

```sh
sops exec-file secrets/app.sops.yaml 'my-app --config {}'
```

기본 `exec-file`은 가능한 환경에서 FIFO를 사용한다. 실제 임시 파일이 필요한 프로그램에만
`--no-fifo`를 사용한다.

## recipient 변경과 key 회전

`.sops.yaml`을 수정해도 기존 파일 metadata는 자동으로 바뀌지 않는다. 이전 개인키로
복호화할 수 있을 때 `updatekeys`를 실행한다.

```sh
# .sops.yaml의 recipient를 파일 metadata에 반영
sops updatekeys secrets/app.sops.yaml

# 확인 없이 자동 적용
sops updatekeys --yes secrets/app.sops.yaml
```

`updatekeys`는 data key를 감싸는 master key 목록을 변경한다. data key 자체까지 새로
만들어 모든 값을 다시 암호화하려면 `rotate`를 사용한다.

```sh
sops rotate --in-place secrets/app.sops.yaml
```

멤버를 제거할 때는 새 recipient 구성을 먼저 적용하고, 제거된 사람이 이전 Git history의
secret을 이미 읽었을 가능성이 있으면 실제 credential도 함께 교체한다. 암호화 키 변경만으로
과거에 노출된 비밀번호가 무효화되지는 않는다.

## Git에서 확인할 것

```sh
# 암호화 상태 확인
sops filestatus secrets/app.sops.yaml

# 평문 placeholder나 실제 secret이 남았는지 검색
rg 'CHANGE_ME|known-secret-fragment' secrets

# commit 전 diff 확인
git diff -- secrets .sops.yaml
```

다음 파일만 Git으로 관리한다.

- `.sops.yaml`
- `*.sops.yaml` 같은 암호화 결과

다음 항목은 관리하지 않는다.

- age 개인키
- 복호화해 만든 임시 평문 파일
- `sops decrypt ... > plain.yaml`로 생성한 출력

## 흔한 문제

### no matching creation rules

대상 경로가 `.sops.yaml`의 `path_regex`와 일치하지 않는다. 저장소 root에서 실행했는지,
명령에 넘긴 상대 경로가 regex와 맞는지 확인한다.

### no identity matched any recipient

현재 age 개인키가 파일 metadata의 recipient와 맞지 않는다. 키 경로와 공개 recipient를
확인한다.

```sh
age-keygen -y "$SOPS_AGE_KEY_FILE"
```

### MAC mismatch

암호화 파일이 SOPS 밖에서 잘못 수정되었거나 merge 과정에서 손상되었을 가능성이 높다.
정상 버전으로 되돌린 뒤 SOPS를 통해 다시 편집한다. `--ignore-mac`은 무결성 검사를
우회하므로 일반적인 해결책으로 사용하지 않는다.

### 새 recipient가 기존 파일에 적용되지 않음

`.sops.yaml`은 새 파일 생성 규칙이다. 기존 파일에는 `sops updatekeys <file>`을 실행해야
한다.

## 참고

- [SOPS 공식 저장소](https://github.com/getsops/sops)
- [SOPS 공식 문서](https://getsops.io/)
- [age 공식 저장소](https://github.com/FiloSottile/age)
