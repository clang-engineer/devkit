# 도구별 플러그인·확장 생태계 사례

> **Core → Extension Point → 확장 프로젝트 → Manager / Configuration / Discovery**를 비교한다. 모든 도구가 모든 영역을 갖추는 것은 아니다. 프로젝트의 역할은 버전과 생태계 변화에 따라 달라질 수 있다.

## 1. 비교 지도

| Core | 확장 경계 | 대표 확장 | 관리·설정 | 발견 |
|---|---|---|---|---|
| [Neovim](https://neovim.io/) | Lua API, 이벤트, RPC | [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter), [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim) | [lazy.nvim](https://github.com/folke/lazy.nvim) (Manager), [LazyVim](https://www.lazyvim.org/) (Distro), [kickstart.nvim](https://github.com/nvim-lua/kickstart.nvim) (Starter) | [awesome-neovim](https://github.com/rockerBOO/awesome-neovim) |
| [tmux](https://github.com/tmux/tmux) | 명령·Hook·스크립트 | [tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect), [tmux-continuum](https://github.com/tmux-plugins/tmux-continuum) | [TPM](https://github.com/tmux-plugins/tpm) (Manager), [Oh My Tmux](https://github.com/gpakosz/.tmux) (Configuration) | [awesome-tmux](https://github.com/rothgar/awesome-tmux) |
| [Yazi](https://yazi-rs.github.io/) | Lua Plugin, Flavor | [yazi plugins](https://yazi-rs.github.io/docs/plugins/overview) | [ya pkg](https://yazi-rs.github.io/docs/cli#pm) | [awesome-yazi](https://github.com/AnirudhG07/awesome-yazi) |
| [Zsh](https://zsh.sourceforge.io/) | 셸 함수·Hook·ZLE | [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions), [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) | [Oh My Zsh](https://ohmyz.sh/) (Framework), [Antidote](https://github.com/mattmc3/antidote) (Manager) | [awesome-zsh-plugins](https://github.com/unixorn/awesome-zsh-plugins) |
| [Fish](https://fishshell.com/) | 함수·이벤트·설정 | [fzf.fish](https://github.com/PatrickF1/fzf.fish) | [Fisher](https://github.com/jorgebucaran/fisher) (Manager), [Oh My Fish](https://github.com/oh-my-fish/oh-my-fish) (Framework) | 프로젝트별 커뮤니티 목록 |
| [OpenCode](https://opencode.ai/docs/plugins/) | Plugin API·Agent·Skill | [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) (구성·확장 프로젝트) | 공식 플러그인 로딩 방식 확인 | 공식 문서·커뮤니티 |
| [Pi](https://github.com/badlogic/pi-mono) | TypeScript Extension | 커뮤니티 Extension | 공식 Extension·Package 방식 확인 | 프로젝트 문서·커뮤니티 |
| [Harlequin](https://harlequin.sh/) | Database Adapter | DB별 Adapter 패키지 | Python 패키지 설치 | 공식 Adapter 문서 |
| [Television](https://github.com/alexpasmantier/television) | Channel·Action | 커스텀 Channel | 구성 파일 | 공식 문서·커뮤니티 |

**주의:** tmux의 플러그인은 스크립트·설정 관례를 활용하며, Neovim이나 Yazi의 확장 API와 동일한 로딩 모델은 아니다. Fish의 함수 확장도 호스트 플러그인 API와 구분해서 이해한다. Harlequin의 Adapter와 Television의 Channel은 범용 UI 플러그인과 다른 확장 단위다.

## 2. 세 도구의 관계 구조

```text
Neovim
  ├─ Core API / Event / RPC
  ├─ Plugins       telescope.nvim / nvim-treesitter
  ├─ Manager       lazy.nvim
  ├─ Starter       kickstart.nvim
  ├─ Distribution  LazyVim
  └─ Discovery     awesome-neovim

tmux
  ├─ Core Commands / Hooks / Scripts
  ├─ Plugins       tmux-resurrect / tmux-continuum
  ├─ Manager       TPM
  ├─ Configuration Oh My Tmux
  └─ Discovery     awesome-tmux

Yazi
  ├─ Core Plugin API / Flavor
  ├─ Extensions    Lua Plugins
  ├─ Manager       ya pkg
  └─ Discovery     awesome-yazi
```

## 3. 도구를 새로 발견했을 때

1. **Core:** 기본 기능과 공식 확장 경계 확인
2. **Extension:** 독립 플러그인·어댑터·스크립트의 실제 사례 확인
3. **Manager:** 설치·업데이트·로드 기능이 내장인지 외부 프로젝트인지 확인
4. **Configuration:** Oh My, Starter, Distro 등의 역할 확인
5. **Discovery:** Awesome·Registry·공식 목록으로 확장 후보 탐색

**프로젝트가 존재한다는 사실과 지금도 호환·유지보수된다는 사실은 다르다.** 사용 전 릴리스·문서·지원 버전을 확인한다.

## 관련 문서

- [확장 가능한 코어 설계](extensible-core-design.md)
- [개발자 도구 확장 생태계 탐색 지도](tool-ecosystem.md)
