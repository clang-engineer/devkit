# Vim — 편집 문법 치트시트

> **동작(Operator)과 범위(Motion / Text Object)를 조합**하면 명령을 유추할 수 있다. 예외적인 명령과 Ex 명령은 별도의 계열로 이해한다.

## 전체 작동 모델 — 입력·편집·표시

```text
사용자 키 입력
    │
    ▼
Mode에 따라 해석
├─ Normal       : Operator + Motion / Text Object
├─ Insert       : 텍스트 입력
├─ Visual       : 범위 선택 후 동작
└─ Command-line : Ex 명령
    │
    ▼
Buffer (텍스트 상태)
├─ Register ↔ 복사·삭제·붙여넣기
├─ Undo Tree : 변경 이력·복구
└─ Dot / Macro : 편집 동작 반복

위치 탐색 → Search / Mark / Jump / Quickfix
              │ 커서·이동 대상 선택
              ▼
         Buffer 안의 위치

Tabpage (Window 배치 묶음)
└─ Window (Buffer를 표시하는 뷰)
   └─ Fold (줄을 접어 표시)

설정·Keymap·Help : 입력과 동작을 제어·발견
```

**중심 흐름은 입력 → Mode 해석 → Buffer 조작**이다. Register는 텍스트의 보관·재사용, Undo·Macro는 변경 이력과 반복, 탐색은 커서 위치 선택에 관여한다. Tabpage·Window·Fold는 **표시 구조**이므로 Buffer 변경의 다음 실행 단계가 아니다. 각 가지는 관계를 나타내며 반드시 순서대로 실행되는 것은 아니다.

## 1. 모드 — 키의 의미를 결정한다

```text
Normal ── i/a/o ──> Insert  : 텍스트 입력
   │
   ├── v / V / Ctrl-v → Visual : 범위 선택
   └── : ────────────> Command-line : Ex 명령

Insert / Visual ── Esc → Normal
Command-line ── Esc → 명령 입력 취소 후 Normal
```

- `i`(insert)는 커서 앞, `a`(append)는 커서 뒤, `o`(open)는 아래 새 줄에서 입력한다.
- 대문자 `I`는 줄의 첫 비공백 문자 앞, `A`는 줄 끝, `O`는 위 새 줄에서 입력한다.
- `v`는 문자, `V`는 줄, `Ctrl-v`는 블록 선택이다.

## 2. Normal 모드 — 동작과 범위의 조합

**대표 실행 흐름:** Normal 모드에서 `ciw` → 현재 단어 내부를 삭제하고 Insert 모드로 전환 → 새 텍스트 입력 → `Esc`로 Normal 복귀. 같은 범위를 `yiw`로 복사하거나 `diw`로 삭제할 수 있다.

```text
["register] [count] operator [count] motion/text-object
     │          │       │               │
     │          │       │               ├─ w / e / b : 단어 경계 이동
     │          │       │               ├─ 0 / ^ / $ : 줄의 시작·첫 글자·끝
     │          │       │               └─ iw / aw / i" / a" : Text Object
     │          │       ├─ d : delete
     │          │       ├─ c : change (삭제 후 Insert)
     │          │       └─ y : yank (복사)
     │          └─ 횟수 (앞뒤 count는 곱해질 수 있음)
     └─ 선택한 레지스터 (없으면 기본 동작)
```

**Motion은 커서를 움직이는 규칙**, **Text Object는 Operator 또는 Visual 모드에서 영역을 선택하는 규칙**이다. `iw`를 Normal 모드에서 단독 이동 명령처럼 사용하지 않는다.

| 조합 | 해석 |
|---|---|
| `dw` | 다음 단어 경계까지 삭제 |
| `ciw` | 현재 단어 내부를 바꾸고 입력 모드 진입 |
| `ya"` | 따옴표와 그 안의 내용을 복사 |
| `d$` / `D` | 줄 끝까지 삭제 |
| `3dd` | 현재 줄부터 3줄 삭제 |
| `"ayiw` | `a` 레지스터에 현재 단어 내부 복사 |

`dd`, `cc`, `yy`처럼 Operator를 두 번 쓰면 줄 단위 동작이다. `.`은 마지막 변경 반복, `u`는 Undo, `Ctrl-r`은 Redo다.

## 3. 범위를 만드는 두 가지 방식

