# sed & awk Cheatsheet

> 텍스트 스트림 변환의 양대 산맥. **sed**는 라인 단위 치환·삽입·삭제, **awk**는 필드·집계·보고서.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 한 줄 치환 | `sed 's/old/new/' file` |
| 전체 치환 (파일 원본 수정) | `sed -i 's/old/new/g' file` (macOS: `sed -i ''`) |
| 특정 줄 삭제 | `sed '/pattern/d' file` |
| 5~10번째 줄만 출력 | `sed -n '5,10p' file` |
| CRLF → LF | `sed -i 's/\r$//' file` |
| N번째 컬럼만 | `awk '{print $N}'` (구분자: `-F,`) |
| 헤더 제외하고 합계 | `awk 'NR>1 {sum+=$1} END {print sum}'` |
| 중복 제거 (순서 유지) | `awk '!seen[$0]++' file` |
| IP별 카운트 | `awk '{c[$1]++} END {for (i in c) print c[i], i}'` |
| 빈 줄 압축 | `sed -i '/^$/N;/\n$/D' file` |

## sed (Stream Editor)

라인 단위 검색/치환/삽입/삭제. 입력은 stdin 또는 파일, 결과는 stdout.

### 기본

```sh
sed [opts] '명령' file
sed -e '명령1' -e '명령2' file       # 명령 여러 개
sed '명령1; 명령2' file               # 세미콜론으로도 가능
sed -E '...'                          # ERE 정규식 (기본은 BRE)
sed -n '...'                          # 자동 출력 끄기 (`p`와 조합)
sed -i '...' file                     # 원본 수정 (GNU)
sed -i '' '...' file                  # macOS: 백업 없이 원본 수정
sed -i.bak '...' file                 # .bak 백업과 함께 수정
```

### 치환 (`s`)

```sh
sed 's/old/new/' file          # 줄당 첫 번째만
sed 's/old/new/g' file         # 줄 전체
sed 's/old/new/2' file         # 줄당 2번째 매치만
sed 's/old/new/gi' file        # 대소문자 무시
sed 's|/etc/foo|/var/bar|g'    # 구분자 변경 (경로에 편리)
sed -E 's/([a-z]+)=([0-9]+)/\2=\1/' file  # 백레퍼런스 \1 \2
sed 's/&/[&]/g' file           # & = 매치된 전체 문자열
```

### 주소 (라인 선택)

```sh
sed '3d' file                  # 3번째 줄 삭제
sed '1,5d' file                # 1~5번째 줄
sed '/^#/d' file               # # 시작 줄 (주석) 삭제
sed '/^$/d' file               # 빈 줄 삭제
sed '/start/,/end/d' file      # start ~ end 사이 (포함) 삭제
sed '$d' file                  # 마지막 줄 삭제
sed -n '5,10p' file            # 5~10번째 줄만 출력 (-n + p)
sed -n '/pattern/p' file       # grep 흉내
sed '5,10s/old/new/g' file     # 5~10번째 줄에서만 치환
```

### 삽입 / 추가 / 변경

```sh
sed '3a 새 줄'         file    # 3번째 줄 뒤에 추가
sed '3i 새 줄'         file    # 3번째 줄 앞에 삽입
sed '3c 대체 줄'       file    # 3번째 줄을 통째 교체
sed '/pattern/a 새 줄' file    # 매칭 줄 뒤에 추가
sed 's/$/;/' file              # 모든 줄 끝에 ;
sed 's/^/  /' file             # 모든 줄 앞에 들여쓰기
```

> `a`/`i`/`c`는 GNU sed 기준. macOS·BSD sed에선 `sed '3a\'` 다음 줄에 텍스트를 쓰는 백슬래시-개행 형식이 필요하다.

### 자주 쓰는 조합

```sh
# CRLF → LF
sed -i 's/\r$//' file

# 줄 끝 공백 제거
sed -i 's/[[:space:]]\+$//' file

# 연속 빈 줄을 한 줄로 (squeeze blank lines)
sed -i '/^$/N;/\n$/D' file

# IP 주소만 추출
sed -En 's/.*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).*/\1/p' file
```

---

## awk (Pattern-Action)

필드 기반 처리. 조건/계산/배열 지원.

### 기본

