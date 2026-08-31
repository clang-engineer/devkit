# Taskwarrior Cheatsheet

> Taskwarrior 3.5.0 기준의 로컬 우선 CLI 태스크 관리자. Taskwarrior 전체가 Rust로
> 재작성된 것은 아니며, 3.x에서는 Rust 라이브러리 **TaskChampion**이 저장·동기화
> 코어를 담당한다.

## 30초만 본다면

| 상황 | 명령 / 핵심 |
|---|---|
| 추가 | `task add "우유 사기" project:home due:tomorrow` |
| 지금 볼 목록 | `task` = `task next`; `task list`와는 다른 리포트 |
| 완료 / 수정 | `task 3 done` / `task 3 modify due:fri +urgent` |
| 검색 | `task project:home +PENDING list` |
| 실수 복구 | `task undo` (변경 내용을 보여 주고 확인을 요구함) |
| 자동화 식별자 | 숫자 ID 대신 UUID 사용; 생성 시 `rc.verbose=new-uuid` |
| 백업·연동용 출력 | `task <filter> export` → JSON 배열 |
| 보류 | `wait:날짜`는 그때까지 대부분의 기본 리포트에서 숨김 |
| 예정 | 미래 `scheduled:`는 `+READY`/`task ready`에 영향; 기본 `next`에서 숨기는 기능은 아님 |
| 동기화 | v3는 `taskd` 미지원; SQLite 디렉터리를 파일 동기화하지 말 것 |

## 설치와 최초 실행

```sh
brew install task                 # macOS
sudo apt install taskwarrior      # Debian/Ubuntu (배포판 제공 버전 확인)
task --version
touch ~/.taskrc                   # 빈 파일로도 충분
```

| 항목 | 기본값 |
|---|---|
| 설정 | `~/.taskrc` 우선, 없으면 `$XDG_CONFIG_HOME/task/taskrc` (`~/.config/task/taskrc`) |
| 데이터 디렉터리 | `~/.task/` |
| 로컬 데이터베이스 | `~/.task/taskchampion.sqlite3` |

설정 파일이 없으면 TTY에서는 샘플 설정을 만들지 물을 수 있지만, **non-TTY에서는
프롬프트를 띄우지 않고 종료한다.** CI나 스크립트에서는 먼저 빈 `~/.taskrc`를
만들거나 `TASKRC`로 준비한 파일을 지정한다. `data.location`은 기본값을 바꿀 때만
설정하면 된다.

## 핵심 명령

| 명령 | 동작 |
|---|---|
| `task add "리팩터링"` | 태스크 추가 |
| `task` / `task next` | urgency 중심의 기본 `next` 리포트 |
| `task list` | `next`와 필터·열 구성이 다른 `list` 리포트 |
| `task 3 done` | 완료 |
| `task 3 delete` | 삭제 (확인 요청) |
| `task 3 modify due:mon` | 속성 수정 |
| `task 3 annotate "검토 필요"` | 주석 추가 |
| `task 3 edit` | `$EDITOR`에서 편집 |
| `task 3 start` / `task 3 stop` | 활성 상태 시작 / 해제 |
| `task undo` | 직전 변경 검토 후 되돌리기 |
| `task count` | 필터에 맞는 개수 출력 |
| `task info 3` | 태스크의 UUID와 전체 속성 확인 |

`start`는 `start` 타임스탬프를 기록하고 `stop`은 이를 제거해 활성 상태를
표시한다. 시작·중지 구간을 누적하는 시간 추적기가 아니다.

## 속성

```sh
task add "릴리스 점검" project:devkit +docs due:fri priority:H
task 3 modify project:devkit.docs scheduled:tomorrow
task 3 modify due:                    # 빈 값으로 속성 제거
```

| 속성 | 의미 |
|---|---|
| `project:이름` | 프로젝트. `project:devkit.docs`처럼 계층화 가능 |
| `+태그` / `-태그` | 태그 추가 / 제거 |
| `due:날짜` | 기한; urgency와 overdue 계산에 반영 |
| `priority:H/M/L` | 우선순위 |
| `scheduled:날짜` | 예정 시각. 미래이면 `+READY`가 아니며 `task ready`에서 제외 |
| `wait:날짜` | 시각이 올 때까지 waiting 상태로 두고 대부분의 기본 리포트에서 숨김 |
| `recur:주기` | 반복 규칙. **반드시 `due:`와 함께 지정** |

```sh
task add "주간 리뷰" due:fri recur:weekly
```

미래 `scheduled:` 태스크도 기본 `task next`에 나타날 수 있다. 실제로 감추려면
`wait:`를 쓰고, 실행 가능 여부를 보고 싶으면 `task ready` 또는 `+READY` 필터를
쓴다.

