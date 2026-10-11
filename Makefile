.PHONY: web test
PORT ?= 8080
web:
	python3 -m http.server $(PORT) --bind 127.0.0.1
test:
	$(MAKE) -C cmdtreemap test
