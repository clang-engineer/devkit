.PHONY: cli test test-reference test-cli

cli:
	$(MAKE) -C cmdtreemap cli

test: test-reference test-cli

test-reference:
	node --test tests/*.test.cjs

test-cli:
	$(MAKE) -C cmdtreemap test
