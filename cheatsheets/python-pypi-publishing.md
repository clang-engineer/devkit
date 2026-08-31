# Python PyPI Trusted Publishing Cheatsheet

> GitHub Actions의 OpenID Connect(OIDC) 신원으로 PyPI에 배포하는 흐름. 장기
> `PYPI_API_TOKEN` 없이, 지정한 저장소·워크플로·환경에서만 짧은 수명의 배포
> 자격을 받는다.

## 30초만 본다면

| 단계 | 핵심 |
|---|---|
| PyPI 연결 | 기존 프로젝트: **Manage → Publishing** / 신규 프로젝트: 계정 **Publishing**에서 pending publisher 등록 |
| 일치해야 할 값 | GitHub owner, repository, **workflow 파일명**, environment 이름 `pypi` |
| GitHub 환경 | 저장소 **Settings → Environments → New environment → `pypi`** |
| 빌드 | `uv build --no-sources` |
| 배포 전 검사 | `uvx twine check --strict dist/*` |
| 권한 | publish job에만 `permissions: id-token: write` |
| 인증 | `pypa/gh-action-pypi-publish` 사용, PyPI token secret은 만들지 않음 |
| 재배포 | PyPI 파일명은 불변. 수정본은 **버전을 올려** 다시 빌드·배포 |
| 배포 후 | PyPI JSON 확인 + 깨끗한 격리 환경에서 설치·실행 |

## 1. PyPI Trusted Publisher 등록

### 이미 PyPI 프로젝트가 있을 때

프로젝트 페이지에서 **Manage → Publishing → Add a new publisher**로 이동한다.
**Manage → Collaborators가 아니다.**

### 아직 PyPI 프로젝트가 없을 때

PyPI 계정 설정의 **Publishing → Add a new pending publisher**에서 등록한다. 첫
성공 배포가 프로젝트를 만들고 pending publisher를 일반 publisher로 전환한다.
등록한 프로젝트 이름과 빌드 메타데이터의 distribution 이름이 일치해야 한다.

### GitHub publisher 입력값

| PyPI 필드 | 입력값 | 주의 |
|---|---|---|
| PyPI project name | 배포할 distribution 이름 | import 패키지명이 아니라 PyPI 배포 이름 |
| Owner | GitHub 사용자 또는 조직 이름 | 대소문자를 포함해 실제 owner 확인 |
| Repository name | 저장소 이름만 | `owner/repository` 전체를 넣지 않음 |
| Workflow name | 예: `publish.yml` | `.github/workflows/` 경로가 아닌 **파일명만** |
| Environment name | `pypi` | GitHub job의 `environment.name`과 정확히 일치 |

PyPI는 GitHub OIDC token의 owner/repository/workflow/environment claim을 등록값과
대조한다. workflow 파일을 rename하거나 저장소를 이전하면 publisher 설정도
갱신한다.

## 2. GitHub `pypi` environment 만들기

저장소 **Settings → Environments → New environment**에서 `pypi`를 만든다. 필요하면
여기에 required reviewers나 배포 branch/tag 규칙을 추가한다. workflow의 publish
job에도 같은 환경을 선언해야 환경 claim과 보호 규칙이 적용된다.

```yaml
environment:
  name: pypi
  url: https://pypi.org/p/<distribution-name>
```

## 3. 로컬에서 배포물 만들고 검사하기

```sh
rm -rf dist
uv build --no-sources
uvx twine check --strict dist/*
```

`--no-sources`는 빌드할 때 uv 전용 source 설정을 무시해, 실제 배포본이 공개 package
index에서 해결 가능한지 확인하기 쉽게 한다. `twine check --strict`는 README 렌더링
경고도 실패로 처리한다. wheel과 source distribution(sdist)을 모두 검사한다.

## 4. 안전한 GitHub release workflow

빌드와 배포를 별도 job으로 둔다. build job은 산출물을 artifact로 넘기고, publish
job만 OIDC token 발급 권한을 가진다.

