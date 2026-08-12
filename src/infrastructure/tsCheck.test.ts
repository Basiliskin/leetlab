// Fixture suite for roadmap phase tscheck-completion-entrypoint: tsCheck
// gains an exported `getCompletions(code, pos, ts)` that serves type-aware
// autocomplete off the same LanguageService host checkCode uses, so a
// TS-mode editor can complete built-in JS/TS standard-library members.
//
// Covers: exported-entrypoint (named export, correct signature, no caller-
// built host), live-document-freshness (a fresh doc is parsed, never a stale
// snapshot), member-completion-correctness (`reader.` yields ReadableStream's
// public members, global-scope-only names absent), editor-render-payload
// (name/kind/sortText present, detail from getCompletionEntryDetails), and
// repeatability-no-host-corruption (identical calls identical, interleaved
// checkCode unaffected, mixed sequence never throws).

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ts from 'typescript'
import { checkCode, getCompletions } from './tsCheck'

const LIB_DIR = resolve(process.cwd(), 'node_modules/typescript/lib')

// tsCheck fetches lib.d.ts files from the jsDelivr CDN; serve them from the
// locally installed typescript package instead so the suite runs offline.
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

const READER_DOC = `const reader: ReadableStream = new ReadableStream();\nreader.`

async function namesOf(doc: string): Promise<string[]> {
  const entries = await getCompletions(doc, doc.length, ts)
  return entries.map((e) => e.name)
}

describe('tsCheck completion entrypoint', () => {
  let restoreFetch: () => void

  beforeAll(() => {
    restoreFetch = stubLibFetch()
  })
  afterAll(() => {
    restoreFetch()
  })

  it('exports a named getCompletions(code, pos, ts) entrypoint', async () => {
    expect(typeof getCompletions).toBe('function')
    const entries = await getCompletions(READER_DOC, READER_DOC.length, ts)
    expect(entries.length).toBeGreaterThan(0)
    // the module-private host is the only engine; no caller-built host
    expect(entries[0]).toHaveProperty('name')
  })

  it('yields ReadableStream public members on `reader.`', async () => {
    const names = await namesOf(READER_DOC)
    for (const m of ['getReader', 'cancel', 'pipeTo']) {
      expect(names).toContain(m)
    }
  })

  it('filters member context to the type, not global scope', async () => {
    const names = await namesOf(READER_DOC)
    for (const g of ['fetch', 'Promise', 'console', 'setTimeout']) {
      expect(names).not.toContain(g)
    }
  })

  it('parses the live document, not a stale snapshot', async () => {
    // warm the host on the reader doc first
    await getCompletions(READER_DOC, READER_DOC.length, ts)

    // a different doc must surface its own members, not the last one's
    const pDoc = `const p = new Promise((res) => res(1));\np.`
    const pNames = await namesOf(pDoc)
    for (const m of ['then', 'catch', 'finally']) {
      expect(pNames).toContain(m)
    }
    expect(pNames).not.toContain('getReader')

    // and the original doc still resolves after the switch
    const back = await namesOf(READER_DOC)
    expect(back).toContain('pipeTo')
  })

  it('carries name/kind/sortText and getCompletionEntryDetails-backed detail', async () => {
    const entries = await getCompletions(READER_DOC, READER_DOC.length, ts)
    for (const e of entries) {
      expect(typeof e.name).toBe('string')
      expect(typeof e.kind).toBe('string')
      expect(typeof e.kindModifiers).toBe('string')
      expect(typeof e.sortText).toBe('string')
    }
    const getReader = entries.find((e) => e.name === 'getReader')
    expect(getReader).toBeDefined()
    expect(getReader!.detail).toBeTruthy()
    expect(getReader!.detail).toContain('ReadableStream')
  })

  it('repeats identically and survives interleaved checkCode', async () => {
    const first = await namesOf(READER_DOC)
    expect(first).toContain('getReader')

    // interleave a checkCode run against a different doc
    const diags = await checkCode(`const x: number = "nope"`, ts)
    expect(diags.some((d) => d.message.includes('Type'))).toBe(true)

    // same call, same result, and nothing threw along the way
    const second = await namesOf(READER_DOC)
    expect(second).toEqual(first)
  })
})

