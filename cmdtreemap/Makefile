.PHONY: prepare web cli test

PORT ?= 8080

prepare:
	cp ../reference/cli/catalog.json catalog.json

web:
	$(MAKE) -C .. web PORT=$(PORT)

cli: prepare
	go run .

test: prepare
	go test ./...

