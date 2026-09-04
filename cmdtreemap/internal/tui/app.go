package tui

import (
	"os/exec"
	"strings"

	"charm.land/bubbles/v2/cursor"
	"charm.land/bubbles/v2/textinput"
	"charm.land/bubbles/v2/tree"
	"charm.land/bubbles/v2/viewport"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"

	"github.com/clang/cmdtreemap/internal/model"
)

var filterQuery string

type pane int

const (
	paneTree pane = iota
	panePreview
)

type previewMode int

const (
	previewNormal previewMode = iota
	previewVisual
)

type treeItem struct {
	name    string
	catIdx  int
	relIdx  int
	isLeaf  bool
	rel     *model.Relation
}

func (i treeItem) String() string {
	name := i.name
	if filterQuery != "" {
		name = highlightMatch(name, filterQuery)
	}
	if i.isLeaf && i.rel != nil {
		toStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#50FA7B"))
		whyStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))
		return toStyle.Render(name) + whyStyle.Render("  ["+i.rel.Why+"]")
	}
	return name
}

func highlightMatch(s, query string) string {
	lower := strings.ToLower(s)
	q := strings.ToLower(query)
	idx := strings.Index(lower, q)
	if idx == -1 {
		return s
	}
	matchStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#FF79C6")).Underline(true)
	return s[:idx] + matchStyle.Render(s[idx:idx+len(query)]) + s[idx+len(query):]
}

type Model struct {
	data          model.CommandsData
	tree          tree.Model
	viewport      viewport.Model
	textInput     textinput.Model
	filterInput   textinput.Model
	explored      map[[2]int]bool
	filterActive  bool
	focusedPane   pane
	previewActive bool
	previewMode   previewMode
	previewCursor int
	visualStart   int
	visualEnd     int
	previewLines  []string
	tldrOutput    string
	showTldr      bool
	width         int
	height        int
}

