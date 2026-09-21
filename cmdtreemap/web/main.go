//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/clang/cmdtreemap/internal/model"
)

func main() {
	var data model.CommandsData
	_ = data // The web adapter will consume the shared model in the next spike.

	document := js.Global().Get("document")
	status := document.Call("getElementById", "status")
	status.Set("textContent", "cmdtreemap WASM adapter loaded")

	ready := js.FuncOf(func(this js.Value, args []js.Value) any {
		return "ready"
	})
	js.Global().Set("cmdtreemapReady", ready)
	defer ready.Release()

	select {}
}
