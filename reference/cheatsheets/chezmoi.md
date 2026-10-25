# chezmoi — Dotfiles 상태·변환·배포 지도

> chezmoi는 여러 환경의 설정 파일을 **Source에서 원하는 상태(Target)로 해석한 뒤 실제 홈(Destination)에 적용**한다. 명령보다 세 상태와 변환 규칙을 먼저 이해한다.

## 전체 기능 지도

```text
chezmoi
├─ 상태 관리     Source / Target / Destination
├─ 파일 속성     dot_ / private_ / executable_ / symlink_ / exact_
├─ 환경별 변환   Template / Data / Secret
├─ 자동 실행     run_ / run_once_ / run_onchange_
├─ 제외·보호     .chezmoiignore / age / GPG
├─ 동기화        Git / init / update / re-add
└─ 검증          diff / status / verify / doctor
```

## 세 상태와 명령의 방향

```text
실제 홈 파일 ── add / re-add ──> Source State (관리 원본)
                                    │
                               속성·템플릿 해석
                                    ▼
                               Target State
                                    │
                         diff / status → apply
                                    ▼
                              Destination (~)
```

- `add`는 기존 파일을 관리 대상으로 편입, `edit`는 Source 수정, `re-add`는 Destination 변경을 Source에 다시 반영한다.
- `diff`는 적용 전 차이를 확인하고 `apply`는 실제 파일을 변경한다.
- `update`는 Source 저장소의 갱신과 적용을 연결한다. Source와 Destination은 자동 양방향 동기화되는 것이 아니다.

## 파일 이름이 속성을 표현한다

```text
Source name                    Destination
dot_zshrc                   → ~/.zshrc
private_dot_ssh/config      → ~/.ssh/config (권한 제한)
executable_script           → ~/script (실행 가능)
symlink_dot_vimrc           → ~/.vimrc (심볼릭 링크)
dot_zshrc.tmpl              → ~/.zshrc (템플릿 렌더)
exact_dot_config/           → ~/.config/ (관리 대상과 일치하도록 조정)
```

접두어는 **파일의 의미와 배포 방식**을 지정한다. `exact_`는 관리하지 않는 대상 파일을 삭제할 수 있으므로 특히 주의한다. 파일명 속성을 변경할 때는 `chattr`를 사용한다.

## Template과 Data의 역할

```text
Source Template (.tmpl)
       + Data (.chezmoi.os / 사용자 설정 / Secret)
                         │
                         ▼
                  Rendered Target
```

`Template`는 머신별 분기·값 주입, `Data`는 그 분기에 사용하는 입력이다. `.chezmoitemplates`는 여러 파일이 재사용하는 템플릿 조각을 관리한다.

```gotmpl
{{ if eq .chezmoi.os "darwin" }}
# macOS 전용 설정
{{ end }}
```

`chezmoi data`는 사용 가능한 데이터를 확인하고, `chezmoi cat <target>`은 렌더링 결과를 확인한다.

## 파일 배포와 스크립트 실행은 다르다

| 구분 | 역할 | 대표 형식 |
|---|---|---|
| Managed file | Target 상태로 배포 | `dot_zshrc`, `.tmpl` |
| Run script | 적용 과정에서 명령 실행 | `run_...` |
| Once | 스크립트 내용 기반 실행 이력 | `run_once_...` |
| On change | 내용 변경을 기준으로 재실행 | `run_onchange_...` |
| Ignore | Target 대상에서 제외 | `.chezmoiignore` |
| Encrypt | Source에 비밀값을 암호화해 보관 | `encrypted_...` |

`run_once_`·`run_onchange_`는 단순한 시간 기반 스케줄러가 아니다. 스크립트 내용의 변화와 실행 상태를 기반으로 적용 여부를 판단한다.

## Git·Secret·검증의 경계

```text
Git          → Source 버전·동기화
chezmoi      → Target 생성·Destination 적용
age / GPG    → 비밀값 암호화·복호화
Secret store → 템플릿에 필요한 민감 정보 공급
```

암호화된 파일이라도 복호화된 Destination과 실행 로그의 접근 권한은 별도로 관리한다.

```sh
chezmoi diff
chezmoi apply --dry-run
chezmoi apply
chezmoi verify
```

**주의:** `apply`는 실제 파일을 덮어쓸 수 있다. `destroy`·`exact_` 등 파괴적 기능은 대상과 미리보기를 확인한다.

공식 명세: [chezmoi User Guide](https://www.chezmoi.io/user-guide/) · [Reference](https://www.chezmoi.io/reference/)
