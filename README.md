# devkit

**Developer tool maps, cheatsheets, and reusable templates.**

Explore tools by purpose, discover their relationships, and find practical command references.

## Explore

- [Interactive Devkit](https://clang-engineer.github.io/devkit/)
- [Cheatsheets](reference/cheatsheets/README.md)
- [Tool ecosystem map](reference/tool-ecosystem.md)
- [Terminal explorer (cmdtreemap)](cmdtreemap/README.md)
- [Reusable templates](templates/README.md)

## How it works

```text
reference/catalog.json
    ├── reference-explorer (Web)
    └── cmdtreemap (Go TUI)
```

The catalog owns tool classifications, relationships, and document links. The web UI is maintained separately in [reference-explorer](https://github.com/clang-engineer/reference-explorer).

## Repository layout

| Path | Purpose |
|---|---|
| `reference/catalog.json` | Canonical tool taxonomy, relationships and document links |
| `reference/cheatsheets/` | Detailed command references |
| `cmdtreemap/` | Go terminal explorer |
| `templates/` | Reusable project and shell templates |

Run `make test` for catalog and Go tests, `make test-cli` for the TUI, and `make prepare` to refresh the embedded catalog.

## Contributing

- [Catalog and development guide](docs/catalog.md)
- [Cheatsheet writing guidelines](reference/CHEATSHEET_GUIDELINES.md)
