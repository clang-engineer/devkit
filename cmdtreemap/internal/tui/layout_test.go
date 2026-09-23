package tui

import (
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

func TestPanelFitsWidth(t *testing.T) {
	for _, width := range []int{4, 20, 49, 91} {
		panel := renderPanel("상세 정보", "content", width, 5, true)
		for _, line := range strings.Split(panel, "\n") {
			if got := lipgloss.Width(line); got != width {
				t.Errorf("width %d: rendered %d: %q", width, got, line)
			}
		}
	}
}

func TestViewFitsTerminal(t *testing.T) {
	m := newTestModel(t)
	view := m.View()
	if got := lipgloss.Width(view.Content); got > 140 {
		t.Fatalf("view width %d exceeds terminal", got)
	}
}

func TestSmallTerminalDoesNotPanic(t *testing.T) {
	for _, size := range [][2]int{{1, 1}, {20, 5}, {60, 12}} {
		m := newTestModel(t)
		m = press(m, key('/'))
		updated, _ := m.Update(tea.WindowSizeMsg{Width: size[0], Height: size[1]})
		_ = updated.View()
	}
}
