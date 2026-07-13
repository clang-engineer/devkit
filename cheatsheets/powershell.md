# PowerShell Cheatsheet

> Bash 쓰던 사람이 Windows에서 PowerShell 만났을 때 손 안 닿는 부분 위주.
> 대상: Windows PowerShell 5.1 + PowerShell 7 (PSCore). 차이가 있으면 표기.

## 30초만 본다면 (Bash → PowerShell)

| Bash | PowerShell |
|---|---|
| `var=1` | `$var = 1` |
| `$HOME` | `$env:HOME` 또는 `$HOME` |
| `export FOO=1` | `$env:FOO = "1"` |
| `ls -la` | `Get-ChildItem -Force` (`ls`/`dir`은 alias) |
| `grep pattern file` | `Select-String -Pattern pattern file` (`sls`) |
| `find . -name "*.py"` | `Get-ChildItem -Recurse -Filter *.py` |
| `cat file` | `Get-Content file` (`gc`) |
| `which cmd` | `Get-Command cmd` (`gcm`) |
| `curl URL` | `Invoke-WebRequest URL` (`iwr`) — **PS 5.1 한정** alias라 옵션 다름 (PS 7은 alias 없음 → 진짜 `curl.exe`) |
| 파이프(텍스트) | 파이프(**객체** — `Select-Object`, `Where-Object`) |
| `cmd1 && cmd2` | PS 7+: 그대로 / PS 5.1: `cmd1; if ($?) { cmd2 }` |

## Bash와 핵심 차이

| 영역 | Bash | PowerShell |
|------|------|------------|
| 변수 | `var=1` | `$var = 1` (반드시 `$` prefix) |
| 환경변수 | `$HOME`, `export FOO=1` | `$env:HOME`, `$env:FOO = 1` |
| 파이프 | 텍스트 줄 | **객체** (속성/메소드 그대로 흐름) |
| `&&` / `\|\|` | 사용 가능 | **PS 5.1 ❌** / PS 7 ✓ |
| 삼항 `? :` | 없음 (외부) | **PS 5.1 ❌** / PS 7 `? :` ✓ |
| 명령 종료 | 줄바꿈 또는 `;` | 줄바꿈 또는 `;` (동일) |
| 주석 | `#` | `#` (동일) |
| 명령 결과 | 종료 코드 (`$?`) | 객체 + `$?` (true/false) |
| 호출 연산자 | (없음) | `&` (`& "C:\path with space\app.exe" arg`) |

## 변수와 환경변수

```powershell
$var = "hello"                         # 변수
$arr = @(1, 2, 3)                      # 배열
$hash = @{ a = 1; b = 2 }              # 해시 테이블

$env:PATH                              # 환경변수 읽기
$env:FOO = "bar"                       # 환경변수 쓰기 (현재 세션만)
[Environment]::SetEnvironmentVariable('FOO','bar','User')  # 영구

Remove-Item Env:FOO                    # 환경변수 삭제
Get-ChildItem Env:                     # 모든 환경변수
```

## 객체 파이프라인

```powershell
Get-Process | Where-Object { $_.CPU -gt 100 }              # 필터
Get-Process | Where-Object CPU -gt 100                     # 간략 (PS 3+)
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5
Get-Process | Select-Object Name, CPU, Id                  # 컬럼 선택
Get-Process | ForEach-Object { $_.Name }                   # 매핑
Get-Process | Group-Object ProcessName                     # 그룹
Get-Process | Measure-Object CPU -Sum -Average             # 집계

# alias: ? = Where-Object, % = ForEach-Object, select = Select-Object
ps | ? CPU -gt 100 | select Name,CPU
```

`$_` 는 파이프 현재 항목 (Bash의 자리표시자 없음 → `$_` 가 그 역할).

## 자주 쓰는 cmdlet

```powershell
Get-Command rg                         # 명령 위치/타입 (which 대체)
Get-Help <cmd> -Examples               # man 페이지 + 예시
Get-Module -ListAvailable              # 설치된 모듈
Test-Path C:\foo                       # 존재 확인
Resolve-Path .\rel                     # 절대 경로
Measure-Command { ... }                # time { ... }
```

## 파일 / 디렉터리

