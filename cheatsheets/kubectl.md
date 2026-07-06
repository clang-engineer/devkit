# kubectl Cheatsheet

> Kubernetes 클러스터 CLI. 조회·로그·디버깅·배포·롤백 한 곳에. 컨텍스트/네임스페이스 함정 포함.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 클러스터 정보 | `kubectl cluster-info` |
| 현재 컨텍스트·네임스페이스 | `kubectl config get-contexts` (현재는 `*`) |
| 파드 목록 | `kubectl get pods` (전체 네임스페이스: `-A`) |
| 더 자세히 (노드·IP 포함) | `kubectl get pods -o wide` |
| 파드 상세 (이벤트 포함) | `kubectl describe pod <name>` |
| 실시간 로그 | `kubectl logs -f <pod>` (이전 컨테이너: `--previous`) |
| 컨테이너 안 들어가기 | `kubectl exec -it <pod> -- bash` |
| 로컬 → 파드 포트 포워딩 | `kubectl port-forward <pod> 8080:80` |
| 적용·삭제 | `kubectl apply -f deploy.yml` / `kubectl delete -f deploy.yml` |
| 롤백 | `kubectl rollout undo deployment/<name>` |
| 리소스 사용량 | `kubectl top pod` / `kubectl top node` (metrics-server 필요) |

## 설정 / 컨텍스트

```bash
# kubeconfig 위치 (기본: ~/.kube/config)
echo $KUBECONFIG

# 컨텍스트(=클러스터+사용자+네임스페이스 조합)
kubectl config get-contexts
kubectl config use-context my-cluster
kubectl config current-context

# 기본 네임스페이스 변경 (매번 -n 안 붙이게)
kubectl config set-context --current --namespace=mynamespace

# 다중 kubeconfig 병합
export KUBECONFIG=~/.kube/config:~/.kube/other-config
kubectl config view --flatten > ~/.kube/merged-config
```

> 컨텍스트 잘못 잡으면 운영을 개발인 줄 알고 건드린다. 위험 명령 전엔 `kubectl config current-context` 한 번.

## 리소스 조회 (`get`)

```bash
kubectl get pods                              # 현재 네임스페이스
kubectl get pods -A                           # 모든 네임스페이스
kubectl get pods -n kube-system               # 특정 네임스페이스
kubectl get pods -o wide                      # IP·노드까지
kubectl get pods -o yaml                      # 풀 YAML
kubectl get pods -o json | jq '.items[].metadata.name'
kubectl get pods --watch                      # 변화 추적 (-w)
kubectl get pods -l app=nginx                 # 라벨 필터
kubectl get pods --field-selector status.phase=Running

# 여러 리소스 한 번에
kubectl get pods,svc,deploy -n mynamespace

# 약어로
kubectl get po                                # pods
kubectl get svc                               # services
kubectl get deploy                            # deployments
kubectl get ns                                # namespaces
kubectl get rs                                # replicasets
kubectl get sts                               # statefulsets
kubectl get ds                                # daemonsets
kubectl get cm                                # configmaps
kubectl get pvc                               # persistentvolumeclaims
kubectl get ing                               # ingresses
kubectl get sa                                # serviceaccounts
kubectl get crd                               # customresourcedefinitions

# 전체 약어 보기
kubectl api-resources
```

## 디버깅 (`describe` / `logs` / `events`)

```bash
# describe — 이벤트와 함께 상세
kubectl describe pod <name>
kubectl describe node <name>

# 이벤트만 (최근 순)
kubectl get events --sort-by='.lastTimestamp'
kubectl get events -n mynamespace --watch

# 로그
kubectl logs <pod>                            # 마지막 로그
kubectl logs -f <pod>                         # follow
kubectl logs <pod> -c <container>             # 멀티 컨테이너 중 하나
kubectl logs <pod> --previous                 # 직전 컨테이너 (crash 후 분석)
kubectl logs <pod> --since=1h                 # 1시간 이내
kubectl logs <pod> --tail=100
kubectl logs -l app=nginx --all-containers    # 라벨로 묶어서

# 파드 안 들어가서 셸
kubectl exec -it <pod> -- bash                # 또는 sh
kubectl exec -it <pod> -c <container> -- sh
kubectl exec <pod> -- env                     # 명령만 (인터랙티브 X)

# 파드 안에 임시 도구 컨테이너 띄우기 (디버깅용)
kubectl debug <pod> -it --image=busybox --target=<container>
```

## 포트 포워딩 / 프록시 / 복사

```bash
# 로컬 8080 → 파드 80
kubectl port-forward <pod> 8080:80

# 서비스 단위
kubectl port-forward svc/myservice 8080:80

# 모든 인터페이스 바인딩
kubectl port-forward --address 0.0.0.0 svc/x 8080:80

# API 서버 프록시 (대시보드 같은 거)
kubectl proxy --port=8001

# 파드 ↔ 로컬 파일 복사
kubectl cp ./local.txt <pod>:/tmp/remote.txt
kubectl cp <pod>:/var/log/app.log ./app.log
kubectl cp -c <container> ./local.txt <pod>:/tmp/
```

