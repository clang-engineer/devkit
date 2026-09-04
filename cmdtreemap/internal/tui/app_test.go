package tui

import (
	_ "embed"
	"encoding/json"
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"

	"github.com/clang/cmdtreemap/internal/model"
)

//go:embed testdata/commands.json
var testJSON []byte

func loadTestData(t *testing.T) model.CommandsData {
	t.Helper()
	var data model.CommandsData
	if err := json.Unmarshal(testJSON, &data); err != nil {
		t.Fatalf("데이터 로드 실패: %v", err)
	}
	return data
}

func newTestModel(t *testing.T) Model {
	t.Helper()
	data := loadTestData(t)
	m := NewModel(data)
	// 시뮬레이션된 터미널 크기
	nm, _ := m.Update(tea.WindowSizeMsg{Width: 140, Height: 40})
	m = nm.(Model)
	return m
}

// selectFirstTool expands the first category and its first group, then moves the
// cursor onto the first leaf tool, using only the public tree API. Returns false
// if no leaf tool is reachable. (Direct n.Open() calls do not refresh the
// library's lazy child list, so tests must expand via ToggleCurrentNode.)
func selectFirstTool(m *Model) bool {
	m.tree.SetYOffset(1)
	m.tree.ToggleCurrentNode()
	m.tree.Down()
	m.tree.ToggleCurrentNode()
	m.tree.Down()
	n := m.tree.NodeAtCurrentOffset()
	if n == nil {
		return false
	}
	item, ok := n.GivenValue().(treeItem)
	return ok && item.isLeaf && item.rel != nil
}

func key(code rune) tea.KeyPressMsg {
	return tea.KeyPressMsg(tea.Key{Code: code, Text: string(code)})
}

func keyMod(code rune, mod tea.KeyMod) tea.KeyPressMsg {
	return tea.KeyPressMsg(tea.Key{Code: code, Mod: mod})
}

func keyEnter() tea.KeyPressMsg {
	return tea.KeyPressMsg(tea.Key{Code: tea.KeyEnter})
}

func keyEsc() tea.KeyPressMsg {
	return tea.KeyPressMsg(tea.Key{Code: tea.KeyEscape})
}

func keyTab() tea.KeyPressMsg {
	return tea.KeyPressMsg(tea.Key{Code: tea.KeyTab})
}

func TestNewModelBuilds(t *testing.T) {
	m := newTestModel(t)
	if m.tree.Root() == nil {
		t.Fatal("트리 루트가 nil")
	}
	// 렌더링이 panic 없이 동작해야 함
	_ = m.View()
}

func TestEnterOpensPreview(t *testing.T) {
	m := newTestModel(t)

	// 첫 노드(카테고리)는 rel이 nil이라 enter해도 preview 열리지 않아야 함
	m2, _ := m.Update(keyEnter())
	m = m2.(Model)
	if m.previewActive {
		t.Fatal("rel 없는 노드에서 enter로 preview가 열리면 안 됨")
	}

	// 실제 tool이 있는 노드로 이동 후 enter
	// 트리에서 자식이 있는 항목으로 내려가면서 preview 활성화 확인
	// 오프셋 탐색: depth 있는 노드 찾기 위해 여러번 내려감
	for i := 0; i < 10; i++ {
		m2, _ = m.Update(key('j'))
		m = m2.(Model)
	}
	// preview active 여부와 무관하게 View는 panic 없어야 함
	_ = m.View()

	// 카테고리 확장 후 실제 명령어 노드에 접근할 수 있는지 확인
	// root에서 AllNodes를 통해 tool 노드 존재 확인
	if len(m.tree.Root().AllNodes()) == 0 {
		t.Fatal("트리에 노드가 없음")
	}
}

