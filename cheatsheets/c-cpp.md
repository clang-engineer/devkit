# C / C++ Cheatsheet

> C/C++ 자주 다시 찾는 스니펫 + GDB 디버거. 한 곳에 모아둠.

## C++ 문자열 분리 (split by delimiter)

### `string::find` 기반 (구분자 문자열)

```cpp
#include <vector>
#include <string>
using namespace std;

vector<string> split(string input, string delimiter) {
    vector<string> vec;
    size_t pos = 0;
    string token;
    while ((pos = input.find(delimiter)) != string::npos) {
        token = input.substr(0, pos);
        vec.push_back(token);
        input.erase(0, pos + delimiter.length());
    }
    vec.push_back(input);
    return vec;
}
```

### `stringstream` 기반 (구분자가 char 한 글자)

```cpp
#include <vector>
#include <string>
#include <sstream>
using namespace std;

vector<string> split(const string& str, char delimiter) {
    vector<string> vec;
    string token;
    stringstream ss(str);
    while (getline(ss, token, delimiter)) {
        vec.push_back(token);
    }
    return vec;
}
```

## 타입 변환

### `char` ↔ `int`

```cpp
char c = '1';
int i = (int)c;        // 형 변환 (ASCII 49)
int i = c - '0';       // '0' 빼서 숫자값 (1)

int n = 1;
char c = (char)n;      // ASCII 1 (제어 문자)
char c = n + '0';      // 숫자 문자 '1'
```

### `string` ↔ `int`

```cpp
string s = "123";
int i = stoi(s);              // C++11
int i = atoi(s.c_str());      // C-style

int i = 123;
string s = to_string(i);

stringstream ss;
ss << i;
string s = ss.str();
```

### ASCII 기준값

| 숫자 | 문자 |
|---|---|
| 65 | `A` |
| 97 | `a` |
| 48 | `0` |

## Google C++ Style Guide 요약

### Naming

| 대상 | 컨벤션 |
|---|---|
| 클래스, 함수 | `CamelCase` |
| 변수 (로컬/일반) | `snake_case` |
| 클래스 데이터 멤버 | `snake_case_` (뒤에 `_`) |
| 상수 | `kCamelCase` (앞에 `k`) |
| enum 값 | `kEnumName` 권장 (`ENUM_NAME`도 허용) |

### 구조

- 모든 코드는 namespace 안에. 헤더에 `using namespace` 금지.
- `struct`는 POD(Plain Old Data) 컨테이너용, **로직 들어가면 `class`**.
- 상속보다 **구성(composition) 우선**, 상속은 명확한 is-a 관계에서만.
- out parameter(포인터로 결과 받기) 지양, **결과를 반환**하는 함수.

### 도구

- `clang-format` — GoogleStyle 프리셋
- `gtest` — `<gtest/gtest.h>`

---

## GDB — GNU 디버거

> C/C++ 중단점·스택·변수 조사·메모리 검사. `-g`로 컴파일된 바이너리가 전제.

### 30초만 본다면

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

### 설치

```sh
brew install gdb        # macOS — Apple Silicon에선 사실상 불가, lldb 사용 권장
sudo apt install gdb    # Ubuntu/Debian
```

> macOS(특히 Apple Silicon)에선 `gdb` 대신 Xcode에 포함된 `lldb`가 사실상 표준.
> 명령 대응은 대체로 비슷하다(`b`/`r`/`n`/`s`/`p`/`bt`).

### 사전 준비

컴파일 시 `-g` 옵션으로 디버그 정보 포함:

```sh
gcc -g test.c -o test
g++ -g main.cpp -o main
```

### 실행

```sh
gdb <프로그램명>
gdb --args <프로그램명> <arg1> <arg2>    # 인자 전달
```

### 중단점 (Breakpoint)

```sh
break <함수이름>
break <라인번호>
break <파일이름:라인번호>
break <파일이름:함수이름>
break <...> if <condition>    # 조건부 중단점

info break                    # 중단점 목록 (약어: i b)
clear <함수이름>               # 특정 중단점 삭제
clear <라인번호>
delete                        # 모든 중단점 삭제
delete <번호>                  # 번호로 삭제

enable <번호>
disable <번호>
```

### 실행 제어

| 명령어 | 설명 |
|--------|------|
| `run` (`r`) | 프로세스 실행/재실행 |
| `continue` (`c`) | 다음 중단점까지 재개 |
| `next` (`n`) | 한 줄 실행 (함수 내부 진입 X) |
| `step` (`s`) | 한 줄 실행 (함수 내부 진입 O) |
| `finish` | 현재 함수 완료 후 리턴값 출력 |
| `return` | 현재 함수를 실행하지 않고 빠져나감 |
| `return <값>` | 지정한 값을 리턴하며 빠져나감 |

### Call Stack

```sh
backtrace              # 콜 스택 확인 (약어: bt)
bt full                # 지역변수 포함 출력
bt <N>                 # 상위 N개만 출력
frame <N>              # N번 프레임으로 이동
up / down              # 프레임 이동
```

### 값 출력 / 변경

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

### 소스 코드

```sh
list                   # 현재 위치 소스 출력 (약어: l)
list <라인번호>
list <함수이름>
list <시작>,<끝>
set listsize <N>       # 출력 라인 수 설정
```

### 메모리 / 레지스터

```sh
x/<N><fmt><size> <주소>   # 메모리 검사 (예: x/16xb $rsp)
info registers            # 레지스터 확인 (약어: i r)
info locals               # 지역변수 확인
info args                 # 함수 인자 확인
```

### 워치포인트

```sh
watch <변수>              # 변수 값 변경 시 중단
rwatch <변수>             # 변수 읽기 시 중단
awatch <변수>             # 읽기/쓰기 시 중단
info watchpoints          # 워치포인트 목록
```

## 참고

- [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
- `man gdb`, `gdb` 안에서 `help <topic>`
