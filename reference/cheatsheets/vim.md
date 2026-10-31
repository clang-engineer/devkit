# Vim — 편집 문법 치트시트

> **동작(Operator)과 범위(Motion / Text Object)를 조합**하면 명령을 유추할 수 있다. 예외적인 명령과 Ex 명령은 별도의 계열로 이해한다.

## 전체 작동 모델 — 입력에서 편집 결과까지

```text
사용자 키 입력
      │
      ▼
Mode (키의 의미 결정) [1]
├─ Insert       → 텍스트 입력
├─ Visual       → 범위 선택
├─ Command-line → Ex 명령
└─ Normal       → Operator + Motion / Text Object [2·3]
                         │
                         ▼
                    Buffer 변경
                         ├─ Register : 복사·삭제 내용 보관 [4]
                         ├─ Undo / Dot / Macro : 변경 복원·반복 [5]
                         └─ Search / Mark / Jump : 위치 탐색 [5]
                         │
                  Window가 Buffer 표시 [6]
                         └─ Tabpage : Window 배치 묶음

설정·매핑·도움말 → 입력·동작 방식 확장 [7]
```

**Vim은 키 자체보다 현재 Mode와 조작 대상이 중요하다.** Normal 모드에서 Operator는 동작, Motion·Text Object는 범위를 결정한다. 편집된 텍스트는 Buffer에 있고, Window·Tabpage는 이를 보여주는 화면 구성이다. 숫자는 아래 본문 절을 가리킨다.

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

## 5. 탐색·위치·반복·접기

탐색·Mark·Jump는 **어디에서 작업할지**, Macro·Dot Repeat는 **어떤 동작을 반복할지**, Fold는 **어떻게 표시할지** 결정한다. 같은 기능 목록으로 외우기보다 서로 다른 조작 대상을 구분한다.

```text
Vim의 탐색과 반복
├─ Search      : 내용으로 위치 찾기 (/ ? n N)
├─ Mark        : 특정 위치를 이름으로 기억 (m, ', `)
├─ Jump List   : 이동 이력을 따라 앞뒤로 탐색 (Ctrl-o / Ctrl-i)
├─ Quickfix    : 여러 위치의 결과 목록 (:cnext / :cprev)
├─ Macro       : 키 입력 시퀀스를 Register에 기록·재생 (q / @)
├─ Dot Repeat  : 마지막 변경을 반복 (.)
├─ Undo Tree   : 변경 이력을 되돌리거나 다시 적용 (u / Ctrl-r)
└─ Fold        : 텍스트를 지우지 않고 화면에서 접기 (z 계열)
```

| 기능 | 언제 필요한가 | 대표 진입점 |
|---|---|---|
| Search | 같은 문자열을 찾을 때 | `/pattern`, `n` / `N` |
| Mark | 지정한 위치로 나중에 돌아올 때 | `ma`, `'a`, `\`a` |
| Jump List | 정의 이동·검색 등 이전 위치로 돌아갈 때 | `Ctrl-o` / `Ctrl-i` |
| Quickfix | 검색·컴파일 결과를 차례로 탐색할 때 | `:copen`, `:cnext` |
| Macro | 여러 키 입력을 순서대로 반복할 때 | `qa … q`, `@a` |
| Dot Repeat | 직전 변경 동작을 반복할 때 | `.` |
| Undo | 변경 이력을 되돌릴 때 | `u`, `Ctrl-r` |
| Fold | 긴 코드의 일부를 접어 구조를 볼 때 | `za` 토글, `zc` 접기, `zo` 열기 |

**Macro는 Register에 명령 시퀀스를 저장**하고, Mark는 **위치**를 기억한다. Jump List는 이동 이력, Fold는 표시 상태이므로 서로 역할이 다르다. Fold의 생성·유지 방식은 `foldmethod`에 따라 달라진다.

범위 치환은 `:%s/old/new/g`(전체 버퍼), `:s/old/new/g`(현재 줄)처럼 Ex 명령으로 수행한다. `gc`의 `c`는 치환 시 확인(confirm) 옵션이다.

## 6. 편집 대상의 계층 — Buffer / Window / Tab

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

## 7. 설정과 도움말은 별도 명령 계열

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
