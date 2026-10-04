.PHONY: prepare web cli test

PORT ?= 8080

prepare:
	cp ../reference/cli/catalog.json catalog.json

web:
	@echo "http://localhost:$(PORT)/cmdtreemap/web/"
	python3 -m http.server $(PORT) --bind 127.0.0.1 --directory ..

cli: prepare
	go run .

test: prepare
	go test ./...
	node --test web/*.test.cjs scripts/*.test.cjs

