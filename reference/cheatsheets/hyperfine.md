# hyperfine — 반복 측정과 비교 구조

> `time`은 한 번의 실행 시간을 관찰하고, `hyperfine`은 **반복 측정의 분포와 비교**를 제공한다.

## 측정 흐름

```text
명령 A / B
    │
    ├─ --prepare : 측정 전 환경 준비 (선택)
    ├─ --warmup N: 워밍업 N회
    └─ --runs N  : 반복 측정 N회
            │
            ▼
      평균·표준편차·범위
            │
       명령 간 비교
```

```sh
hyperfine 'rg TODO src/'                  # 반복 실행
hyperfine --warmup 3 'rg TODO src/'       # 워밍업
hyperfine --runs 20 'rg TODO src/'        # 횟수 지정
hyperfine 'grep -R TODO src/' 'rg TODO src/' # 비교
```

## 옵션의 역할

| 옵션 | 의미 |
|---|---|
| `--warmup N` | 캐시·초기화 영향을 줄이기 위한 측정 전 실행 |
| `--runs N` | 반복 측정 횟수 |
| `--prepare CMD` | 벤치마크 실행 전 준비 명령 |
| `--export-json FILE` | 결과를 구조화된 데이터로 저장 |

`--prepare`는 각 측정 실행 전에 준비 작업을 수행할 수 있다. 파일 시스템 캐시·CPU 부하·명령 출력·프로세스 시작 비용은 결과에 영향을 준다.

## 비교할 때 주의할 점

```text
같은 입력 / 같은 결과 / 같은 환경
                │
           반복 측정
                │
        분산을 함께 해석
```

두 명령이 **동일한 결과를 만드는지** 먼저 확인한다. 예를 들어 `grep -R`과 `rg`는 ignore·숨김 파일·바이너리 처리 기본값이 달라 같은 작업을 측정하지 않을 수 있다. 작은 시간 차이를 성능 우위로 단정하지 않는다.

공식 문서: [hyperfine 저장소](https://github.com/sharkdp/hyperfine) · `hyperfine --help`