```powershell
Get-ChildItem               # ls
Get-ChildItem -Recurse -Filter *.log
New-Item -ItemType Directory foo
New-Item -ItemType File bar.txt
Remove-Item foo -Recurse -Force        # rm -rf
Copy-Item src dst -Recurse
Move-Item old new
Get-Content file.txt                   # cat
Get-Content file.txt -Tail 50 -Wait    # tail -f
Set-Content file.txt "x"               # 덮어쓰기
Add-Content file.txt "x"               # append
```

### `Get-Content` 주요 옵션 (`gc` 가 alias)

| 옵션 | 설명 |
|---|---|
| `-Wait` | 파일 변화 실시간 감지 (tail -f) |
| `-Tail <n>` | 끝에서 n줄 (= `tail -n`) |
| `-TotalCount <n>` | 처음 n줄만 (= `head -n`, `-Wait` 와 호환 X) |
| `-Encoding <name>` | UTF8/ASCII/Unicode 등 명시 |
| `-Delimiter <s>` | 줄바꿈이 아닌 다른 구분자로 split |
| `-Raw` | 줄 분할 없이 한 덩어리 문자열로 반환 (정규식·`Select-String` 에 유리) |
| `-ReadCount <n>` | 파이프 단위 배치 크기 |

```powershell
gc "C:\path\to\file.log" -Wait -Tail 10   # 마지막 10줄부터 실시간 follow
```

## 문자열 / 출력

```powershell
"Hello $name"                          # 보간 (큰따옴표만)
'Hello $name'                          # 리터럴 (작은따옴표 — 보간 X)
"Result: $($obj.Property)"             # 표현식 보간

@"
멀티라인
  $name 보간 OK
"@                                      # double-quoted here-string

@'
멀티라인
$literal 그대로 (보간 X)
'@                                      # single-quoted here-string

Write-Host "color" -ForegroundColor Cyan
Write-Output $obj                      # 파이프로 흘려보냄 (echo 아님)
```

## 제어 흐름

```powershell
# &&/|| 대체 (PS 5.1)
cmd1; if ($?) { cmd2 }                  # cmd1 성공 시 cmd2
cmd1; if (-not $?) { cmd2 }             # 실패 시
cmd1 -and cmd2                          # 잘못된 사용 (논리 연산자임 — 명령 체이닝 X)

if ($x -eq 1) { ... } elseif (...) { } else { }
switch ($v) { 'a' { ... } 'b' { ... } default { ... } }

foreach ($f in Get-ChildItem) { $f.Name }
for ($i=0; $i -lt 10; $i++) { ... }
while ($cond) { ... }
do { ... } while ($cond)
```

비교 연산자(중요): `-eq`, `-ne`, `-lt`, `-gt`, `-le`, `-ge`, `-like` (와일드카드), `-match` (정규식), `-in`, `-contains`. **`==` 같은 거 안 됨**.

## 함수 / splatting

```powershell
function Get-Sum {
    param(
        [Parameter(Mandatory)][int]$A,
        [int]$B = 0
    )
    return $A + $B
}

Get-Sum -A 1 -B 2

# splatting: 해시/배열을 인자로 풀어 전달
$params = @{ Path = '.'; Recurse = $true; Filter = '*.log' }
Get-ChildItem @params                  # @hash → 파라미터 풀기

function Wrap { Get-Process @args }    # @args → 호출자 인자 그대로 패스
```

## 에러 처리

```powershell
try {
    risky-thing
} catch [System.IO.IOException] {
    Write-Warning "IO error: $_"
} catch {
    Write-Error "기타: $_"
} finally {
    cleanup
}

$ErrorActionPreference = 'Stop'        # 모든 cmdlet의 에러를 throw로
risky -ErrorAction Stop                # 호출 단위로 적용
risky -ErrorAction SilentlyContinue    # 조용히 무시 (Get-Command 가드 시 자주)
```

## 외부 명령 / 종료 코드

```powershell
git status                             # 그냥 호출
& "C:\Program Files\App\app.exe" arg   # 공백 경로는 호출 연산자
$LASTEXITCODE                          # 외부 명령 종료 코드 ($?와 다름)

# Bash의 2>&1 주의
# PS 5.1에서 native 명령에 2>&1 쓰면 stderr가 ErrorRecord로 감싸지고
# $? 가 false가 됨 (정상 종료해도). 가능하면 redirect 안 함.

# 인자 파싱 회피 (--로 시작하는 인자)
git log --% --format=%H                # --% 이후 그대로 전달
```

