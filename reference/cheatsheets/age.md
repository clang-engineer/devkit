# age — 파일 암호화 치트시트

> **age는 파일 전체를 암호화·복호화한다.** 텍스트·DB·바이너리를 같은 방식으로 다루며,
> 암호문 안의 구조는 Git diff로 볼 수 없다. 자주 편집하는 YAML·JSON 설정에는
> [SOPS](sops.md)가 age 키를 활용해 편집 절차를 관리한다.

## 파일과 키의 관계

```text
평문 파일 ── age -R 공개 recipient 목록 ──> 파일.age
                                            │
개인키 파일 ── age -d -i ────────────────────┘
                         │
                         ▼
                      복호화된 파일
```

`recipient`는 암호화할 상대의 공개키, `identity`는 복호화할 개인키다.
한 암호문에 recipient를 여러 개 지정하면 각 개인키 소유자가 **독립적으로** 복호화한다.
개인키와 암호문을 같은 Git 저장소에 커밋하면 저장소 접근자도 복호화할 수 있다.

## 1. 키 준비

```sh
# macOS (Linux는 사용하는 패키지 매니저로 age 설치)
brew install age
age --version

# 개인키는 저장소 밖에 생성; 이미 있는 파일을 덮어쓰지 않도록 확인
mkdir -p "$HOME/.config/age"
umask 077
age-keygen -o "$HOME/.config/age/keys.txt"

# 공개 recipient만 저장소에 기록 가능
age-keygen -y "$HOME/.config/age/keys.txt" > recipients.txt
```

`keys.txt`를 잃으면 해당 키로 암호화한 파일은 복구할 수 없다. 안전한 장소에 백업한다.
`recipients.txt`는 공개키 목록이다. 여러 사람이 열어야 하면 각자의 공개 recipient를
한 줄씩 추가한다. 개인키는 추가하지 않는다.

## 2. 파일 암호화·복호화

아래 `<...>`는 파일 경로를 나타내는 설명용 자리표시자다. 셸에 그대로 입력하지 말고
실제 경로로 바꿔 실행한다.

```sh
# -R: 공개 recipient 목록 파일, -o: 암호문 파일 (생략하면 stdout)
age -R <공개키_목록_경로> -o <암호문_파일_경로> <원문_파일_경로>

# -d: 복호화, -i: 개인키 파일, -o: 복원본 파일
age -d -i <개인키_파일_경로> -o <복원본_파일_경로> <암호문_파일_경로>
```

`<암호문_파일_경로>`는 암호화 결과, `<복원본_파일_경로>`는 **평문**이다.
복원본을 Git에 추가하지 않는다. 암호화가 원문 파일을 자동 삭제하지도 않는다.
암호문과 개인키만으로 복원되는지 확인한 뒤 평문 파일의 보관·삭제를 결정한다.
`rm`은 안전한 완전 삭제를 보장하지 않는다.

### 파일을 수정할 때

age 단독에는 편집 명령이 없다. 복호화 → 편집 → **새 암호문 생성·확인** 순서다.
예를 들어 `data.bin.restored`를 편집했다면:

```sh
age -R recipients.txt -o data.bin.age.next data.bin.restored
age -d -i "$HOME/.config/age/keys.txt" -o /dev/null data.bin.age.next
# 복호화 가능함을 확인한 후 기존 암호문을 교체하고 평문을 정리
```

`/dev/null` 검사는 해당 키로 **복호화가 가능하다**는 것만 확인한다. 편집 내용이
의도한 값인지는 암호문 교체 전에 별도로 확인한다. 반복해서 편집하는 설정 파일이면
[SOPS의 편집 절차](sops.md#neovim으로-편집)가 편하다.

## 3. 다른 입력 방식

| 필요 | 명령·옵션 | 특징 |
|---|---|---|
| 한 공개키를 직접 지정 | `age -r '<recipient>' -o data.age data` | `-r`을 반복하면 각 수신자가 복호화 가능 |
| 비밀번호로 암호화 | `age -p -o data.age data` | 대화형으로 입력; `-r`·`-R`과 함께 쓸 수 없음 |
| 텍스트 형태 암호문 | `age -a -R recipients.txt -o data.age data` | ASCII armor; 복호화 시 자동 인식 |

비밀번호 모드는 복호화할 때 `age -d -o data.restored data.age`로 입력을 요청한다.
비밀번호를 잊으면 복구할 수 없다. 공개키 방식과 달리 수신자를 추가하려면 파일을
다시 암호화해야 한다.

## 4. Git에 저장하기 전

```sh
# 암호문과 공개 recipient 파일만 stage하고 내용을 확인
git add -- data.bin.age recipients.txt
git diff --cached -- data.bin.age recipients.txt
git status --short
```

평문, 개인키, 복호화한 작업 파일이 staged 목록에 없는지 확인한다. 이미 평문을 커밋했다면
암호문을 새로 추가해도 Git 이력은 남으므로 노출된 자격 증명을 교체해야 한다.
파일명·크기·변경 시점 같은 Git 메타데이터는 감춰지지 않는다.

## 참고

- [age 공식 저장소 및 사용법](https://github.com/FiloSottile/age)
- [age(1) 명령 매뉴얼](https://github.com/FiloSottile/age/blob/main/doc/age.1.html)
- [SOPS — 구조화된 설정 파일 편집](sops.md)
