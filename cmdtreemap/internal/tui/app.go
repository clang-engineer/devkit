package tui

import (
	"os/exec"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/clang/cmdtreemap/internal/model"
)

type viewState int

const (
	viewTree viewState = iota
	viewDetail
	viewSearch
)

type TreeItem struct {
	CategoryIndex  int
	RelationIndex  int
	From           string
	To             string
	Why            string
}

type tldrDoneMsg struct {
	output string
	err    error
}

type Model struct {
	data       model.CommandsData
	state      viewState
	cursor     int
	items      []TreeItem
	detail     *model.Relation
	textInput  textinput.Model
	tldrOutput string
	showTldr   bool
	explored   map[[2]int]bool
	width      int
	height     int
}

func NewModel(data model.CommandsData) Model {
	ti := textinput.New()
	ti.Placeholder = "명령어 검색..."
	ti.Focus()
	ti.CharLimit = 50

	return Model{
		data:      data,
		state:     viewTree,
		textInput: ti,
		items:     buildTreeItems(data),
		explored:  make(map[[2]int]bool),
	}
}

func buildTreeItems(data model.CommandsData) []TreeItem {
	var items []TreeItem
	for ci, cat := range data.Categories {
		for ri, rel := range cat.Relations {
			items = append(items, TreeItem{
				CategoryIndex: ci,
				RelationIndex: ri,
				From:          rel.From,
				To:            rel.To,
				Why:           rel.Why,
			})
		}
	}
	return items
}

func (m Model) Init() tea.Cmd {
	return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tldrDoneMsg:
		if msg.err != nil {
			m.tldrOutput = "tldr를 찾을 수 없습니다.\n\n설치 방법:\n  brew install tldr\n  cargo install tlrc"
		} else {
			m.tldrOutput = msg.output
		}
		return m, nil

	case tea.KeyMsg:
		switch m.state {
		case viewTree:
			return m.updateTree(msg)
		case viewDetail:
			return m.updateDetail(msg)
		case viewSearch:
			return m.updateSearch(msg)
		}
	}

	return m, nil
}

func (m Model) updateTree(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c", "q":
		return m, tea.Quit

	case "up", "k":
		if m.cursor > 0 {
			m.cursor--
		}

	case "down", "j":
		if m.cursor < len(m.items)-1 {
			m.cursor++
		}

	case "enter":
		if m.cursor < len(m.items) {
			item := m.items[m.cursor]
			m.detail = &m.data.Categories[item.CategoryIndex].Relations[item.RelationIndex]
			m.explored[[2]int{item.CategoryIndex, item.RelationIndex}] = true
			m.state = viewDetail
			m.showTldr = false
			m.tldrOutput = ""
		}

	case "/":
		m.state = viewSearch
		m.textInput.Reset()
		m.textInput.Focus()
		return m, textinput.Blink
	}

	return m, nil
}

func (m Model) updateDetail(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c", "q":
		return m, tea.Quit

	case "esc", "b", "backspace":
		if m.showTldr {
			m.showTldr = false
			m.tldrOutput = ""
			return m, nil
		}
		m.state = viewTree
		m.detail = nil

	case "t":
		if m.detail != nil && m.detail.Tldr != "" {
			if m.showTldr {
				m.showTldr = false
				m.tldrOutput = ""
				return m, nil
			}
			m.showTldr = true
			m.tldrOutput = ""
			tldrCmd := m.detail.Tldr
			return m, func() tea.Msg {
				cmd := exec.Command("tldr", tldrCmd)
				out, err := cmd.CombinedOutput()
				if err != nil {
					return tldrDoneMsg{output: "", err: err}
				}
				return tldrDoneMsg{output: string(out), err: nil}
			}
		}
	}

	return m, nil
}

func (m Model) updateSearch(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return m, tea.Quit

	case "esc":
		m.state = viewTree
		m.textInput.Blur()
		return m, nil

	case "enter":
		query := strings.ToLower(m.textInput.Value())
		if query != "" {
			for i, item := range m.items {
				if strings.Contains(strings.ToLower(item.From), query) ||
					strings.Contains(strings.ToLower(item.To), query) {
					m.cursor = i
					m.state = viewTree
					m.textInput.Blur()
					return m, nil
				}
			}
		}
		m.state = viewTree
		m.textInput.Blur()
		return m, nil
	}

	var cmd tea.Cmd
	m.textInput, cmd = m.textInput.Update(msg)
	return m, cmd
}

