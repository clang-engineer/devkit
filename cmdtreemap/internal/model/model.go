package model

type Relation struct {
	From       string `json:"from"`
	To         string `json:"to"`
	Why        string `json:"why"`
	Group      string `json:"group"`
	Problem    string `json:"problem"`
	Solution   string `json:"solution"`
	Relation   string `json:"relation"` // alternative, specialized, complement, successor
	Boundary   string `json:"boundary,omitempty"`
	Install    string `json:"install,omitempty"`
	Tldr       string `json:"tldr,omitempty"`
}

type Category struct {
	Name        string     `json:"name"`
	Why         string     `json:"why"`
	Relations   []Relation `json:"relations"`
}

type CommandsData struct {
	Title      string     `json:"title"`
	Philosophy string     `json:"philosophy"`
	Categories []Category `json:"categories"`
}