```sh
awk '패턴 { 액션 }' file
awk -F, '...' file              # 입력 구분자 (`,`)
awk -F'[,;]' '...' file         # 여러 구분자 (정규식)
awk -v var=value '...' file     # 외부 변수 주입
awk 'BEGIN{OFS=","} {print $1,$2}' file  # 출력 구분자
```

### 내장 변수

| 변수 | 의미 |
|---|---|
| `$0` | 현재 줄 전체 |
| `$1`, `$2`, ... | n번째 필드 |
| `$NF` | 마지막 필드 |
| `NF` | 현재 줄의 필드 개수 |
| `NR` | 지금까지 읽은 줄 번호 (1부터) |
| `FNR` | 현재 파일에서의 줄 번호 (여러 파일일 때 reset) |
| `FS` / `OFS` | 입력 / 출력 필드 구분자 |
| `RS` / `ORS` | 입력 / 출력 레코드 구분자 |
| `FILENAME` | 현재 파일명 |

### 패턴 + 액션

```sh
awk '{print $1}'                       # 첫 번째 필드
awk '{print $1, $NF}'                  # 첫·마지막 필드
awk 'NR>1'                             # 헤더 제외 (1줄 이후)
awk 'NR==1; END{print}'                # 첫 줄 + 마지막 줄 (END는 마지막 $0)
awk '/pattern/'                        # grep과 동일
awk '!/pattern/'                       # 부정
awk '/start/,/end/'                    # 범위 (start~end 사이)
awk '$3 >= 100'                        # 3번째 필드 100 이상
awk '$2 == "ERROR" {print $0}'         # 문자열 비교
awk 'length($0) > 80'                  # 80자 초과 줄
awk 'NF == 0'                          # 빈 줄
```

### BEGIN / END

```sh
# 합계
awk '{ sum += $1 } END { print sum }' file

# 평균
awk '{ sum += $1; n++ } END { print sum/n }' file

# 줄 수 (= wc -l)
awk 'END { print NR }' file

# 헤더 출력
awk 'BEGIN{print "name\tage"} {print $1,$2}' file
```

### 배열 (associative)

```sh
# IP별 카운트
awk '{ count[$1]++ } END { for (ip in count) print count[ip], ip }' access.log | sort -rn

# 컬럼별 합계
awk -F, '{ sum[$1] += $2 } END { for (k in sum) print k, sum[k] }' data.csv

# 중복 제거 (순서 유지)
awk '!seen[$0]++' file
```

### printf

```sh
awk '{ printf "%-20s %5d\n", $1, $2 }' file
awk 'BEGIN{printf "%.2f\n", 1/3}'
```

### 자주 쓰는 함수

| 함수 | 설명 |
|---|---|
| `length(s)` | 문자열 길이 (인자 없으면 `$0`) |
| `substr(s, start, len)` | 부분 문자열 (1-based) |
| `index(s, t)` | t의 위치 (없으면 0) |
| `split(s, arr, sep)` | sep으로 분할, arr에 저장, 개수 반환 |
| `gsub(re, rep, s)` | 전역 치환, 횟수 반환 (s 생략 = `$0`) |
| `sub(re, rep, s)` | 첫 번째만 치환 |
| `toupper(s)` / `tolower(s)` | 대소문자 |
| `sprintf(fmt, ...)` | printf 결과를 문자열로 |

### 자주 쓰는 시나리오

```sh
# CSV에서 N번째 컬럼 출력
awk -F, '{print $3}' file.csv

# /etc/passwd 사용자명만
awk -F: '{print $1}' /etc/passwd

# 컬럼 순서 바꾸기
awk -F, 'BEGIN{OFS=","} {print $3,$1,$2}' file.csv

# nginx 로그 status별 카운트
awk '{ s[$9]++ } END { for (c in s) print c, s[c] }' access.log

# 평균 응답시간 (마지막 필드)
awk '{ sum += $NF; n++ } END { printf "%.2f ms\n", sum/n }' timings.log
```

---

## sed vs awk

| | sed | awk |
|---|---|---|
| 처리 단위 | 라인 | 라인 + 필드 |
| 강점 | 치환·삽입·삭제 (in-place 가능) | 컬럼 추출, 계산, 보고서, 배열 집계 |
| 정규식 | BRE 기본 (`-E`로 ERE) | ERE |
| 변수/제어문 | 없음 (제한적 hold space) | 변수·배열·for/if/while 지원 |
| 언제 쓰나 | 한두 줄짜리 텍스트 변환 | 컬럼/통계가 등장하는 순간 |