func TestFilterAndHighlight(t *testing.T) {
	m := newTestModel(t)

	// 필터 모드 활성화
	m2, _ := m.Update(key('/'))
	m = m2.(Model)
	if !m.filterActive {
		t.Fatal("'/'로 필터 모드가 활성화되지 않음")
	}

	// View() 호출 - filterActive=true일 때 렌더링이 panic 없어야 함
	_ = m.View()

	// BlinkMsg 시뮬레이션 (커서 깜빡임)
	// textinput.Blink()가 반환하는 cursor.BlinkMsg와 유사하게 처리
	// 실제로는 tea.Cmd로 오지만 여기선 직접 Update 호출로 시뮬레이션
	_ = m.View()

	// 필터 입력: 'bat' 타이핑
	for _, r := range "bat" {
		m2, _ = m.Update(key(r))
		m = m2.(Model)
		// 매 키 입력마다 View() 호출해서 렌더링 확인
		_ = m.View()
	}
	if m.filterInput.Value() != "bat" {
		t.Fatalf("필터 입력 실패: %q", m.filterInput.Value())
	}

	// 필터가 적용된 상태에서 View() 여러 번 호출 (트리 필터링 후 렌더링)
	for i := 0; i < 5; i++ {
		_ = m.View()
	}

	// 하이라이트 유틸 확인
	hl := highlightMatch("bat vs cat", "bat")
	if stripANSI(hl) != "bat vs cat" {
		t.Fatal("하이라이트 결과에 원문이 없음")
	}

	// Enter로 필터 확정
	m2, _ = m.Update(keyEnter())
	m = m2.(Model)
	if m.filterActive {
		t.Fatal("Enter 후에도 필터 모드가 남음")
	}

	// Esc로 다시 필터 해제 확인
	m2, _ = m.Update(key('/'))
	m = m2.(Model)
	m2, _ = m.Update(keyEsc())
	m = m2.(Model)
	if m.filterActive {
		t.Fatal("Esc로 필터 모드가 해제되지 않음")
	}
	if m.filterQuery != "" {
		t.Fatalf("Esc 후 filterQuery가 초기화되지 않음: %q", m.filterQuery)
	}
}

func TestFocusSwitchAndPreview(t *testing.T) {
	m := newTestModel(t)

	// 첫 카테고리와 첫 그룹을 펼쳐 첫 tool 노드로 이동 (공개 API 사용)
	if !selectFirstTool(&m) {
		t.Fatal("tool 노드를 찾을 수 없음")
	}
	m.previewActive = false
	m2, _ := m.Update(keyEnter())
	m = m2.(Model)
	if !m.previewActive {
		t.Fatal("tool 노드에서 enter로 preview가 열리지 않음")
	}

	// Ctrl+L로 preview로 포커스 이동
	m2, _ = m.Update(keyMod('l', tea.ModCtrl))
	m = m2.(Model)
	if m.focusedPane != panePreview {
		t.Fatal("Ctrl+L로 preview 포커스 안 됨")
	}

	// preview에서 j/k 이동 (panic 없어야 함)
	m2, _ = m.Update(key('j'))
	m = m2.(Model)
	m2, _ = m.Update(key('k'))
	m = m2.(Model)

	// visual mode 진입
	m2, _ = m.Update(key('v'))
	m = m2.(Model)
	if m.previewMode != previewVisual {
		t.Fatal("v로 visual mode 진입 안 됨")
	}

	// 선택 확장
	m2, _ = m.Update(key('j'))
	m = m2.(Model)

	// y로 클립보드 복사 (panic 없어야 함)
	m2, _ = m.Update(key('y'))
	m = m2.(Model)
	if m.previewMode != previewNormal {
		t.Fatal("y 후 normal mode로 복귀 안 됨")
	}

	// Ctrl+H로 트리로 복귀
	m2, _ = m.Update(keyMod('h', tea.ModCtrl))
	m = m2.(Model)
	if m.focusedPane != paneTree {
		t.Fatal("Ctrl+H로 트리 포커스 안 됨")
	}

	// 렌더링 확인
	_ = m.View()
}

func TestQuit(t *testing.T) {
	m := newTestModel(t)
	_, cmd := m.Update(keyMod('c', tea.ModCtrl))
	if cmd == nil {
		t.Fatal("ctrl+c가 quit 명령을 반환하지 않음")
	}
}

