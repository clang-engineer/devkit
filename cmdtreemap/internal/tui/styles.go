package tui

import "github.com/charmbracelet/lipgloss"

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#FAFAFA")).
			Background(lipgloss.Color("#7D56F4")).
			Padding(0, 1)

	categoryStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#FFB86C")).
			MarginTop(1)

	arrowStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#6272A4"))

	fromStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#8BE9FD"))

	toStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#50FA7B"))

	whyStyle = lipgloss.NewStyle().
			Italic(true).
			Foreground(lipgloss.Color("#6272A4"))

	selectedStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#BD93F9"))

	helpStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#6272A4"))

	detailTitleStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#BD93F9")).
				MarginBottom(1)

	detailLabelStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#FFB86C"))

	detailValueStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#F8F8F2"))

	boundaryStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FF5555")).
			Italic(true)

	relationStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#6272A4")).
			Padding(0, 1)
)
