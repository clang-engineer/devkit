.PHONY: web cli test test-web test-cli
PORT ?= 8080

web:
	@echo "http://localhost:$(PORT)/web/"
	python3 -m http.server $(PORT) --bind 127.0.0.1

cli:
	$(MAKE) -C cmdtreemap cli

test: test-web test-cli

test-web:
	node --test tests/*.test.cjs

test-cli:
	$(MAKE) -C cmdtreemap test
