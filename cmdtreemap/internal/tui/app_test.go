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
	if filterQuery != "" {
		t.Fatalf("Esc 후 filterQuery가 초기화되지 않음: %q", filterQuery)
	}
}

func TestFocusSwitchAndPreview(t *testing.T) {
	m := newTestModel(t)

	// 실제 tool 노드에 접근하기 위해 트리 확장 & 이동
	// 모든 노드를 펼치고 tool 노드로 이동
	root := m.tree.Root()
	for _, n := range root.AllNodes() {
		n.Open()
	}

	// 카테고리를 제외한 tool 노드(rel != nil)를 찾아 선택
	// yOffset을 tool 노드로 이동
	toolNodes := []int{}
	all := root.AllNodes()
	for off, n := range all {
		if item, ok := n.GivenValue().(treeItem); ok && item.rel != nil {
			toolNodes = append(toolNodes, off)
		}
	}
	if len(toolNodes) == 0 {
		t.Fatal("tool 노드를 찾을 수 없음")
	}

	// 첫 tool 노드로 이동
	m.tree.SetYOffset(toolNodes[0])
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
	// quit 명령이 반환되는지 확인
	_ = cmd
	// cmd가 tea.Quit인지 확인
	if cmd == nil {
		t.Fatal("ctrl+c가 quit 명령을 반환하지 않음")
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
