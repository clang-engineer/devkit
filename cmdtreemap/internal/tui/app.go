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

// lazygit-inspired color palette
const (
	colorGreen   = "#50FA7B" // active panel border
	colorMuted   = "#3C3C3C" // inactive panel border
	colorBlue    = "#44475A" // selected line background
	colorOrange  = "#FFB86C" // category nodes
	colorCyan    = "#8BE9FD" // group nodes
	colorDefault = "#F8F8F2" // leaf tool nodes
	colorDim     = "#6272A4" // dim / secondary text
	colorPurple  = "#BD93F9" // accents
)

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
	name        string
	catIdx      int
	relIdx      int
	isLeaf      bool
	rel         *model.Relation
	filterQuery string
}

func (i treeItem) String() string {
	name := i.name
	if i.filterQuery != "" {
		name = highlightMatch(name, i.filterQuery)
	}
	if i.isLeaf && i.rel != nil {
		toStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDefault))
		whyStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim))
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
	filterQuery   string
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
	t.SetShowHelp(false)
	t.SetOpenCharacter("▾")
	t.SetClosedCharacter("▸")
	t.SetCursorCharacter("")

	// all folders (categories and groups) start collapsed; enter/space/l open
	// them on demand. Close() also marks each node initialClosed so the closed
	// state is preserved on subsequent child additions.
	collapseAllFolders(t)

	styles := tree.DefaultDarkStyles()
	styles.SelectedNodeStyle = lipgloss.NewStyle().
		Background(lipgloss.Color(colorBlue)).
		Foreground(lipgloss.Color(colorDefault))
	t.SetStyles(styles)

	// The library's setRootStyles installs an EnumeratorStyleFunc that indexes
	// children.At(i) while the renderer shrinks the children list as hidden
	// (filtered) nodes are removed, which panics on re-render. Override it with
	// a static style so filtering + viewport refresh works.
	t.Root().EnumeratorStyle(lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim)))

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

// collapseAllFolders closes every non-root folder and resets the cursor to the
// first category. Used at startup and when exiting filter mode so folders that
// were opened by the search are folded back up.
func collapseAllFolders(t tree.Model) {
	// Close() also marks each node initialClosed so the closed state is
	// preserved on subsequent child additions.
	for _, n := range t.Root().AllNodes() {
		if n != t.Root() && len(n.ChildNodes()) > 0 {
			n.Close()
		}
	}
	// Node.Close() skips the library's internal yOffset recalculation, leaving
	// every node's yOffset stale (as if all folders were open). Force a
	// recalculation through the public API so cursor navigation j/k finds nodes.
	t.SetYOffset(0)
	t.OpenCurrentNode()
	// move the cursor off the (invisible) root line onto the first category.
	if len(t.Root().ChildNodes()) > 0 {
		t.SetYOffset(1)
	}
}

