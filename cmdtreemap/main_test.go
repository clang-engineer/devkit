package main

import (
	"encoding/json"
	"testing"

	"github.com/clang/cmdtreemap/internal/model"
)

func TestEmbeddedCommandsJSON(t *testing.T) {
	var data model.CommandsData
	if err := json.Unmarshal(commandsJSON, &data); err != nil {
		t.Fatalf("embedded commands JSON is invalid: %v", err)
	}
	if len(data.Categories) == 0 {
		t.Fatal("embedded commands JSON has no categories")
	}
}
