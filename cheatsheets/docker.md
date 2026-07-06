# Docker Cheatsheet

> 컨테이너 + 이미지 + 네트워크/볼륨 + Compose. Docker Engine 20+ / Compose v2 (공백, `docker compose`) 기준.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 실행 중인 것 | `docker ps` (전체: `-a`) |
| 빠르게 띄우기 (포트·이름·자동삭제) | `docker run --rm -d -p 8080:80 --name nginx nginx` |
| 안으로 들어가기 | `docker exec -it <name> bash` |
| 로그 | `docker logs -f --tail=100 <name>` |
| 정지·삭제 | `docker rm -f <name>` |
| 이미지 빌드 | `docker build -t myapp .` |
| 디스크 정리 | `docker system prune -a` (이미지·캐시 회수, 볼륨은 `--volumes` 추가) |
| Compose 띄우기 | `docker compose up -d` |
| Compose 한 서비스 재시작 | `docker compose restart <svc>` |
| Compose 로그 | `docker compose logs -f <svc>` |

## 컨테이너 라이프사이클

```bash
docker ps                          # 실행 중
docker ps -a                       # 전체
docker run [opts] <image> [cmd]    # 새 컨테이너
docker start / stop / restart <c>  # 시작 / 정지 / 재시작
docker rm [-f] <c>                 # 삭제 (-f: 실행 중도)
docker stop $(docker ps -q)        # 전부 중지
docker rm -f $(docker ps -aq)      # 전부 강제 삭제
```

### `docker run` 주요 옵션

| 옵션 | 설명 |
|---|---|
| `-d` | 백그라운드 |
| `-it` | interactive + tty (쉘 진입 시 필수) |
| `--name <n>` | 컨테이너 이름 |
| `-p host:cont` | 포트 매핑 (`-p 8080:80`) |
| `-v host:cont[:ro]` | bind mount (절대경로) |
| `-v vol:cont` | named volume 마운트 |
| `-e KEY=VAL` / `--env-file .env` | 환경변수 |
| `--rm` | 종료 시 자동 삭제 |
| `--network <net>` | 네트워크 지정 |
| `--restart unless-stopped` | 재시작 정책 (`no`/`on-failure`/`always`/`unless-stopped`) |
| `-u <uid>` / `-w <path>` | 실행 사용자 / 작업 디렉토리 |

## 디버깅 & 모니터링

```bash
docker exec -it <c> bash               # 쉘 접속
docker exec -it -u root -w /app <c> sh # root + 작업 디렉토리 지정
docker logs -f <c>                     # follow
docker logs -f --tail 100 <c>          # 마지막 100줄부터 follow
docker logs --since 10m <c>            # 최근 10분
docker logs --timestamps <c>           # 타임스탬프 포함
docker stats [<c>...]                  # CPU/메모리 실시간
docker inspect <c>                     # 전체 메타데이터 (JSON)
docker inspect -f '{{.State.Status}}' <c>          # 필드만 추출
docker inspect -f '{{json .State.Health}}' <c> | jq  # 헬스체크 결과
docker cp <c>:/path/file ./local       # 컨테이너 → 호스트
docker cp ./local <c>:/path/file       # 호스트 → 컨테이너
```

## 이미지

```bash
docker images
docker pull <image>[:<tag>]
docker push <image>[:<tag>]
docker build -t myapp:latest .
docker build --no-cache -t myapp .         # 캐시 무시
docker build --target=<stage> -t myapp .   # multi-stage 일부만 빌드
docker tag <src> <dst>                     # 태그 추가
docker history <image>                     # 레이어 별 크기/명령
docker save <image> -o file.tar            # 이미지 → tar
docker load -i file.tar                    # tar → 이미지
docker commit <c> <image>                  # 컨테이너 → 이미지
docker rmi [-f] <image>
docker image prune       # dangling (태그 없는) 만 정리
docker image prune -a    # 미참조 이미지까지 정리
```

## 볼륨

```bash
docker volume ls
docker volume create <name>
docker volume inspect <name>     # 호스트 경로 확인
docker volume rm <name>
docker volume prune              # 미사용 정리
```

| 종류 | 사용 | 특징 |
|---|---|---|
| **bind mount** | `-v $(pwd):/app` | 호스트 경로 직접. 권한/SELinux 이슈 가능 |
| **named volume** | `-v mydata:/app` | docker가 관리. 호스트 OS 독립, 백업·이전 용이 |

## 네트워크

```bash
docker network ls
docker network create [--driver bridge] <name>
docker network inspect <name>
docker network connect <net> <c>     # 실행 중 컨테이너에 추가
docker network disconnect <net> <c>
docker network prune
```

| 드라이버 | 용도 |
|---|---|
| `bridge` (기본) | 컨테이너 간 격리된 가상 네트워크 |
| `host` | 호스트 네트워크 공유 (포트 매핑 불필요) |
| `none` | 네트워크 없음 |

## Docker Compose

```bash
docker compose up -d                  # 백그라운드 실행
docker compose up --build             # 이미지 재빌드 후 실행
docker compose up --force-recreate    # 컨테이너 재생성
docker compose down                   # 중지 + 삭제
docker compose down -v                # 볼륨까지 삭제
docker compose ps                     # 상태 확인
docker compose logs -f [<service>]
docker compose exec <service> bash
docker compose restart [<service>]
docker compose pull                   # 이미지 갱신
docker compose run --rm <s> <cmd>     # 일회성 실행
docker compose config                 # 최종 병합된 설정 출력
```

> `docker-compose`(하이픈) v1은 deprecated. `docker compose`(공백) v2 사용.

## 디스크 정리

```bash
docker system df                    # 사용량 확인
docker system prune                 # 정지된 컨테이너 + dangling 이미지 + 미사용 네트워크
docker system prune -a              # 위 + 미참조 이미지 모두
docker system prune -a --volumes    # 위 + 미사용 볼륨 (주의!)
```

## 자주 쓰는 조합

```bash
# 특정 이미지 기준으로 컨테이너 찾기
docker ps --filter ancestor=nginx

# Dockerfile 없이 빠른 인터랙티브 테스트
docker run --rm -it alpine sh

# 호스트 폴더를 컨테이너에 마운트하고 쉘 진입
docker run --rm -it -v $(pwd):/work -w /work alpine sh
```

## 폐쇄망(오프라인) 바이너리 설치

패키지 매니저 없이 정적 바이너리로 설치. 공식: [Docker — Binaries](https://docs.docker.com/engine/install/binaries/).

```sh
# 1) 바이너리 tarball 다운로드 (인터넷 PC 에서)
#    https://download.docker.com/linux/static/stable/<arch>/

# 2) 폐쇄망 PC 로 옮긴 뒤 압축 해제
tar xzvf docker-<version>.tgz

# 3) /usr/bin 으로 복사 (전역 실행)
sudo cp docker/* /usr/bin/

# 4) 데몬 실행
sudo dockerd &

# 5) 동작 확인
sudo docker run hello-world
```

systemd 운영용으로 `/etc/systemd/system/docker.service` 작성하면 부팅 자동 실행 가능.
