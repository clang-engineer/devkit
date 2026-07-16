# macOS 관리 Cheatsheet

> 디스크 정리·LaunchDaemons·심볼릭 링크·Secure Input 같은 macOS 운영 트러블슈팅.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 용량 큰 캐시 찾기 | `du -sh ~/Library/Caches/* 2>/dev/null \| sort -rh \| head` |
| APFS 실제 사용량 | `diskutil apfs list` |
| Homebrew 캐시 정리 | `brew cleanup --prune=all` |
| LaunchDaemons 등록 | `sudo launchctl load /Library/LaunchDaemons/<plist>` |
| 등록된 daemon 확인 | `launchctl list \| grep <label>` |
| 로그인 사용자 daemon | `launchctl list` (sudo 없이) |
| `java_home`이 엉뚱한 버전 | 심볼릭 링크 복구 (아래 섹션) |
| 단축키 갑자기 먹통 | Secure Input 잡힌 프로세스 확인 |

## 디스크 용량 정리

### 용량 큰 디렉토리 찾기

```sh
du -sh ~/Library/Caches/* 2>/dev/null | sort -rh | head -10
du -sh ~/Library/Containers/* 2>/dev/null | sort -rh | head -10
diskutil apfs list | grep "Capacity"  # APFS 실제 사용량 (df보다 정확)
```

### 안전하게 정리 가능한 항목

```sh
# 패키지 매니저 캐시
brew cleanup --prune=all              # Homebrew
yarn cache clean                      # Yarn
npm cache clean --force               # npm

# IDE / 개발 도구 캐시
rm -rf ~/Library/Caches/JetBrains     # JetBrains (재시작 시 재생성)
rm -rf ~/Library/Logs/JetBrains       # JetBrains 로그
rm -rf ~/.gradle/caches               # Gradle (빌드 시 재다운로드)
```

### 참고

- `df -h /`는 APFS에서 System 볼륨만 표시할 수 있음 → `diskutil apfs list`가 정확
- Docker는 데몬 실행 상태에서만 `docker system prune -a` 가능

## Homebrew & Java 심볼릭 링크

`brew cleanup` 후 `java_home`이 엉뚱한 버전 반환 / `jenv local` 실패 시, JDK 심볼릭 링크를 복구한다.

```sh
sudo ln -sfn /opt/homebrew/Cellar/openjdk@21/<버전>/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

## LaunchDaemons (부팅 시 자동 실행)

### plist 작성

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.example.my-script</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/sh</string>
        <string>/path/to/script.sh</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/tmp/my-script.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/my-script.log</string>
</dict>
</plist>
```

### 등록 / 해제

```sh
# 등록 — 현대 방식 (권장, macOS 10.11+)
sudo cp com.example.my-script.plist /Library/LaunchDaemons/
sudo launchctl bootstrap system /Library/LaunchDaemons/com.example.my-script.plist
sudo launchctl enable system/com.example.my-script

# 등록 — legacy (아직 동작하나 deprecated 경고)
sudo launchctl load /Library/LaunchDaemons/com.example.my-script.plist

# 해제
sudo launchctl bootout system /Library/LaunchDaemons/com.example.my-script.plist   # 현대
sudo launchctl unload /Library/LaunchDaemons/com.example.my-script.plist           # legacy
sudo rm /Library/LaunchDaemons/com.example.my-script.plist

# 상태 확인
sudo launchctl print system/com.example.my-script
```

### LaunchDaemons vs LaunchAgents

| | LaunchDaemons | LaunchAgents |
|---|---|---|
| 경로 | `/Library/LaunchDaemons/` | `~/Library/LaunchAgents/` |
| 권한 | root | 사용자 |
| 실행 시점 | 부팅 시 (로그인 불필요) | 로그인 시 |

`RunAtLoad: true` → load 즉시 + 부팅 시 실행

## Secure Input 문제 (AeroSpace 등)

단축키가 갑자기 먹통이 되면(AeroSpace 등 핫키 도구) Secure Input을 의심한다. 어떤 프로세스가 Secure Input을 잡고 있는지 확인:

```sh
ioreg -l -w 0 | grep SecureInput && ps -p <PID> -o comm=
```
