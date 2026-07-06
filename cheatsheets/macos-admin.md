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
brew cleanup --prune=all              # Homebrew (~3.8GB)
yarn cache clean                      # Yarn (~1.4GB)
npm cache clean --force               # npm (~2.2GB)

# IDE / 개발 도구 캐시
rm -rf ~/Library/Caches/JetBrains     # JetBrains (~3.4GB, 재시작 시 재생성)
rm -rf ~/Library/Caches/jdtls         # Java LSP (~1.1GB)
rm -rf ~/Library/Logs/JetBrains       # JetBrains 로그 (~223MB)
rm -rf ~/.gradle/caches               # Gradle (~5GB, 빌드 시 재다운로드)

# 앱 임시 파일
rm -rf ~/Library/Containers/com.microsoft.Outlook/Data/tmp  # Outlook 임시 (~7GB)
```

### 참고

- `df -h /`는 APFS에서 System 볼륨만 표시할 수 있음 → `diskutil apfs list`가 정확
- Docker는 데몬 실행 상태에서만 `docker system prune -a` 가능

## Raycast Quicklink (URL 런처)

자주 쓰는 URL(SharePoint, OneNote 등)을 이름으로 검색해 바로 여는 방법.

```sh
brew install --cask raycast
```

`⌥ Space` → "Create Quicklink" → Name과 URL 입력. 이후 이름만 치면 바로 열린다.

### Spotlight 대체하려면

Raycast 설정(`⌘ ,`) → General → Hotkey를 `⌘ Space`로 변경하고, 시스템 설정 → 키보드 단축키 → Spotlight에서 기존 단축키 해제.

> Spotlight의 `.webloc` 방식은 인덱싱이 불안정해서 비추천.

## Homebrew & Java 심볼릭 링크

`brew cleanup` 후 `java_home`이 엉뚱한 버전 반환 / `jenv local` 실패. 별도 글: [brew cleanup 후 java_home이 엉뚱한 버전을 반환할 때](https://clang-engineer.github.io/posts/homebrew-cleanup-java-symlink-broken/)

핵심 한 줄:

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

AeroSpace 단축키 갑자기 먹통 → Secure Input 의심. 별도 글: [AeroSpace 단축키가 갑자기 안 될 때 — macOS Secure Input](https://clang-engineer.github.io/posts/aerospace-secure-input-hotkey-blocked/)

핵심 한 줄:

```sh
ioreg -l -w 0 | grep SecureInput && ps -p <PID> -o comm=
```