func NewModel(data model.CommandsData) Model {
	ti := textinput.New()
	ti.Placeholder = "명령어 검색..."
	ti.CharLimit = 50

	fi := textinput.New()
	fi.Placeholder = "필터..."
	fi.CharLimit = 30

	root := buildTreeRoot(data)

	t := tree.New(root, 80, 24)
	t.KeyMap.Toggle.SetKeys(" ")
	t.KeyMap.Open.SetKeys("l", "right")
	t.KeyMap.Close.SetKeys("h", "left")

	vp := viewport.New()

	return Model{
		data:        data,
		tree:        t,
		viewport:    vp,
		textInput:   ti,
		filterInput: fi,
		explored:    make(map[[2]int]bool),
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

func addTreeNodes(parent *tree.Node, node *TreeNode, catIdx int, relations []model.Relation) {
	if node.Rel != nil {
		return
	}

	if len(node.Children) == 0 {
		return
	}

	var rootRel *model.Relation
	if len(node.Children) > 0 && node.Children[0].Rel != nil {
		rootRel = node.Children[0].Rel
	}

	parentNode := tree.Root(treeItem{
		name:   node.From,
		catIdx: catIdx,
		isLeaf: false,
		rel:    rootRel,
	})
	parentNode.ItemStyleFunc(func(children tree.Nodes, i int) lipgloss.Style {
		return lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#BD93F9"))
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

	parent.Child(treeItem{
		name:   node.Rel.To,
		catIdx: catIdx,
		relIdx: relIdx,
		isLeaf: true,
		rel:    node.Rel,
	})
}

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

func applyFilter(root *tree.Node, query string) {
	filterQuery = query

	if query == "" {
		for _, node := range root.AllNodes() {
			node.SetHidden(false)
		}
		return
	}

	q := strings.ToLower(query)

	// 루트의 직계 자식(카테고리)부터 재귀 필터링
	for _, cat := range root.ChildNodes() {
		filterNode(cat, q)
	}
}

func filterNode(node *tree.Node, q string) bool {
	item, _ := node.GivenValue().(treeItem)
	selfMatch := item.name != "" && strings.Contains(strings.ToLower(item.name), q)

	anyChild := false
	for _, child := range node.ChildNodes() {
		if filterNode(child, q) {
			anyChild = true
		}
	}

	hide := !(selfMatch || anyChild)
	node.SetHidden(hide)
	if !hide {
		node.Open()
	}
	return !hide
}

func (m Model) Init() tea.Cmd { return nil }

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
treeWidth := m.width*35/100 - 1
	if treeWidth < 4 {
		treeWidth = 4
	}
	previewWidth := m.width - treeWidth - 3
	treeHeight := m.height - 3
	m.tree.SetSize(treeWidth, treeHeight)
	m.viewport.SetWidth(previewWidth)
	m.viewport.SetHeight(m.height)
	m.filterInput.SetWidth(treeWidth - 2)
		return m, nil
	case tea.KeyPressMsg:
		return m.updateTree(msg)
	case cursor.BlinkMsg:
		// 필터 입력 커서 깜빡임 유지
		if m.filterActive {
			var cmd tea.Cmd
			m.filterInput, cmd = m.filterInput.Update(msg)
			return m, cmd
		}
		return m, nil
	case tldrDoneMsg:
		if msg.err != nil {
			m.tldrOutput = "tldr를 찾을 수 없습니다."
		} else {
			m.tldrOutput = msg.output
		}
		m.refreshPreview()
		return m, nil
	}
	return m, nil
}

func (m Model) updateTree(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	if m.filterActive {
		return m.updateFilterMode(msg)
	}

	if m.focusedPane == panePreview {
		return m.updatePreview(msg)
	}

	switch msg.String() {
	case "ctrl+c", "q":
		return m, tea.Quit
	case "enter":
		node := m.tree.NodeAtCurrentOffset()
		if node == nil {
			return m, nil
		}
		val, ok := node.GivenValue().(treeItem)
		if !ok || val.rel == nil {
			return m, nil
		}
		m.previewActive = true
		m.explored[[2]int{val.catIdx, val.relIdx}] = true
		m.showTldr = true
		m.tldrOutput = ""
		m.refreshPreview()
		if val.rel.Tldr != "" {
			return m, fetchTldrCmd(val.rel.Tldr)
		}
		return m, nil
	case "/":
		m.filterActive = true
		m.filterInput.Reset()
		return m, m.filterInput.Focus()
	case "ctrl+l":
		m.focusedPane = panePreview
		m.previewMode = previewNormal
		m.previewCursor = m.viewport.YOffset()
		return m, nil
	case "ctrl+h":
		if m.focusedPane == panePreview {
			m.focusedPane = paneTree
			return m, nil
		}
	case "b", "esc", "backspace":
		if m.previewActive {
			m.previewActive = false
			m.showTldr = false
			m.tldrOutput = ""
			return m, nil
		}
	}

	var cmd tea.Cmd
	m.tree, cmd = m.tree.Update(msg)
	m.refreshPreview()
	return m, cmd
}

func (m Model) updatePreview(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch m.previewMode {
	case previewVisual:
		return m.updateVisualMode(msg)
	default:
		return m.updatePreviewNormal(msg)
	}
}

func (m Model) updatePreviewNormal(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+h":
		m.focusedPane = paneTree
		return m, nil
	case "ctrl+c", "q":
		return m, tea.Quit
	case "j", "down":
		if m.previewCursor < len(m.previewLines)-1 {
			m.previewCursor++
			yoff := m.viewport.YOffset()
			vh := m.viewport.Height()
			if m.previewCursor >= yoff+vh {
				m.viewport.ScrollDown(1)
			}
		}
		return m, nil
	case "k", "up":
		if m.previewCursor > 0 {
			m.previewCursor--
			yoff := m.viewport.YOffset()
			if m.previewCursor < yoff {
				m.viewport.ScrollUp(1)
			}
		}
		return m, nil
	case "g":
		m.previewCursor = 0
		m.viewport.GotoTop()
		return m, nil
	case "G":
		m.previewCursor = len(m.previewLines) - 1
		if m.previewCursor < 0 {
			m.previewCursor = 0
		}
		m.viewport.GotoBottom()
		return m, nil
	case "ctrl+d":
		m.viewport.HalfPageDown()
		yoff := m.viewport.YOffset()
		vh := m.viewport.Height()
		m.previewCursor = yoff + vh/2
		if m.previewCursor >= len(m.previewLines) {
			m.previewCursor = len(m.previewLines) - 1
		}
		if m.previewCursor < 0 {
			m.previewCursor = 0
		}
		return m, nil
	case "ctrl+u":
		m.viewport.HalfPageUp()
		yoff2 := m.viewport.YOffset()
		vh2 := m.viewport.Height()
		m.previewCursor = yoff2 + vh2/2
		if m.previewCursor >= len(m.previewLines) {
			m.previewCursor = len(m.previewLines) - 1
		}
		if m.previewCursor < 0 {
			m.previewCursor = 0
		}
		return m, nil
	case "v":
		m.previewMode = previewVisual
		m.visualStart = m.previewCursor
		m.visualEnd = m.previewCursor
		m.refreshPreview()
		return m, nil
	case "esc", "b":
		m.focusedPane = paneTree
		m.previewMode = previewNormal
		return m, nil
	case "t":
		if m.showTldr {
			m.showTldr = false
			m.tldrOutput = ""
			m.refreshPreview()
			return m, nil
		}
		node := m.tree.NodeAtCurrentOffset()
		if node != nil {
			if val, ok := node.GivenValue().(treeItem); ok && val.rel != nil && val.rel.Tldr != "" {
				m.showTldr = true
				m.tldrOutput = ""
				tldrCmd := val.rel.Tldr
				m.refreshPreview()
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

	return m, nil
}

func (m Model) updateVisualMode(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "j", "down":
		if m.visualEnd < len(m.previewLines)-1 {
			m.visualEnd++
		}
		m.ensureVisible(m.visualEnd)
		m.refreshPreview()
		return m, nil
	case "k", "up":
		if m.visualEnd > 0 {
			m.visualEnd--
		}
		m.ensureVisible(m.visualEnd)
		m.refreshPreview()
		return m, nil
	case "y":
		start := m.visualStart
		end := m.visualEnd
		if start > end {
			start, end = end, start
		}
		if start < 0 {
			start = 0
		}
		if end >= len(m.previewLines) {
			end = len(m.previewLines) - 1
		}
		selected := strings.Join(m.previewLines[start:end+1], "\n")
		m.copyToClipboard(selected)
		m.previewMode = previewNormal
		m.refreshPreview()
		return m, nil
	case "esc":
		m.previewMode = previewNormal
		m.refreshPreview()
		return m, nil
	}

	return m, nil
}

func (m Model) ensureVisible(line int) {
	yoff := m.viewport.YOffset()
	vh := m.viewport.Height()
	if line < yoff {
		m.viewport.SetYOffset(line)
	} else if line >= yoff+vh {
		m.viewport.SetYOffset(line - vh + 1)
	}
}

func (m Model) copyToClipboard(text string) {
	cmd := exec.Command("pbcopy")
	cmd.Stdin = strings.NewReader(text)
	cmd.Run()
}

func (m *Model) refreshPreview() {
	node := m.tree.NodeAtCurrentOffset()
	if node == nil {
		m.previewLines = []string{"명령어를 선택하세요"}
		m.viewport.SetContent(strings.Join(m.previewLines, "\n"))
		return
	}

	val, ok := node.GivenValue().(treeItem)
	if !ok || val.rel == nil {
		m.previewLines = []string{"상세 정보가 없습니다"}
		m.viewport.SetContent(strings.Join(m.previewLines, "\n"))
		return
	}

	d := val.rel
	content := m.buildPreviewContent(d)
	m.previewLines = strings.Split(content, "\n")

	// visual mode일 때 선택 영역 하이라이트
	if m.previewMode == previewVisual && len(m.previewLines) > 0 {
		start := m.visualStart
		end := m.visualEnd
		if start > end {
			start, end = end, start
		}
		if start < 0 {
			start = 0
		}
		if end >= len(m.previewLines) {
			end = len(m.previewLines) - 1
		}

		highlighted := make([]string, len(m.previewLines))
		copy(highlighted, m.previewLines)
		for i := start; i <= end; i++ {
			highlighted[i] = lipgloss.NewStyle().
				Background(lipgloss.Color("#44475A")).
				Foreground(lipgloss.Color("#F8F8F2")).
				Render(m.previewLines[i])
		}
		m.viewport.SetContent(strings.Join(highlighted, "\n"))
	} else {
		m.viewport.SetContent(content)
	}
}

func (m Model) buildPreviewContent(d *model.Relation) string {
	var b strings.Builder

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#BD93F9"))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#FFB86C"))
	valueStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#F8F8F2"))
	helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))

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
		b.WriteString("\n  " + lipgloss.NewStyle().Foreground(lipgloss.Color("#FF5555")).Italic(true).Render(d.Boundary))
		b.WriteString("\n\n")
	}

	b.WriteString(labelStyle.Render("관계 유형"))
	b.WriteString("\n  " + lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4")).Render(d.Relation))
	b.WriteString("\n\n")

	if d.Install != "" {
		b.WriteString(labelStyle.Render("설치"))
		b.WriteString("\n  " + valueStyle.Render("$ "+d.Install))
		b.WriteString("\n\n")
	}

	if d.Tldr != "" {
		b.WriteString(labelStyle.Render("tldr: " + d.Tldr))
		b.WriteString("\n")
		if m.showTldr && m.tldrOutput != "" {
			b.WriteString(m.tldrOutput)
		} else if m.showTldr {
			b.WriteString(helpStyle.Render("로딩 중..."))
		}
		b.WriteString("\n\n")
	}

	if m.focusedPane == panePreview {
		modeLabel := "NORMAL"
		if m.previewMode == previewVisual {
			modeLabel = "VISUAL"
		}
		b.WriteString(helpStyle.Render("[" + modeLabel + "] "))
		b.WriteString(helpStyle.Render("j/k:이동 v:선택 y:복사 Ctrl+H:트리 t:tldr Esc:뒤로"))
	} else {
		b.WriteString(helpStyle.Render("[Enter] 선택  [/] 필터  Ctrl+L:미리보기  [q] 종료"))
	}
	return b.String()
}

func (m Model) updateFilterMode(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c", "q":
		return m, tea.Quit
	case "esc":
		m.filterActive = false
		m.filterInput.Blur()
		m.filterInput.Reset()
		applyFilter(m.tree.Root(), "")
		return m, nil
	case "enter":
		m.filterActive = false
		m.filterInput.Blur()
		return m, nil
	case "ctrl+u":
		m.filterInput.Reset()
		applyFilter(m.tree.Root(), "")
		return m, nil
	}

	var cmd tea.Cmd
	m.filterInput, cmd = m.filterInput.Update(msg)
	query := m.filterInput.Value()
	applyFilter(m.tree.Root(), query)
	return m, cmd
}

