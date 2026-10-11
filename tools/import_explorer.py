"""One-time, checksum-guarded import. Does not modify either source catalog."""
from pathlib import Path
import hashlib
import json
import sys

source = Path(sys.argv[1]).resolve()
root = Path.cwd()
assert not (root / 'src/index.js').exists(), 'Shared explorer already exists; refusing to overwrite it'
expected = {
    'assets/js/devkit.js': '34d8b2dc6565722b15d0f385328fa3c676e27724',
    'assets/js/devkit-model.js': 'f281662baddeec96c219f78571ca5501a13b63a6',
    'assets/js/reference-data.js': 'a0e3786132cd5acaec176d67fd8a613dc71ccfa9',
    'assets/css/devkit.css': '2c2a61c66168875e90a2593a3a54dd86a16fa634',
    '.github/tests/devkit.test.cjs': '4e4c18e7512039366f5d7ac0e04424dca0c7c781',
}

def read(path):
    data = (source / path).read_bytes()
    if path in expected:
        actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        assert actual == expected[path], f'Unexpected source version: {path}: {actual}'
    return data.decode('utf-8')

preserved = {str(p): hashlib.sha256(p.read_bytes()).hexdigest()
             for p in Path('reference').rglob('*') if p.is_file()}

def write(path, text):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')

def replace_once(text, before, after):
    assert text.count(before) == 1, f'Expected one occurrence of {before[:70]!r}'
    return text.replace(before, after, 1)

model = read('assets/js/devkit-model.js')
layout_start = model.index('// Deterministic component layout:')
tldr_start = model.index('export function tldrPaths(')
hash_start = model.index('export function readHash(')
write('src/core/catalog.js', model[:layout_start] + model[hash_start:])
write('src/graph/layout.js', model[layout_start:tldr_start])
write('src/integrations/tldr.js', model[tldr_start:hash_start])
write('src/core/reference-data.js', read('assets/js/reference-data.js'))
ui = read('assets/js/devkit.js')
ui = replace_once(ui, "import { escapeHtml as esc, fetchCatalog } from './reference-data.js';", "import { escapeHtml as esc, fetchCatalog } from '../core/reference-data.js';")
ui = replace_once(ui, "import { RELATIONS, buildModel, filterModel, layoutCategory, parseTldr, readHash, safeUrl, tldrPaths, validateCatalog } from './devkit-model.js';", "import { RELATIONS, buildModel, filterModel, readHash, safeUrl, validateCatalog } from '../core/catalog.js';\nimport { layoutCategory } from '../graph/layout.js';\nimport { parseTldr, tldrPaths } from '../integrations/tldr.js';")
ui = replace_once(ui, "const root = document.querySelector('[data-devkit]');\nif (root) mount(root);\n\nfunction mount(root) {", "export function mount(root) {\n  if (!root || root.dataset.devkitMounted === 'true') return;\n  root.dataset.devkitMounted = 'true';")
write('src/ui/explorer.js', ui)
write('src/index.js', "import { mount } from './ui/explorer.js';\nexport { mount };\nconst root = document.querySelector('[data-devkit]');\nif (root) mount(root);\n")
css = read('assets/css/devkit.css')
css = replace_once(css, "/* Only explorer pages reclaim the blog's unrelated recent-posts side panel. */\nbody:has(.dk-app) #panel-wrapper { display: none !important; }\nbody:has(.dk-app) main { max-width: 100%; flex: 1 1 100%; }\n", '')
write('src/styles/explorer.css', css)