func buildTreeRoot(data model.CommandsData) *tree.Node {
	// empty root name → the root node line is never rendered, so the top-level
	// categories appear as the tree's top items.
	root := tree.Root("")

	for ci, cat := range data.Categories {
		catNode := tree.Root(cat.Name)
		catNode.ItemStyleFunc(func(children tree.Nodes, i int) lipgloss.Style {
			return lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(colorOrange))
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
		return lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(colorCyan))
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
			return lipgloss.NewStyle().Foreground(lipgloss.Color(colorCyan))
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

func (m *Model) applyFilter(root *tree.Node, query string) {
	m.filterQuery = query

	// AllNodes only returns currently visible nodes, but that's fine: the
	// filterQuery field is only used by String() for highlight rendering, and
	// String() is only called on visible nodes anyway.
	for _, node := range root.AllNodes() {
		if item, ok := node.GivenValue().(treeItem); ok {
			item.filterQuery = query
			node.SetValue(item)
		}
	}

	if query == "" {
		for _, node := range root.AllNodes() {
			node.SetHidden(false)
		}
		return
	}

	q := strings.ToLower(query)

	// filterNode traverses each category tree. It opens the node before
	// walking its children so the lazy children list is materialised and
	// deeper nodes become reachable for the search.
	var filterNode func(node *tree.Node) bool
	filterNode = func(node *tree.Node) bool {
		item, _ := node.GivenValue().(treeItem)
		selfMatch := item.name != "" && strings.Contains(strings.ToLower(item.name), q)

		// Materialise lazy children before walking them.
		node.Open()

		anyChild := false
		for _, child := range node.ChildNodes() {
			if filterNode(child) {
				anyChild = true
			}
		}

		match := selfMatch || anyChild
		node.SetHidden(!match)
		return match
	}

	// Process all top-level categories. filterNode's recursive Open() calls
	// materialise deeper lazy children as we go, so each subsequent category
	// traversal reaches more of the tree.
	for _, cat := range root.ChildNodes() {
		filterNode(cat)
	}
}

func (m Model) Init() tea.Cmd { return nil }

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.updateSizes()
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

// updateSizes recomputes the tree/viewport/filter sizes from the current
// window dimensions and filter state.
func (m *Model) updateSizes() {
	treePanelWidth := m.width * 35 / 100
	if treePanelWidth < 4 {
		treePanelWidth = 4
	}
	previewPanelWidth := m.width - treePanelWidth
	panelHeight := m.height - 1
	treeInnerWidth := treePanelWidth - 2
	previewInnerWidth := previewPanelWidth - 2
	treeHeight := panelHeight - 2
	if m.filterActive {
		treeHeight -= 3 // filter bar: top border + input line + bottom border
	}
	m.tree.SetSize(treeInnerWidth, treeHeight)
	m.viewport.SetWidth(previewInnerWidth)
	m.viewport.SetHeight(panelHeight - 2)
	m.filterInput.SetWidth(treeInnerWidth - 2)
}

func (m Model) updateTree(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	if m.filterActive {
		return m.updateFilterMode(msg)
	}

	if m.focusedPane == panePreview {
		return m.updatePreview(msg)
	}

	if msg.Key().Mod&tea.ModCtrl != 0 {
		switch msg.Key().Code {
		case 'l', tea.KeyRight:
			m.focusedPane = panePreview
			m.previewMode = previewNormal
			m.previewCursor = m.viewport.YOffset()
			return m, nil
		}
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
		if !ok {
			return m, nil
		}
		if val.isLeaf && val.rel != nil {
			// Leaf tool: open preview.
			m.previewActive = true
			m.previewCursor = 0
			m.viewport.GotoTop()
			m.explored[[2]int{val.catIdx, val.relIdx}] = true
			m.showTldr = true
			m.tldrOutput = ""
			m.refreshPreview()
			if val.rel.Tldr != "" {
				return m, fetchTldrCmd(val.rel.Tldr)
			}
			return m, nil
		}
		// Non-leaf: toggle expand/collapse.
		m.tree.ToggleCurrentNode()
		m.refreshPreview()
		return m, nil
	case "tab", "ctrl+l":
		m.focusedPane = panePreview
		m.previewMode = previewNormal
		m.previewCursor = m.viewport.YOffset()
		return m, nil
	case "h", "left":
		m = m.closeParent()
		return m, nil
	case "ctrl+h":
		if m.focusedPane == panePreview {
			m.focusedPane = paneTree
			return m, nil
		}
	case "/":
		m.filterActive = true
		m.filterInput.Reset()
		m.updateSizes()
		return m, m.filterInput.Focus()
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

// closeParent closes the parent folder of the currently selected node. From a
// leaf tool or a nested group, h collapses the enclosing folder (matching the
// "h goes up/left" tree convention) rather than only closing the selected node.
// It moves the cursor onto the parent, then closes it via the native tree API so
// yOffsets stay consistent and the cursor remains on the now-collapsed folder.
// It returns the updated Model so the tree state (cursor offset, collapsed
// folders) propagates back to the caller; m is a value type so direct mutation
// here would otherwise be lost.
func (m Model) closeParent() Model {
	current := m.tree.NodeAtCurrentOffset()
	if current == nil {
		return m
	}
	parent := findParentNode(m.tree.Root(), current)
	if parent == nil || parent == m.tree.Root() {
		return m
	}
	m.tree.SetYOffset(parent.YOffset())
	m.tree.CloseCurrentNode()
	m.refreshPreview()
	return m
}

// findParentNode returns the immediate parent of target, or nil if not found.
func findParentNode(node, target *tree.Node) *tree.Node {
	for _, child := range node.ChildNodes() {
		if child == target {
			return node
		}
		if parent := findParentNode(child, target); parent != nil {
			return parent
		}
	}
	return nil
}

func (m Model) updatePreview(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	// Ctrl + h (lowercase): move to tree pane, from any preview mode.
	if msg.Key().Mod&tea.ModCtrl != 0 && (msg.Key().Code == 'h' || msg.Key().Code == tea.KeyBackspace) {
		m.focusedPane = paneTree
		m.previewMode = previewNormal
		return m, nil
	}
	switch m.previewMode {
	case previewVisual:
		return m.updateVisualMode(msg)
	default:
		return m.updatePreviewNormal(msg)
	}
}

func (m Model) updatePreviewNormal(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+h", "backspace", "tab":
		m.focusedPane = paneTree
		m.previewMode = previewNormal
		return m, nil
	case "ctrl+c", "q":
		return m, tea.Quit
	case "j", "down":
		if m.previewCursor < len(m.previewLines)-1 {
			m.previewCursor++
			m.ensureVisible(m.previewCursor)
		}
		m.refreshPreview()
		return m, nil
	case "k", "up":
		if m.previewCursor > 0 {
			m.previewCursor--
			m.ensureVisible(m.previewCursor)
		}
		m.refreshPreview()
		return m, nil
	case "g":
		m.previewCursor = 0
		m.viewport.GotoTop()
		m.refreshPreview()
		return m, nil
	case "G":
		m.previewCursor = len(m.previewLines) - 1
		if m.previewCursor < 0 {
			m.previewCursor = 0
		}
		m.viewport.GotoBottom()
		m.refreshPreview()
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
		m.refreshPreview()
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
		m.refreshPreview()
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

	highlighted := make([]string, len(m.previewLines))
	copy(highlighted, m.previewLines)

	start, end := m.visualStart, m.visualEnd
	if m.previewMode == previewVisual {
		if start > end {
			start, end = end, start
		}
	}
	// normal mode: cursor line only; visual mode: selected range.
	// clamp so the highlight never falls outside the content.
	if start < 0 {
		start = 0
	}
	if end >= len(m.previewLines) {
		end = len(m.previewLines) - 1
	}
	curStart, curEnd := start, end
	if m.previewMode != previewVisual {
		curStart, curEnd = m.previewCursor, m.previewCursor
	}
	if m.focusedPane == panePreview && curStart >= 0 && curStart < len(m.previewLines) {
		for i := curStart; i <= curEnd && i < len(m.previewLines); i++ {
			highlighted[i] = lipgloss.NewStyle().
				Background(lipgloss.Color(colorBlue)).
				Foreground(lipgloss.Color(colorDefault)).
				Render(m.previewLines[i])
		}
	}
	m.viewport.SetContent(strings.Join(highlighted, "\n"))
}

func (m Model) buildPreviewContent(d *model.Relation) string {
	var b strings.Builder

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(colorPurple))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(colorOrange))
	valueStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDefault))
	helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim))

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
	b.WriteString("\n  " + lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim)).Render(d.Relation))
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
		b.WriteString(helpStyle.Render("j/k:이동 v:선택 y:복사 Tab:트리 t:tldr Esc:뒤로"))
	} else {
		b.WriteString(helpStyle.Render("[Enter] 선택  [/] 필터  Tab:미리보기  [q] 종료"))
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
		m.applyFilter(m.tree.Root(), "")
		// Fold back up any folders the search opened.
		collapseAllFolders(m.tree)
		m.updateSizes()
		return m, nil
	case "enter":
		m.filterActive = false
		m.filterInput.Blur()
		m.updateSizes()
		return m, nil
	case "ctrl+u":
		m.filterInput.Reset()
		m.applyFilter(m.tree.Root(), "")
		m.tree.SetYOffset(m.tree.YOffset())
		return m, nil
	}

	var cmd tea.Cmd
	m.filterInput, cmd = m.filterInput.Update(msg)
	query := m.filterInput.Value()
	m.applyFilter(m.tree.Root(), query)
	m.tree.SetYOffset(m.tree.YOffset())
	return m, cmd
}

