# Google Chrome

macOS에서 Chrome 창이 뜨지 않을 때의 복구 명령. 터미널에 입력한다.
기본 설치 위치인 `/Applications/Google Chrome.app` 기준이다.

## 30초 복구 — 기존 프로세스를 종료하지 않고 창 열기

```sh
open -n -a "Google Chrome" --args --new-window
```

`open -n`은 이미 실행 중이어도 새 앱 인스턴스를 요청한다. Chrome은 같은
프로필의 기존 인스턴스로 요청을 전달할 수도 있으므로, 별도 프로필을 만드는
명령은 아니다. 기존 일반 창과 테스트 프로세스를 종료하지 않는 우선 복구 방법이다.

## Dock을 눌러도 창이 뜨지 않을 때

자동화 도구나 AI 에이전트가 실행한 **headless Chrome**만 남아 있을 수 있다.
Headless는 창을 표시하지 않는 실행 모드다. macOS가 기존 앱 인스턴스를
활성화하려 할 때 눈에 보이는 창이 없을 수 있다. 다만 모든 창 미표시 현상의
원인이 headless인 것은 아니다.

### 1. 창 없는 Chrome 확인

```sh
pgrep -fl '^/Applications/Google Chrome[.]app/Contents/MacOS/Google Chrome .*--headless([=[:space:]]|$)'
```

PID와 실행 인자를 확인한다. `--headless` 또는 `--headless=new`가 있으면
창 없는 실행이다. `--user-data-dir`과 `--remote-debugging-port`는 어떤 테스트가
띄운 프로세스인지 구분하는 단서다. 출력이 없으면 해당 패턴의 프로세스가 없다.

### 2. 필요할 때만 테스트 프로세스 정리

**진행 중인 브라우저 자동화 테스트가 중단될 수 있다.** 담당 에이전트를 찾을 수
없고 테스트 중단이 괜찮을 때 사용한다. 일반 Chrome 창까지 종료하는
`killall "Google Chrome"`은 피한다.

```sh
# 위에서 확인한 headless Chrome 본체만 정상 종료 요청(SIGTERM)
pkill -f '^/Applications/Google Chrome[.]app/Contents/MacOS/Google Chrome .*--headless([=[:space:]]|$)'

# 남은 대상이 있는지 확인하고 일반 창 열기
pgrep -fl '^/Applications/Google Chrome[.]app/Contents/MacOS/Google Chrome .*--headless([=[:space:]]|$)'
open -n -a "Google Chrome" --args --new-window
```

특정 테스트만 종료하려면 첫 단계에서 확인한 PID로 `kill -TERM <PID>`를 사용한다.
패턴은 기본 설치 경로의 headless 본체만 대상으로 하며, 다른 위치에 설치한
Chrome이나 Chromium은 포함하지 않는다. 인자 순서가 달라도 `--headless`를 찾는다.

## 예방

자동화 테스트는 자신이 띄운 브라우저만 `finally`/종료 처리에서 닫아야 한다.
임시 프로필로 분리하고 정상 완료뿐 아니라 실패·취소 시에도 정리한다.
사용자의 일반 Chrome을 일괄 종료하는 방식은 쓰지 않는다.

## 참고

- [Chrome Headless 공식 문서](https://developer.chrome.com/docs/chromium/headless)
- macOS 로컬 매뉴얼: `man open`, `man pgrep`, `man pkill`
