package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"

	tea "charm.land/bubbletea/v2"

	"github.com/clang/cmdtreemap/internal/model"
	"github.com/clang/cmdtreemap/internal/tui"
)

//go:generate node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('../reference/catalog.json','utf8')).tool_map; fs.writeFileSync('catalog.json', JSON.stringify(data, null, 2)+'\n');"
//go:embed catalog.json
var commandsJSON []byte

func main() {
	var data model.CommandsData
	if err := json.Unmarshal(commandsJSON, &data); err != nil {
		fmt.Fprintf(os.Stderr, "데이터 로드 실패: %v\n", err)
		os.Exit(1)
	}

	m := tui.NewModel(data)
	p := tea.NewProgram(m)

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "실행 실패: %v\n", err)
		os.Exit(1)
	}
}

