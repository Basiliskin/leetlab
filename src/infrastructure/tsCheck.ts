// Semantic (type) checking for the TS editor. Uses the TypeScript compiler
// that tsCompiler already loads from the CDN at runtime; lib.d.ts files are
// fetched lazily from jsDelivr and cached, mirroring that same approach.
// Falls back to nothing useful offline - callers degrade to parser-based lint.
//
// The host also serves a synthetic ambient .d.ts (sandboxAmbient.ts)
// declaring the 5 sandbox service globals with their real types, so
// TS-mode solution code referencing them gets no false diagnostics.

const LIB_BASE = "https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/"

import {
  AMBIENT_FILE_NAME,
  AMBIENT_TEXT,
  SERVICE_TEXT_PATHS,
} from './sandboxAmbient'

// Reference directives look like `lib="es2021.intl"` but map to the file
// `lib.es2021.intl.d.ts`; seeds may already carry the full `lib.*.d.ts` name.
const libFetch = new Map<string, Promise<string>>()
const libTexts = new Map<string, string>()

function fetchLib(full: string): Promise<string> {
  let p = libFetch.get(full)
  if (!p) {
    p = fetch(LIB_BASE + full).then((r) => {
      if (!r.ok) throw new Error(`lib ${full}: HTTP ${r.status}`)
      return r.text()
    })
    libFetch.set(full, p)
  }
  return p
}

// Resolve the transitive `/// <reference lib="..." />` closure of the
// requested libs so getScriptSnapshot can serve them synchronously. Text is
// cached under the full file name (`lib.es2020.d.ts`), which is what the
// compiler's host queries use.
async function ensureLibs(seed: string[]): Promise<void> {
  const stack = [...seed]
  while (stack.length) {
    const full = stack.pop()!
    if (libTexts.has(full)) continue
    const text = await fetchLib(full)
    libTexts.set(full, text)
    for (const m of text.matchAll(/\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/g)) {
      const child = `lib.${m[1]}.d.ts`
      if (!libTexts.has(child)) stack.push(child)
    }
  }
}

// The host receives lib names in several shapes: `/lib.es2020.d.ts`,
// `/node_modules/@typescript/lib-es2020.d.ts`. Normalize to the cache key.
function normLibName(name: string): string | undefined {
  if (!name.endsWith(".d.ts")) return undefined
  const base = name.split("/").pop()!
  if (base.startsWith("lib-")) return "lib." + base.slice(4)
  return base
}

export interface TsDiag {
  from: number
  to: number
  severity: "error" | "warning"
  message: string
}

let service: import('typescript').LanguageService | null = null
let version = 0
let currentCode = ""
// Serializes host mutations (currentCode/version bump + lib seeding) across
// checkCode and getCompletions so interleaved calls never corrupt each other.
let chain: Promise<unknown> = Promise.resolve()

function makeHost(ts: typeof import('typescript')) {
  return {
    getCompilationSettings: () => ({
      strict: true,
      target: ts.ScriptTarget.ES2021,
      lib: ["lib.es2021.d.ts", "lib.dom.d.ts"],
      module: ts.ModuleKind.ESNext,
      noEmit: true,
      skipLibCheck: true,
    }),
    getScriptFileNames: () => [
      "input.ts",
      AMBIENT_FILE_NAME,
      ...SERVICE_TEXT_PATHS.keys(),
    ],
    getScriptVersion: () => String(version),
    getScriptSnapshot: (name: string) => {
      if (name === "input.ts") return ts.ScriptSnapshot.fromString(currentCode)
      if (name === AMBIENT_FILE_NAME) return ts.ScriptSnapshot.fromString(AMBIENT_TEXT)
      const svc = SERVICE_TEXT_PATHS.get(name)
      if (svc !== undefined) return ts.ScriptSnapshot.fromString(svc)
      const n = normLibName(name)
      const text = n === undefined ? undefined : libTexts.get(n)
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text)
    },
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    directoryExists: () => true,
    fileExists: (name: string) => {
      if (name === "input.ts" || name === AMBIENT_FILE_NAME) return true
      if (SERVICE_TEXT_PATHS.has(name)) return true
      const n = normLibName(name)
      return n !== undefined && libTexts.has(n)
    },
    readFile: (name: string) => {
      if (name === "input.ts") return currentCode
      if (name === AMBIENT_FILE_NAME) return AMBIENT_TEXT
      const svc = SERVICE_TEXT_PATHS.get(name)
      if (svc !== undefined) return svc
      const n = normLibName(name)
      return n === undefined ? undefined : libTexts.get(n)
    },
    getDefaultLibFileName: () => "lib.es2021.d.ts",
    getNewLine: () => "\n",
  }
}

export function checkCode(code: string, ts: typeof import('typescript')): Promise<TsDiag[]> {
  const run = async (): Promise<TsDiag[]> => {
    version++
    currentCode = code
    await ensureLibs(["lib.es2021.d.ts", "lib.dom.d.ts"])
    if (!service) service = ts.createLanguageService(makeHost(ts))
    const all = [
      ...service.getSyntacticDiagnostics("input.ts"),
      ...service.getSemanticDiagnostics("input.ts"),
    ]
    const out: TsDiag[] = []
    for (const d of all) {
      if (d.start === undefined || d.length === 0) continue
      const from = Math.min(code.length, d.start)
      const to = Math.min(code.length, from + (d.length ?? 1))
      if (from >= to) continue
      out.push({
        from,
        to,
        severity: d.category === ts.DiagnosticCategory.Error ? "error" : "warning",
        message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
      })
    }
    return out
  }
  const result = chain.then(run, run)
  chain = result
  return result
}

export interface TsCompletionEntry {
  name: string
  kind: string
  kindModifiers: string
  sortText: string
  /** Rendered from getCompletionEntryDetails displayParts, e.g. a signature. */
  detail?: string
}

// Type-aware completion for the TS editor (roadmap phase tscheck-completion-
// entrypoint). Reuses checkCode's exact live-document machinery - bump the
// same currentCode/version, warm the same lib seed - so the LanguageService
// resolves types against the doc the caller just passed, never a stale one.
export function getCompletions(
  code: string,
  pos: number,
  ts: typeof import('typescript'),
): Promise<TsCompletionEntry[]> {
  const run = async (): Promise<TsCompletionEntry[]> => {
    version++
    currentCode = code
    await ensureLibs(["lib.es2021.d.ts", "lib.dom.d.ts"])
    if (!service) service = ts.createLanguageService(makeHost(ts))
    const svc = service

    const info = svc.getCompletionsAtPosition("input.ts", pos, undefined)
    if (!info) return []

    return info.entries.map((entry) => {
      const details = svc.getCompletionEntryDetails(
        "input.ts",
        pos,
        entry.name,
        undefined,
        entry.source,
        undefined,
        entry.data,
      )
      const rendered =
        details?.displayParts.map((p) => p.text).join("") ?? ""
      return {
        name: entry.name,
        kind: entry.kind,
        kindModifiers: entry.kindModifiers ?? "",
        sortText: entry.sortText,
        detail: rendered || undefined,
      }
    })
  }
  const result = chain.then(run, run)
  chain = result
  return result
}
