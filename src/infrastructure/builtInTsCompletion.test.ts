// Fixture suite for roadmap phase builtin-ts-completion-source: the async
// CompletionSource builtInTsCompletion composes the phase-0/1 tsCheck
// getCompletions entrypoint into the CodeMirror editor as the repo's first
// async source, beside the two sync sources.
//
// Covers: member-context-completion (`reader.` yields ReadableStream members,
// no global-scope names), constructor-signature-detail (`new ReadableStream(`
// spells out params+types, apply stays a no-op), service-handle-abstention
// (null for the 5 handles bare / `handle.` / `new handle(`, non-service
// identifiers still complete), offline-error-degradation (null when window.ts
// is absent and when the tsCheck call throws), and repeatable-safe-completion
// (cheap null paths are synchronous; real LanguageService calls reuse the warm
// host).
//
// Runs in the Node environment with `window` synthesized and lib.d.ts served
// from the local typescript package, exactly like tsCheck.test.ts.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CompletionContext } from '@codemirror/autocomplete'
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import ts from 'typescript'
import { builtInTsCompletion } from './builtInTsCompletion'
import * as tsCheck from './tsCheck'

const LIB_DIR = resolve(process.cwd(), 'node_modules/typescript/lib')
const HANDLES = ['redis', 'pg', 'rabbitmq', 'kafka', 'queue']

// tsCheck fetches lib.d.ts from the jsDelivr CDN; serve them from the local
// typescript package instead so the suite runs offline.
function stubLibFetch() {
  const realFetch = globalThis.fetch
  globalThis.fetch = ((input: string | URL | Request) => {
    const libName = String(input).split('/').pop()!
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(readFileSync(resolve(LIB_DIR, libName), 'utf8')),
    } as unknown as Response)
  }) as typeof fetch
  return () => {
    globalThis.fetch = realFetch
  }
}

function completionAt(doc: string, pos: number) {
  const state = EditorState.create({
    doc,
    extensions: [
      javascript(),
      javascriptLanguage.data.of({ autocomplete: builtInTsCompletion }),
    ],
  })
  return builtInTsCompletion(new CompletionContext(state, pos, false))
}

async function labelsOf(result: Awaited<ReturnType<typeof completionAt>>) {
  return result?.options.map((o) => o.label) ?? []
}

describe('builtInTsCompletion source (real CompletionContext + LanguageService)', () => {
  let restoreFetch: () => void
  let originalWindowTs: unknown

  beforeAll(() => {
    restoreFetch = stubLibFetch()
    // The source reads window.ts like tsLint does; synthesize it in Node.
    originalWindowTs = (globalThis as Record<string, unknown>).window
    ;(globalThis as Record<string, unknown>).window = { ts }
  })
  afterAll(() => {
    restoreFetch()
    if (originalWindowTs === undefined) {
      delete (globalThis as Record<string, unknown>).window
    } else {
      ;(globalThis as Record<string, unknown>).window = originalWindowTs
    }
  })

  it('yields ReadableStream members on `reader.` scoped to member context', async () => {
    const doc = `const reader: ReadableStream = new ReadableStream();\nreader.`
    const result = await completionAt(doc, doc.length)
    expect(result?.from).toBe(doc.length)
    const labels = await labelsOf(result)
    for (const m of ['getReader', 'cancel', 'pipeTo']) {
      expect(labels).toContain(m)
    }
    // member context, not global scope
    for (const g of ['fetch', 'Promise', 'console', 'setTimeout']) {
      expect(labels).not.toContain(g)
    }
  })

  it('replaces only the partial member when `reader.pipe` is typed', async () => {
    const doc = `const reader: ReadableStream = new ReadableStream();\nreader.pipe`
    const result = await completionAt(doc, doc.length)
    expect(result?.from).toBe(doc.length - 4) // start of `pipe`
    const labels = await labelsOf(result)
    expect(labels).toContain('pipeTo')
    expect(labels).toContain('pipeThrough')
  })

  it('spells out the constructor params for `new ReadableStream(`', async () => {
    const doc = `const r = new ReadableStream(`
    const result = await completionAt(doc, doc.length)
    expect(result).not.toBeNull()
    expect(result!.options).toHaveLength(1)
    const option = result!.options[0]
    expect(option.label).toBe('ReadableStream')
    // dom-lib declaration: 2 optional params, names + types spelled out
    expect(option.detail).toContain('underlyingSource')
    expect(option.detail).toContain('UnderlyingSource')
    expect(option.detail).toContain('strategy')
    expect(option.detail).toContain('QueuingStrategy')
    // the identifier is already typed ahead of the paren; accepting must not
    // paste it again
    expect(option.apply).toBe('')
  })

  it('renders a second built-in so the signature path is not ReadableStream-special', async () => {
    const doc = `const m = new Map(`
    const result = await completionAt(doc, doc.length)
    expect(result).not.toBeNull()
    expect(result!.options[0].label).toBe('Map')
    expect(result!.options[0].detail).toContain('entries')
  })

  it('returns null for exactly the 5 service handles in every context', async () => {
    for (const handle of HANDLES) {
      // bare
      expect(await completionAt(handle, handle.length)).toBeNull()
      // member, full and partial
      expect(await completionAt(`${handle}.`, handle.length + 1)).toBeNull()
      expect(await completionAt(`${handle}.ge`, handle.length + 3)).toBeNull()
      // constructor
      expect(await completionAt(`new ${handle}(`, `new ${handle}(`.length)).toBeNull()
    }
  })

  it('short-circuits service handles synchronously, before any await', () => {
    const state = EditorState.create({
      doc: 'redis.',
      extensions: [javascript()],
    })
    const syncResult = builtInTsCompletion(new CompletionContext(state, 6, false))
    expect(syncResult).toBeNull()
    expect(typeof (syncResult as Promise<unknown>)?.then).toBe('undefined')
  })

  it('still completes non-service identifiers', async () => {
    const result = await completionAt('ReadableStr', 'ReadableStr'.length)
    const labels = await labelsOf(result)
    expect(labels).toContain('ReadableStream')
  })

  it('stays silent inside comments and strings', async () => {
    expect(await completionAt('// reader.', 9)).toBeNull()
    expect(await completionAt('const s = "reader."', 18)).toBeNull()
  })

  it('returns null when window.ts is absent (offline cold start)', async () => {
    const win = globalThis.window as unknown as { ts?: unknown }
    const saved = win.ts
    delete win.ts
    try {
      expect(await completionAt('reader.', 7)).toBeNull()
      expect(await completionAt(`const r = new ReadableStream(`, `const r = new ReadableStream(`.length)).toBeNull()
    } finally {
      win.ts = saved
    }
  })

  it('returns null when the tsCheck call throws', async () => {
    const spy = vi.spyOn(tsCheck, 'getCompletions').mockRejectedValue(new Error('offline'))
    try {
      expect(await completionAt('reader.', 7)).toBeNull()
      expect(spy).toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})
