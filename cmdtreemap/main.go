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

//go:embed internal/data/commands.json
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