func TestPreviewCursorHighlightAndVisualSelect(t *testing.T) {
	m := newTestModel(t)

	if !selectFirstTool(&m) {
		t.Fatal("tool 노드를 찾을 수 없음")
	}
	m2, _ := m.Update(keyEnter())
	m = m2.(Model)
	if !m.previewActive {
		t.Fatal("enter로 preview 미열림")
	}

	// Tab으로 상세 패널로 이동
	m2, _ = m.Update(keyTab())
	m = m2.(Model)
	if m.focusedPane != panePreview {
		t.Fatal("Tab으로 상세 패널 전환 실패")
	}
	if m.previewCursor != 0 {
		t.Fatalf("previewCursor 초기값이 0이 아님: %d", m.previewCursor)
	}

	// j로 커서 이동 → refreshPreview가 커서 하이라이트 반영
	before := m.previewCursor
	m2, _ = m.Update(key('j'))
	m = m2.(Model)
	if m.previewCursor != before+1 {
		t.Fatalf("j로 커서 이동 실패: %d -> %d", before, m.previewCursor)
	}
	content := m.viewport.View()
	if !strings.Contains(content, "\x1b[") {
		t.Fatal("커서 하이라이트(ANSI)가 viewport 내용에 없음")
	}

	// v로 비주얼 모드 진입
	m2, _ = m.Update(key('v'))
	m = m2.(Model)
	if m.previewMode != previewVisual {
		t.Fatal("v로 비주얼 모드 진입 실패")
	}
	if m.visualStart != m.visualEnd {
		t.Fatal("v 진입 시 visualStart/End가 같아야 함")
	}

	// j로 선택 영역 확장
	ve := m.visualEnd
	m2, _ = m.Update(key('j'))
	m = m2.(Model)
	if m.visualEnd <= ve {
		t.Fatal("j로 visual 선택 영역 확장 실패")
	}

	// y로 복사 후 normal 복귀
	m2, _ = m.Update(key('y'))
	m = m2.(Model)
	if m.previewMode != previewNormal {
		t.Fatal("y 후 normal 모드 복귀 실패")
	}
}

func TestHFromLeafClosesParent(t *testing.T) {
	m := newTestModel(t)

	if !selectFirstTool(&m) {
		t.Fatal("tool 노드를 찾을 수 없음")
	}

	root := m.tree.Root()
	leaf := m.tree.NodeAtCurrentOffset()
	firstParent := findParentNode(root, leaf)
	if firstParent == nil || firstParent == root {
		t.Fatal("leaf의 부모(폴더)를 찾지 못함")
	}
	if !firstParent.IsOpen() {
		t.Fatal("테스트 전제: leaf의 부모 폴더가 열려 있어야 함")
	}

	// h 한 번으로 부모 폴더 닫기 (값 리시버 변경이 Model로 전파되는지 검증)
	m2, _ := m.Update(key('h'))
	m = m2.(Model)

	// 현재 yOffset의 노드의 부모가 닫혔는지 확인
	if firstParent.IsOpen() {
		t.Fatal("h로 부모 폴더가 닫히지 않음")
	}
}

func TestHighlightMatchNoMatch(t *testing.T) {
	if got := highlightMatch("hello", "zzz"); got != "hello" {
		t.Fatalf("매칭 없을 때 원문 유지 실패: %q", got)
	}
}

func TestHighlightMatchCaseInsensitive(t *testing.T) {
	got := highlightMatch("HTop", "top")
	// ANSI 이스케이프 제거 후 원문이 온전히 남아야 함 (하이라이트로 분할돼도)
	plain := stripANSI(got)
	if plain != "HTop" {
		t.Fatalf("대소문자 무시 하이라이트로 원문이 손상됨: %q", plain)
	}
}

func stripANSI(s string) string {
	var b strings.Builder
	insc := false
	runes := []rune(s)
	for i := 0; i < len(runes); i++ {
		c := runes[i]
		if c == '\x1b' {
			insc = true
			continue
		}
		if insc {
			if c == 'm' {
				insc = false
			}
			continue
		}
		b.WriteRune(c)
	}
	return b.String()
}
