package tui

import tea "charm.land/bubbletea/v2"

// toggleTldr is shared by the t shortcut and Enter on the tldr action line.
func (m Model) toggleTldr() (tea.Model, tea.Cmd) {
	if m.showTldr {
		m.showTldr = false
		m.tldrOutput = ""
		m.refreshPreview()
		return m, nil
	}
	if node := m.tree.NodeAtCurrentOffset(); node != nil {
		if item, ok := node.GivenValue().(treeItem); ok && item.rel != nil && item.rel.Tldr != "" {
			m.showTldr = true
			m.tldrOutput = ""
			m.refreshPreview()
			return m, fetchTldrCmd(item.rel.Tldr)
		}
	}
	return m, nil
}

// clampPreviewCursor also handles content shrinking when tldr is closed.
func (m *Model) clampPreviewCursor() {
	m.previewCursor = max(0, min(m.previewCursor, len(m.rawLines)-1))
	if len(m.rawLines) == 0 {
		m.previewCol = 0
		return
	}
	m.previewCol = clampCol(m.rawLines[m.previewCursor], m.previewCol)
}
