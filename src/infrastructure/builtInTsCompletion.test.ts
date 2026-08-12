// Fixture suite for roadmap phase builtin-ts-completion-source: the async
// CompletionSource builtInTsCompletion composes the phase-0/1 tsCheck
// getCompletions entrypoint into the CodeMirror editor as the repo's first
// async source, beside the two sync sources.
//
// Covers: member-context-completion (`reader.` yields ReadableStream members,
// no global-scope names), constructor-signature-detail (`new ReadableStream(`
// spells out params+types, apply is now the curated function-form trigger),
// service-handle-abstention (null for the 5 handles bare / `handle.` /
// `new handle(`, non-service identifiers still complete), offline-error-
// degradation (null when window.ts is absent and when the tsCheck call
// throws), and repeatable-safe-completion (cheap null paths are synchronous;
// real LanguageService calls reuse the warm host).
//
// Phase 3 (codeeditor-usage-templates) layers curated labels on top: a
// separate `describe` block asserts the function-form apply triggers the
// popover bridge, performs no doc mutation, falls back cleanly when the
// template list is empty or `coordsAtPos` is null, and leaves non-curated
// constructor/bare entries byte-for-byte identical to Phase 1.
//
// Runs in the Node environment with `window` synthesized and lib.d.ts served
// from the local typescript package, exactly like tsCheck.test.ts.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CompletionContext } from '@codemirror/autocomplete'
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import ts from 'typescript'
import { buildUsageTemplateApply, builtInTsCompletion } from './builtInTsCompletion'
import { __resetForTests, getState } from './popoverBridge'
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
    // ReadableStream is a curated usage-template label (Phase 3), so accept
    // opens the popover instead of pasting the bare identifier - the apply
    // field is therefore a function, not the empty string (which is the
    // non-curated constructor convention, asserted separately below).
    expect(typeof option.apply).toBe('function')
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

/**
 * Phase 3 (codeeditor-usage-templates): curated labels carry a
 * function-form `apply` that opens the popover bridge at the accept site.
 * Non-curated labels keep their Phase 1 `apply` value byte-for-byte. The
 * stub view here is the minimum surface area the apply callback touches
 * (`coordsAtPos`, `state.doc.toString()`, and `dispatch`) - the production
 * DOM is not exercised in this suite because the bridge has its own DOM
 * shell tested in phase 4.
 */
