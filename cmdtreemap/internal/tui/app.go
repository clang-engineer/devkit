package tui

import (
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"unicode"

	"charm.land/bubbles/v2/cursor"
	"charm.land/bubbles/v2/textinput"
	"charm.land/bubbles/v2/tree"
	"charm.land/bubbles/v2/viewport"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"

	"github.com/clang/cmdtreemap/internal/model"
)

// Vim-inspired color palette
const (
	colorGreen   = "#98c379" // active panel border
	colorMuted   = "#3b4252" // inactive panel border
	colorBlue    = "#3b4261" // selected line background
	colorOrange  = "#d19a66" // category nodes
	colorCyan    = "#56b6c2" // group nodes
	colorDefault = "#e5c07b" // leaf tool nodes
	colorDim     = "#5c6370" // dim / secondary text
	colorPurple  = "#c678dd" // accents
	colorCursor  = "#e06c75" // block cursor
	colorGutter  = "#4b5263" // line numbers
	colorGutterCur = "#e06c75" // current line number
	colorStatusBg = "#2c323c" // status bar background
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
	previewSearch
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
	previewCol    int
	visualStart   int
	visualEnd     int
	previewLines  []string
	rawLines      []string
	pendingG      bool
	searchQuery   string
	searchActive  bool
	searchInput   textinput.Model
	tldrOutput    string
	showTldr      bool
	tldrLine      int
	urlLine       int
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

	si := textinput.New()
	si.Placeholder = "검색..."
	si.CharLimit = 30

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
	vp.SetContent("")

	return Model{
		data:        data,
		tree:        t,
		viewport:    vp,
		textInput:   ti,
		filterInput: fi,
		searchInput: si,
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

// findNextVisibleOffset scans from the current cursor position in the given
// direction and returns the first offset whose node is not hidden. Falls back
// to the opposite direction if no visible node exists in the requested
// direction. Returns the current offset if no visible node is found at all.
func (m *Model) findNextVisibleOffset(direction int) int {
	current := m.tree.YOffset()
	total := m.tree.Root().Size()

	// Primary: scan in the requested direction.
	for offset := current + direction; offset >= 0 && offset < total; offset += direction {
		if node := m.tree.Node(offset); node != nil && !node.Hidden() {
			return offset
		}
	}
	// Fallback: scan the opposite direction.
	for offset := current - direction; offset >= 0 && offset < total; offset -= direction {
		if node := m.tree.Node(offset); node != nil && !node.Hidden() {
			return offset
		}
	}
	return current
}

// skipHiddenIfNeeded moves the cursor off a hidden node to the nearest visible
// one. direction should match the movement that just occurred (+1 for down,
// -1 for up). No-op when the cursor is already on a visible node.
func (m *Model) skipHiddenIfNeeded(direction int) {
	if node := m.tree.NodeAtCurrentOffset(); node == nil || !node.Hidden() {
		return
	}
	target := m.findNextVisibleOffset(direction)
	if target != m.tree.YOffset() {
		m.tree.SetYOffset(target)
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
		if m.searchActive {
			return m.updateSearchMode(msg)
		}
		return m.updateTree(msg)
	case cursor.BlinkMsg:
		if m.filterActive || m.searchActive {
			var cmd tea.Cmd
			if m.filterActive {
				m.filterInput, cmd = m.filterInput.Update(msg)
			} else {
				m.searchInput, cmd = m.searchInput.Update(msg)
			}
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
	case lessDoneMsg:
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
			m.explored[[2]int{val.catIdx, val.relIdx}] = true
			m.focusedPane = panePreview
			m.previewMode = previewNormal
			m.previewCursor = 0
			m.previewCol = 0
			m.refreshPreview()
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
		if m.focusedPane == panePreview {
			m.focusedPane = paneTree
			m.showTldr = false
			m.tldrOutput = ""
			return m, nil
		}
	}

	var cmd tea.Cmd
	if m.filterQuery != "" {
		prevY := m.tree.YOffset()
		m.tree, cmd = m.tree.Update(msg)
		if newY := m.tree.YOffset(); newY != prevY {
			dir := 1
			if newY < prevY {
				dir = -1
			}
			m.skipHiddenIfNeeded(dir)
		}
	} else {
		m.tree, cmd = m.tree.Update(msg)
	}
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
	if m.pendingG {
		m.pendingG = false
		if msg.String() == "g" {
			m.previewCursor = 0
			m.previewCol = 0
			m.viewport.GotoTop()
			m.refreshPreview()
			return m, nil
		}
		return m, nil
	}

	switch msg.String() {
	case "esc":
		return m, nil
	case "ctrl+h", "tab":
		m.focusedPane = paneTree
		m.previewMode = previewNormal
		return m, nil
	case "ctrl+c", "q":
		return m, tea.Quit
	case "enter":
		node := m.tree.NodeAtCurrentOffset()
		if node != nil {
			if val, ok := node.GivenValue().(treeItem); ok && val.rel != nil {
				if m.tldrLine >= 0 && m.previewCursor == m.tldrLine && val.rel.Tldr != "" {
					if m.showTldr {
						m.showTldr = false
						m.tldrOutput = ""
					} else {
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
					m.refreshPreview()
					return m, nil
				}
				if m.urlLine >= 0 && m.previewCursor == m.urlLine && val.rel.URL != "" {
					return m, openURLCmd(val.rel.URL)
				}
			}
		}
		return m, nil
	case "j", "down":
		if m.previewCursor < len(m.previewLines)-1 {
			m.previewCursor++
			if len(m.rawLines) > 0 {
				m.previewCol = clampCol(m.rawLines[m.previewCursor], m.previewCol)
			}
			m.ensureVisible(m.previewCursor)
		}
		m.refreshPreview()
		return m, nil
	case "k", "up":
		if m.previewCursor > 0 {
			m.previewCursor--
			if len(m.rawLines) > 0 {
				m.previewCol = clampCol(m.rawLines[m.previewCursor], m.previewCol)
			}
			m.ensureVisible(m.previewCursor)
		}
		m.refreshPreview()
		return m, nil
	case "g":
		m.pendingG = true
		return m, nil
	case "G":
		m.previewCursor = len(m.previewLines) - 1
		if m.previewCursor < 0 {
			m.previewCursor = 0
		}
		if len(m.rawLines) > 0 {
			m.previewCol = clampCol(m.rawLines[m.previewCursor], m.previewCol)
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
		if len(m.rawLines) > 0 {
			m.previewCol = clampCol(m.rawLines[m.previewCursor], m.previewCol)
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
		if len(m.rawLines) > 0 {
			m.previewCol = clampCol(m.rawLines[m.previewCursor], m.previewCol)
		}
		m.refreshPreview()
		return m, nil
	case "v":
		m.previewMode = previewVisual
		m.visualStart = m.previewCursor
		m.visualEnd = m.previewCursor
		m.refreshPreview()
		return m, nil
	case "V":
		m.previewMode = previewVisual
		m.visualStart = m.previewCursor
		m.visualEnd = m.previewCursor
		m.refreshPreview()
		return m, nil
	case "y":
		if len(m.rawLines) > 0 && m.previewCursor < len(m.rawLines) {
			m.copyToClipboard(m.rawLines[m.previewCursor])
		}
		return m, nil
	case "w":
		if len(m.rawLines) > 0 && m.previewCursor < len(m.rawLines) {
			m.previewCol = wordForward(m.rawLines[m.previewCursor], m.previewCol)
			m.refreshPreview()
		}
		return m, nil
	case "b":
		if len(m.rawLines) > 0 && m.previewCursor < len(m.rawLines) {
			m.previewCol = wordBackward(m.rawLines[m.previewCursor], m.previewCol)
			m.refreshPreview()
		}
		return m, nil
	case "e":
		if len(m.rawLines) > 0 && m.previewCursor < len(m.rawLines) {
			m.previewCol = wordEnd(m.rawLines[m.previewCursor], m.previewCol)
			m.refreshPreview()
		}
		return m, nil
	case "0":
		m.previewCol = 0
		m.refreshPreview()
		return m, nil
	case "$":
		if len(m.rawLines) > 0 && m.previewCursor < len(m.rawLines) {
			runes := []rune(m.rawLines[m.previewCursor])
			m.previewCol = len(runes) - 1
			if m.previewCol < 0 {
				m.previewCol = 0
			}
			m.refreshPreview()
		}
		return m, nil
	case "/":
		m.searchActive = true
		m.searchInput.Reset()
		return m, m.searchInput.Focus()
	case "n":
		if m.searchQuery != "" {
			m.viewport.HighlightNext()
			m.refreshPreview()
		}
		return m, nil
	case "N":
		if m.searchQuery != "" {
			m.viewport.HighlightPrevious()
			m.refreshPreview()
		}
		return m, nil
	case "backspace":
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

func isVimWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

func wordForward(line string, col int) int {
	runes := []rune(line)
	n := len(runes)
	if col >= n-1 {
		return n - 1
	}
	i := col
	// skip current word
	if isVimWordChar(runes[i]) {
		for i < n && isVimWordChar(runes[i]) {
			i++
		}
	} else if !unicode.IsSpace(runes[i]) {
		for i < n && !unicode.IsSpace(runes[i]) && !isVimWordChar(runes[i]) {
			i++
		}
	}
	// skip whitespace
	for i < n && unicode.IsSpace(runes[i]) {
		i++
	}
	if i >= n {
		return n - 1
	}
	return i
}

func wordBackward(line string, col int) int {
	runes := []rune(line)
	if col <= 0 {
		return 0
	}
	i := col - 1
	// skip whitespace
	for i > 0 && unicode.IsSpace(runes[i]) {
		i--
	}
	// skip word
	if isVimWordChar(runes[i]) {
		for i > 0 && isVimWordChar(runes[i-1]) {
			i--
		}
	} else if !unicode.IsSpace(runes[i]) {
		for i > 0 && !unicode.IsSpace(runes[i-1]) && !isVimWordChar(runes[i-1]) {
			i--
		}
	}
	return i
}

func wordEnd(line string, col int) int {
	runes := []rune(line)
	n := len(runes)
	if col >= n-1 {
		return n - 1
	}
	i := col + 1
	// skip whitespace
	for i < n && unicode.IsSpace(runes[i]) {
		i++
	}
	if i >= n {
		return n - 1
	}
	// move to end of word
	if isVimWordChar(runes[i]) {
		for i < n-1 && isVimWordChar(runes[i+1]) {
			i++
		}
	} else if !unicode.IsSpace(runes[i]) {
		for i < n-1 && !unicode.IsSpace(runes[i+1]) && !isVimWordChar(runes[i+1]) {
			i++
		}
	}
	return i
}

func clampCol(line string, col int) int {
	runes := []rune(line)
	maxCol := len(runes) - 1
	if maxCol < 0 {
		maxCol = 0
	}
	if col < 0 {
		return 0
	}
	if col > maxCol {
		return maxCol
	}
	return col
}

func stripANSI(s string) string {
	re := regexp.MustCompile(`\x1b\[[0-9;]*m`)
	return re.ReplaceAllString(s, "")
}

func (m *Model) refreshPreview() {
	m.refreshPreviewContent()
	m.scrollToCursor()
}

func (m *Model) refreshPreviewContent() {
	node := m.tree.NodeAtCurrentOffset()
	if node == nil {
		m.previewLines = []string{"명령어를 선택하세요"}
		m.rawLines = m.previewLines
		m.viewport.SetContent(strings.Join(m.previewLines, "\n"))
		m.setLineNumbers()
		return
	}

	val, ok := node.GivenValue().(treeItem)
	if !ok || val.rel == nil {
		m.previewLines = []string{"상세 정보가 없습니다"}
		m.rawLines = m.previewLines
		m.viewport.SetContent(strings.Join(m.previewLines, "\n"))
		m.setLineNumbers()
		return
	}

	d := val.rel
	content := m.buildPreviewContent(d)
	m.previewLines = strings.Split(content, "\n")

	m.rawLines = make([]string, len(m.previewLines))
	for i, l := range m.previewLines {
		m.rawLines[i] = stripANSI(l)
	}

	highlighted := make([]string, len(m.previewLines))
	copy(highlighted, m.previewLines)

	start, end := m.visualStart, m.visualEnd
	if m.previewMode == previewVisual {
		if start > end {
			start, end = end, start
		}
	}
	if start < 0 {
		start = 0
	}
	if end >= len(m.previewLines) {
		end = len(m.previewLines) - 1
	}

	if m.focusedPane == panePreview && m.previewMode == previewVisual {
		for i := start; i <= end && i < len(m.previewLines); i++ {
			highlighted[i] = lipgloss.NewStyle().
				Background(lipgloss.Color(colorBlue)).
				Foreground(lipgloss.Color(colorDefault)).
				Render(m.previewLines[i])
		}
	} else if m.focusedPane == panePreview && m.previewCursor >= 0 && m.previewCursor < len(m.previewLines) {
		curLine := m.previewLines[m.previewCursor]
		if len(m.rawLines) > 0 && m.previewCursor < len(m.rawLines) {
			rawLine := m.rawLines[m.previewCursor]
			col := m.previewCol
			if col >= len(rawLine) {
				col = len(rawLine) - 1
			}
			if col < 0 {
				col = 0
			}
			highlighted[m.previewCursor] = insertBlockCursor(curLine, rawLine, col)
		} else {
			highlighted[m.previewCursor] = lipgloss.NewStyle().
				Background(lipgloss.Color(colorBlue)).
				Foreground(lipgloss.Color(colorDefault)).
				Render(curLine)
		}
	}

	m.viewport.SetContent(strings.Join(highlighted, "\n"))
	m.setLineNumbers()
}

func (m *Model) setLineNumbers() {
	lines := m.previewLines
	cursor := m.previewCursor
	total := len(lines)

	m.viewport.LeftGutterFunc = func(ctx viewport.GutterContext) string {
		idx := ctx.Index
		if idx < 0 || idx >= total {
			return ""
		}
		numStr := fmt.Sprintf("%4d", idx+1)
		if m.focusedPane == panePreview && idx == cursor {
			return lipgloss.NewStyle().
				Foreground(lipgloss.Color(colorGutterCur)).
				Bold(true).
				Render(numStr) + " "
		}
		return lipgloss.NewStyle().
			Foreground(lipgloss.Color(colorGutter)).
			Render(numStr) + " "
	}
}

func (m *Model) scrollToCursor() {
	if m.previewCursor < 0 || m.previewCursor >= len(m.rawLines) {
		return
	}
	line := m.rawLines[m.previewCursor]
	runes := []rune(line)
	if len(runes) == 0 {
		return
	}
	col := m.previewCol
	if col >= len(runes) {
		col = len(runes) - 1
	}
	if col < 0 {
		col = 0
	}

	// Calculate visual width from start of line to cursor
	visPos := 0
	for i := 0; i < col && i < len(runes); i++ {
		visPos += lipgloss.Width(string(runes[i]))
	}
	// Add half cursor width for centering
	cursorWidth := lipgloss.Width(string(runes[col]))

	vpWidth := m.viewport.Width()
	// maxWidth() accounts for gutter, but we calculate manually for safety
	var gutterW int
	if m.viewport.LeftGutterFunc != nil {
		gutterW = lipgloss.Width(m.viewport.LeftGutterFunc(viewport.GutterContext{}))
	}
	availWidth := vpWidth - gutterW
	if availWidth < 1 {
		availWidth = 1
	}

	xOff := m.viewport.XOffset()
	if visPos < xOff {
		m.viewport.SetXOffset(visPos)
	} else if visPos+cursorWidth > xOff+availWidth {
		m.viewport.SetXOffset(visPos + cursorWidth - availWidth)
	}
}

func insertBlockCursor(styledLine, rawLine string, col int) string {
	rawRunes := []rune(rawLine)
	if len(rawRunes) == 0 {
		return styledLine
	}
	if col >= len(rawRunes) {
		col = len(rawRunes) - 1
	}
	if col < 0 {
		col = 0
	}

	// Find visual position in styled line by counting visible characters
	cursorPos := 0
	inEscape := false
	vIdx := 0
	for i := 0; i < len(styledLine); i++ {
		if styledLine[i] == '\x1b' {
			inEscape = true
			continue
		}
		if inEscape {
			if styledLine[i] == 'm' {
				inEscape = false
			}
			continue
		}
		if vIdx == col {
			cursorPos = i
			break
		}
		vIdx++
	}

	// If col is at end of line, place cursor on last character
	if vIdx < col {
		// Find last visible character
		lastVis := 0
		inEsc := false
		for i := 0; i < len(styledLine); i++ {
			if styledLine[i] == '\x1b' {
				inEsc = true
				continue
			}
			if inEsc {
				if styledLine[i] == 'm' {
					inEsc = false
				}
				continue
			}
			lastVis = i
		}
		cursorPos = lastVis
	}

	// Find end of the character at cursorPos
	charEnd := cursorPos + 1
	for charEnd < len(styledLine) && styledLine[charEnd] != '\x1b' && styledLine[charEnd] != '\n' {
		charEnd++
	}

	cursorChar := styledLine[cursorPos:charEnd]
	cursorStyle := lipgloss.NewStyle().
		Background(lipgloss.Color(colorCursor)).
		Foreground(lipgloss.Color("#1a1b26")).
		Bold(true)

	return styledLine[:cursorPos] + cursorStyle.Render(cursorChar) + styledLine[charEnd:]
}

func (m Model) buildPreviewContent(d *model.Relation) string {
	var b strings.Builder

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(colorPurple))
	labelStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color(colorOrange))
	valueStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDefault))
	helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorDim))
	linkStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorCyan)).Underline(true)

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

	// tldr line
	if d.Tldr != "" {
		m.tldrLine = len(strings.Split(b.String(), "\n"))
		tldrLabel := "tldr: " + d.Tldr
		if m.showTldr {
			tldrLabel += " [Enter] 닫기"
		} else {
			tldrLabel += " [Enter] 열기"
		}
		b.WriteString(labelStyle.Render(tldrLabel))
		b.WriteString("\n")
		if m.showTldr && m.tldrOutput != "" {
			b.WriteString(m.tldrOutput)
		} else if m.showTldr {
			b.WriteString(helpStyle.Render("로딩 중..."))
		}
		b.WriteString("\n\n")
	} else {
		m.tldrLine = -1
	}

	// URL line
	if d.URL != "" {
		m.urlLine = len(strings.Split(b.String(), "\n"))
		b.WriteString(labelStyle.Render("공식 문서"))
		b.WriteString("\n  " + linkStyle.Render(d.URL) + "  " + helpStyle.Render("[Enter] 브라우저에서 열기"))
		b.WriteString("\n\n")
	} else {
		m.urlLine = -1
	}

	if m.focusedPane == panePreview {
		modeLabel := "NORMAL"
		modeStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorGreen)).Bold(true)
		if m.previewMode == previewVisual {
			modeLabel = "VISUAL"
			modeStyle = lipgloss.NewStyle().Foreground(lipgloss.Color(colorPurple)).Bold(true)
		}
		if m.searchActive {
			modeLabel = "SEARCH"
			modeStyle = lipgloss.NewStyle().Foreground(lipgloss.Color(colorOrange)).Bold(true)
		}
		b.WriteString(modeStyle.Render(" " + modeLabel + " "))
		b.WriteString(helpStyle.Render("  j/k  w/b/e  0/$  gg/G  v  y  /  n/N  t  Esc  ⌫"))
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
		// Move the cursor onto the first visible node so the user can select
		// a search result immediately instead of starting on the hidden root.
		m.tree.SetYOffset(0)
		m.skipHiddenIfNeeded(1)
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
	// Position the cursor on the first visible node after the root.
	m.tree.SetYOffset(0)
	m.skipHiddenIfNeeded(1)
	return m, cmd
}

