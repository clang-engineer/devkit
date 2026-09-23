package tui

import (
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
)

func TestTldrKeysShareToggle(t *testing.T) {
	for _, msg := range []tea.KeyPressMsg{key('t'), keyEnter()} {
		t.Run(msg.String(), func(t *testing.T) {
			m := newTestModel(t)
			if !selectFirstTool(&m) {
				t.Fatal("no tool selected")
			}
			m = press(m, keyEnter())
			if m.tldrLine < 0 {
				t.Fatal("fixture has no tldr action")
			}
			m.previewCursor = m.tldrLine
			updated, cmd := m.Update(msg)
			m = updated.(Model)
			if !m.showTldr || cmd == nil {
				t.Fatal("opening tldr must request its content")
			}
			updated, cmd = m.Update(msg)
			m = updated.(Model)
			if m.showTldr || m.tldrOutput != "" || cmd != nil {
				t.Fatal("closing tldr must clear content without another command")
			}
		})
	}
}

func TestClosingTldrClampsCursor(t *testing.T) {
	m := newTestModel(t)
	if !selectFirstTool(&m) {
		t.Fatal("no tool selected")
	}
	m = press(m, keyEnter())
	m = press(m, key('t'))
	updated, _ := m.Update(tldrDoneMsg{output: strings.Repeat("example\n", 100)})
	m = updated.(Model)
	m = press(m, key('G'))
	m = press(m, key('t'))
	if m.previewCursor >= len(m.rawLines) {
		t.Fatal("cursor left outside shortened content")
	}
	m = press(m, key('k'))
	_ = m.View()
}

func TestVisualKeysShareSelection(t *testing.T) {
	for _, r := range "vV" {
		m := newTestModel(t)
		m.focusedPane = panePreview
		m.previewCursor = 0
		m = press(m, key(r))
		if m.previewMode != previewVisual || m.visualStart != 0 || m.visualEnd != 0 {
			t.Fatalf("%c did not start visual selection", r)
		}
	}
}

func TestHalfPageCursorBounds(t *testing.T) {
	for _, r := range "du" {
		m := newTestModel(t)
		m.focusedPane = panePreview
		for i := 0; i < 10; i++ {
			m = press(m, keyMod(r, tea.ModCtrl))
			if m.previewCursor < 0 || m.previewCursor >= max(1, len(m.rawLines)) {
				t.Fatalf("Ctrl+%c cursor out of range: %d", r, m.previewCursor)
			}
		}
	}
}