```yaml
# .github/workflows/publish.yml
name: Publish Python distribution

on:
  release:
    types: [published]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: astral-sh/setup-uv@v10
      - name: Build distributions
        run: uv build --no-sources
      - name: Check distributions
        run: uvx twine check --strict dist/*
      - uses: actions/upload-artifact@v7
        with:
          name: python-package-distributions
          path: dist/

  publish:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: pypi
      url: https://pypi.org/p/<distribution-name>
    permissions:
      id-token: write
    steps:
      - uses: actions/download-artifact@v8
        with:
          name: python-package-distributions
          path: dist/
      - uses: pypa/gh-action-pypi-publish@release/v1
```

- `id-token: write`는 OIDC token을 요청할 권한이지 저장소 쓰기 권한이 아니다.
- `password`, `user`, `PYPI_API_TOKEN`을 설정하지 않는다. action이 Trusted
  Publishing 교환을 수행한다.
- build job에는 `id-token: write`를 주지 않는다. 검증된 artifact만 publish job으로
  전달한다.
- PyPI Trusted Publishing의 publish step은 reusable workflow에서 지원되지 않는다.
  PyPI에 등록한 최상위 workflow에 publish job을 직접 둔다.

## 5. 릴리스와 배포 후 검증

릴리스 전에 버전, tag, 빌드 메타데이터가 일치하는지 확인한다. PyPI는 한 번 업로드한
파일명을 덮어쓰거나 교체하지 않는다. 잘못 올렸다면 삭제 후 같은 파일을 다시 올리는
대신 **버전을 올려** 새 파일명으로 배포한다.

```sh
# PyPI가 해당 버전과 파일을 제공하는지 확인
curl -fsSL \
  https://pypi.org/pypi/<distribution-name>/<version>/json \
  | jq '{name: .info.name, version: .info.version, files: [.urls[].filename]}'

# 현재 프로젝트/가상환경과 분리해 실제 PyPI 배포본 실행
uvx --from '<distribution-name>==<version>' <console-command> --version
```

CLI가 없는 라이브러리는 격리된 임시 환경에서 import를 확인한다.

```sh
uv run --isolated --no-project \
  --with '<distribution-name>==<version>' \
  python -c 'import <import_name>; print(<import_name>.__version__)'
```

배포 직후 CDN/index 반영에 짧은 지연이 있을 수 있다. JSON에는 새 버전이 있지만 설치가
안 되면 잠시 후 다시 확인하되, 로컬 cache의 기존 설치를 성공으로 오인하지 않도록
격리 실행을 유지한다.

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| `invalid-publisher` | PyPI **Manage → Publishing**에 등록했는지 확인. Collaborators는 업로드 신원 설정이 아님 |
| `invalid-publisher` | owner, repository, workflow **파일명**, `environment: pypi`가 등록값과 정확히 같은지 확인 |
| 신규 프로젝트를 못 찾음 | 프로젝트 Manage가 아니라 계정 **Publishing**의 pending publisher를 사용했는지 확인 |
| OIDC token을 받지 못함 | publish job에 `permissions: id-token: write`가 있는지 확인 |
| environment 불일치 | GitHub에 `pypi` 환경이 존재하고 publish job이 `environment.name: pypi`를 선언했는지 확인 |
| 파일이 이미 존재함 / 400 | 같은 distribution·version의 파일명은 재사용 불가. 버전을 올리고 `dist/`를 다시 빌드 |
| build는 성공, publish는 실패 | artifact 이름/경로와 `needs: build`, PyPI publisher의 workflow 파일명을 확인 |

## 공식 문서

- [PyPI: Adding a Trusted Publisher to an Existing PyPI Project](https://docs.pypi.org/trusted-publishers/adding-a-publisher/)
- [PyPI: Creating a PyPI Project through OIDC](https://docs.pypi.org/trusted-publishers/creating-a-project-through-oidc/)
- [PyPI: Troubleshooting Trusted Publishing](https://docs.pypi.org/trusted-publishers/troubleshooting/)
- [Python Packaging User Guide: Packaging Python Projects](https://packaging.python.org/en/latest/tutorials/packaging-projects/)
- [uv: Building and publishing a package](https://docs.astral.sh/uv/guides/package/)
- [GitHub Actions: OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [GitHub Actions: Managing environments for deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [PyPA publish action](https://github.com/pypa/gh-action-pypi-publish)
