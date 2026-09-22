//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/clang/cmdtreemap/internal/model"
)

func main() {
	var data model.CommandsData
	_ = data // The web adapter will consume the shared model in the next spike.

	ready := js.FuncOf(func(this js.Value, args []js.Value) any {
		return "ready"
	})
	js.Global().Set("cmdtreemapReady", ready)
	js.Global().Set("cmdtreemapWasmReady", true)
	defer ready.Release()

	select {}
}