```text
Motion: 어디까지 이동할까?
  w  다음 단어 시작     e  단어 끝        b  이전 단어 시작
  0  줄 시작            ^  첫 비공백      $  줄 끝
  gg 파일 시작          G  파일 끝

Text Object: 어떤 덩어리인가?
  i = inner (안쪽)      a = around (구분자·주변 포함)
  w = word              " / ' / ( / [ / { = 둘러싼 영역
  p = paragraph
```

`diw`와 `daw`는 공백 처리 범위가 다르다. 괄호 안쪽만 수정할 때 `ci(`, 괄호까지 지울 때 `da(`처럼 **동작만 교체해도 같은 영역 규칙을 재사용**한다.

Visual에서는 `viw`, `va(`처럼 Text Object로 범위를 선택한 뒤 `d`, `y`, `>` 등을 적용할 수 있다.

## 4. 레지스터 — 변경 내용의 저장 위치

레지스터는 Buffer가 아니라 **복사·삭제한 내용을 임시 보관하는 저장소**다. 명시적으로 레지스터를 고르지 않아도 기본 레지스터 규칙이 적용된다.

```text
y / d / c → Register → p / P
                │
                ├─ "  : unnamed (기본)
                ├─ a-z: 이름 붙인 저장소
                ├─ 0  : 최근 yank
                ├─ +  : 시스템 클립보드 (지원 환경)
                └─ _  : black hole (버리기)
```

`"ap`는 `a` 레지스터 붙여넣기, `"_diw`는 삭제 내용을 버리기, `"+y`는 지원 환경에서 시스템 클립보드에 복사한다. 레지스터 동작에는 번호 레지스터와 삭제 크기에 따른 추가 규칙이 있다.

## 5. 위치 탐색 — 발견·기억·복귀·순회

**Search는 내용으로 위치를 발견하고, Mark는 원하는 위치를 직접 저장하며, Jump List는 방문 이력을 따라 복귀한다.** Quickfix는 여러 위치를 결과 목록으로 묶어 순회한다.

```text
위치 탐색
├─ Search     발견 : 내용으로 위치 찾기
├─ Mark       기억 : 특정 위치에 책갈피 지정
├─ Jump List  복귀 : 주요 점프의 방문 이력 탐색
└─ Quickfix   순회 : 여러 파일의 검색·진단 결과 탐색
```

| 목적 | 대표 조작 | 기억할 차이 |
|---|---|---|
| 내용 검색 | `/pattern`, `?pattern`, `n` / `N` | 정방향·역방향 검색, 다음·반대 방향 일치 |
| 위치 저장 | `ma`, `mA` | 소문자 마크는 파일별, 대문자 마크는 파일 간 이동 가능 |
| 마크로 복귀 | `'a` / `\`a` | 마크가 있는 줄의 첫 비공백 문자 / 정확한 줄·열 |
| 방문 이력 | `Ctrl-o` / `Ctrl-i`, `:jumps` | 이전·다음 점프 위치 / 이력 확인 |
| 결과 순회 | `:copen`, `:cnext`, `:cprev` | Quickfix 목록 열기·다음·이전 결과 |

**Mark — 직접 지정한 책갈피.** `ma`는 현재 파일의 위치를 `a`에 저장한다. 다른 파일까지 이동할 책갈피는 `mA`처럼 대문자를 쓴다. 예를 들어 `main.py`에서 `mA` → `utils.py` 탐색 → `\`A`를 누르면 `main.py`의 정확한 마크 위치로 돌아온다. `'A`는 해당 줄의 첫 비공백 문자로 이동한다. 소문자 마크는 파일마다 독립적으로 존재한다.

**Jump List — 자동 기록된 방문 이력.** `/TODO` 검색이나 `gg` 같은 주요 점프 후 `Ctrl-o`로 이전 위치, `Ctrl-i`로 다음 위치를 방문한다. 브라우저의 뒤로·앞으로와 비슷하지만 `h/j/k/l` 같은 모든 작은 이동을 기록하는 것은 아니다. 특정 위치를 고정하는 Mark와 달리 점프 이력은 탐색 과정에서 쌓인다.

**Quickfix — 여러 위치의 작업 목록.** `:vimgrep /TODO/gj **/*.md`로 여러 파일의 일치 위치를 모은 뒤 `:copen`으로 목록을 열고 `:cnext` / `:cprev`로 순회한다. 검색 결과뿐 아니라 빌드 오류·진단 위치도 다룰 수 있다. Quickfix 자체는 검색 명령이 아니라 **결과 위치를 관리하는 목록**이다.

