package tui

import "github.com/clang/cmdtreemap/internal/model"

type TreeNode struct {
	From     string
	Children []*TreeNode
	Rel      *model.Relation
}

// buildCategoryTrees preserves the source order of roots and relations.
func buildCategoryTrees(cat model.Category) []*TreeNode {
	type entry struct {
		node     *TreeNode
		incoming bool
	}
	nodes := make(map[string]*entry)
	var order []string
	get := func(name string) *entry {
		if e, ok := nodes[name]; ok {
			return e
		}
		e := &entry{node: &TreeNode{From: name}}
		nodes[name] = e
		order = append(order, name)
		return e
	}
	for i := range cat.Relations {
		rel := &cat.Relations[i]
		from, to := get(rel.From), get(rel.To)
		to.incoming = true
		to.node.Rel = rel
		from.node.Children = append(from.node.Children, to.node)
	}
	var roots []*TreeNode
	for _, name := range order {
		if e := nodes[name]; !e.incoming {
			roots = append(roots, e.node)
		}
	}
	return roots
}