func (m Model) View() string {
	var b strings.Builder

	title := titleStyle.Render("cmdtreemap")
	header := lipgloss.JoinHorizontal(lipgloss.Top, title, "  ", helpStyle.Render("↑↓:이동 Enter:상세 /:검색 q:종료"))
	b.WriteString(header)
	b.WriteString("\n\n")

	switch m.state {
	case viewTree:
		b.WriteString(m.viewTree())
	case viewDetail:
		b.WriteString(m.viewDetail())
	case viewSearch:
		b.WriteString(m.viewSearch())
	}

	return b.String()
}

func (m Model) viewTree() string {
	var b strings.Builder
	var currentCat string

	for i, item := range m.items {
		cat := m.data.Categories[item.CategoryIndex].Name
		if cat != currentCat {
			b.WriteString("\n")
			b.WriteString(categoryStyle.Render(cat))
			b.WriteString("\n")
			currentCat = cat
		}

		cursor := "  "
		if i == m.cursor {
			cursor = selectedStyle.Render("▶ ")
		}

		explored := " "
		if m.explored[[2]int{item.CategoryIndex, item.RelationIndex}] {
			explored = exploredStyle.Render("✓")
		}

		from := fromStyle.Render(item.From)
		arrow := arrowStyle.Render(" ──[" + item.Why + "]──→ ")
		to := toStyle.Render(item.To)

		b.WriteString(cursor + explored + " " + from + arrow + to)
		b.WriteString("\n")
	}

	return b.String()
}

func (m Model) viewDetail() string {
	if m.detail == nil {
		return ""
	}

	var b strings.Builder
	d := m.detail

	b.WriteString(detailTitleStyle.Render(d.From + " → " + d.To))
	b.WriteString("\n\n")

	b.WriteString(detailLabelStyle.Render("문제"))
	b.WriteString("\n")
	b.WriteString("  " + detailValueStyle.Render(d.Problem))
	b.WriteString("\n\n")

	b.WriteString(detailLabelStyle.Render("해결"))
	b.WriteString("\n")
	b.WriteString("  " + detailValueStyle.Render(d.Solution))
	b.WriteString("\n\n")

	if d.Boundary != "" {
		b.WriteString(detailLabelStyle.Render("경계"))
		b.WriteString("\n")
		b.WriteString("  " + boundaryStyle.Render(d.Boundary))
		b.WriteString("\n\n")
	}

	b.WriteString(detailLabelStyle.Render("관계 유형"))
	b.WriteString("\n")
	b.WriteString("  " + relationStyle.Render(d.Relation))
	b.WriteString("\n\n")

	if d.Install != "" {
		b.WriteString(detailLabelStyle.Render("설치"))
		b.WriteString("\n")
		b.WriteString("  " + detailValueStyle.Render("$ "+d.Install))
		b.WriteString("\n\n")
	}

	if m.showTldr {
		b.WriteString(detailLabelStyle.Render("tldr: " + d.Tldr))
		b.WriteString("\n")
		if m.tldrOutput != "" {
			b.WriteString(m.tldrOutput)
		} else {
			b.WriteString(helpStyle.Render("로딩 중..."))
		}
		b.WriteString("\n\n")
		b.WriteString(helpStyle.Render("[t] tldr 닫기  [b] 뒤로  [q] 종료"))
	} else {
		b.WriteString(helpStyle.Render("[t] tldr 보기  [b] 뒤로  [q] 종료"))
	}

	return b.String()
}

func (m Model) viewSearch() string {
	var b strings.Builder
	b.WriteString(detailTitleStyle.Render("검색"))
	b.WriteString("\n")
	b.WriteString(m.textInput.View())
	b.WriteString("\n\n")
	b.WriteString(helpStyle.Render("Enter: 검색  Esc: 뒤로"))
	return b.String()
}
