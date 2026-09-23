.PHONY: web cli test

PORT ?= 8080

web:
	@echo "http://localhost:$(PORT)/web/"
	python3 -m http.server $(PORT) --bind 127.0.0.1

cli:
	go run .

test:
	go test ./...
	node --test web/*.test.cjs scripts/*.test.cjs