## 필터와 일괄 작업

명령 앞의 필터에 맞는 태스크만 조회하거나 변경한다. 일괄 변경 전에는 같은
필터로 먼저 리포트를 확인한다.

```sh
task project:devkit list
task +docs next
task due:today list
task +OVERDUE list
task +docs +urgent list            # AND
task 1-3 done                      # 현재 ID 범위 일괄 완료
task project:devkit +PENDING count
```

숫자 ID는 현재 리포트에 붙는 편의용 값이라 필터, 완료, 동기화 등에 따라 바뀐다.
셸 스크립트나 외부 시스템에는 안정적인 UUID를 저장한다.

```sh
uuid=$(task rc.verbose=new-uuid add "자동 생성 태스크")
task "$uuid" modify +automated
task _get "$uuid".description
```

`rc.verbose=new-uuid`는 사람이 읽는 생성 메시지 대신 새 UUID만 받기 위한 일회성
설정 override다. 즉시 생성된 항목을 가리키는 `+LATEST` 같은 상태나 변동 가능한
숫자 ID에 의존하지 않는 편이 안전하다.

## 날짜

`due:`, `scheduled:`, `wait:` 등에 같은 날짜 표현을 쓴다.

| 표현 | 의미 |
|---|---|
| `today` `tomorrow` `now` | 오늘, 내일, 현재 |
| `eod` `eow` `eom` | day/week/month의 끝 |
| `mon`~`sun` / `monday` | 다음 해당 요일 |
| `3days` `2weeks` | 현재 기준 상대 시각 |
| `2026-09-15` | 절대 날짜 |

숫자로 된 날짜의 입력·표시는 `dateformat` 설정에 따라 달라질 수 있다. 사람이
입력할 때는 현재 설정을 확인하고, 스크립트와 교환 데이터에는 모호하지 않은 ISO
형식을 우선한다.

## Undo와 JSON export

- `task undo`는 직전 변경의 diff를 보여 주고 확인을 받은 뒤 적용한다. 자동으로
  조용히 되돌리는 명령이 아니다.
- 동기화는 undo 이력의 경계다. 동기화 이전 변경까지 계속 거슬러 올라갈 수 있다고
  가정하지 말고, 중요한 대량 변경 전에는 `export`로 별도 스냅샷을 남긴다.
- `task export`는 필터에 맞는 태스크를 **JSON 배열**로 stdout에 내보낸다. 기본
  리포트의 표나 ANSI 장식이 아니며, 필터 결과가 없으면 빈 배열이다.
- export의 날짜 값은 사람이 보는 `dateformat`과 다른 기계용 형식이므로 문자열
  모양을 하드코딩하기보다 JSON으로 파싱한다.

```sh
task export > task-backup.json
task project:devkit +PENDING export | jq '.[] | {uuid, description, due}'
```

## 동기화와 데이터 안전

Taskwarrior 3은 과거 Taskserver인 **`taskd`를 지원하지 않는다.** 현재
TaskChampion 동기화 백엔드는 다음과 같다.

- TaskChampion sync server
- S3-compatible object storage
- Google Cloud Platform (GCP)
- local
- Git

여러 장치에서 쓸 때는 공식 sync 설정을 통해 백엔드를 선택한다. **Dropbox,
Syncthing, rsync 등으로 `~/.task/` 또는 `taskchampion.sqlite3`를 장치 간 직접
복제하지 않는다.** 실행 중인 SQLite 데이터베이스와 관련 파일을 파일 단위로
동기화하면 충돌하거나 손상될 수 있다. 단순 백업도 일관된 `task export` 결과를
별도로 보관하는 방식이 안전하다.

## 선택 사항: 일상 화면에 노출하기

Taskwarrior 자체 동작에 필요한 설정은 아니다. 직접 `task`를 여는 습관이 없다면
이미 보는 화면에 소량만 노출하는 운영 레시피로 선택해 적용한다.

새 셸에서 다음 항목 5개 표시 (`~/.zshrc`):

```sh
if command -v task >/dev/null 2>&1; then
  task next limit:5 2>/dev/null
fi
```

tmux 상태바에 pending 개수 표시:

```tmux
#(task +PENDING count 2>/dev/null) todo
```

## 참고

- [Taskwarrior 공식 문서](https://taskwarrior.org/docs/)
- [Taskwarrior 동기화 문서](https://taskwarrior.org/docs/sync/)
- [Taskwarrior 3.5.0 release](https://github.com/GothenburgBitFactory/taskwarrior/releases/tag/v3.5.0)
