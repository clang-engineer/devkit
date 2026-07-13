# Vim Cheatsheet

> **모드**: Normal(기본), Insert(입력), Visual(선택), Command(명령)
> 대부분의 명령 앞에 숫자를 붙이면 반복된다. 예: `5dd` = 5줄 삭제, `3w` = 단어 3개 이동.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 입력 모드 진입 | `i` (커서 위치) / `a` (다음) / `o` (아래 줄) |
| 입력 → Normal | `Esc` 또는 `Ctrl+[` |
| 저장하고 나가기 | `:wq` 또는 `ZZ` |
| 저장 안 하고 나가기 | `:q!` |
| 마지막 변경 취소 / 재실행 | `u` / `Ctrl+R` |
| 줄 삭제·복사·붙여넣기 | `dd` / `yy` / `p` |
| 검색 | `/패턴` (다음 `n`, 이전 `N`) |
| 치환 (파일 전체) | `:%s/old/new/g` |
| 줄로 점프 | `:42` 또는 `42G` |
| 단어 단위 이동 | `w` / `b` / `e` |
| 매치 괄호로 점프 | `%` |
| 보이는 곳에서 끝까지 삭제 | `D` (`d$`와 동일) |
| 시스템 클립보드에 복사 | `"+y` (Linux) / `"*y` (macOS는 동등) |
| 시스템 클립보드에서 붙여넣기 | `"+p` |

## 모드 전환

| 명령어 | 설명 |
|--------|------|
| `i` | 커서 위치에 입력 모드 |
| `I` | 줄 첫 문자 앞에 입력 모드 |
| `a` | 커서 다음에 입력 모드 |
| `A` | 줄 맨 뒤에 입력 모드 |
| `o` | 아래 줄에 입력 모드 |
| `O` | 위 줄에 입력 모드 |
| `s` | 문자 삭제 후 입력 모드 |
| `S` | 줄 삭제 후 입력 모드 |
| `Esc` / `Ctrl+c` | Normal 모드로 돌아가기 |
| `v` | Visual 모드 (문자 단위) |
| `V` | Visual Line 모드 (줄 단위) |
| `Ctrl+v` | Visual Block 모드 (블록) |
| `gv` | 직전 Visual 선택 영역 복원 |

## 커서 이동

| 명령어 | 설명 |
|--------|------|
| `h` `j` `k` `l` | 좌 하 상 우 |
| `w` / `W` | 다음 단어 시작 (W는 공백 기준) |
| `e` / `E` | 다음 단어 끝 |
| `b` / `B` | 이전 단어 시작 |
| `ge` / `gE` | 이전 단어 끝 |
| `0` | 줄 맨 앞 (0번째 칸) |
| `^` | 줄 첫 비공백 문자 |
| `$` | 줄 맨 뒤 |
| `g_` | 줄 마지막 비공백 문자 |
| `gg` | 파일 맨 앞 |
| `G` | 파일 맨 뒤 |
| `5G` / `:5` | 5번째 줄로 이동 |
| `H` `M` `L` | 화면 위 / 중간 / 아래로 이동 |
| `{` / `}` | 이전 / 다음 단락 |
| `(` / `)` | 이전 / 다음 문장 |
| `%` | 짝 괄호로 이동 `()` `[]` `{}` |
| `fx` / `Fx` | 현재 줄에서 다음 / 이전 `x` 문자로 이동 |
| `tx` / `Tx` | `x` 직전 / 직후로 이동 |
| `;` / `,` | 직전 `f`/`t` 검색 반복 (정/역방향) |
| `*` / `#` | 커서 단어로 아래 / 위 검색 |

## Prefix 키 개념

> Vim의 키맵은 prefix로 카테고리가 갈린다. 새 키맵을 외울 때 어디 prefix인지부터 보면 빨라진다.

