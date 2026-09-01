/**
 * Worker-driven verification (horizon 2 phase 1): the runner must accept
 * solutions whose values JSON-normalize to the expected output, while
 * preserving existing failure cases (primitive wrong answers) and
 * preserving safeOut's diagnostic rendering (literal `undefined` at the
 * root stays literal in the output line).
 *
 * Mirrors `sandboxE2E.test.ts`: loads `sandbox.worker.ts` once, captures
 * `postMessage`, drives `self.onmessage` with synthetic MessageEvents —
 * the same production code path Vite's `?worker` import bundles and the
 * browser runs in a real Web Worker.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// In a real browser Web Worker these are globals; here we capture
// postMessage and re-expose `self` so the worker module's top-level
// `self.onmessage = ...` assignment works in Node.
const messages: Array<Record<string, unknown>> = []
let onmessage: ((ev: { data: unknown }) => Promise<void> | void) | null = null

const capturedPostMessage = (m: unknown) => {
  messages.push(m as Record<string, unknown>)
}

beforeAll(async () => {
  // The worker uses `self` (== globalThis) and `postMessage` (browser
  // Web Worker global). Provide them before the module's top-level
  // `self.onmessage = ...` assignment runs.
  ;(globalThis as { postMessage?: typeof capturedPostMessage }).postMessage =
    capturedPostMessage
  Object.defineProperty(globalThis, 'self', {
    configurable: true,
    value: globalThis,
  })
  await import('./sandbox.worker')
  onmessage = (globalThis as { onmessage: typeof onmessage }).onmessage
})

afterAll(() => {
  // Best-effort cleanup; harmless if globals were never set.
  delete (globalThis as { postMessage?: unknown }).postMessage
  delete (globalThis as { onmessage?: unknown }).onmessage
})

function reset() {
  messages.length = 0
}

function findCases(): Array<Record<string, unknown>> {
  return messages.filter((m) => m.type === 'case') as Array<
    Record<string, unknown>
  >
}

describe('sandbox deepEq — undefined-vs-null comparison normalization', () => {
  it('passes when fn returns [undefined, 4, undefined] against expected = [null, 4, null]', async () => {
    reset()
    const SOLUTION = `function solve() { return [undefined, 4, undefined]; }`
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: [{ input: [], expected: [null, 4, null] }],
      },
    })
    const cases = findCases()
    expect(cases).toHaveLength(1)
    const c = cases[0] as { pass: boolean | null; output: string }
    expect(c.pass).toBe(true)
  })

  it('still fails when fn returns primitive 4 against expected = null (no over-normalization)', async () => {
    reset()
    const SOLUTION = `function solve() { return 4; }`
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: [{ input: [], expected: null }],
      },
    })
    const cases = findCases()
    expect(cases).toHaveLength(1)
    const c = cases[0] as { pass: boolean | null; output: string }
    expect(c.pass).toBe(false)
  })

  it('preserves NaN equality: [NaN] vs [NaN] passes (deepEq NaN handling intact)', async () => {
    reset()
    const SOLUTION = `function solve() { return [NaN]; }`
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: [{ input: [], expected: [NaN] }],
      },
    })
    const cases = findCases()
    expect(cases).toHaveLength(1)
    const c = cases[0] as { pass: boolean | null; output: string }
    expect(c.pass).toBe(true)
  })

  it('safeOut still renders the literal "undefined" string for a root-level undefined (display not normalized)', async () => {
    reset()
    const SOLUTION = `function solve() { return undefined; }`
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: [{ input: [], expected: 42 }],
      },
    })
    const cases = findCases()
    expect(cases).toHaveLength(1)
    const c = cases[0] as { pass: boolean | null; output: string }
    expect(c.output).toBe('undefined')
    expect(c.pass).toBe(false)
  })

  it('plain-object slot normalization: {a: undefined} vs {a: null} now passes', async () => {
    reset()
    const SOLUTION = `function solve() { return { a: undefined }; }`
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: [{ input: [], expected: { a: null } }],
      },
    })
    const cases = findCases()
    expect(cases).toHaveLength(1)
    const c = cases[0] as { pass: boolean | null; output: string }
    expect(c.pass).toBe(true)
  })
})
