# jq Cheatsheet

> **JSON query** — JSON을 셸 파이프라인에서 가공·필터·재구성하는 표준 도구.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 예쁘게 출력 | `jq .` |
| 한 줄로 (compact) | `jq -c .` |
| 문자열을 따옴표 없이 (셸 변수에) | `jq -r .name` |
| 중첩 필드 | `jq '.user.address.city'` |
| 배열 펼치기 | `jq '.items[]'` |
| 조건으로 거르기 | `jq '.[] \| select(.active)'` |
| 필드만 새 객체로 | `jq '.[] \| {id, name}'` |
| 키 목록 | `jq 'keys'` / 길이 `jq 'length'` |
| 키 지우기 | `jq 'del(.password)'` |
| 합치기 | `jq -s 'add'` (배열 합) / `jq '. + {x:1}'` (객체 병합) |

## 설치

```bash
brew install jq                # macOS
scoop install jq               # Windows
sudo apt install jq            # Linux
```

## 기본

```bash
echo '{"a":1}' | jq            # pretty print
jq '.' data.json               # pretty print 파일
jq -r '.name' data.json        # raw (따옴표 제거, 셸 변수에 담기 좋음)
jq -c '.' data.json            # compact (한 줄)
jq -s '.' a.json b.json        # slurp (여러 파일을 배열로)
```

## 필드 추출

```bash
jq '.name' data.json                  # 단일 필드
jq '.user.address.city' data.json     # 중첩
jq '.items[]' data.json               # 배열을 각 요소로 펼치기
jq '.items[0]' data.json              # 첫 번째 요소
jq '.items[-1]' data.json             # 마지막 요소
jq '.items[2:5]' data.json            # 슬라이스
jq '.items[].name' data.json          # 배열의 각 .name
jq 'keys' data.json                   # 키 목록
jq 'length' data.json                 # 길이
```

## 필터 (select)

```bash
jq '.items[] | select(.age > 20)' data.json
jq '.items[] | select(.tags | contains(["urgent"]))'
jq '.[] | select(.status == "active")'
jq '.items | map(select(.active))'    # 배열로 모으기
```

## 변환 (map / 재구성)

```bash
jq '.items | map(.name)'                            # 이름만 뽑은 배열
jq '.items | map({id, name})'                       # 일부 필드만 객체로
jq '.items[] | "\(.name): \(.score)"'               # 문자열 보간 (-r과 함께)
jq '.users | from_entries'                          # [{key,value}] → 객체
jq '. + {extra: "x"}'                               # 객체 병합
jq 'del(.password)'                                 # 키 제거
jq 'walk(if type=="object" then del(.id) else . end)'  # 모든 깊이에서 제거
```

## 그룹/집계

```bash
jq 'group_by(.category)' data.json
jq '[.[] | .price] | add'              # 합계
jq '[.[] | .price] | min, max'
jq 'sort_by(.score) | reverse'         # 정렬 후 역순
jq 'unique_by(.id)'
```

## 활용 시나리오

### curl로 API 응답 가공

```bash
curl -s api.example.com/users | jq '.[] | select(.active) | .email' -r
```

### GitHub API: 최근 커밋 메시지만

```bash
curl -s "https://api.github.com/repos/$OWNER/$REPO/commits?per_page=10" \
  | jq -r '.[] | "\(.sha[0:7]) \(.commit.message | split("\n")[0])"'
```

### kubectl + jq

```bash
kubectl get pods -o json | jq -r '.items[] | "\(.metadata.name)\t\(.status.phase)"'
```

### docker inspect에서 마운트만

```bash
docker inspect <container> | jq '.[0].Mounts'
```

### package.json의 dependencies 키 목록

```bash
jq -r '.dependencies | keys[]' package.json
```

## 디버깅 팁

```bash
jq '.items | debug | map(.name)'       # 중간값 stderr로 출력
jq 'try .items[].score catch 0'        # 에러 시 fallback
jq -e '.found'                         # exit code: false/null이면 1 (스크립트에 유용)
```

## yq — YAML 버전 (보너스)

jq 문법을 YAML/XML/TOML에 그대로 적용. 두 구현이 있어서 **헷갈리기 쉽다**:

| 구현 | 만든 사람 | 문법 | 설치 |
|---|---|---|---|
| **yq (mikefarah, Go)** | 사실상 표준 | jq와 동등 | `brew install yq` |
| python yq | kislyuk | jq를 호출 (jq 필요) | `pip install yq` |

```bash
# YAML → 값 추출
yq '.spec.replicas' deploy.yml

# YAML ↔ JSON 변환
yq -o=json deploy.yml
yq -p=json -o=yaml data.json

# 값 변경 (in-place)
yq -i '.spec.replicas = 5' deploy.yml

# 멀티 문서 YAML
yq '.[] | .kind' multi.yml             # 모든 문서의 kind

# jq 파이프라인으로 (YAML→JSON→jq→YAML)
yq -o=json '.' x.yml | jq '...' | yq -p=json
```

## 더 보기

- `jq --help`, `man jq`
- 공식: https://jqlang.github.io/jq/manual/
- 플레이그라운드: https://jqplay.org/
- yq 공식: https://mikefarah.gitbook.io/yq/
