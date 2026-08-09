import { stripTypes } from "./stripTypes"

export class TypeScriptCompiler {
  ready = false

  async load() {
    if (this.ready || (window as any).ts) {
      this.ready = true
      return
    }
    return new Promise<void>((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.min.js'
      script.onload = () => {
        this.ready = true
        resolve()
      }
      script.onerror = () => {
        this.ready = false
        resolve()
      }
      document.head.appendChild(script)
    })
  }

  compile(src: string) {
    // if typescript loaded use transpileModule, else fallback to stripping types
    const ts = (window as any).ts
    if (ts && typeof ts.transpileModule === 'function') {
      try {
        return ts.transpileModule(src, {
          compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS },
        }).outputText
      } catch (e: any) {
        throw new Error(`TS Error: ${e.message}`)
      }
    }
    return stripTypes(src)
  }
}

export const tsCompiler = new TypeScriptCompiler()
