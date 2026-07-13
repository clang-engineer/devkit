# chezmoi Cheatsheet

여러 머신에 dotfiles를 관리·배포하는 Go 단일 바이너리. 핵심 모델은 **3-상태**:

- **source state** — git으로 추적하는 dotfiles 원본. 기본 `~/.local/share/chezmoi`.
- **target state** — source에 템플릿/스크립트를 적용해 계산한 "이래야 한다"는 상태.
- **destination** — 실제 홈(`~`). `apply`가 destination을 target으로 맞춘다.

편집은 **source를 고치고 `apply`** 하는 게 정석. destination(`~/.zshrc` 등)을 직접 고치면 다음 `apply`에서 덮인다.

## 일상 명령어

| 명령 | 동작 |
|------|------|
| `chezmoi init` | source 디렉토리 생성/초기화 |
| `chezmoi init <user>/<repo>` | GitHub 리포에서 source clone (`--apply`로 clone+적용 한 번에) |
| `chezmoi add ~/.zshrc` | 기존 파일을 source로 편입 (`dot_zshrc`로 저장됨) |
| `chezmoi edit ~/.zshrc` | 그 파일의 **source**를 연다 (destination 아님) |
| `chezmoi apply` | destination을 target에 맞춤 (실제 적용) |
| `chezmoi diff` | target vs destination 차이 (적용 전 미리보기) |
| `chezmoi status` | 변경될 항목 요약 (`git status`처럼 코드 표시) |
| `chezmoi re-add` | destination에서 수정된 관리 파일을 source로 되반영 |
| `chezmoi update` | `git pull` + `apply` 한 번에 |
| `chezmoi cd` | source 디렉토리에서 서브셸 실행 (`exit`로 복귀) |
| `chezmoi git -- <args>` | source에서 git 실행 (`chezmoi git -- push`) |
| `chezmoi managed` / `unmanaged` | 관리 중 / 관리 안 되는 파일 목록 |
| `chezmoi forget ~/.zshrc` | source에서만 제거 (destination 파일은 유지) |
| `chezmoi destroy ~/.zshrc` | source + destination + state 전부 삭제 |
| `chezmoi doctor` | 환경 진단 (누락 도구, 설정 문제) |

- **적용 전 항상 `diff` 또는 `-n`(`--dry-run`).** `apply -v`는 뭘 바꾸는지 보여주며 적용.
- `chezmoi apply ~/.zshrc`처럼 **경로 인자로 대상 한정** 가능 (전체 대신 일부만).
- `status` 코드: 왼쪽=마지막 적용 후 destination 변화, 오른쪽=적용 시 일어날 변화. `M`=수정 `A`=추가 `D`=삭제.

## source 네이밍 규칙 (attributes)

source 파일명의 **접두사/접미사가 곧 파일 속성**. destination 이름으로 역변환된다.

| source 이름 | destination | 의미 |
|-------------|-------------|------|
| `dot_zshrc` | `.zshrc` | `dot_` → 선행 `.` |
| `private_dot_ssh/` | `.ssh/` (0600/0700) | 그룹·기타 권한 제거 |
| `readonly_foo` | `foo` (0444) | 쓰기 권한 제거 |
| `executable_script` | `script` (+x) | 실행 권한 부여 |
| `dot_zshrc.tmpl` | `.zshrc` | 템플릿으로 렌더 |
| `encrypted_private_key.age` | `key` | 저장은 암호화, 적용 시 복호화 |
| `symlink_dot_vimrc` | `.vimrc` → 심볼릭 링크 | 내용이 링크 타겟 경로 |
| `exact_dot_config/` | `.config/` | 디렉토리에서 관리 외 파일 **삭제** (정확히 일치) |
| `empty_foo` | `foo` (빈 파일 허용) | 기본은 빈 파일이면 제거되는데 이걸로 유지 |
| `literal_...` | 접두사 파싱 중단 | 실제로 `dot_`로 시작하는 파일명 등 |

- **속성 변경은 손으로 rename 말고 `chezmoi chattr`.** 예: `chezmoi chattr +executable,private ~/.ssh/config` / `+template ~/.zshrc`.
- 접두사 순서 고정: `encrypted_` `private_` `readonly_` `empty_` `executable_` `symlink_` 등 → `dot_` → 이름. 헷갈리면 `add` 후 `chezmoi source-path ~/.foo`로 실제 저장 이름 확인.
- `exact_`는 **디렉토리 접두사** — 붙이면 그 디렉토리의 미관리 파일을 apply 시 지운다. 안 붙이면 추가 파일은 그대로 둔다.
- `symlink_`는 **말단 파일에만** 붙지 디렉토리엔 안 붙는다. 엔트리 파일 내용이 곧 링크 타겟 경로 (보통 `.tmpl`). 중첩 타겟(`~/.config/nvim`만 링크)은 **소스 디렉토리 중첩으로 미러**: `dot_config/symlink_nvim.tmpl` → `~/.config/nvim`. 평평한 `symlink_dot_config_nvim` 식 네이밍은 없다.