// Fixture suite for roadmap phase tscheck-constructor-signature-completion:
// getCompletions detects the `new Identifier(` cursor context and renders the
// constructor's parameters from getSignatureHelpItems displayParts into the
// '('...')' detail style sandboxServiceCompletions uses.
//
// Covers: signature-fidelity (ReadableStream's 2 optional params with dom-lib
// types; Map/Set/Array/Date arities; displayParts-driven, no hardcoded map;
// JSON/Math/console never fabricate), context-triggering (fires only at
// `new Identifier(`, not member/bare-identifier contexts, via the phase-0
// entrypoint), and repeatability (interleaved member/constructor calls).
describe('tsCheck constructor signature completion', () => {
  async function detailOf(doc: string): Promise<string | undefined> {
    const entries = await getCompletions(doc, doc.length, ts)
    expect(entries.length).toBeGreaterThan(0)
    return entries[0].detail
  }

  it('renders ReadableStream with 2 optional params from the dom lib', async () => {
    const doc = `const r = new ReadableStream(`
    const entries = await getCompletions(doc, doc.length, ts)
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('ReadableStream')
    expect(entries[0].detail).toBe(
      'new ReadableStream(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>)'
    )
  })

  it('renders a second built-in so the formatter is not ReadableStream-special', async () => {
    const doc = `const m = new Map(`
    const detail = await detailOf(doc)
    expect(detail).toBe(
      'new Map(entries?: readonly (readonly [K, V])[] | null)'
    )
  })

  it('renders arities for Set, Array, and Date from the seeded lib', async () => {
    expect(await detailOf(`const s = new Set(`)).toBe(
      'new Set(values?: readonly T[] | null)'
    )
    expect(await detailOf(`const a = new Array(`)).toBe(
      'new Array(...items: T[])'
    )
    // Date's full overload: 2 required + 5 optional params
    expect(await detailOf(`const d = new Date(`)).toBe(
      'new Date(year: number, monthIndex: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number)'
    )
  })

  it('never fabricates a signature for JSON, Math, or console', async () => {
    // `new JSON(` is a type error, not a constructor call: no `new JSON(...)`
    // detail may appear. The call falls through to scope completions.
    const j = await getCompletions(`new JSON(`, `new JSON(`.length, ts)
    expect(j.some((e) => e.detail?.startsWith('new JSON('))).toBe(false)
    const m = await getCompletions(`new Math(`, `new Math(`.length, ts)
    expect(m.some((e) => e.detail?.startsWith('new Math('))).toBe(false)
    const c = await getCompletions(`new console(`, `new console(`.length, ts)
    expect(c.some((e) => e.detail?.startsWith('new console('))).toBe(false)
  })

  it('fires only at `new Identifier(`, not member or bare-identifier contexts', async () => {
    // member context: `reader.` still yields type members, no constructor card
    const member = await getCompletions(READER_DOC, READER_DOC.length, ts)
    expect(member.some((e) => e.detail?.startsWith('new '))).toBe(false)
    expect(member.map((e) => e.name)).toContain('getReader')

    // bare identifier, no opening paren: no `new Readable(...)` detail
    const bare = await getCompletions(`new Readable`, `new Readable`.length, ts)
    expect(bare.some((e) => e.detail?.startsWith('new Readable('))).toBe(false)

    // identifier without `new`: `Promise(` completes normally, not as a ctor
    const plain = await getCompletions(`Promise(`, `Promise(`.length, ts)
    expect(plain.some((e) => e.detail?.startsWith('new Promise('))).toBe(false)
  })

  it('stays deterministic across interleaved constructor and member calls', async () => {
    const first = await detailOf(`const r = new ReadableStream(`)
    // interleaved member completion against a different doc
    const pNames = await namesOf(`const p = new Promise((res) => res(1));\np.`)
    expect(pNames).toContain('then')
    // constructor call still resolves identically afterwards
    expect(await detailOf(`const r = new ReadableStream(`)).toBe(first)
    expect(first).toContain('underlyingSource?')
  })
})
