# SOPS Cheatsheet

SOPS는 설정 파일을 암호화해 Git에서 관리한다. YAML·JSON·dotenv·INI 파일은
값을 암호화하고 키 이름과 구조는 남긴다. binary 파일은 구조를 유지하지 않는다.

**흐름:** age 키 준비 → 파일 암호화 → 암호화 상태 확인 → Git에 저장 →
SOPS로 편집·복호화 → 필요할 때 recipient 갱신·키 회전.
비밀번호 자동 완성은 password manager, 실행 중인 서비스에 중앙에서 비밀을 공급하는 일은
secret manager의 역할이다.

## 키와 파일의 관계

```text
암호화할 파일 ── SOPS ── Data Key로 값 암호화 [2]
                  │
                  ├─ age / KMS Recipient로 Data Key 보호 [1·2]
                  │
                  ▼
             SOPS 파일 ── Git 저장 [2]
                  │
       편집·조회·실행 시 복호화 [3]
                  │
          Recipient 변경 / Data Key 교체 [4]

Git에 저장: 암호문 + 메타데이터
Git 밖에 보관: 개인키·KMS 접근 권한
```
파일명·필드 이름·구조는 노출될 수 있다. 암호화한 파일과 복호화 권한은 따로 관리한다.

### 공개키와 개인키

| 대상 | 역할 | 보관 |
|---|---|---|
| age 공개 recipient (`age1...`) | 새 파일의 데이터 키를 암호화 | `.sops.yaml`에 기록 가능 |
| age 개인키 (`AGE-SECRET-KEY-...`) | 데이터 키를 복호화 | Git 밖에 보관 |
| SOPS 데이터 키 | 파일의 값을 암호화 | recipient로 보호해 파일 메타데이터에 저장 |

SOPS는 파일마다 데이터 키를 만들고, age recipient로 그 키를 보호한다.
recipient를 추가하면 같은 파일을 열 수 있는 사람이 늘어난다. `.sops.yaml` 변경은
기존 암호문에 자동 반영되지 않는다. 자세한 원리: [SOPS 보안 모델](https://getsops.io/docs/security/) ·
[age 파일 형식 명세](https://c2sp.org/age).

## 1. 키 준비 — 설치와 age

### 설치

```sh
# macOS
brew install sops age

# 설치 확인
sops --version
age-keygen --version
```

### Age 키 준비

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

## 2. 암호화 정책과 파일 생성

`.sops.yaml`은 새 파일에 적용할 Recipient 선택 규칙이다. 기존 파일의 Recipient 변경은 별도 갱신이 필요하다.

### .sops.yaml

저장소 root에 규칙을 둔다. `age-keygen -y` 출력으로 아래 예시 recipient를 교체한다.
SOPS는 대상 경로와 처음 일치하는 `creation_rules`를 새 파일 암호화에 사용한다.

```yaml
creation_rules:
  - path_regex: '(^|/)secrets/.*\.sops\.ya?ml$'
    age: age1example_public_recipient
```

### 파일 만들기

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

### 커밋 전 확인

```sh
# 암호화된 파일과 규칙만 stage한 뒤 실제로 커밋할 내용 확인
git add -- .sops.yaml secrets/app.sops.yaml
git diff --cached -- .sops.yaml secrets/app.sops.yaml
git status --short
```

`filestatus`는 지정한 파일의 암호화 여부만 확인한다. diff와 staged 파일 목록에서
평문 파일·개인키가 포함되지 않았는지도 확인한다. 이전에 평문을 커밋했다면 이 단계로
Git 이력이 사라지지 않으므로 해당 credential을 교체해야 한다.

Git에는 `.sops.yaml`과 암호화 결과만 저장한다. age 개인키, 편집 중 생성된 평문,
`sops decrypt ... > plain.yaml`의 출력은 저장하지 않는다.

### 여러 recipient

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

## 3. 암호화 파일 사용 — 편집·조회·전달

파일을 평문으로 영구 저장하지 않고 편집·조회·프로세스에 전달하는 경로를 구분한다.

### Neovim으로 편집

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

### 조회

```sh
# 전체 내용을 stdout으로 복호화
sops decrypt secrets/app.sops.yaml

# YAML/JSON 경로 하나만 추출
sops decrypt \
  --extract '["database"]["password"]' \
  secrets/app.sops.yaml
```

stdout 출력은 terminal scrollback, pipe 대상, CI log에 남을 수 있다. 필요한 값만
`--extract`로 읽고 출력 결과를 log에 기록하지 않는다.

### 프로세스에 전달

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

## 4. 키 관리 — Recipient 변경과 Data Key 회전

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

## 5. 진단

### 흔한 문제 — 원인별 확인

| 증상 | 확인 대상 |
|---|---|
| `no matching creation rules` | `.sops.yaml`의 `path_regex`와 대상 경로 |
| `no identity matched any recipient` | age 개인키와 파일 recipient |
| `MAC mismatch` | 파일 손상·SOPS 밖에서의 수정; 무결성 검사를 우회하지 않음 |
| 새 recipient가 적용되지 않음 | 기존 파일은 `sops updatekeys <file>` 실행 |

## 참고

- [age — 파일 전체 암호화·복호화와 키 준비](age.md)
- [SOPS 공식 저장소](https://github.com/getsops/sops)
- [SOPS 공식 문서](https://getsops.io/)

## 관련 글

- [비밀번호는 어디에 보관할까? SOPS+age, Bitwarden, 1Password](https://clang-engineer.github.io/posts/security/2026-11-13-password-storage-sops-bitwarden-1password/)