## 템플릿 (.tmpl)

Go `text/template` + [sprig](https://masterminds.github.io/sprig/) 함수. 머신별 분기·시크릿 주입에 사용.

```gotmpl
# ~/.gitconfig.tmpl
[user]
    email = {{ .email }}
{{ if eq .chezmoi.os "darwin" }}
    # macOS 전용 설정
{{ end }}
```

| 명령 | 동작 |
|------|------|
| `chezmoi data` | 템플릿에서 쓸 수 있는 전체 데이터 (`.chezmoi.*` + 사용자 정의) |
| `chezmoi execute-template '{{ .chezmoi.os }}'` | 템플릿 조각을 즉석 렌더 (디버깅) |
| `chezmoi cat ~/.gitconfig` | 템플릿 렌더 **결과**(target 내용)를 출력 |
| `chezmoi edit --apply ~/.zshrc` | 편집 직후 바로 적용 |

- 내장 변수: `.chezmoi.os` (`darwin`/`linux`), `.chezmoi.arch`, `.chezmoi.hostname`, `.chezmoi.homeDir`.
- 사용자 데이터는 `.chezmoi.toml.tmpl`(config 템플릿) 또는 source 루트의 `.chezmoidata.<fmt>`에 정의.
- 시크릿은 파일에 넣지 말고 템플릿 함수로: `{{ (onepassword "item").fields... }}`, `{{ pass "..." }}`, `{{ keyring "svc" "user" }}`.

## 스크립트 (run_)

source 루트의 `run_*` 파일은 **apply 시 실행**되는 스크립트(관리 파일 아님).

| 접두사 | 실행 시점 |
|--------|-----------|
| `run_foo.sh` | 매 apply마다 |
| `run_once_foo.sh` | 내용 해시가 처음일 때 딱 한 번 (setup용) |
| `run_onchange_foo.sh` | 스크립트 내용이 바뀔 때마다 (예: brew 목록 변경 시 `brew bundle`) |
| `run_before_` / `run_after_` | 파일 적용 **전 / 후** 순서 지정 |

- `run_once_`/`run_onchange_`는 **내용 해시로 판정**한다. `.tmpl`로 만들어 관련 데이터를 주석에 박아두면, 그 데이터가 바뀔 때 재실행을 유도할 수 있다.
- 실행 순서는 파일명 알파벳순. `run_once_before_00-...` 식으로 숫자 프리픽스를 흔히 쓴다.

## 무시 & 암호화

- **`.chezmoiignore`** — source 루트에 두면 그 패턴은 target에서 제외 (템플릿 지원 → OS별 무시 가능). `README.md` 등 리포에는 두되 배포 안 할 파일에. **적는 이름은 source명이 아니라 target명**: `dot_zshrc`(X) → `.zshrc`(O), run 스크립트는 프리픽스 뗀 이름(`run_once_after_10-x.sh` → `10-x.sh`). `.tmpl`이면 `{{ if ne .chezmoi.os "windows" }}` 블록 안에 **반대편(그 OS에서 안 쓸) 파일**을 넣어 무시.
- **암호화**: `chezmoi.toml`에 `encryption = "age"`(권장) 또는 `"gpg"` 설정 후 `chezmoi add --encrypt ~/.ssh/id_ed25519`. source엔 `encrypted_...age`로 저장, apply 때 복호화.
- age 키 생성: `chezmoi age gen-key`. edit는 `chezmoi edit`(자동 복호화) 또는 `chezmoi edit-encrypted`.

## 함정

- **destination 직접 편집분은 apply가 덮는다.** 손으로 고쳤으면 `chezmoi re-add`로 source에 회수하거나, 애초에 `chezmoi edit`으로 편집.
- **`add`는 스냅샷**이다 — 이후 파일이 바뀌어도 source는 자동 갱신 안 됨. `re-add`가 필요.
- **`.tmpl` 파일을 `add`로 다시 넣으면 템플릿이 리터럴 값으로 덮인다.** 템플릿은 `chezmoi edit`으로만 손대고 `add` 재실행 주의.
- **`exact_` 없는 디렉토리는 추가 파일을 안 지운다** — 정리를 원하면 `exact_`를 명시.
- source 위치는 `~/.local/share/chezmoi`가 기본이나 config로 바뀔 수 있다. 실제 위치는 `chezmoi source-path`로 확인.

## 검증

```sh
chezmoi doctor                 # 환경 진단
chezmoi diff                   # 적용 전 전체 차이
chezmoi apply -nv ~/.zshrc     # dry-run + verbose로 특정 파일만 미리보기
chezmoi verify && echo OK      # destination이 target과 일치하면 성공 종료코드
```

## 참고

- [chezmoi 공식 문서](https://www.chezmoi.io/)
- [User guide](https://www.chezmoi.io/user-guide/setup/) / [Reference](https://www.chezmoi.io/reference/)
- 관련 치트시트: `git.md` (source 리포 관리), `ssh.md` (암호화 대상 키)
