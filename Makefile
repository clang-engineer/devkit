.PHONY: prepare cli test test-reference test-cli

cli:
	$(MAKE) -C cmdtreemap cli

prepare:
	$(MAKE) -C cmdtreemap prepare

test: test-reference test-cli

test-reference: prepare
	node --test tests/*.test.cjs

test-cli:
	$(MAKE) -C cmdtreemap test