// renderPanel draws a rounded-border panel with an embedded title in the top
// border, e.g. "╭─ cmdtreemap ────────╮".
func renderPanel(title, content string, width, height int, active bool) string {
	borderColor := lipgloss.Color(colorMuted)
	if active {
		borderColor = lipgloss.Color(colorGreen)
	}
	borderStyle := lipgloss.NewStyle().Foreground(borderColor).Bold(active)

	innerWidth := width - 2
	if innerWidth < 0 {
		innerWidth = 0
	}

	titleStr := " " + title + " "
	titleWidth := lipgloss.Width(titleStr)
	dashCount := innerWidth - titleWidth
	if dashCount < 0 {
		dashCount = 0
	}
	top := borderStyle.Render("╭─" + titleStr + strings.Repeat("─", dashCount) + "╮")

	contentLines := strings.Split(content, "\n")
	var lines []string
	lines = append(lines, top)
	for i := 0; i < height-2; i++ {
		var line string
		if i < len(contentLines) {
			line = contentLines[i]
		}
		line = lipgloss.NewStyle().Width(innerWidth).Render(line)
		lines = append(lines, borderStyle.Render("│")+line+borderStyle.Render("│"))
	}
	bottom := borderStyle.Render("╰" + strings.Repeat("─", innerWidth) + "╯")
	lines = append(lines, bottom)

	return strings.Join(lines, "\n")
}

