package tui

import (
	"testing"

	"github.com/clang/cmdtreemap/internal/model"
)

func TestStandaloneCommandsRemainVisible(t *testing.T) {
	category := model.Category{
		Commands: []model.Command{{Name: "plugin-a"}, {Name: "plugin-b"}, {Name: "plugin-a"}},
	}
	roots := buildCategoryTrees(category)
	if len(roots) != 2 || roots[0].From != "plugin-a" || roots[1].From != "plugin-b" {
		t.Fatalf("standalone tools were lost or duplicated: %#v", roots)
	}
}

func TestStandaloneCommandsCoexistWithRelationships(t *testing.T) {
	category := model.Category{
		Commands: []model.Command{{Name: "base"}, {Name: "extension"}, {Name: "independent"}},
		Relations: []model.Relation{{From: "base", To: "extension"}},
	}
	roots := buildCategoryTrees(category)
	if len(roots) != 2 || roots[0].From != "base" || roots[1].From != "independent" {
		t.Fatalf("expected relationship root and standalone tool: %#v", roots)
	}
	if len(roots[0].Children) != 1 || roots[0].Children[0].From != "extension" {
		t.Fatal("existing relationship changed")
	}
}