# Test the shared modules. The VM fixture still executes the real UI code.
model_test = read('.github/tests/devkit.test.cjs')
model_test = replace_once(model_test, "const source = fs.readFileSync(path.join(__dirname, '../../assets/js/devkit-model.js'), 'utf8');", "const source = ['core/catalog.js', 'graph/layout.js', 'integrations/tldr.js'].map(file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')).join('\\n');")
write('tests/model.test.cjs', model_test)
ui_test = read('tools/reference-ui.test.cjs')
ui_test = replace_once(ui_test, "require('../.github/tests/devkit.test.cjs');", "require('./model.test.cjs');")
ui_test = replace_once(ui_test, "const source = name => readFileSync(resolve(base, 'assets/js', name), 'utf8');", "const source = name => readFileSync(resolve(base, 'src', name), 'utf8');")
start = ui_test.index('const bundle = ')
end = ui_test.index('const remote = ', start)
ui_test = ui_test[:start] + "const bundle = ['core/reference-data.js', 'core/catalog.js', 'graph/layout.js', 'integrations/tldr.js'].map(file => source(file).replace(/^export /gm, '')).join('\\n') + '\\nconst esc = escapeHtml;\\n' + source('ui/explorer.js').replace(/^import .*;\\n/gm, '').replace(/^export /gm, '') + \n  '\\nconst root = document.querySelector(\\'[data-devkit]\\'); if (root) mount(root);';\n" + ui_test[end:]
write('tests/ui.test.cjs', ui_test)
write('cmdtreemap/web/app.test.cjs', "// Shared explorer contracts replace assertions tied to the retired tree renderer.\nrequire('../../tests/ui.test.cjs');\nrequire('../../tests/resources.test.cjs');\n")
# Compatibility endpoints keep working without owning renderer code.
write('cmdtreemap/web/app.js', "const root = document.querySelector('#cmdtreemap-root');\nif (root) {\n  root.dataset.devkit = '';\n  root.dataset.catalog = root.dataset.source || '../../reference/cli/catalog.json';\n  root.dataset.cheatsheets = '../../reference/cheatsheets/catalog.json';\n}\nawait import('../../src/index.js');\n")
write('cmdtreemap/web/app.css', "/* Compatibility URL. Shared CSS lives in src/styles/. */\n@import url('../../src/styles/explorer.css');\n")

html = '''<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Devkit · 도구 탐색기</title>
  <link rel="stylesheet" href="{prefix}src/styles/explorer.css">
  <style>body {{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#f8fafc;color:#213047;}} main {{max-width:1500px;margin:auto;}} @media(max-width:850px){{body{{padding:12px}}}}</style>
</head>
<body><main>
  <h1>Devkit</h1>
  <section data-devkit data-catalog="{prefix}reference/cli/catalog.json" data-cheatsheets="{prefix}reference/cheatsheets/catalog.json" aria-label="Devkit 도구 탐색"><p>데이터를 불러오는 중...</p></section>
  <noscript><p>JavaScript가 필요합니다. <a href="https://github.com/clang-engineer/devkit/tree/main/reference/cheatsheets">치트시트 원본</a></p></noscript>
</main><script type="module" src="{prefix}src/index.js"></script></body></html>
'''
write('web/index.html', html.format(prefix='../'))
write('cmdtreemap/web/index.html', html.format(prefix='../../'))
files = sorted(str(p.relative_to('src')) for p in Path('src').rglob('*') if p.is_file())
write('src/manifest.json', json.dumps({'api_version': 1, 'entry': 'index.js', 'style': 'styles/explorer.css', 'files': files}, indent=2) + '\n')
write('Makefile', '.PHONY: web test\nPORT ?= 8080\nweb:\n\tpython3 -m http.server $(PORT) --bind 127.0.0.1\ntest:\n\t$(MAKE) -C cmdtreemap test\n')