| Prefix | 카테고리 | 예 |
|---|---|---|
| `g` | 확장 명령 | `gg`(맨 위), `gd`(local 정의), `gx`(URL 열기), `gu`/`gU`(대소문자), `g;`/`g,`(change list) |
| `z` | 화면·fold | `zz`(중앙), `zo`/`zc`(fold), `zR`/`zM`(전부), `zt`/`zb`(맨 위/아래) |
| `[` / `]` | 이전/다음 이동 | `[d`/`]d`(진단), `[m`/`]m`(함수), `[p`/`]p`(인덴트 붙여넣기) |
| `d` `y` `c` | operator (+motion) | `dw`, `y$`, `cw`, `ciw`, `daB` |
| `<leader>` | 사용자/플러그인 | `<leader>w` 등 (기본 `\`, LazyVim은 `Space`) |
| `<localleader>` | 파일타입 전용 | (기본 `\`) |
| `m` / `"` | 마크 / 레지스터 | `ma`, `"ay`, `"+y` |

## 스크롤

| 명령어 | 설명 |
|--------|------|
| `Ctrl+f` / `Ctrl+b` | 한 페이지 아래 / 위 |
| `Ctrl+d` / `Ctrl+u` | 반 페이지 아래 / 위 |
| `Ctrl+e` / `Ctrl+y` | 한 줄 아래 / 위 |
| `zz` | 커서를 화면 중앙으로 |
| `zt` | 커서를 화면 위로 |
| `zb` | 커서를 화면 아래로 |

## Insert 모드 단축키

| 명령어 | 설명 |
|--------|------|
| `Ctrl+h` | 한 문자 지우기 (백스페이스) |
| `Ctrl+w` | 한 단어 지우기 |
| `Ctrl+u` | 줄 시작까지 지우기 |
| `Ctrl+j` | 줄바꿈 삽입 |
| `Ctrl+t` / `Ctrl+d` | 들여쓰기 / 내어쓰기 |
| `Ctrl+n` / `Ctrl+p` | 자동완성 다음 / 이전 후보 (단어) |
| `Ctrl+r{reg}` | 레지스터 내용 삽입 (예: `Ctrl+r"`) |
| `Ctrl+o {cmd}` | Normal 명령 한 번 실행 후 다시 Insert |

### Ctrl-X 자동완성 (플러그인 없이)

| 키 | 대상 |
|---|---|
| `Ctrl+x Ctrl+l` | 라인 단위 |
| `Ctrl+x Ctrl+f` | 파일명·경로 (현재 디렉토리 기준) |
| `Ctrl+x Ctrl+o` | omnifunc (filetype별) |
| `Ctrl+x Ctrl+k` | 사전 (`dictionary` 옵션) |
| `Ctrl+x Ctrl+n` / `Ctrl+x Ctrl+p` | 현재 버퍼 단어 |

## Abbreviate — 타이핑 시 자동 치환

스페이스/Enter 직후 치환.

```vim
abbr  consolee console     " insert + command 모두
iabbr coment   comment     " insert 전용
cabbr Q        q           " command 전용
```

### 동적 abbreviate

```vim
iabbr <expr> __time   strftime("%Y-%m-%d %H:%M:%S")
iabbr <expr> __file   expand('%:p')
iabbr <expr> __branch trim(system("git rev-parse --abbrev-ref HEAD"))
```

타임스탬프·파일명 자주 넣으면 스니펫 플러그인 대체.

## 편집

| 명령어 | 설명 |
|--------|------|
| `x` / `X` | 커서 / 이전 문자 삭제 |
| `r<char>` | 문자 하나 교체 |
| `R` | Replace 모드 (덮어쓰기) |
| `u` | Undo |
| `U` | 현재 줄의 모든 변경 되돌리기 |
| `Ctrl+r` | Redo |
| `.` | 마지막 변경 반복 |
| `Ctrl+a` / `Ctrl+x` | 커서 아래(뒤) 숫자 증가 / 감소 (`10Ctrl+a` = +10) |
| `J` | 다음 줄을 현재 줄 뒤에 붙임 (보통 공백 1개, 문장 끝 뒤 2개·`)` 앞 0개) |
| `gJ` | 공백 없이 줄 붙이기 |
| `~` | 대소문자 토글 |
| `g~{motion}` | 영역 대소문자 토글 |
| `gu{motion}` / `gU{motion}` | 영역 소문자 / 대문자화 |
| `cc` / `S` | 줄 변경 |
| `C` | 커서부터 줄 끝까지 변경 |
| `cw` / `ciw` | 단어 변경 / 안쪽 단어 변경 |
| `c$` | 커서부터 줄 끝까지 변경 (= `C`) |

## 텍스트 오브젝트

> `d`, `c`, `y`, `v` 같은 연산자 뒤에 붙여 쓴다. `a` = around(주변 포함), `i` = inner(안쪽만).

| 오브젝트 | 의미 |
|--------|------|
| `aw` / `iw` | 단어 (whitespace 포함 / 단어만) |
| `as` / `is` | 문장 |
| `ap` / `ip` | 단락 |
| `a"` `a'` `` a` `` | 따옴표 영역 (포함) |
| `i"` `i'` `` i` `` | 따옴표 영역 (안쪽) |
| `a(` `a)` `ab` | `()` 블록 (포함) |
| `i(` `i)` `ib` | `()` 블록 (안쪽) |
| `a{` `a}` `aB` | `{}` 블록 (포함) |
| `i{` `i}` `iB` | `{}` 블록 (안쪽) |
| `a[` `a]` / `i[` `i]` | `[]` 블록 |
| `a<` `a>` / `i<` `i>` | `<>` 블록 |
| `at` / `it` | XML/HTML 태그 |

**예**: `ci"` = 따옴표 안 내용 변경, `da{` = `{}` 블록 통째 삭제, `yip` = 단락 복사.

## 잘라내기 / 복사 / 붙여넣기

| 명령어 | 설명 |
|--------|------|
| `yy` / `Y` | 줄 복사 |
| `2yy` | 2줄 복사 |
| `yw` / `yiw` / `yaw` | 단어 복사 (커서부터 / 단어 / 주변포함) |
| `y$` / `y0` | 줄 끝까지 / 줄 시작까지 복사 |
| `dd` | 줄 삭제 |
| `2dd` | 2줄 삭제 |
| `dw` / `diw` / `daw` | 단어 삭제 |
| `D` / `d$` | 커서부터 줄 끝까지 삭제 |
| `d0` | 줄 시작까지 삭제 |
| `p` / `P` | 붙여넣기 (커서 뒤 / 앞) |
| `gp` / `gP` | 붙여넣기 후 커서를 끝으로 이동 |
| `:3,5d` | 3~5번째 줄 삭제 |
| `"+y` / `"+p` | 시스템 클립보드 복사 / 붙여넣기 |
| `"*y` / `"*p` | 선택 클립보드 (X11) |

## 들여쓰기

| 명령어 | 설명 |
|--------|------|
| `>>` / `<<` | 현재 줄 들여쓰기 / 내어쓰기 |
| `>{motion}` | 영역 들여쓰기 (예: `>ap`) |
| `=={motion}` | 자동 들여쓰기 |
| `==` | 현재 줄 자동 들여쓰기 |
| `gg=G` | 파일 전체 자동 들여쓰기 |
| Visual 모드 + `>` `<` | 영역 들여쓰기 / 내어쓰기 |

## Visual 모드

| 명령어 | 설명 |
|--------|------|
| `v` + 이동 + `y` | 영역 복사 |
| `v` + 이동 + `d` | 영역 삭제 |
| `v` + 이동 + `c` | 영역 변경 |
| `v` + 이동 + `>` / `<` | 들여쓰기 / 내어쓰기 |
| `V` + 이동 + `d` | 여러 줄 삭제 |
| `Ctrl+v` + 이동 + `I` + 입력 + `Esc Esc` | 블록 단위 동시 삽입 |
| `Ctrl+v` + 이동 + `c` + 입력 + `Esc` | 블록 단위 변경 |
| `o` | 선택 시작점/끝점 토글 |
| `O` | (블록 모드) 반대편 모서리로 이동 |
| `u` / `U` | 선택 영역 소문자 / 대문자화 |
| `~` | 대소문자 토글 |

## 검색 & 치환

| 명령어 | 설명 |
|--------|------|
| `/pattern` | 아래로 검색 |
| `?pattern` | 위로 검색 |
| `n` / `N` | 다음 / 이전 결과 |
| `*` / `#` | 커서 단어 아래로 / 위로 검색 |
| `:noh` | 검색 하이라이트 끄기 |
| `/\vpattern` | very magic 모드 (정규식 이스케이프 최소) |
| `:s/old/new/` | 현재 줄 첫 번째 치환 |
| `:s/old/new/g` | 현재 줄 전체 치환 |
| `:%s/old/new/g` | 파일 전체 치환 |
| `:%s/old/new/gc` | 파일 전체 치환 (확인) |
| `:5,10s/old/new/g` | 5~10번째 줄 치환 |
| `:%s/old/new/gci` | 대소문자 무시 치환 |

## 여러 파일에서 검색 (Quickfix)

| 명령어 | 설명 |
|--------|------|
| `:vimgrep /pattern/ {file}` | 파일 검색 (예: `:vimgrep /TODO/ **/*.js`) |
| `:cnext` / `:cn` | 다음 결과로 이동 |
| `:cprevious` / `:cp` | 이전 결과로 이동 |
| `:copen` / `:cope` | quickfix 창 열기 |
| `:cclose` / `:ccl` | quickfix 창 닫기 |
| `:cdo {cmd}` | quickfix 모든 항목에 명령 실행 (예: `:cdo s/old/new/g \| update`) |

## 마크

> 마크는 파일 내 위치에 이름표를 붙인다. 소문자(`a-z`)는 파일 단위, 대문자(`A-Z`)는 전역.

| 명령어 | 설명 |
|--------|------|
| `:marks` | 마크 목록 |
| `ma` | 현재 위치를 `a` 마크로 저장 |
| `` `a `` | 마크 `a` 위치로 (행+열) |
| `'a` | 마크 `a`가 있는 줄로 |
| `` `0 `` | 직전에 종료한 위치 |
| `` `" `` | 직전 파일 편집 위치 |
| `` `. `` | 마지막 변경 위치 |
| ` `` ` | 마지막 점프 이전 위치 |
| `Ctrl+o` / `Ctrl+i` | 점프 목록 뒤로 / 앞으로 |
| `g;` / `g,` | 변경 목록 이전 / 다음 |

## 레지스터

> `:registers`로 전체 보기. `"x` 접두사로 특정 레지스터를 지정한다.

| 레지스터 | 의미 |
|--------|------|
| `"ay` / `"ap` | 레지스터 `a`에 복사 / 붙여넣기 |
| `"0` | 직전 yank (덮어쓰이지 않음) |
| `""` | unnamed (기본) |
| `"+` | 시스템 클립보드 |
| `"*` | 선택 클립보드 (X11) |
| `"%` | 현재 파일명 |
| `"#` | 직전 버퍼 파일명 |
| `"/` | 직전 검색 패턴 |
| `":` | 직전 명령 |
| `".` | 직전 입력 텍스트 |
| `"-` | 작은 삭제 (한 줄 미만) |
| `"_` | 블랙홀 (버림) |
| `"=` | 표현식 (계산 결과 삽입) |

## 매크로

| 명령어 | 설명 |
|--------|------|
| `qa` | 레지스터 `a`에 녹화 시작 |
| `q` | 녹화 종료 |
| `@a` | 매크로 `a` 실행 |
| `@@` | 직전 매크로 재실행 |
| `5@a` | 매크로 `a` 5회 실행 |
| `:reg a` | 레지스터 `a` 내용 확인 |

## 폴딩

| 명령어 | 설명 |
|--------|------|
| `zo` / `zc` | 폴드 열기 / 닫기 |
| `za` | 폴드 토글 |
| `zR` / `zM` | 모든 폴드 열기 / 닫기 |
| `zr` / `zm` | 폴드 한 단계 열기 / 닫기 |
| `zf{motion}` | 영역으로 폴드 생성 |
| `zd` | 폴드 삭제 |
| `zE` | 모든 폴드 삭제 |
| `zj` / `zk` | 다음 / 이전 폴드 시작으로 이동 |

### foldmethod — 접는 기준

```vim
:set foldmethod=indent     " 들여쓰기 기준
:set foldmethod=syntax     " 구문 트리 기준 (filetype별)
:set foldmethod=marker     " {{{ }}} 마커
:set foldmethod=manual     " 수동 (zf로 영역 지정)
:set foldmethod=expr       " 표현식 (treesitter 등)
:set foldlevelstart=99     " 파일 열자마자 펼친 상태
```

Neovim + treesitter: `foldmethod=expr` + `foldexpr=nvim_treesitter#foldexpr()`.

## 저장 & 종료

| 명령어 | 설명 |
|--------|------|
| `:w` | 저장 |
| `:w <file>` | 다른 이름으로 저장 |
| `:saveas <file>` | 다른 이름으로 저장 (편집 대상도 전환) |
| `:q` | 종료 |
| `:q!` | 강제 종료 (저장 안 함) |
| `:wq` / `:x` | 저장 후 종료 |
| `ZZ` | `:wq`와 동일 |
| `ZQ` | `:q!`와 동일 |
| `:wa` | 모든 버퍼 저장 |
| `:wqa` | 모든 버퍼 저장 후 종료 |
| `:qa!` | 모든 버퍼 강제 종료 |

## 버퍼

| 명령어 | 설명 |
|--------|------|
| `:e <file>` | 파일 열기 |
| `:ls` / `:buffers` | 버퍼 목록 |
| `:bn` / `:bnext` | 다음 버퍼 |
| `:bp` / `:bprevious` | 이전 버퍼 |
| `:b <name>` / `:b <num>` | 특정 버퍼로 이동 |
| `:bd` | 버퍼 닫기 |
| `:bufdo {cmd}` | 모든 버퍼에 명령 실행 |

## 창 (Window/Split)

| 명령어 | 설명 |
|--------|------|
| `:split` / `Ctrl+w s` | 가로 분할 |
| `:vsplit` / `Ctrl+w v` | 세로 분할 |
| `Ctrl+w w` | 다음 창 |
| `Ctrl+w h/j/k/l` | 방향 창으로 이동 |
| `Ctrl+w q` / `:q` | 창 닫기 |
| `Ctrl+w o` | 다른 창 모두 닫기 |
| `Ctrl+w =` | 창 크기 균등 |
| `Ctrl+w _` / `Ctrl+w \|` | 가로 / 세로 최대화 |
| `Ctrl+w H/J/K/L` | 창을 좌/하/상/우로 이동 |
| `Ctrl+w r` | 창 순서 회전 |

## 탭

| 명령어 | 설명 |
|--------|------|
| `:tabnew <file>` | 새 탭 열기 |
| `:tabclose` | 탭 닫기 |
| `:tabonly` | 다른 탭 모두 닫기 |
| `gt` / `gT` | 다음 / 이전 탭 |
| `2gt` | 2번째 탭으로 |
| `:tabs` | 탭 목록 |
| `:tabmove N` | N번 위치로 탭 이동 |
| `:tabdo {cmd}` | 모든 탭에 명령 실행 |

## Diff 모드

| 명령어 | 설명 |
|--------|------|
| `vimdiff a b` | 쉘에서 두 파일 비교 실행 |
| `:diffthis` | 현재 창을 diff에 포함 |
| `:diffoff` | diff 모드 해제 |
| `:diffupdate` | diff 갱신 |
| `]c` / `[c` | 다음 / 이전 변경 위치 |
| `do` (diff obtain) | 다른 쪽 내용 가져오기 |
| `dp` (diff put) | 다른 쪽으로 내용 보내기 |

## 도움말 & 심볼

| 명령어 | 설명 |
|--------|------|
| `:help {topic}` | 도움말 (예: `:help dd`) |
| `K` | 커서 아래 단어 도움말 (LSP 있으면 hover, 없으면 `keywordprg`) |
| `:set keywordprg?` | 현재 `keywordprg` 값 확인 (기본: `man`) |
| `:setlocal keywordprg=pydoc` | 버퍼 단위로 변경 (예: Python용) |

## 설정

| 명령어 | 설명 |
|--------|------|
| `:set number` / `:set nonumber` | 줄 번호 표시 / 숨기기 |
| `:set relativenumber` | 상대 줄 번호 |
| `:set paste` / `:set nopaste` | 붙여넣기 모드 (들여쓰기 방지) |
| `:syntax on` | 문법 강조 |
| `:set hlsearch` / `:noh` | 검색 하이라이트 / 끄기 |
| `:set ignorecase` / `:set smartcase` | 대소문자 무시 / 대문자 입력 시 구분 |
| `:set wrap` / `:set nowrap` | 줄 바꿈 표시 |
| `:set spell` / `:set nospell` | 맞춤법 검사 |

### 들여쓰기 옵션

| 옵션 | 의미 |
|---|---|
| `autoindent` | 직전 행 들여쓰기 따라가기 |
| `smartindent` | `{`, 키워드 보고 추가 들여쓰기 |
| `cindent` | C/C++ 스타일 |
| `tabstop=4` | Tab 표시 너비 |
| `shiftwidth=4` | `>`/`<` 단위 |
| `expandtab` | Tab을 space로 |
| `filetype indent on` | 파일유형별 들여쓰기 |

### 그 외 동작 옵션

| 옵션 | 의미 |
|---|---|
| `nocompatible` | vi 호환 모드 끔 |
| `history=1000` | 명령·검색 히스토리 크기 |
| `backspace=eol,start,indent` | backspace 허용 영역 |
| `nowrapscan` | 검색이 끝/처음에서 wrap 안 함 |
| `ruler` | 커서 위치 표시 |
| `incsearch` | 점진 검색 |
| `autoread` | 외부 변경 자동 재로드 (`checktime` 필요) |

## 파일 인코딩

```vim
:e ++enc=utf-8       " 다른 인코딩으로 다시 읽기
:e ++enc=euc-kr
:set fileencoding=utf-8 | w   " 인코딩 변환 후 저장
```

### 자동 추정 순서

```vim
set fileencodings=ucs-bom,utf-8,euc-kr,latin1
```

한국어 환경에서 `euc-kr`을 포함시켜 둘 것 — 안 들어 있으면 latin1로 해석되어 깨짐.

| 옵션 | 의미 |
|---|---|
| `encoding` | vim 내부 작업용 (보통 `utf-8`) |
| `fileencoding` | 현재 버퍼의 디스크 인코딩 |
| `fileencodings` | 읽을 때 시도 순서 |
| `termencoding` | 터미널 입출력 인코딩 |

## 자주 쓰는 조합

```vim
" 파일 전체 들여쓰기 정리
gg=G

" 빈 줄 모두 제거
:g/^$/d

" 빈 줄이 아닌 줄만 남기기
:v/./d

" 줄 끝 공백 제거
:%s/\s\+$//g

" 중복 줄 제거 (정렬 후)
:sort u

" 현재 줄을 N번째 줄 아래로 이동
:m N

" 현재 파일 다시 읽기
:e!
```

## Tip

- `vimtutor` — 내장 튜토리얼
- `.` 반복 + 텍스트 오브젝트(`ciw`, `da"`, `yi{`) + 매크로(`qa...q` / `@a`) 조합이 vim 생산성의 핵심

## macOS — Option(Alt) 키 활성화

`<A-...>` 매핑이 안 먹히면 터미널이 Option을 Meta로 안 보내는 것. 터미널별 설정:

| 터미널 | 설정 |
|---|---|
| Apple Terminal.app | Preferences → Profiles → Keyboard → **Use Option as Meta key** 체크 |
| iTerm2 | Preferences → Profiles → Keys → **Left/Right Option Key: Esc+** |
| Ghostty | `macos-option-as-alt = true` + `keybind = alt+left=unbind`(필요 시) |

## Neovim swap 파일 위치 (Linux/macOS)

```
$HOME/.local/share/nvim/swap/
```

복구가 필요한데 안 보이면 여기 확인.