func (m Model) updateSearchMode(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.searchActive = false
		m.searchInput.Blur()
		m.searchInput.Reset()
		m.searchQuery = ""
		m.viewport.ClearHighlights()
		m.refreshPreview()
		return m, nil
	case "enter":
		m.searchActive = false
		m.searchInput.Blur()
		query := m.searchInput.Value()
		if query != "" {
			m.searchQuery = query
			// Build highlight matches from all raw lines
			re, err := regexp.Compile(strings.ToLower(query))
			if err != nil {
				m.refreshPreview()
				return m, nil
			}
			content := strings.Join(m.rawLines, "\n")
			var matches [][]int
			for _, loc := range re.FindAllStringIndex(strings.ToLower(content), -1) {
				matches = append(matches, loc)
			}
			m.viewport.SetHighlights(matches)
			m.viewport.HighlightNext()
		} else {
			m.searchQuery = ""
			m.viewport.ClearHighlights()
		}
		m.refreshPreview()
		return m, nil
	}

	var cmd tea.Cmd
	m.searchInput, cmd = m.searchInput.Update(msg)
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
		return keyStyle.Render(k) + descStyle.Render(rest)
	}

	return hint("q", "uit") + "  " +
		hint("Enter", " expand") + "  " +
		hint("/", " filter") + "  " +
		hint("Tab", " switch") + "  " +
		hint("t", " tldr")
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
	m.refreshPreview()
	previewContent := m.viewport.View()
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