// statusBar renders the bottom keybinding hints line.
func statusBar() string {
	keyStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorGreen)).Bold(true)
	descStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim))

	hint := func(k, rest string) string {
		return keyStyle.Render("["+k+"]") + descStyle.Render(rest)
	}

	return hint("q", "uit") + "  " +
		hint("enter", "expand") + "  " +
		hint("/", "filter") + "  " +
		hint("tab", "switch") + "  " +
		hint("t", "tldr")
}

func (m Model) View() tea.View {
	var v tea.View

	treePanelWidth := m.width * 35 / 100
	if treePanelWidth < 4 {
		treePanelWidth = 4
	}
	previewPanelWidth := m.width - treePanelWidth
	panelHeight := m.height - 1
	if panelHeight < 3 {
		panelHeight = 3
	}

	// 트리 패널
	treeContent := m.tree.View()
	if m.filterActive {
		prefix := lipgloss.NewStyle().Foreground(lipgloss.Color(colorOrange)).Bold(true).Render("/")
		bar := lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), true, true, true, true).
			BorderForeground(lipgloss.Color(colorOrange)).
			Width(treePanelWidth - 4).
			Render(prefix + m.filterInput.View())
		treeContent = lipgloss.JoinVertical(lipgloss.Left, treeContent, bar)
	}
	treePanel := renderPanel("cmdtreemap", treeContent, treePanelWidth, panelHeight, m.focusedPane == paneTree)

	// 미리보기 패널
	var previewContent string
	if m.previewActive {
		m.refreshPreview()
		previewContent = m.viewport.View()
	} else {
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim))
		previewContent = helpStyle.Render("명령어를 선택하고 Enter로 상세 보기")
	}
	previewPanel := renderPanel("상세 정보", previewContent, previewPanelWidth, panelHeight, m.focusedPane == panePreview)

	combined := lipgloss.JoinHorizontal(lipgloss.Top, treePanel, previewPanel)

	status := statusBar()

	v.SetContent(lipgloss.JoinVertical(lipgloss.Left, combined, status))
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