**선택 기준:** 나중에 꼭 돌아올 지점은 Mark, 방금 따라간 코드 경로를 되짚을 때는 Jump List, 여러 검색·오류 위치를 차례로 처리할 때는 Quickfix를 쓴다.
## 6. 편집 반복·복구 — Dot·Macro·Undo

```text
편집 동작
├─ Dot (.)       → 마지막 변경을 다른 위치에 반복
├─ Macro (q/@)   → 여러 키 입력을 Register에 기록·재생
└─ Undo (u)      → Buffer 변경 이력을 되돌림
   └─ Ctrl-r     → Undo한 변경 다시 적용
```

| 목적 | 대표 조작 | 예시 |
|---|---|---|
| 단일 변경 반복 | `.` | `ciw`로 단어 수정 후 다른 단어에서 `.` |
| 여러 동작 기록 | `qa` … `q` | `a` 레지스터에 Macro 기록 |
| 기록한 동작 실행 | `@a`, `@@` | `a` Macro 실행 / 직전 Macro 재실행 |
| 반복 횟수 | `3@a` | Macro를 세 번 실행 |
| 변경 복구 | `u`, `Ctrl-r` | Undo / Redo |
| Undo 이력 탐색 | `:undolist`, `:earlier`, `:later` | 변경 이력과 시간·순서 기준 이동 |

**예시:** 같은 편집을 다른 위치에 반복할 때는 `.`이 간단하다. 이동·삽입 등 여러 키를 묶어 반복하려면 `qa`로 기록을 시작하고 작업 후 `q`로 종료한 다음 `@a`로 실행한다. Macro는 Register에 키 시퀀스를 저장하므로 텍스트를 복사하는 Register와 저장 공간을 공유한다.

## 7. 화면 표시 — Fold

Fold는 **Buffer의 텍스트를 지우지 않고 Window에서 일부 줄을 접어 표시**한다. 큰 함수·문단을 접어 구조를 볼 때 사용한다.

| 목적 | 대표 조작 |
|---|---|
| 접기·펼치기 토글 | `za` |
| 접기 / 펼치기 | `zc` / `zo` |
| 모두 접기 / 펼치기 | `zM` / `zR` |
| 선택한 줄을 수동 접기로 지정 | Visual 선택 후 `zf` (`foldmethod=manual`) |
| 접기 방식 확인 | `:set foldmethod?` |

`foldmethod`는 manual·indent·syntax·expr·marker·diff 등 방식으로 접을 범위를 결정한다. **Fold는 편집 동작이 아니라 화면 표현**이므로 Undo·Macro와 구분한다.

## 8. 편집 대상 — Buffer·Window·Tab

**Buffer는 텍스트 상태, Window는 그 상태를 보여주는 뷰, Tabpage는 Window 배치**다. 같은 Buffer를 여러 Window에서 표시할 수 있으므로 파일·Buffer·Window·Tab을 1:1로 대응시키지 않는다.

```text
Buffer (파일·텍스트 상태)
   ▲
Window (Buffer를 표시하는 뷰)
   ▲
Tabpage (Window 배치 묶음)
```

| 대상 | 대표 명령 | 의미 |
|---|---|---|
| Buffer | `:ls`, `:bnext`, `:bprev`, `:bd` | 열린 버퍼 목록·전환·닫기 |
| Window | `:split`, `:vsplit`, `Ctrl-w h/j/k/l` | 분할·창 이동 |
| Tab | `:tabnew`, `gt`, `gT` | 배치 생성·다음·이전 |
| File | `:w`, `:q`, `:wq`, `:q!` | 저장·종료 |

**Tab은 파일 하나가 아니라 Window 레이아웃**이다. Window를 닫는 것과 Buffer를 지우는 것도 다르다.

## 9. 설정과 도움말은 별도 명령 계열

```text
:set number       → 옵션 설정
:map / :nmap      → 키 매핑 조회·정의
:help motion.txt  → Motion 공식 도움말
:help text-objects
:help registers
:help usr_04.txt
```

Vim의 모든 명령이 Operator 문법을 따르는 것은 아니다. `:...`는 Ex 명령, `z...`는 폴드·스크롤 등의 명령 계열, `Ctrl-w ...`는 Window 조작 접두어다. **공통 규칙으로 유추할 수 있는 명령과 개별적으로 알아야 하는 명령을 구분**한다.

공식 문서: [Vim User Manual](https://vimhelp.org/usr_toc.txt.html) · [Vim Reference](https://vimhelp.org/)
