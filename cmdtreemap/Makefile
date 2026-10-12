.PHONY: prepare web cli test

PORT ?= 8080

prepare:
	node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('../reference/catalog.json','utf8')).tool_map; fs.writeFileSync('catalog.json', JSON.stringify(data, null, 2)+'\n');"

web:
	$(MAKE) -C .. web PORT=$(PORT)

cli: prepare
	go run .

test: prepare
	go test ./...

