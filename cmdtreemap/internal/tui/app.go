package tui

import (
	"os/exec"
	"strings"

	"charm.land/bubbles/v2/textinput"
	"charm.land/bubbles/v2/tree"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"

	"github.com/clang/cmdtreemap/internal/model"
)

type viewState int

const (
	viewTree viewState = iota
	viewDetail
	viewSearch
)

type treeItem struct {
	name    string
	catIdx  int
	relIdx  int
	isLeaf  bool
	rel     *model.Relation
}

func (i treeItem) String() string {
	if i.isLeaf && i.rel != nil {
		toStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#50FA7B"))
		whyStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))
		return toStyle.Render(i.name) + whyStyle.Render("  ["+i.rel.Why+"]")
	}
	return i.name
}

type Model struct {
	data       model.CommandsData
	state      viewState
	tree       tree.Model
	textInput  textinput.Model
	detail     *model.Relation
	tldrOutput string
	showTldr   bool
	explored   map[[2]int]bool
	width      int
	height     int
}

func NewModel(data model.CommandsData) Model {
	ti := textinput.New()
	ti.Placeholder = "명령어 검색..."
	ti.CharLimit = 50

	root := buildTreeRoot(data)

	t := tree.New(root, 80, 24)
	t.KeyMap.Toggle.SetKeys(" ")
	t.KeyMap.Open.SetKeys("l", "right")
	t.KeyMap.Close.SetKeys("h", "left")

	return Model{
		data:      data,
		state:     viewTree,
		tree:      t,
		textInput: ti,
		explored:  make(map[[2]int]bool),
	}
}

func buildTreeRoot(data model.CommandsData) *tree.Node {
	root := tree.Root("cmdtreemap")

	for ci, cat := range data.Categories {
		catNode := tree.Root(cat.Name)
		catNode.ItemStyleFunc(func(children tree.Nodes, i int) lipgloss.Style {
			return lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#FFB86C"))
		})

		trees := buildCategoryTrees(cat)
		for _, tNode := range trees {
			addTreeNodes(catNode, tNode, ci, data.Categories[ci].Relations)
		}

		root.Child(catNode)
	}

	return root
}

func debugTree(node *TreeNode, depth int) {
	indent := ""
	for i := 0; i < depth; i++ {
		indent += "  "
	}
	rel := "nil"
	if node.Rel != nil {
		rel = node.Rel.From + "→" + node.Rel.To
	}
	children := make([]string, len(node.Children))
	for i, c := range node.Children {
		if c.Rel != nil {
			children[i] = c.Rel.From + "→" + c.Rel.To
		} else {
			children[i] = c.From + "(no rel)"
		}
	}
	_ = indent
	_ = rel
	_ = children
}

func addTreeNodes(parent *tree.Node, node *TreeNode, catIdx int, relations []model.Relation) {
	if node.Rel != nil {
		return
	}

	if len(node.Children) == 0 {
		return
	}

	parentNode := tree.Root(treeItem{name: node.From, catIdx: catIdx, isLeaf: false})
	parentNode.ItemStyleFunc(func(children tree.Nodes, i int) lipgloss.Style {
		return lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#8BE9FD"))
	})

	for _, child := range node.Children {
		if child.Rel == nil {
			continue
		}
		addChildNode(parentNode, child, catIdx, relations)
	}

	parent.Child(parentNode)
}

func addChildNode(parent *tree.Node, node *TreeNode, catIdx int, relations []model.Relation) {
	if node.Rel == nil {
		return
	}

	relIdx := -1
	for ri, r := range relations {
		if r.From == node.Rel.From && r.To == node.Rel.To {
			relIdx = ri
			break
		}
	}

	// Chain node (intermediate): show as expandable tree node
	if len(node.Children) > 0 {
		interNode := tree.Root(treeItem{
			name:   node.Rel.To,
			catIdx: catIdx,
			relIdx: relIdx,
			isLeaf: false,
			rel:    node.Rel,
		})
		interNode.ItemStyleFunc(func(children tree.Nodes, i int) lipgloss.Style {
			return lipgloss.NewStyle().Foreground(lipgloss.Color("#8BE9FD"))
		})
		for _, grandchild := range node.Children {
			if grandchild.Rel != nil {
				addChildNode(interNode, grandchild, catIdx, relations)
			}
		}
		parent.Child(interNode)
		return
	}

	// Leaf node: plain child, no indicator
	parent.Child(treeItem{
		name:   node.Rel.To,
		catIdx: catIdx,
		relIdx: relIdx,
		isLeaf: true,
		rel:    node.Rel,
	})
}

// TreeNode for building tree from flat relations
type TreeNode struct {
	From     string
	Children []*TreeNode
	Rel      *model.Relation
}

func buildCategoryTrees(cat model.Category) []*TreeNode {
	type entry struct {
		node     *TreeNode
		incoming bool
	}
	nodes := make(map[string]*entry)

	for i := range cat.Relations {
		rel := &cat.Relations[i]
		f, ok := nodes[rel.From]
		if !ok {
			f = &entry{node: &TreeNode{From: rel.From}}
			nodes[rel.From] = f
		}
		t, ok := nodes[rel.To]
		if !ok {
			t = &entry{node: &TreeNode{From: rel.To}}
			nodes[rel.To] = t
		}
		t.incoming = true
		t.node.Rel = rel
		f.node.Children = append(f.node.Children, t.node)
		nodes[rel.From] = f
		nodes[rel.To] = t
	}

	var roots []*TreeNode
	for _, e := range nodes {
		if !e.incoming {
			roots = append(roots, e.node)
		}
	}
	return roots
}

