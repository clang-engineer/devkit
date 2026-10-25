# PowerShell Cheatsheet

> Bash 쓰던 사람이 Windows에서 PowerShell 만났을 때 손 안 닿는 부분 위주.
> 대상: Windows PowerShell 5.1 + PowerShell 7 (PSCore). 차이가 있으면 표기.

## 객체 파이프라인과 명령 문법

```text
Verb-Noun [-Parameter Value] | Verb-Noun ...
Get-Process               | Where-Object ... | Select-Object ...

Bash Pipeline       : 주로 텍스트 스트림
PowerShell Pipeline : .NET 객체 (속성·메서드)
```

Cmdlet은 보통 **동사-대상**으로 읽는다. `Get-ChildItem`(자식 항목 조회), `Set-Content`(내용 설정), `Where-Object`(객체 필터), `Select-Object`(속성 선택)처럼 계열화한다.

```powershell
Get-Process | Where-Object CPU -gt 10 | Select-Object Name, CPU
$env:FOO = "1"       # 프로세스 환경변수
$items = @(1, 2, 3) # 배열
```

`ls`·`cat` 같은 별칭이 있어도 Bash 명령과 옵션·출력 타입이 같지는 않다. PowerShell 5.1과 7의 차이는 아래 버전별 주의사항을 참고한다.

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

## Windows 운영 작업과의 경계

```text
PowerShell 객체 파이프라인
├─ Get-Service / Start-Service → 서비스 상태 조회·제어
├─ sc.exe                      → Windows Service Control 명령
├─ nssm                        → 일반 실행 파일의 서비스 래퍼 (별도 도구)
├─ Resolve-DnsName             → 이름 해석 조회
└─ Test-NetConnection          → 네트워크 연결 검사
```

`sc`는 PowerShell에서 `Set-Content` 별칭일 수 있으므로 서비스 제어 CLI는 `sc.exe`로 명시한다. DNS 결과와 TCP 포트 연결 결과는 서로 다른 계층을 검사하며, 어느 하나만으로 원인을 확정하지 않는다.

설치·서비스 등록·네트워크 장애 진단 절차는 [Windows 서비스·DNS 진단 가이드](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_posts/reference/troubleshooting/2026-10-25-powershell-service-dns-diagnostics.md)에서 다룬다.

## 참고

- 공식: https://learn.microsoft.com/powershell/
- PS 5.1 vs 7 차이: https://learn.microsoft.com/powershell/scripting/whats-new/differences-from-windows-powershell
- Profile 예시: https://github.com/clang-engineer/dotfiles/blob/main/chezmoi/Documents/PowerShell/profile.ps1
