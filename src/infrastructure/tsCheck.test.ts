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
