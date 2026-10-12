.PHONY: cli test test-web test-cli
PORT ?= 8080


cli:
	$(MAKE) -C cmdtreemap cli

test: test-web test-cli

test-web:
	node --test tests/*.test.cjs

test-cli:
	$(MAKE) -C cmdtreemap test
