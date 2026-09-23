package tui

import "github.com/clang/cmdtreemap/internal/model"

type TreeNode struct {
	From     string
	Children []*TreeNode
	Rel      *model.Relation
}

// buildCategoryTrees keeps source order and gives each incoming relation its
// own node. Repeated tools terminate a path instead of forming pointer cycles.
func buildCategoryTrees(cat model.Category) []*TreeNode {
	outgoing := make(map[string][]int)
	incoming := make(map[string]bool)
	var order []string
	for i, rel := range cat.Relations {
		if _, ok := outgoing[rel.From]; !ok {
			order = append(order, rel.From)
		}
		outgoing[rel.From] = append(outgoing[rel.From], i)
		incoming[rel.To] = true
	}
	visited := make([]bool, len(cat.Relations))
	var expand func(string, map[string]bool) []*TreeNode
	expand = func(name string, path map[string]bool) []*TreeNode {
		var children []*TreeNode
		for _, i := range outgoing[name] {
			visited[i] = true
			rel := &cat.Relations[i]
			node := &TreeNode{From: rel.To, Rel: rel}
			if !path[rel.To] {
				path[rel.To] = true
				node.Children = expand(rel.To, path)
				delete(path, rel.To)
			}
			children = append(children, node)
		}
		return children
	}
	var roots []*TreeNode
	addRoot := func(name string) {
		roots = append(roots, &TreeNode{From: name, Children: expand(name, map[string]bool{name: true})})
	}
	for _, name := range order {
		if !incoming[name] {
			addRoot(name)
		}
	}
	// Disconnected cycles have no natural root; start at their first source.
	for i, rel := range cat.Relations {
		if !visited[i] {
			addRoot(rel.From)
		}
	}
	return roots
}
