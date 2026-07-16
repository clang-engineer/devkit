# 압축/해제 Cheatsheet

> tar / gzip / zip / xz / bzip2 / 7z. 매번 헷갈리는 플래그(`-c` 만들기, `-x` 풀기) 한 곳에.

## 30초만 본다면

| 상황 | 명령 |
|---|---|
| 디렉터리 → tar.gz | `tar -czf out.tar.gz dir/` |
| tar.gz 풀기 | `tar -xzf in.tar.gz` |
| 특정 경로에 풀기 | `tar -xzf in.tar.gz -C /target` |
| 내용 확인 (안 풀고) | `tar -tzf in.tar.gz` |
| zip 만들기 (재귀) | `zip -r out.zip dir/` |
| zip 풀기 | `unzip in.zip` (`-d /target` 옵션) |
| 한 파일 압축 (gzip) | `gzip -k file` (`-k` 원본 유지) |
| gz 내용 보기 | `zcat file.gz` / `zless file.gz` / `zgrep "x" file.gz` |
| 최고 압축률 | `tar -cJf out.tar.xz dir/` (xz) |
| 외부 호환 (Windows) | `zip` |

## tar

```bash
# 압축 (tar.gz)
tar -czf archive.tar.gz dir/

# 해제
tar -xzf archive.tar.gz

# 특정 디렉토리에 해제
tar -xzf archive.tar.gz -C /target/dir/

# 내용 확인 (해제 없이)
tar -tzf archive.tar.gz

# tar.bz2 압축/해제
tar -cjf archive.tar.bz2 dir/
tar -xjf archive.tar.bz2

# tar.xz 압축/해제
tar -cJf archive.tar.xz dir/
tar -xJf archive.tar.xz

# 특정 파일만 해제
tar -xzf archive.tar.gz path/to/file

# 특정 패턴 제외
tar -czf archive.tar.gz --exclude='*.log' dir/

# 진행 상황 표시 (verbose)
tar -czvf archive.tar.gz dir/
tar -xzvf archive.tar.gz
```

### tar 플래그 요약

| 플래그 | 설명 |
|--------|------|
| `-c` | 생성 (create) |
| `-x` | 해제 (extract) |
| `-t` | 목록 (list) |
| `-z` | gzip 압축 |
| `-j` | bzip2 압축 |
| `-J` | xz 압축 |
| `-f` | 파일 지정 |
| `-v` | 상세 출력 |
| `-C` | 해제 디렉토리 지정 |

## gzip / gunzip

```bash
gzip -k file.txt           # 압축, 원본 유지 (-k 없으면 원본 삭제)
gunzip file.txt.gz         # 해제
zcat file.gz               # 안 풀고 내용 보기 (zless / zgrep 도 동일 계열)
```

## zip / unzip

```bash
zip -r archive.zip dir/    # 압축 (디렉토리는 -r 재귀)
unzip archive.zip          # 해제 (-d /target 으로 대상 지정)
unzip -l archive.zip       # 안 풀고 목록 보기
```

## xz / bzip2 / 7z

`-d` 로 해제, 압축률·속도 트레이드오프는 아래 [형식별 비교](#형식별-비교) 표 참조. 나머지 옵션은 각 도구 `--help`.

```bash
xz -dk file.txt.xz         # xz  해제 (원본 유지)
bzip2 -dk file.txt.bz2     # bzip2 해제 (원본 유지)
7z x archive.7z            # 7z  해제 (압축 a, 목록 l)
```

## 형식별 비교

| 형식 | 압축률 | 속도 | 비고 |
|------|--------|------|------|
| gzip (.gz) | 보통 | 빠름 | 가장 범용적 |
| bzip2 (.bz2) | 높음 | 느림 | gzip보다 압축률 좋음 |
| xz (.xz) | 최고 | 매우 느림 | 최고 압축률 |
| zip (.zip) | 보통 | 빠름 | Windows 호환 |
| 7z (.7z) | 높음 | 보통 | 다양한 알고리즘 지원 |