func (m Model) View() tea.View {
	var v tea.View

	treeView := m.tree.View()

	// 필터 바
	if m.filterActive {
		treeWidth := m.width*35/100 - 1
		if treeWidth < 4 {
			treeWidth = 4
		}
		prefix := lipgloss.NewStyle().Foreground(lipgloss.Color("#FFB86C")).Bold(true).Render("/")
		bar := lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), true, true, true, true).
			BorderForeground(lipgloss.Color("#FFB86C")).
			Width(treeWidth - 2).
			Render(prefix + m.filterInput.View())
		treeView = lipgloss.JoinVertical(lipgloss.Left, treeView, bar)
	}

	// 트리 포커스 표시
	if m.focusedPane == paneTree {
		treeStyle := lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), false, false, false, true).
			BorderForeground(lipgloss.Color("#BD93F9"))
		treeView = treeStyle.Render(treeView)
	}

	// 미리보기 패널
	var previewContent string
	if m.previewActive {
		m.refreshPreview()
		previewContent = m.viewport.View()
	} else {
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))
		previewContent = helpStyle.Render("명령어를 선택하고 Enter로 상세 보기\n\nCtrl+H:트리  Ctrl+L:미리보기")
	}

	// 미리보기 포커스 시 모드 표시기 (lazyvim 스타일)
	if m.focusedPane == panePreview {
		modeStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#50FA7B")).Bold(true)
		modeLabel := "NORMAL"
		if m.previewMode == previewVisual {
			modeLabel = "VISUAL"
		}
		if !m.previewActive {
			previewContent = lipgloss.JoinVertical(lipgloss.Left,
				modeStyle.Render("["+modeLabel+"]  < >:이동  Enter:상세  /:필터  q:종료"),
				previewContent,
			)
		}

		previewStyle := lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), false, false, false, true).
			BorderForeground(lipgloss.Color("#50FA7B"))
		previewContent = previewStyle.Render(previewContent)
	}

	// 분리선
	sepStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))
	n := m.height
	if n < 1 {
		n = 1
	}
	sepLines := make([]string, 0, n)
	for i := 0; i < n; i++ {
		sepLines = append(sepLines, "│")
	}
	separator := sepStyle.Render(strings.Join(sepLines, "\n"))

	combined := lipgloss.JoinHorizontal(lipgloss.Top, treeView, separator, previewContent)

	v.SetContent(combined)
	v.AltScreen = true
	return v
}

func fetchTldrCmd(name string) tea.Cmd {
	return func() tea.Msg {
		out, err := exec.Command("tldr", name).CombinedOutput()
		if err != nil {
			return tldrDoneMsg{err: err}
		}
		return tldrDoneMsg{output: string(out)}
	}
}

type tldrDoneMsg struct {
	output string
	err    error
}