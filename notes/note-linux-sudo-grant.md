---
layout: notes
title: "Linux에서 사용자에게 sudo 권한 부여하기"
date: 2026-05-22
categories: [linux]
tags: [sudo, sudoers, usermod, wheel, visudo]
---

sudo는 `/etc/sudoers`에 적힌 규칙을 읽어 "누가 무엇을 어떤 권한으로 실행할 수 있는지" 판단한다. 권한 부여는 두 갈래 — 관리 그룹(sudo/wheel)에 사용자를 넣거나, sudoers에 규칙을 직접 명시하는 것.

## 왜 그룹만 추가하면 sudo가 되는가

배포판은 기본 sudoers에 "특정 그룹은 모든 명령 실행 가능"이라는 규칙을 미리 넣어둔다. 그래서 그 그룹에 사용자를 끼워 넣기만 하면 개별 규칙을 손대지 않아도 sudo가 열린다. 그룹 이름은 배포판마다 다르다 — Debian/Ubuntu는 `sudo`, RHEL/CentOS/Rocky/Alma 계열은 `wheel`.

```bash
# Debian/Ubuntu 계열
sudo usermod -aG sudo username

# RHEL 계열
sudo usermod -aG wheel username
```

`-aG`의 `-a`(append)를 빼면 기존 소속 그룹이 날아가니 항상 붙인다. 그룹 변경은 세션이 새로 시작될 때 반영되므로 해당 사용자는 재로그인해야 한다.

## sudoers에 직접 명시하기

세밀한 제어가 필요하면 규칙을 직접 쓴다. 편집은 반드시 `visudo`로 — 저장 시점에 문법을 검사해 잘못된 파일로 sudo 전체가 잠기는 사고를 막아준다.

```bash
sudo visudo
```

```
# 모든 권한 부여
username    ALL=(ALL:ALL) ALL

# 비밀번호 없이 허용
username    ALL=(ALL:ALL) NOPASSWD: ALL
```

## 그룹 추가 vs 직접 명시

- **usermod -aG**: 배포판이 깔아둔 "전체 sudo" 규칙에 얹는 방식. 간단하지만 사실상 root 전권.
- **visudo 직접 명시**: 특정 명령만 허용하는 최소 권한이 가능. 서버 운영 환경에서는 `ALL`보다 필요한 명령만 나열하는 편이 보안상 바람직하다.

`/etc/sudoers`를 직접 고치기보다 `/etc/sudoers.d/` 아래 별도 파일로 두면 관리·롤백이 쉽다.

```bash
sudo visudo -f /etc/sudoers.d/username
```

```
username    ALL=(ALL) /usr/bin/systemctl restart nginx, /usr/bin/firewall-cmd
```

`sudoers.d` 파일은 권한이 `0440`이어야 하고, 파일명에 마침표(`.`)나 `~`가 들어가면 무시된다.

## 확인

```bash
sudo -l -U username
```

해당 사용자가 실제로 어떤 권한을 갖는지 보여준다.
