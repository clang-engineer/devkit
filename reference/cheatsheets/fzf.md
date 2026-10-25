# fzf — 선택 파이프라인 치트시트

> **검색 대상 생성**과 **대화형 선택**을 분리한다. fzf는 `fd`·`rg`·`git` 등의 출력을 받아 선택값을 stdout으로 돌려주는 필터다.

## 데이터 흐름

```text
후보 생성           선택 UI            결과 소비
fd / rg / git ──|──> fzf [옵션] ──|──> nvim / script / shell
                       │
                       ├─ -m, --multi    복수 선택
                       ├─ --preview CMD  후보 미리보기
                       ├─ --bind K:A     키와 동작 연결
                       └─ --nth FIELDS  검색할 필드 선택
```

`|`는 stdout을 다음 명령의 stdin으로 전달한다. `$(...)`는 명령 출력을 인자로 치환한다.

```sh
fd --type f | fzf                       # 파일 하나 선택
nvim "$(fd --type f | fzf)"              # 선택 파일 열기
fd --type f | fzf -m                    # 복수 선택
fd --type f | fzf --preview 'bat {}'    # {} = 현재 후보
```

## 선택 결과를 인자로 사용할 때

```text
단일 선택 → 경로 한 개 → "$(...)"로 한 인자 유지
다중 선택 → 경로 여러 개 → 각 경로를 별도 인자로 전달
취소      → 빈 결과 / 실패 상태를 확인
```

`fzf -m`의 여러 줄 결과를 하나의 `"$(...)"`로 감싸면 여러 파일이 **하나의 인자**가 된다. 공백·줄바꿈이 있는 파일명을 안전하게 다루려면 NUL 구분(`--read0`, `--print0`)을 활용한다.

```bash
file=$(fd --type f | fzf) || exit
[[ -n $file ]] && nvim -- "$file"
```

자동화에서 `fzf` 선택 취소와 명령 실패를 구분해야 한다면 종료 상태도 확인한다.

## 비슷해 보여도 다른 역할

```text
rg      내용에서 패턴 검색
fd      파일·디렉터리 후보 생성
fzf     전달된 후보 중 선택
zoxide  방문 기록으로 디렉터리 추정
```

## Shell 통합

zsh에서는 `source <(fzf --zsh)`로 키 바인딩을 설정할 수 있다.

| 키 | 동작 |
|---|---|
| `Ctrl-T` | 파일·경로 선택 |
| `Alt-C` | 디렉터리 선택 후 이동 |
| `Ctrl-R` | 히스토리 검색 (Atuin을 쓰면 바인딩 담당을 정한다) |

화면 배치는 `--height`, `--layout`, 필드 분리는 `--delimiter`, 상세 옵션은 공식 문서를 참고한다. 비대화형 자동화에 불필요하게 fzf를 넣지 않는다.

공식 저장소: <https://github.com/junegunn/fzf>
