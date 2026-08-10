import type * as TS from 'typescript'
import { stripTypes } from './stripTypes'

// The runtime TypeScript namespace is loaded from the CDN into window.ts; the
// local `typescript` package only provides types (import type is erased).
type TsGlobal = { ts?: typeof TS }

export class TypeScriptCompiler {
  ready = false

  async load() {
    if (this.ready || (window as unknown as TsGlobal).ts) {
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
    const ts = (window as unknown as TsGlobal).ts
    if (ts && typeof ts.transpileModule === 'function') {
      try {
        return ts.transpileModule(src, {
          compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS },
        }).outputText
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const err = new Error(`TS Error: ${msg}`) as Error & { cause?: unknown }
        err.cause = e
        throw err
      }
    }
    return stripTypes(src)
  }
}

export const tsCompiler = new TypeScriptCompiler()
