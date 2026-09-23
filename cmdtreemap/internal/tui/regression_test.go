package tui

import (
	"strings"
	"testing"
	"unicode/utf8"

	tea "charm.land/bubbletea/v2"
	"github.com/clang/cmdtreemap/internal/model"
)

func TestCategoryRootOrder(t *testing.T) {
	cat := model.Category{Relations: []model.Relation{{From: "z", To: "z1"}, {From: "a", To: "a1"}}}
	for i := 0; i < 100; i++ {
		roots := buildCategoryTrees(cat)
		if len(roots) != 2 || roots[0].From != "z" || roots[1].From != "a" {
			t.Fatalf("unexpected root order: %v", roots)
		}
	}
}

func TestUnicodeHighlight(t *testing.T) {
	for _, tc := range [][2]string{{"Ktool", "tool"}, {"İabc", "abc"}, {"한글 검색", "검색"}, {"K", "k"}, {"abc", ""}} {
		got := highlightMatch(tc[0], tc[1])
		if !utf8.ValidString(got) || stripANSI(got) != tc[0] {
			t.Fatalf("highlight damaged %q: %q", tc[0], got)
		}
	}
}

func TestWordMotionBounds(t *testing.T) {
	for name, motion := range map[string]func(string, int) int{"forward": wordForward, "backward": wordBackward, "end": wordEnd} {
		for _, line := range []string{"", "한글 test", "a", "   "} {
			for _, col := range []int{-5, 0, 1, 100} {
				got := motion(line, col)
				if got < 0 || got > max(0, len([]rune(line))-1) {
					t.Errorf("%s(%q,%d) = %d", name, line, col, got)
				}
			}
		}
	}
}

func TestPreviewActionLines(t *testing.T) {
	m := newTestModel(t)
	rel := &model.Relation{From: "cat", To: "bat", Tldr: "bat", URL: "https://example.com"}
	lines := strings.Split(stripANSI(m.buildPreviewContent(rel)), "\n")
	if !strings.HasPrefix(lines[m.tldrLine], "tldr: bat") {
		t.Fatalf("wrong tldr line: %d", m.tldrLine)
	}
	if lines[m.urlLine] != "공식 문서" {
		t.Fatalf("wrong URL line: %d", m.urlLine)
	}
	m.buildPreviewContent(&model.Relation{})
	if m.tldrLine != -1 || m.urlLine != -1 {
		t.Fatal("action lines not reset")
	}
}

func TestEnsureVisiblePersists(t *testing.T) {
	m := newTestModel(t)
	m.viewport.SetHeight(3)
	m.viewport.SetContent(strings.Repeat("line\n", 20))
	m.ensureVisible(10)
	if m.viewport.YOffset() != 8 {
		t.Fatalf("offset = %d", m.viewport.YOffset())
	}
}

func TestFilterAcceptsQ(t *testing.T) {
	m := newTestModel(t)
	updated, _ := m.Update(key('/'))
	updated, cmd := updated.Update(key('q'))
	m = updated.(Model)
	if m.filterInput.Value() != "q" {
		t.Fatal("q was not entered")
	}
	if cmd != nil {
		if _, ok := cmd().(tea.QuitMsg); ok {
			t.Fatal("q quit filter mode")
		}
	}
}

func TestCtrlCInAllModes(t *testing.T) {
	for _, mode := range []string{"tree", "filter", "search", "visual"} {
		m := newTestModel(t)
		m.filterActive = mode == "filter"
		m.searchActive = mode == "search"
		if mode == "visual" {
			m.focusedPane = panePreview
			m.previewMode = previewVisual
		}
		_, cmd := m.Update(keyMod('c', tea.ModCtrl))
		if cmd == nil {
			t.Fatalf("%s: no quit command", mode)
		}
		if _, ok := cmd().(tea.QuitMsg); !ok {
			t.Fatalf("%s: not a quit message", mode)
		}
	}
}

func TestBlockCursorPreservesUnicode(t *testing.T) {
	for _, line := range []string{"한글 abc", "\x1b[31m한글\x1b[0m abc"} {
		raw := stripANSI(line)
		for col := 0; col < len([]rune(raw)); col++ {
			got := insertBlockCursor(line, raw, col)
			if !utf8.ValidString(got) || stripANSI(got) != raw {
				t.Fatalf("cursor damaged text: %q", got)
			}
		}
	}
}