describe('builtInTsCompletion usage-template wiring (Phase 3)', () => {
  let restoreFetch: () => void
  let originalWindowTs: unknown

  beforeAll(() => {
    restoreFetch = stubLibFetch()
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
  afterEach(() => {
    // The bridge is module-level state shared with the rest of the suite;
    // reset between cases so a leaking open in one test can't poison the
    // next.
    __resetForTests()
  })

  /**
   * Minimal stand-in for the parts of `EditorView` the apply callback
   * reads: viewport coords for the anchor, the live document text for the
   * accept-source snapshot, and a `dispatch` recorder so we can assert
   * the callback never edits the document.
   */
  function stubView(opts: {
    rect?: { left: number; top: number; bottom: number; right: number } | null
    doc?: string
    coordsBothNull?: boolean
  } = {}) {
    const dispatches: unknown[] = []
    const view = {
      // The production callback uses `from ?? to`, which is observable in
      // the fallback test below; for the happy-path stub we ignore the
      // position and return whichever rect was configured. `pos` is kept
      // in scope as a defense-in-depth typecheck so an accidental String
      // is caught here rather than in a downstream call.
      coordsAtPos: (pos: number) => {
        if (typeof pos !== 'number') return null
        return opts.coordsBothNull ? null : opts.rect ?? null
      },
      // `field` stands in for the real `completionState` field lookup
      // `closeCompletion` (from `@codemirror/autocomplete`) performs
      // internally; returning `undefined` mirrors "no completion field
      // registered on this state" so `closeCompletion` bails out without
      // dispatching, keeping this stub DOM-free like the rest of the file.
      state: { doc: { toString: () => opts.doc ?? '' }, field: () => undefined },
      dispatch: (...args: unknown[]) => {
        dispatches.push(args)
      },
    }
    return { view: view as unknown as Parameters<ReturnType<typeof buildUsageTemplateApply>>[0], dispatches }
  }

  for (const label of ['TransformStream', 'ReadableStream', 'WritableStream', 'AbortController']) {
    it(`attaches function-form apply to curated constructor \`new ${label}(\``, async () => {
      const ctorDoc = `new ${label}(`
      const ctorResult = await completionAt(ctorDoc, ctorDoc.length)
      expect(ctorResult, `${label} should appear in constructor completion`).not.toBeNull()
      expect(ctorResult!.options).toHaveLength(1)
      expect(typeof ctorResult!.options[0].apply).toBe('function')
    })
  }

  for (const label of ['TransformStream', 'ReadableStream', 'WritableStream', 'AbortController']) {
    it(`attaches function-form apply to curated bare identifier \`${label}\``, async () => {
      // Partial of one shorter than the label, so completion fills in the
      // suffix. The LanguageService still surfaces the full label.
      const bareDoc = label.slice(0, label.length - 1)
      const bareResult = await completionAt(bareDoc, bareDoc.length)
      const bareOption = bareResult?.options.find((o) => o.label === label)
      expect(bareOption, `${label} should appear on bare completion`).toBeDefined()
      expect(typeof bareOption!.apply).toBe('function')
    })
  }

  it('opens the bridge with the resolved payload when the curated apply fires', () => {
    // Real CodeMirror semantics for a constructor accept: `from === to
    // === ` the cursor, a zero-width point right after the `(` - not a
    // span over `TransformStream(` (see the walk-back regression test
    // below, which pins that the function resolves the actual span
    // itself rather than trusting these raw args as the replace range).
    const doc = `new TransformStream(`
    const apply = buildUsageTemplateApply('TransformStream')
    const { view, dispatches } = stubView({
      rect: { left: 42, top: 7, bottom: 25, right: 200 },
      doc,
    })

    apply(view, { label: 'TransformStream' } as never, doc.length, doc.length)

    const state = getState()
    expect(state, 'bridge should have opened on the curated apply').not.toBeNull()
    expect(state!.label).toBe('TransformStream')
    expect(state!.templates.length).toBeGreaterThan(0)
    expect(state!.templates[0].label).toBeTruthy()
    expect(state!.coords).toEqual({ x: 42, y: 25 })
    expect(state!.source).toBe(doc)
    // Walked back over the whole `new TransformStream(` prefix, not
    // just the zero-width point CodeMirror passed in.
    expect(state!.from).toBe(0)
    expect(state!.to).toBe(doc.length)
    expect(state!.pos).toBe(doc.length)
    // The apply never mutates the doc itself - the picker (phase 4) does
    // that. It does call `closeCompletion(view)` to dismiss the native
    // completion dropdown, but the stub's `field()` returns `undefined`
    // (no completion field registered), so `closeCompletion` bails out
    // without dispatching and the transaction log stays empty here.
    expect(dispatches).toEqual([])
  })

  it('walks back over the already-typed `new Name(` and swallows the auto-closed `)` (regression: no `new Name( new Name(...))` duplication)', () => {
    // `closeBrackets()` auto-inserts the matching `)` the instant the
    // user types `(`, so by accept time the live document already has
    // an empty `()` pair sitting right where the completion fired.
    // `from === to === pos` is CodeMirror's real shape for a
    // constructor accept: a zero-width point between the two parens.
    // A prior version of `buildUsageTemplateApply` forwarded that raw
    // zero-width range straight through as the bridge's replace range,
    // so the picker's splice landed *between* the parens instead of
    // replacing them - producing `new WritableStream( new
    // WritableStream({...}))` with a stray trailing `)`.
    const doc = 'const tmp = new WritableStream()'
    const pos = doc.length - 1 // between `(` and the auto-closed `)`
    const apply = buildUsageTemplateApply('WritableStream')
    const { view } = stubView({
      rect: { left: 10, top: 20, bottom: 30, right: 40 },
      doc,
    })

    apply(view, { label: 'WritableStream' } as never, pos, pos)

    const state = getState()
    expect(state).not.toBeNull()
    expect(state!.from).toBe(doc.indexOf('new WritableStream('))
    // `to` extends one past `pos` - past the auto-closed `)` - so the
    // splice replaces the whole `new WritableStream()` call, not just
    // the empty space between its parens.
    expect(state!.to).toBe(doc.length)
    expect(doc.slice(state!.from, state!.to)).toBe('new WritableStream()')
  })

  it('falls back to the `to` coords when the `from` coords are unavailable', () => {
    const doc = `new AbortController(`
    const apply = buildUsageTemplateApply('AbortController')
    // coordsAtPos returns null for any pos except the second (the `to`).
    const view = {
      coordsAtPos: (pos: number) => (pos === doc.length ? { left: 1, top: 2, bottom: 3, right: 4 } : null),
      state: { doc: { toString: () => doc }, field: () => undefined },
      dispatch: () => {},
    } as unknown as Parameters<ReturnType<typeof buildUsageTemplateApply>>[0]

    apply(view, { label: 'AbortController' } as never, doc.length, doc.length)

    const state = getState()
    expect(state).not.toBeNull()
    expect(state!.coords).toEqual({ x: 1, y: 3 })
  })

  it('is a no-op when both `from` and `to` coords are null', () => {
    const doc = `new TransformStream(`
    const apply = buildUsageTemplateApply('TransformStream')
    const { view, dispatches } = stubView({ coordsBothNull: true, doc })

    apply(view, { label: 'TransformStream' } as never, 4, doc.length)

    expect(getState()).toBeNull()
    expect(dispatches).toEqual([])
  })

  it('is a no-op for labels with empty templates (defensive fallback)', () => {
    const apply = buildUsageTemplateApply('DefinitelyNotInUsageTemplates')
    const { view, dispatches } = stubView({
      rect: { left: 1, top: 2, bottom: 3, right: 4 },
      doc: '',
    })

    apply(view, { label: 'DefinitelyNotInUsageTemplates' } as never, 0, 0)

    expect(getState()).toBeNull()
    expect(dispatches).toEqual([])
  })

  it('keeps non-curated constructor entries at `apply: ""` (byte-identical to Phase 1)', async () => {
    const doc = `const m = new Map(`
    const result = await completionAt(doc, doc.length)
    expect(result).not.toBeNull()
    expect(result!.options[0].label).toBe('Map')
    expect(result!.options[0].apply).toBe('')
  })

  it('keeps non-curated bare entries without an apply field (byte-identical to Phase 1)', async () => {
    // Promise is non-curated; bare `Prom` partial completion should leave
    // the default CodeMirror apply (replace the partial with the label).
    const result = await completionAt('Prom', 4)
    expect(result).not.toBeNull()
    const promiseOption = result!.options.find((o) => o.label === 'Promise')
    expect(promiseOption).toBeDefined()
    // The Completion type's `apply` is optional; "no apply field" means
    // `undefined`, which is byte-identical to the Phase 1 behavior.
    expect(promiseOption!.apply).toBeUndefined()
  })
})

/**
 * Autocomplete-keystroke-freeze regression (builtInTsCompletion-defer-ls-work):
 * the LS synchronous body used to run on the same task as the user's
 * keystroke, blocking input for ~50-150ms per typed character on a non-trivial
 * doc. The fix wraps the body in `setTimeout(..., 0)` so the LS work runs on
 * the next macrotask - this test pins that invariant.
 *
 * The first assertion (Promise still pending on the synchronous tick) catches
 * the regression: a naive future reader who deletes the `setTimeout` to "make
 * it simpler" would let the body run synchronously again, the Promise would
 * resolve on the microtask flush, and the editor would freeze once more on
 * the next keystroke.
 */
describe('builtInTsCompletion keystroke-yield deferral (LS work off the input tick)', () => {
  let restoreFetch: () => void
  let originalWindowTs: unknown

  beforeAll(() => {
    restoreFetch = stubLibFetch()
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

  it('does not resolve the LS completion promise on the synchronous tick of the source call', async () => {
    const state = EditorState.create({
      doc: 'reader.',
      extensions: [javascript()],
    })
    const result = builtInTsCompletion(new CompletionContext(state, 7, false))
    expect(result).not.toBeNull()
    // Narrow to Promise<unknown>: CompletionSource returns
    // `CompletionResult | null | Promise<CompletionResult | null>`, and the
    // bare/member/ctor paths above all return a Promise here.
    const promise = result as Promise<unknown>
    // Race the promise against a microtask flush: if the source ran its
    // LS body synchronously (the regression), the microtask flush wins
    // and the promise is already settled. With the setTimeout deferral,
    // the macrotask hasn't fired yet, so the race resolves false.
    const microtaskSettled = await Promise.race([
      promise.then(() => true, () => true),
      Promise.resolve(false),
    ])
    expect(microtaskSettled).toBe(false)
    // Now let the timer fire and the LS body resolve. The resolved value
    // depends on what the LS returns for this snippet - it can be a
    // CompletionResult, null (no matches), or a rejected error wrapped as
    // null by the source's try/catch. What matters is that it actually
    // settles (no hang) and does not throw.
    await expect(promise).resolves.toBeDefined()
  })
})
