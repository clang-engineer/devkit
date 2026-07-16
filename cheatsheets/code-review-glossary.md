# Code Review Glossary

> GitHub / GitLab / Bitbucket / Gerrit 리뷰 코멘트에서 자주 보이는 약어와 관용 표현. 도구 중립.

## 승인 · 반대 신호

| 약어 | 풀이 | 의미 |
|------|------|------|
| **LGTM** | Looks Good To Me | "내가 봤을 땐 OK, 머지해도 됨". 사실상 approval 도장. |
| **SGTM** | Sounds Good To Me | 제안/방향에 동의. 코드보단 논의 맥락에서. |
| **WFM** | Works For Me | "내 환경에선 잘 됨". 재현 안 되는 버그 리포트 대응. |
| **+1 / -1** | — | 찬성/반대. Gerrit 점수 표기에서 유래. Slack 이모지로도 흐름. |
| **NACK / ACK** | Negative/Positive Acknowledgement | 커널/리눅스 메일링리스트 스타일. NACK = 반대. |

## 리뷰 요청 · 진행 상태

| 약어 | 풀이 | 의미 |
|------|------|------|
| **PTAL** | Please Take A Look | "한 번 봐주세요". 리뷰어 핑할 때. |
| **RFC** | Request For Comments | "아직 결정 아님, 의견 받음" 단계의 제안/PR. |
| **WIP** | Work In Progress | 작업 중, 머지 금지. GitHub은 Draft PR로 대체 권장. |
| **Draft PR** | — | GitHub 정식 기능. CI는 돌지만 리뷰어 자동 요청 안 됨. |
| **RFR** | Ready For Review | Draft에서 일반 PR로 전환 = 리뷰 요청 의사. |

## 코멘트 톤 · 중요도

| 표현 | 의미 |
|------|------|
| **nit:** | "nitpick" — 사소한 지적, 안 고쳐도 머지 무방. (스타일/네이밍 등) |
| **nb:** / **NB:** | "nota bene" — "참고로 알아둬". 액션 요구 아님. |
| **q:** | 질문. 변경 요구 아님. |
| **suggestion:** | 대안 제시. GitHub은 ` ```suggestion ` 코드블록으로 1클릭 적용 가능. |
| **blocker** | "이건 머지 막는 이슈". 명시적으로 강한 신호. |
| **non-blocking** | "지적은 하는데 머지는 막지 않음". |
| **follow-up** | "이번 PR 말고 다음에 처리하자". 별도 이슈로. |
| **out of scope** | "이 PR의 범위 아님". 새 이슈로 분리 요청. |

## 코드 변경 종류

| 표현 | 의미 |
|------|------|
| **TBD** | To Be Determined — 아직 미정. |
| **TODO** | 추후 작업. 보통 이슈 번호 같이 단다 (`TODO(#123)`). |
| **FIXME** | 알려진 결함, 임시 코드. |
| **XXX** | 위험/주의 마커. FIXME보다 강함. |
| **HACK** | 정공법 아님을 명시. |
| **NOTE** | 미래의 누군가에게 남기는 메모. |

## PR 관리 어휘

| 표현 | 의미 |
|------|------|
| **Squash and merge** | 모든 커밋을 하나로 합쳐 머지. 히스토리 깔끔. |
| **Rebase and merge** | 커밋 하나하나를 main 위에 올림. linear history 유지. |
| **Merge commit** | 머지 커밋 생성. 브랜치 형태 보존. |
| **Force push** | 리뷰어 작업 화면 깨질 수 있음. rebase 후엔 보통 lease 옵션 (`--force-with-lease`)으로. |
| **Backport** | 핫픽스를 이전 릴리스 브랜치로 옮김. |
| **Cherry-pick** | 특정 커밋만 골라 다른 브랜치에 적용. |
| **Revert** | 머지 후 되돌리는 커밋. 원본 삭제 아니고 역연산 커밋. |
| **CODEOWNERS** | 경로별 자동 리뷰어 지정 파일 (`.github/CODEOWNERS`). |

## 회의 · 협업 일반

| 표현 | 의미 |
|------|------|
| **bikeshedding** | 본질 아닌 사소한 색깔 논쟁. (자전거 보관소 색 논쟁에서 유래) |
| **yak shaving** | 진짜 작업하려다 부수적인 일에 빠지는 상태. |
| **MVP** | Minimum Viable Product. 최소 동작 버전. |
| **NIH** | Not Invented Here — 외부 라이브러리 거부 성향. |
| **DRY / KISS / YAGNI / SOLID** | 코딩 원칙 약어. 컨텍스트 봐서. |
| **postmortem** | 사후 분석 문서. 보통 장애 후. |
| **RCA** | Root Cause Analysis — 근본 원인 분석. |
| **IIRC / AFAIK / TIL** | If I Recall / As Far As I Know / Today I Learned. |

## GitHub/GitLab 고유 기능 용어

| 표현 | 의미 |
|------|------|
| **Conventional Commits** | `feat:`, `fix:`, `chore:` 접두. CHANGELOG 자동화. |
| **Semver** | `MAJOR.MINOR.PATCH`. breaking/feature/fix 구분. |
| **Squash** | 커밋 합치기. GitHub PR 설정에서 디폴트로 강제 가능. |
| **Linked issue** | PR 본문에 `Closes #123` → 머지 시 이슈 자동 닫힘. |
| **Assignee vs Reviewer** | 담당자 vs 리뷰어. GitHub은 둘 다 별도 필드. |
| **Mention (@user)** | 알림 발송. `@org/team`은 팀 단위. |
| **Approval / Request changes** | GitHub Review 상태. CODEOWNERS와 조합해 머지 게이트. |
| **Merge queue** | 동시 머지 직렬화 + CI 재검증. 대규모 모노레포에서 유용. |
| **Protected branch** | main 등 직접 푸시 금지, 룰 강제. |

## 자주 헷갈리는 짝

- **LGTM ≠ approval**: LGTM 코멘트만 달고 GitHub Approve 버튼 안 누르면 머지 게이트엔 안 잡힌다. 반드시 Review → Approve 까지.
- **Draft PR ≠ WIP 라벨**: Draft는 자동 리뷰 요청 안 보냄, WIP 라벨은 단순 표식. 효과 다름.
- **Rebase ≠ Squash**: rebase는 커밋 유지하며 위치 이동, squash는 커밋 합침.
- **Revert ≠ Reset**: revert는 새 커밋 생성 (협업 안전), reset은 히스토리 조작 (force push 필요).

## 참고

- [GitHub Glossary](https://docs.github.com/en/get-started/learning-about-github/github-glossary)
- [GitLab Documentation Word List](https://docs.gitlab.com/development/documentation/styleguide/word_list/)
- [Conventional Commits](https://www.conventionalcommits.org/)
