package tui

import (
	"testing"

	"github.com/clang/cmdtreemap/internal/model"
)

func TestCategoryChainsAndBranches(t *testing.T) {
	cat := model.Category{Relations: []model.Relation{
		{From: "top", To: "htop"}, {From: "htop", To: "btop"}, {From: "top", To: "atop"},
	}}
	roots := buildCategoryTrees(cat)
	if len(roots) != 1 || roots[0].From != "top" {
		t.Fatal("missing top root")
	}
	children := roots[0].Children
	if len(children) != 2 || children[0].From != "htop" || children[1].From != "atop" {
		t.Fatal("branch order changed")
	}
	if len(children[0].Children) != 1 || children[0].Children[0].From != "btop" {
		t.Fatal("btop is not a child of htop")
	}
}

func TestSharedDestinationKeepsRelations(t *testing.T) {
	cat := model.Category{Relations: []model.Relation{
		{From: "a", To: "c"}, {From: "b", To: "c"}, {From: "c", To: "d"},
	}}
	roots := buildCategoryTrees(cat)
	if len(roots) != 2 {
		t.Fatal("expected two roots")
	}
	for i, root := range roots {
		child := root.Children[0]
		if child.Rel != &cat.Relations[i] {
			t.Fatal("incoming relation was overwritten")
		}
		if len(child.Children) != 1 || child.Children[0].From != "d" {
			t.Fatal("missing shared continuation")
		}
	}
}

func TestCyclesRemainFinite(t *testing.T) {
	cat := model.Category{Relations: []model.Relation{
		{From: "a", To: "b"}, {From: "b", To: "a"}, {From: "x", To: "x"},
	}}
	roots := buildCategoryTrees(cat)
	if len(roots) != 2 {
		t.Fatal("cycles disappeared")
	}
	end := roots[0].Children[0].Children[0]
	if end.From != "a" || len(end.Children) != 0 {
		t.Fatal("cycle must terminate at repeated tool")
	}
	if len(roots[1].Children[0].Children) != 0 {
		t.Fatal("self loop did not terminate")
	}
	m := NewModel(model.CommandsData{Categories: []model.Category{cat}})
	_ = m.View()
}

func TestParallelRelationsKeepIndices(t *testing.T) {
	cat := model.Category{Name: "test", Relations: []model.Relation{
		{From: "a", To: "b", Why: "first"}, {From: "a", To: "b", Why: "second"},
	}}
	m := NewModel(model.CommandsData{Categories: []model.Category{cat}})
	m.applyFilter(m.tree.Root(), "b")
	seen := map[int]bool{}
	for _, node := range m.tree.Root().AllNodes() {
		if item, ok := node.GivenValue().(treeItem); ok && item.isLeaf {
			seen[item.relIdx] = true
		}
	}
	if !seen[0] || !seen[1] {
		t.Fatalf("relation indices collapsed: %v", seen)
	}
}
