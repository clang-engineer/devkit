# GDB Cheatsheet

> GNU 디버거. C/C++ 중단점·스택·변수 조사·메모리 검사. `-g`로 컴파일된 바이너리가 전제.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 실행 | `gdb ./prog` (인자 있으면 `gdb --args ./prog arg1`) |
| 시작 | `run` (단축 `r`) |
| 중단점 설정 | `break main` / `b file.c:42` / `b ClassName::method` |
| 계속 진행 | `continue` (`c`) |
| 한 줄 실행 (함수 안 들어감) | `next` (`n`) |
| 한 줄 실행 (함수 들어감) | `step` (`s`) |
| 함수에서 나가기 | `finish` |
| 콜 스택 | `backtrace` (`bt`) |
| 변수 출력 | `print var` (`p var`) / 포맷: `p/x var`(hex) `p/t var`(bin) |
| 현재 위치 코드 | `list` (`l`) |
| 종료 | `quit` (`q`) |

## 설치

```sh
brew install gdb        # macOS — Apple Silicon에선 사실상 불가, lldb 사용 권장
sudo apt install gdb    # Ubuntu/Debian
```

> macOS(특히 Apple Silicon)에선 `gdb` 대신 Xcode에 포함된 `lldb`가 사실상 표준.
> 명령 대응은 대체로 비슷하다(`b`/`r`/`n`/`s`/`p`/`bt`).

## 사전 준비

컴파일 시 `-g` 옵션으로 디버그 정보 포함:

```sh
gcc -g test.c -o test
g++ -g main.cpp -o main
```

## 실행

```sh
gdb <프로그램명>
gdb --args <프로그램명> <arg1> <arg2>    # 인자 전달
```

## 중단점 (Breakpoint)

```sh
break <함수이름>
break <파일이름:라인번호>
break <...> if <condition>    # 조건부 중단점
info break                    # 중단점 목록 (약어: i b)
```

> 삭제·활성/비활성(`delete`/`clear`/`enable`/`disable`)은 `help breakpoints` 참고.

## 실행 제어

| 명령어 | 설명 |
|--------|------|
| `run` (`r`) | 프로세스 실행/재실행 |
| `continue` (`c`) | 다음 중단점까지 재개 |
| `next` (`n`) | 한 줄 실행 (함수 내부 진입 X) |
| `step` (`s`) | 한 줄 실행 (함수 내부 진입 O) |
| `finish` | 현재 함수 완료 후 리턴값 출력 |
| `return` | 현재 함수를 실행하지 않고 빠져나감 |
| `return <값>` | 지정한 값을 리턴하며 빠져나감 |

## Call Stack

```sh
backtrace              # 콜 스택 확인 (약어: bt)
bt full                # 지역변수 포함 출력
bt <N>                 # 상위 N개만 출력
frame <N>              # N번 프레임으로 이동
up / down              # 프레임 이동
```

## 값 출력 / 변경

```sh
print <변수>            # 변수 값 출력 (약어: p)
p *<포인터>             # 포인터 역참조
p arr[n]               # 배열 요소
p/x <변수>             # 16진수 출력
set print pretty on    # 이후 p *<구조체>가 멀티라인으로 출력
set var <변수>=<값>     # 변수 값 변경

display <변수>          # 매 step/next마다 자동 출력
info display           # display 목록
undisplay <번호>        # display 해제
```

## 기타

핵심 밖의 명령은 `man gdb` 또는 gdb 안에서 `help <cmd>`로:

- 소스 출력 `list` / `set listsize` → `help list`
- 메모리·레지스터 `x/<fmt>` / `info registers` / `info locals`·`args` → `help x`, `help info`
- 워치포인트 `watch` / `rwatch` / `awatch` → `help watch`

## 참고

- `man gdb`, `gdb` 안에서 `help <topic>`