func openURLCmd(url string) tea.Cmd {
	return func() tea.Msg {
		exec.Command("open", url).Run()
		return nil
	}
}

type tldrDoneMsg struct {
	output string
	err    error
}

type lessDoneMsg struct {
	err error
}

func buildPreviewText(d *model.Relation) string {
	var b strings.Builder

	b.WriteString(d.From + " → " + d.To)
	b.WriteString("\n\n")

	b.WriteString("문제\n  " + d.Problem)
	b.WriteString("\n\n")

	b.WriteString("해결\n  " + d.Solution)
	b.WriteString("\n\n")

	if d.Boundary != "" {
		b.WriteString("경계\n  " + d.Boundary)
		b.WriteString("\n\n")
	}

	b.WriteString("관계 유형\n  " + d.Relation)
	b.WriteString("\n\n")

	if d.Install != "" {
		b.WriteString("설치\n  $ " + d.Install)
		b.WriteString("\n\n")
	}

	if d.Tldr != "" {
		b.WriteString("tldr: " + d.Tldr)
		b.WriteString("\n\n")
	}

	if d.URL != "" {
		b.WriteString("공식 문서\n  " + d.URL)
		b.WriteString("\n\n")
	}

	return b.String()
}

func openInLess(d *model.Relation) tea.Cmd {
	content := buildPreviewText(d)
	cmd := exec.Command("less", "-R", "-S", "-N")
	cmd.Stdin = strings.NewReader(content)
	return tea.ExecProcess(cmd, func(err error) tea.Msg {
		return lessDoneMsg{err: err}
	})
}