readme = Path('README.md').read_text()
intro = '''
## Shared explorer

도구 데이터와 웹 UI의 원본은 이 저장소가 소유한다. 블로그는 빌드할 때
이 저장소의 `src/manifest.json`에 명시된 파일을 가져와 정적 자산으로 배포한다.
블로그에 두 번째 렌더러나 수동 동기화용 복사본을 두지 않는다.
데이터는 지금처럼 브라우저에서 Devkit 원본 JSON을 직접 읽는다.

```text
reference/cli/catalog.json         관계·명령 데이터 (기존 경로 유지)
reference/cheatsheets/catalog.json  치트시트 목록·문서 링크
reference/cheatsheets/*.md          긴 문서 원본
src/core/                         로딩·검증·공통 도구 ID·검색
src/graph/                        관계도 배치
src/integrations/                 tldr 페이지·예시 처리
src/ui/                           탐색·상세 패널
src/styles/                       블로그 테마와 독립적인 UI 스타일
web/                              독립 웹 진입점
cmdtreemap/                       Go TUI (데이터 계약 유지)
tests/                            공통 UI·데이터 보존 테스트
```

`make web` 후 `/web/`을 연다. 기존 `/cmdtreemap/web/`도 같은 UI를 사용한다.
`make test`는 Go 테스트와 공통 웹 테스트를 실행한다. 새 필드를 추가하기 전에는
공통 도구 모델과 두 기존 카탈로그의 호환성을 먼저 확인한다.

현재 두 JSON은 **기능별 원본을 유지**한다. 공통 모델에서 도구 ID로 연결하며,
모든 필드를 단일 JSON으로 물리적으로 이전한 상태는 아니다. 기존 CLI, 문서 링크,
외부 소비자와의 호환성을 유지한 채 단계적으로 정리한다.

'''
readme = replace_once(readme, '## Cheatsheets\n', intro + '## Cheatsheets\n')
write('README.md', readme)
# Supersede obsolete UI ownership sections, preserving CLI instructions.
readme = Path('cmdtreemap/README.md').read_text()
a = readme.index('## 디렉터리 구조')
b = readme.index('## CLI 실행', a)
readme = readme[:a] + '''## 구조와 소유권

Go 모델과 터미널 UI는 `internal/`에서 관리한다. 웹 화면은 저장소 루트의
`src/`를 독립 웹과 블로그가 함께 사용한다. `web/`의 이전 자산 주소는
공통 UI로 이어지는 호환 진입점이며, 별도 렌더러를 유지하지 않는다.

CLI·웹 데이터 원본은 `../reference/cli/catalog.json`이다. Go 내장용
`catalog.json`은 `go generate` 또는 `make prepare`로 생성한다.
치트시트와 문서 링크는 `../reference/cheatsheets/catalog.json`에서 연결한다.
전체 디렉터리와 개발 방법은 [저장소 README](../README.md)를 참고한다.

''' + readme[b:]
a = readme.index('## Web 개발 실행')
b = readme.index('## 블로그 연결', a)
readme = readme[:a] + '''## Web 개발 실행

```bash
make web
# http://localhost:8080/cmdtreemap/web/
```

저장소 루트에서는 `make web`으로 `/web/`을 열 수도 있다. 두 페이지가
같은 `src/index.js`와 스타일을 사용하며, 별도 프레임워크 빌드는 필요 없다.
지도·검색·확대·축소·상세 패널·tldr·전체 치트시트 링크를 제공한다.
연결선은 정의된 관계이며 출시 순서나 학습 순서가 아니다.

''' + readme[b:]
readme = readme.replace('두 화면은 각자 독립된 카탈로그를 읽는다.', '공통 UI는 두 카탈로그를 하나의 도구 모델로 연결한다. UI 코드는 Devkit에서 관리하며 블로그 빌드가 동일한 소스를 가져간다.')
readme = readme.replace('블로그는 자체 화면과 검색을 유지하며 데이터만 가져간다.', '블로그는 공통 UI를 재사용하고 데이터는 원본에서 직접 읽는다.')
write('cmdtreemap/README.md', readme)

assert preserved == {str(p): hashlib.sha256(p.read_bytes()).hexdigest()
                     for p in Path('reference').rglob('*') if p.is_file()}, 'Reference resource changed'
print(json.dumps({'preserved_reference_files': len(preserved), 'runtime_files': files,
                  'source_commit': '28bb1f6f8ea9a64a9e4a4378a29b4b4dbef1267b'}, ensure_ascii=False, indent=2))
