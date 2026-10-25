# ripgrep (rg) — 검색 범위와 출력 구조

> `rg`는 **패턴 검색**과 **검색 대상 파일 선택**을 분리해서 이해한다. `grep`과 옵션이 같다고 가정하지 않는다.

## 명령을 읽는 법

```text
rg [OPTIONS] PATTERN [PATH ...]
       │       │         └─ 어디에서 찾을까?
       │       └─ 무엇을 찾을까? (정규식)
       └─ 어떤 파일을 읽고 어떻게 출력할까?
```

```sh
rg 'TODO' src/             # src 안에서 패턴 검색
rg -n 'TODO'               # -n: line number
rg -l 'TODO'               # -l: 일치하는 파일명만
rg -g '*.rs' 'unsafe'      # -g: glob으로 대상 파일 제한
rg -t py 'import'          # -t: file type 필터
```

## 세 가지 필터는 서로 다르다

```text
PATH / glob / type  → 검색할 파일 선택
정규식 PATTERN      → 파일 안에서 일치하는 내용 선택
출력 옵션           → 줄 / 파일명 / 문맥 / JSON 등 표시
```

| 구성 | 의미 | 예 |
|---|---|---|
| `-g` / `--glob` | 파일 경로 패턴 | `-g '*.md'` |
| `-t` / `--type` | 등록된 파일 종류 | `-t py` |
| `-C N` | 일치 줄 앞뒤 N줄 | `-C 2` |
| `-F` | 패턴을 정규식이 아닌 리터럴로 해석 | `rg -F 'a.b'` |
| `-i` | 대소문자 무시 | `rg -i 'error'` |
| `-l` | 내용 대신 파일 경로 출력 | `rg -l 'TODO'` |

## 기본 검색에서 빠지는 파일

```text
기본 검색 → ignore 규칙·숨김 파일·바이너리 감지 적용
   ├─ -uu  → ignore·숨김 파일 제한 완화
   └─ -uuu → 바이너리 제한도 완화
```

`-u`는 검색 범위를 넓히는 단계형 옵션이다. `-uu`·`-uuu`는 큰 디렉터리까지 읽을 수 있으므로 검색 경로를 좁혀 사용한다. 파일만 나열할 때는 `rg --files`를 사용한다.

## 다른 도구와 연결

```text
rg --files | fzf    → 파일 후보를 골라 열기
rg -l TODO | fzf    → TODO가 있는 파일 중 선택
rg --json ...       → 구조화된 검색 결과를 프로그램에서 처리
```

검색 대상과 선택 UI는 서로 다르다. `fzf`는 전달받은 후보를 선택하지만 파일 내용 검색은 `rg`가 수행한다.

공식 문서: [ripgrep 저장소](https://github.com/BurntSushi/ripgrep) · `rg --help`
