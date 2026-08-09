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
    return this.stripTypes(src)
  }

  stripTypes(src: string) {
    return src
      .replace(/^\s*(?:export\s+)?interface\s+[^\n{]*\{[\s\S]*?\n\}/gm, '')
      .replace(/^\s*(?:export\s+)?type\s+[^\n=]+=[^\n;]+;\s*$/gm, '')
      .replace(/\b(?:public|private|protected|readonly|declare|override|implements)\s+/g, '')
      .replace(/(\))\s*:\s*[A-Za-z_$][\w$<>&| ,.]*(?=\s*\{)/g, '$1')
      .replace(/\bas\s+[A-Za-z_$][\w$<>& .]*/g, '')
  }
}

export const tsCompiler = new TypeScriptCompiler()