## $PROFILE / 모듈

```powershell
$PROFILE                               # 현재 사용자 프로파일 경로
notepad $PROFILE                       # 편집

# 위치 (Windows):
# PS 5.1: ~\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
# PS 7  : ~\Documents\PowerShell\Microsoft.PowerShell_profile.ps1

Install-Module PSFzf -Scope CurrentUser
Import-Module PSFzf
Get-Module                             # 로드된 모듈
Get-Module -ListAvailable              # 설치된 모듈
```

## 헷갈리는 alias (Windows 한정 함정)

| alias | 실제 cmdlet | 함정 |
|-------|-------------|------|
| `curl` | Invoke-WebRequest | **진짜 curl 아님**. PS5에선 `curl.exe` 직접 호출 또는 `Remove-Item Alias:curl` |
| `wget` | Invoke-WebRequest | 동일 함정 |
| `ls` | Get-ChildItem | 출력 다름. `eza`/`ls.exe` 직접 |
| `ps` | Get-Process | 거의 호환 |
| `cd` | Set-Location | 거의 호환 |
| `cat` | Get-Content | 거의 호환 |
| `rm` | Remove-Item | `-rf` 같은 옵션 없음 (`-Recurse -Force`) |

```powershell
Get-Alias                              # 모든 alias
Get-Alias curl                         # 특정 alias 확인
Remove-Item Alias:curl                 # alias 제거 (현재 세션)
```

## PS 5.1 vs PS 7 한눈 비교

| 기능 | PS 5.1 (powershell.exe) | PS 7 (pwsh.exe) |
|------|------------------------|------------------|
| `&&` / `\|\|` | ❌ | ✓ |
| 삼항 `? :` | ❌ | ✓ |
| `??` (null coalescing) | ❌ | ✓ |
| `?.` (null conditional) | ❌ | ✓ |
| `ConvertFrom-Json -AsHashtable` | ❌ | ✓ |
| 기본 인코딩 | UTF-16 LE BOM | UTF-8 (no BOM) |
| 크로스플랫폼 | Windows만 | Windows/Mac/Linux |
| `$PROFILE` | `Documents\WindowsPowerShell\` | `Documents\PowerShell\` (Win) / `~/.config/powershell/` (Linux) |

## 자주 까먹는 미니 팁

```powershell
# 명령 결과를 변수와 화면 둘 다
$x = Get-Process | Tee-Object -Variable procs

# JSON 다루기
Get-Content data.json | ConvertFrom-Json
$obj | ConvertTo-Json -Depth 10

# CSV
Import-Csv data.csv | Where-Object Score -gt 80
$arr | Export-Csv out.csv -NoTypeInformation

# clipboard
"hi" | Set-Clipboard
Get-Clipboard

# 명령 히스토리
Get-History
Invoke-History 5                       # 5번 명령 재실행
(Get-PSReadLineOption).HistorySavePath # 히스토리 파일 경로
```

## 서비스 관리 (Get-Service / sc / nssm)

Windows 서비스를 다루는 길은 셋: PowerShell 네이티브 cmdlet, `sc.exe`(cmd 시절 표준), 그리고 일반 exe/batch를 서비스로 감싸는 `nssm`.

```powershell
# 조회 / 상태
Get-Service                            # 전체
Get-Service -Name MyApp                # 특정 (sc query MyApp)
Get-Service | Where-Object Status -eq 'Running'

# 시작 / 정지 / 재시작 (관리자 권한 필요)
Start-Service   MyApp                  # sc start MyApp
Stop-Service    MyApp                  # sc stop MyApp
Restart-Service MyApp

# 시작 유형 변경
Set-Service MyApp -StartupType Automatic   # Automatic / Manual / Disabled