## 배포 / 변경 (`apply` / `patch` / `edit`)

```bash
# 매니페스트 적용 (선언적)
kubectl apply -f deploy.yml
kubectl apply -f ./manifests/                 # 디렉터리
kubectl apply -k ./kustomization/             # Kustomize
kubectl apply --dry-run=client -f x.yml -o yaml  # 검증만

# 부분 패치
kubectl patch deploy myapp -p '{"spec":{"replicas":3}}'
kubectl patch deploy myapp --type=json \
  -p '[{"op":"replace","path":"/spec/replicas","value":5}]'

# 라이브 편집 ($EDITOR 열림 → 저장 시 적용)
kubectl edit deploy myapp

# 이미지만 빠르게 교체
kubectl set image deploy/myapp myapp=myimage:1.2.3

# 스케일
kubectl scale deploy myapp --replicas=5

# 환경변수 추가/변경
kubectl set env deploy/myapp LOG_LEVEL=debug
```

## 롤아웃 / 롤백

```bash
kubectl rollout status deploy/myapp           # 진행 상태
kubectl rollout history deploy/myapp          # 리비전 목록
kubectl rollout history deploy/myapp --revision=3
kubectl rollout undo deploy/myapp             # 직전으로
kubectl rollout undo deploy/myapp --to-revision=3
kubectl rollout restart deploy/myapp          # 파드 순차 재생성 (no image change)
kubectl rollout pause deploy/myapp            # 임시 정지
kubectl rollout resume deploy/myapp
```

## 삭제

```bash
kubectl delete pod <name>
kubectl delete -f deploy.yml
kubectl delete pod <name> --grace-period=0 --force   # 즉시 강제
kubectl delete pods -l app=nginx                     # 라벨 일괄
kubectl delete pod --field-selector status.phase=Failed
kubectl delete ns mynamespace                        # 네임스페이스 통째 (안 사라지면 finalizer 확인)
```

> `kubectl delete pod <name>` 만으로는 deployment의 ReplicaSet이 새로 만든다. 정말 멈추려면 `kubectl scale deploy <name> --replicas=0` 또는 deployment 자체 삭제.

## 임시 실행 (`run`)

```bash
# 일회용 파드 — 네트워크/DNS 디버그
kubectl run -it --rm debug --image=busybox -- sh
# 안에서 nslookup myservice / wget -qO- http://myservice 등
```

## 리소스 사용량 (`top`)

```bash
kubectl top node
kubectl top pod
kubectl top pod -A --sort-by=memory
kubectl top pod -l app=nginx --containers
```

> `error: Metrics API not available` → 클러스터에 `metrics-server` 미설치.

## 매니페스트 다루기

```bash
# 살아있는 리소스의 YAML 추출 (서버사이드 필드 제외하려면)
kubectl get deploy myapp -o yaml > myapp.yml

# explain — 필드 의미 보기 (yaml 만들 때 가장 유용)
kubectl explain pod.spec
kubectl explain pod.spec.containers
kubectl explain deploy --recursive

# 검증
kubectl apply --dry-run=server -f x.yml          # 서버에 보내서 검증만
kubectl diff -f deploy.yml                       # 적용 시 변경 비교
```

## JSONPath / `-o custom-columns`

```bash
# 모든 파드 이름
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# 커스텀 컬럼 (JSONPath보다 가독성 좋음)
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName
```

## 자주 마주치는 함정

| 증상 | 원인 / 해결 |
|---|---|
| `Pending` 상태 | 노드 부족·스케줄 제약. `describe pod` 의 Events 확인 |
| `ImagePullBackOff` | 이미지명·태그 오타, private 레지스트리 인증 (`imagePullSecrets`) |
| `CrashLoopBackOff` | 컨테이너가 즉시 죽음. `logs --previous`로 직전 출력 확인 |
| `OOMKilled` | 메모리 limit 초과. `describe pod`의 Last State |
| 파드는 Running인데 트래픽 안 옴 | Service selector ↔ Pod label 불일치. `describe svc`의 Endpoints가 비어있는지 |
| `kubectl exec` 안 됨 | 컨테이너에 셸 없음. `--image`로 ephemeral debug 컨테이너 |
| 네임스페이스 삭제 안 됨 | finalizer 걸려있음. `kubectl get ns x -o yaml` 확인 후 finalizer 제거 |

## 별칭 / 통합

```bash
# 권장 셸 alias
alias k=kubectl
complete -F __start_kubectl k     # bash 자동완성 전파
# zsh: source <(kubectl completion zsh)

# 컨텍스트·네임스페이스 빠른 전환
brew install kubectx              # kubectx, kubens 제공
kubectx my-cluster
kubens mynamespace

# 프롬프트에 현재 컨텍스트 표시
brew install kube-ps1
```

## 참고

- 공식 reference: https://kubernetes.io/docs/reference/kubectl/
- `kubectl <command> --help` 가 가장 정확
- 매니페스트 작성 시 `kubectl explain` 적극 활용
- 클러스터 깊은 진단: `k9s` (TUI), `stern` (다중 파드 로그)
