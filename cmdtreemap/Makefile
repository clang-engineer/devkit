.PHONY: prepare web cli test

PORT ?= 8080

prepare:
	node scripts/prepare.cjs

web:
	$(MAKE) -C .. web PORT=$(PORT)

cli: prepare
	go run .

test: prepare
	go test ./...

