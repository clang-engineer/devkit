package tui

import (
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
)

func press(m Model, msg tea.KeyPressMsg) Model {
	updated, _ := m.Update(msg)
	return updated.(Model)
}

func TestStartupSelectsFirstCategory(t *testing.T) {
	m := newTestModel(t)
	if m.tree.NodeAtCurrentOffset() != m.tree.Root().ChildNodes()[0] {
		t.Fatal("startup cursor is not on first category")
	}
}

func TestEnterExpandsCategoryAndGroup(t *testing.T) {
	m := newTestModel(t)
	m.tree.SetYOffset(1)
	category := m.tree.NodeAtCurrentOffset()
	m = press(m, keyEnter())
	if !category.IsOpen() {
		t.Fatal("Enter did not open category")
	}
	m = press(m, key('j'))
	group := m.tree.NodeAtCurrentOffset()
	m = press(m, keyEnter())
	if !group.IsOpen() {
		t.Fatal("Enter did not open group")
	}
	m = press(m, key('j'))
	item, ok := m.tree.NodeAtCurrentOffset().GivenValue().(treeItem)
	if !ok || !item.isDestination || !strings.Contains(item.String(), " — "+improvementSummary(item.rel.Solution)) {
		t.Fatal("expected improvement summary on destination, without an extra node")
	}
	m = press(m, keyEnter())
	if m.focusedPane != panePreview {
		t.Fatal("Enter on tool did not open preview")
	}
}

func TestFilterSelectsMatchingTool(t *testing.T) {
	m := newTestModel(t)
	m = press(m, key('/'))
	for _, r := range "bat" {
		m = press(m, key(r))
	}
	m = press(m, keyEnter())
	node := m.tree.NodeAtCurrentOffset()
	if node == nil {
		t.Fatal("missing selected result")
	}
	item, ok := node.GivenValue().(treeItem)
	if !ok || item.name != "bat" || node.Hidden() {
		t.Fatalf("cursor is not on bat: %v", node.GivenValue())
	}
	if item.filterQuery != "bat" {
		t.Fatalf("missing highlight query: %q", item.filterQuery)
	}
	m = press(m, keyEnter())
	if m.focusedPane != panePreview || !strings.Contains(strings.Join(m.rawLines, "\n"), "bat") {
		t.Fatal("selected filter result has no preview")
	}
}

func TestClearEmptyFilterResults(t *testing.T) {
	m := newTestModel(t)
	m = press(m, key('/'))
	for _, r := range "missing-tool-xyz" {
		m = press(m, key(r))
	}
	for _, category := range m.tree.Root().ChildNodes() {
		if !category.Hidden() {
			t.Fatal("nonmatching category remained visible")
		}
	}
	m = press(m, keyMod('u', tea.ModCtrl))
	if m.filterQuery != "" || m.filterInput.Value() != "" {
		t.Fatal("Ctrl+U did not clear filter")
	}
	if m.tree.NodeAtCurrentOffset() != m.tree.Root().ChildNodes()[0] {
		t.Fatal("clearing results left cursor on root")
	}
	_ = m.View()
}

func TestFilterEscapeRestoresCategoryCursor(t *testing.T) {
	m := newTestModel(t)
	m = press(m, key('/'))
	for _, r := range "bat" {
		m = press(m, key(r))
	}
	m = press(m, keyEsc())
	if m.tree.NodeAtCurrentOffset() != m.tree.Root().ChildNodes()[0] {
		t.Fatal("filter escape left cursor on root")
	}
	for _, category := range m.tree.Root().ChildNodes() {
		if category.Hidden() || category.IsOpen() {
			t.Fatal("category not restored to visible and collapsed")
		}
	}
}