func (m Model) Init() tea.Cmd { return nil }

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.tree.SetSize(msg.Width, msg.Height-4)
		return m, nil
	case tea.KeyPressMsg:
		switch m.state {
		case viewTree:
			return m.updateTree(msg)
		case viewDetail:
			return m.updateDetail(msg)
		case viewSearch:
			return m.updateSearch(msg)
		}
	case tldrDoneMsg:
		if msg.err != nil {
			m.tldrOutput = "tldr를 찾을 수 없습니다.\n\n설치 방법:\n  brew install tldr\n  cargo install tlrc"
		} else {
			m.tldrOutput = msg.output
		}
		return m, nil
	}
	return m, nil
}

func (m Model) updateTree(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c", "q":
		return m, tea.Quit
	case "enter":
		m.state = viewDetail
		m.showTldr = false
		m.tldrOutput = ""
		return m, nil
	case "/":
		m.state = viewSearch
		m.textInput.Reset()
		m.textInput.Focus()
		return m, textinput.Blink
	}

	var cmd tea.Cmd
	m.tree, cmd = m.tree.Update(msg)
	return m, cmd
}

func (m Model) updateDetail(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
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
		return m, nil
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

func (m Model) updateSearch(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return m, tea.Quit
	case "esc":
		m.state = viewTree
		m.textInput.Blur()
		return m, nil
	case "enter":
		m.state = viewTree
		m.textInput.Blur()
		return m, nil
	}
	var cmd tea.Cmd
	m.textInput, cmd = m.textInput.Update(msg)
	return m, cmd
}

func (m Model) View() tea.View {
	var v tea.View
	var b strings.Builder

	switch m.state {
	case viewTree:
		b.WriteString(m.tree.View())
	case viewDetail:
		b.WriteString(m.viewDetail())
	case viewSearch:
		b.WriteString(m.viewSearch())
	}

	v.SetContent(b.String())
	v.AltScreen = true
	return v
}

func (m Model) viewDetail() string {
	d := m.findCurrentDetail()
	if d == nil {
		return ""
	}

	var b strings.Builder

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#BD93F9")).MarginBottom(1)
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#FFB86C"))
	valueStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#F8F8F2"))
	boundaryStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#FF5555")).Italic(true)
	relationStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4")).Padding(0, 1)
	helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))
	relatedStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#8BE9FD"))

	b.WriteString(titleStyle.Render(d.From + " → " + d.To))
	b.WriteString("\n\n")

	b.WriteString(labelStyle.Render("문제"))
	b.WriteString("\n  " + valueStyle.Render(d.Problem))
	b.WriteString("\n\n")

	b.WriteString(labelStyle.Render("해결"))
	b.WriteString("\n  " + valueStyle.Render(d.Solution))
	b.WriteString("\n\n")

	if d.Boundary != "" {
		b.WriteString(labelStyle.Render("경계"))
		b.WriteString("\n  " + boundaryStyle.Render(d.Boundary))
		b.WriteString("\n\n")
	}

	b.WriteString(labelStyle.Render("관계 유형"))
	b.WriteString("\n  " + relationStyle.Render(d.Relation))
	b.WriteString("\n\n")

	if d.Install != "" {
		b.WriteString(labelStyle.Render("설치"))
		b.WriteString("\n  " + valueStyle.Render("$ "+d.Install))
		b.WriteString("\n\n")
	}

	related := m.findRelated(d)
	if len(related) > 0 {
		b.WriteString(labelStyle.Render("연결된 도구"))
		b.WriteString("\n")
		for _, r := range related {
			b.WriteString("  " + relatedStyle.Render(r.From+" → "+r.To))
		}
		b.WriteString("\n\n")
	}

	if m.showTldr {
		b.WriteString(labelStyle.Render("tldr: " + d.Tldr))
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

func (m Model) findCurrentDetail() *model.Relation {
	if m.detail != nil {
		return m.detail
	}
	node := m.tree.NodeAtCurrentOffset()
	if node == nil {
		return nil
	}
	val, ok := node.GivenValue().(treeItem)
	if !ok || !val.isLeaf || val.rel == nil {
		return nil
	}
	m.explored[[2]int{val.catIdx, val.relIdx}] = true
	return val.rel
}

func (m Model) findRelated(d *model.Relation) []model.Relation {
	if d.Group == "" {
		return nil
	}
	var related []model.Relation
	for _, cat := range m.data.Categories {
		for _, rel := range cat.Relations {
			if rel.Group == d.Group && (rel.From != d.From || rel.To != d.To) {
				related = append(related, rel)
			}
		}
	}
	return related
}

func (m Model) viewSearch() string {
	var b strings.Builder
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#BD93F9")).MarginBottom(1)
	helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))

	b.WriteString(titleStyle.Render("검색"))
	b.WriteString("\n")
	b.WriteString(m.textInput.View())
	b.WriteString("\n\n")
	b.WriteString(helpStyle.Render("Enter: 검색  Esc: 뒤로"))
	return b.String()
}

type tldrDoneMsg struct {
	output string
	err    error
}

