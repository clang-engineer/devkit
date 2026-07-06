#!/usr/bin/env python3
"""cheatsheets/_index.yml → README.md (+ 블로그 cheatsheet 탭) 생성.

사용법:
    python3 tools/gen-cheatsheet-readme.py
        README.md 생성 (블로그 레포가 인접해 있으면 탭도 함께 갱신)
    python3 tools/gen-cheatsheet-readme.py --check
        검증만 (생성 안 함)
"""
import argparse
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CHEAT = ROOT / "cheatsheets"
INDEX = CHEAT / "_index.yml"
README = CHEAT / "README.md"
BLOG_TAB = ROOT.parent / "clang-engineer.github.io" / "_tabs" / "cheatsheet.md"

BLOG_BLOB_BASE = "https://github.com/clang-engineer/devkit/blob/main/cheatsheets/"
BLOG_TREE_BASE = "https://github.com/clang-engineer/devkit/tree/main/"
BLOG_FRONTMATTER = """---
layout: page
icon: fas fa-book-open
order: 3
title: 치트시트
---"""
BLOG_INTRO = (
    "자주 쓰지만 매번 검색하게 되는 명령어·문법 모음. "
    "본문은 [devkit 레포](https://github.com/clang-engineer/devkit/tree/main/cheatsheets)에서 관리됩니다."
)


def rewrite_links_for_blog(text):
    """yml 안의 상대 링크를 블로그 절대 URL로 치환.

    - `(../X/)`         → `tree/main/X/`
    - `(file.md)` 또는 `(dir/file.md)` → `blob/main/cheatsheets/...`
    """
    text = re.sub(
        r'\(\.\.\/([^)]+)\)',
        lambda m: f'({BLOG_TREE_BASE}{m.group(1)})',
        text,
    )
    text = re.sub(
        r'\((?!https?://)([\w\-]+(?:\/[\w\-]+)*\.md)\)',
        lambda m: f'({BLOG_BLOB_BASE}{m.group(1)})',
        text,
    )
    return text


def _render_groups(data, link_base, transform_text):
    lines = []
    for group in data["groups"]:
        lines += [f"## {group['title']}", ""]
        lines += ["| 파일 | 설명 |", "|------|------|"]
        for item in group["items"]:
            href = f"{link_base}{item['file']}"
            lines.append(f"| [{item['file']}]({href}) | {item['desc']} |")
        lines.append("")
        if group.get("note"):
            lines += [transform_text(group["note"]), ""]
    return lines


def render_readme(data):
    lines = ["# Cheatsheets", ""]
    if data.get("intro"):
        lines += [data["intro"], ""]
    lines += _render_groups(data, link_base="", transform_text=lambda s: s)
    return "\n".join(lines).rstrip() + "\n"


def render_blog_tab(data):
    lines = BLOG_FRONTMATTER.splitlines() + ["", BLOG_INTRO, ""]
    lines += _render_groups(
        data,
        link_base=BLOG_BLOB_BASE,
        transform_text=rewrite_links_for_blog,
    )
    return "\n".join(lines).rstrip() + "\n"


def collect_yml_files(data):
    return {item["file"] for group in data["groups"] for item in group["items"]}


def collect_actual_files():
    return {p.name for p in CHEAT.glob("*.md") if p.name != "README.md"}


def check(data):
    in_yml = collect_yml_files(data)
    actual = collect_actual_files()
    yml_only = in_yml - actual
    actual_only = actual - in_yml
    problems = 0
    if yml_only:
        problems += len(yml_only)
        print("yml에만 있음 (실제 파일 없음):")
        for name in sorted(yml_only):
            print(f"  - {name}")
    if actual_only:
        problems += len(actual_only)
        print("파일만 있음 (yml에 누락):")
        for name in sorted(actual_only):
            print(f"  + {name}")
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="검증만 (생성 안 함)")
    args = parser.parse_args()

    data = yaml.safe_load(INDEX.read_text())
    problems = check(data)

    if args.check:
        if not problems:
            print("OK — yml과 실제 파일 일치")
        sys.exit(1 if problems else 0)

    README.write_text(render_readme(data))
    print(f"생성: {README.relative_to(ROOT)}")

    if BLOG_TAB.parent.exists():
        BLOG_TAB.write_text(render_blog_tab(data))
        print(f"생성: {BLOG_TAB}")
    else:
        print(f"건너뜀: 블로그 레포 없음 ({BLOG_TAB.parent})")

    if problems:
        print(f"\n경고: yml과 실제 파일 차이 {problems}건 (위 참조)")


if __name__ == "__main__":
    main()