# 등록 / 삭제
New-Service -Name MyApp -BinaryPathName "C:\app\my.exe" -StartupType Automatic
Remove-Service MyApp                   # PS 6+ 전용 (5.1은 sc delete 사용)
```

`sc.exe`는 PS/cmd 어디서나 동작. **`binpath=` 등은 `=` 뒤에 공백 한 칸이 필수** (`sc`의 고유 파싱 규칙):

```powershell
sc.exe create MyApp binPath= "C:\app\my.exe" start= auto   # = 뒤 공백 주의
sc.exe delete MyApp
sc.exe query MyApp
```

> PowerShell에서 `sc`는 `Set-Content`의 alias라 `sc.exe`로 명시 호출할 것.

### nssm — exe/batch를 서비스로 감싸기

`New-Service`/`sc`는 "서비스용으로 작성된 exe"만 제대로 등록된다. `java -jar`나 batch처럼 **콘솔에 머무는 일반 프로세스**는 서비스 제어(시작/정지/자동 재시작)가 깨지는데, [nssm](https://nssm.cc/download)이 그 래퍼 역할을 한다.

```bat
:: startup.bat — 서비스로 등록할 대상
@ECHO OFF
call "C:\java\bin\java.exe" -jar "C:\app\startup.jar"
```

```powershell
nssm install MyApp        # GUI: Application 탭에 exe/batch 경로 → Install service
nssm install MyApp "C:\work\startup.bat"   # GUI 없이 한 줄로
nssm start  MyApp
nssm stop   MyApp
nssm remove MyApp confirm                  # 등록 해제
nssm edit   MyApp                          # 설정 GUI 다시 열기
```

> 일반 exe를 `sc create`로 등록하면 시작 시 "서비스가 제때 응답하지 않았습니다(1053)" 에러가 흔하다 → nssm으로 감싸면 해결.

## 네트워크 / DNS 디버깅

> Windows에서 `nslookup` 결과가 `curl`/브라우저와 다른 경우가 잦다. `nslookup`은 한 인터페이스의 DNS만 보고 hosts/캐시도 무시한다. **실제 애플리케이션 경로로 확인하려면 `Resolve-DnsName`**.

```powershell
# 도메인 조회 (모든 인터페이스 DNS + hosts + 캐시 → curl/브라우저와 동일 경로)
Resolve-DnsName myhost.example.com

# 포트 연결 확인
Test-NetConnection myhost.example.com -Port 17943

# 여러 포트 한꺼번에
80, 443, 17943 | ForEach-Object {
    $r = Test-NetConnection myhost.example.com -Port $_ -WarningAction SilentlyContinue
    "{0,-6} {1}" -f $_, $r.TcpTestSucceeded
}
```

### Test-NetConnection 결과 해석

| PingSucceeded | TcpTestSucceeded | 의미 |
|---|---|---|
| True  | True  | 정상 |
| True  | False | 서버까진 가는데 **해당 포트 미개방** (서비스 미기동/방화벽) |
| False | False | **서버 자체 미도달** (라우팅/VPN 필요) |
| False | True  | ICMP만 차단, TCP는 OK — 사내망에서 흔함 |

### Resolve-DnsName 추가 옵션

```powershell
Resolve-DnsName name -DnsOnly             # DNS 프로토콜만 사용 (LLMNR/NetBIOS 제외)
Resolve-DnsName name -CacheOnly           # DNS 서버 안 거치고 캐시만
Resolve-DnsName name -Server 8.8.8.8      # 특정 DNS 서버로 질의 (VPN/공인 DNS 비교)

Get-DnsClientServerAddress | Where-Object { $_.AddressFamily -eq 2 }  # 인터페이스별 DNS
ipconfig /displaydns | Select-String "myhost" -Context 0,5           # 캐시 훑기
Find-NetRoute -RemoteIPAddress 203.0.113.42                          # 목적지로 가는 인터페이스
```

> `tracert`는 포트 스캔이 아니다. TTL을 1,2,3...로 늘려가며 중간 라우터를 노출시키는 도구라 "어디까지 길이 뚫렸는지"만 보여준다. 포트는 `Test-NetConnection -Port`로 별도 확인.

## 참고

- 공식: https://learn.microsoft.com/powershell/
- PS 5.1 vs 7 차이: https://learn.microsoft.com/powershell/scripting/whats-new/differences-from-windows-powershell
- 우리 Profile: `dotfiles/home/Microsoft.PowerShell_profile.ps1`
