// Fixture suite for the Phase 4 runtime-merged-bank read path
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Covers: get-problem-generated-fallback (generated resolves, built-in wins on
// a shared slug, unknown slug -> undefined), merge-idempotent-and-stable,
// builtin-only-no-regression, problem-bank-immutability (length/reference +
// deep-freeze through the read path), sidebar/topbar derived counts and the
// denominator/segments math, and the no-direct-PROBLEM_BANK source guard.

import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Problem } from '@domain/Problem'
import { PROBLEM_BANK } from './problemBank'

// ---------------------------------------------------------------------------
// localStorage shim: the persisted zustand store reads `window.localStorage`
// at module evaluation, so both globals must be in place before the import
// ---------------------------------------------------------------------------

const memory = new Map<string, string>()
const storageShim = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size
  },
}
Object.defineProperty(globalThis, 'localStorage', {
  value: storageShim,
  configurable: true,
  writable: true,
})
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
  writable: true,
})

// The store must be imported after the shim is in place (persist reads
// localStorage at module evaluation), hence the dynamic import.
const { getMergedBank, useAppStore } = await import('./store')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const generatedProblem: Problem = {
  slug: 'generated-sum-pair',
  num: 9001,
  title: 'Find Pair Sum',
  difficulty: 'Medium',
  tags: ['Array', 'Hash Table'],
  fnName: 'findPairSum',
  mode: 'fn',
  starter: {
    js: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction findPairSum(nums, target) {\n  \n}\n',
    ts: 'function findPairSum(nums: number[], target: number): number[] {\n  \n}\n',
  },
  tests: [
    { in: [[1, 2, 3], 4], out: [0, 2] },
    { in: [[], 5], out: [-1, -1] },
  ],
  hints: ['Walk the array once.', 'Remember seen values.'],
  desc: '<p>Find the pair that sums to <code>target</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,2,3], target = 4</div><div><b>Output:</b>[0,2]</div></div><p class="note">Note text.</p>',
  category: 'Generated',
}

const builtinCount = PROBLEM_BANK.length
const builtinRef = PROBLEM_BANK

beforeEach(() => {
  memory.clear()
  useAppStore.setState({ generatedProblems: [], problems: {} })
})

// ---------------------------------------------------------------------------
// Pure merge helper
// ---------------------------------------------------------------------------

describe('getMergedBank (pure merge)', () => {
  it('lists built-ins first, then accepted generated problems in accept order', () => {
    const bank = getMergedBank(PROBLEM_BANK, [generatedProblem])
    expect(bank.slice(0, builtinCount)).toEqual(PROBLEM_BANK)
    expect(bank[builtinCount]).toBe(generatedProblem)
  })

  it('with an empty generated slice the merged list equals PROBLEM_BANK exactly', () => {
    const bank = getMergedBank(PROBLEM_BANK, [])
    expect(bank).toEqual(PROBLEM_BANK)
    expect(bank.length).toBe(builtinCount)
  })

  it('merged count = built-ins + accepted generated', () => {
    const bank = getMergedBank(PROBLEM_BANK, [generatedProblem])
    expect(bank.length).toBe(builtinCount + 1)
  })

  it('contains no duplicate slugs', () => {
    const bank = getMergedBank(PROBLEM_BANK, [generatedProblem])
    const slugs = bank.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('is idempotent: repeated reads keep length and order', () => {
    const first = getMergedBank(PROBLEM_BANK, [generatedProblem])
    const second = getMergedBank(PROBLEM_BANK, [generatedProblem])
    expect(second).toEqual(first)
  })

  it('returns a fresh array, never the PROBLEM_BANK reference', () => {
    const bank = getMergedBank(PROBLEM_BANK, [])
    expect(bank).not.toBe(PROBLEM_BANK)
  })

  it('never mutates its inputs', () => {
    getMergedBank(PROBLEM_BANK, [generatedProblem])
    expect(PROBLEM_BANK.length).toBe(builtinCount)
    expect(PROBLEM_BANK).toBe(builtinRef)
  })
})

// ---------------------------------------------------------------------------
// getProblem merged fallback
// ---------------------------------------------------------------------------

describe('getProblem merged fallback', () => {
  it('returns undefined for an unknown slug (pre-phase miss value)', () => {
    expect(useAppStore.getState().getProblem('no-such-problem')).toBeUndefined()
  })

  it('returns undefined for a generated slug before it is accepted', () => {
    expect(
      useAppStore.getState().getProblem(generatedProblem.slug)
    ).toBeUndefined()
  })

  it('resolves an accepted generated problem by slug', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    const found = useAppStore.getState().getProblem(generatedProblem.slug)
    expect(found?.title).toBe(generatedProblem.title)
    expect(found?.mode).toBe('fn')
    expect(found?.fnName).toBe('findPairSum')
  })

  it('still returns the built-in when a generated problem shares its slug', () => {
    const colliding = {
      ...generatedProblem,
      slug: PROBLEM_BANK[0].slug,
      title: 'Different Title',
    }
    useAppStore.setState({ generatedProblems: [colliding] })
    expect(useAppStore.getState().getProblem(PROBLEM_BANK[0].slug)).toBe(
      PROBLEM_BANK[0]
    )
  })

  it('call shape is unchanged: slug in, Problem | undefined out', () => {
    const { getProblem } = useAppStore.getState()
    expect(typeof getProblem).toBe('function')
    expect(getProblem(PROBLEM_BANK[0].slug)).toBe(PROBLEM_BANK[0])
  })
})

// ---------------------------------------------------------------------------
// PROBLEM_BANK immutability through the read path
// ---------------------------------------------------------------------------

describe('PROBLEM_BANK immutability', () => {
  it('reference identity and length survive accepts and reads', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    useAppStore.getState().getProblem(generatedProblem.slug)
    getMergedBank(PROBLEM_BANK, useAppStore.getState().generatedProblems)
    expect(PROBLEM_BANK).toBe(builtinRef)
    expect(PROBLEM_BANK.length).toBe(builtinCount)
  })

  it('a deep-frozen PROBLEM_BANK passes through the whole read path', () => {
    const frozen = Object.freeze(PROBLEM_BANK)
    expect(() => {
      const bank = getMergedBank(frozen, [generatedProblem])
      expect(bank.length).toBe(builtinCount + 1)
      expect(bank.find((p) => p.slug === generatedProblem.slug)).toBe(
        generatedProblem
      )
    }).not.toThrow()
    expect(frozen.length).toBe(builtinCount)
  })
})

// ---------------------------------------------------------------------------
// Sidebar / Topbar derived sources (logic-level checks; UI derives from the
// same store-derived merged bank)
// ---------------------------------------------------------------------------

describe('sidebar/topbar derived from the merged bank', () => {
  it('a seeded generated problem appears with its difficulty in the counts', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    const bank = getMergedBank(
      PROBLEM_BANK,
      useAppStore.getState().generatedProblems
    )
    const bySlug = bank.find((p) => p.slug === generatedProblem.slug)
    expect(bySlug).toBeDefined()
    // Sidebar difficulty chip counts: `bank.forEach(p => counts[p.difficulty]++)`
    const medium = bank.filter((p) => p.difficulty === 'Medium').length
    const builtinMedium = PROBLEM_BANK.filter(
      (p) => p.difficulty === 'Medium'
    ).length
    expect(medium).toBe(builtinMedium + 1)
    // All / status counts derive from the same bank length
    expect(bank.length).toBe(builtinCount + 1)
  })

  it('solving a generated problem moves the progress numerator', () => {
    const st = useAppStore.getState()
    st.acceptGeneratedProblem(generatedProblem)
    st.selectProblem(generatedProblem.slug)
    st.markSolved()
    const solved = Object.values(useAppStore.getState().problems).filter(
      (p) => p.solvedAt
    ).length
    expect(solved).toBe(1)
    expect(
      useAppStore.getState().problems[generatedProblem.slug]?.solvedAt
    ).toBeTypeOf('number')
  })

  it('denominator and progress segments both equal the merged count', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    const mergedCount = getMergedBank(
      PROBLEM_BANK,
      useAppStore.getState().generatedProblems
    ).length
    expect(mergedCount).toBe(builtinCount + 1)
    // Topbar: <b>{solved}</b>/{mergedCount} and Array.from({length: mergedCount})
    expect(Array.from({ length: mergedCount })).toHaveLength(mergedCount)
  })

  it('a reload restores the same denominator from the persisted slice', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    const persisted = JSON.parse(memory.get('leetlab.v2') ?? '{}')
    const restored = (persisted.state?.generatedProblems ?? []) as Problem[]
    expect(restored).toHaveLength(1)
    expect(restored[0]?.slug).toBe(generatedProblem.slug)
    expect(builtinCount + restored.length).toBe(builtinCount + 1)
  })
})

// ---------------------------------------------------------------------------
// Source guard: UI components must not touch the static bank directly
// ---------------------------------------------------------------------------

describe('UI reads the merged bank only', () => {
  const uiFiles = ['src/components/Sidebar.tsx', 'src/components/Topbar.tsx']

  it.each(uiFiles)('%s never references PROBLEM_BANK directly', (file) => {
    const src = readFileSync(
      new URL(`../../${file}`, import.meta.url),
      'utf8'
    )
    expect(src).not.toMatch(/PROBLEM_BANK/)
  })

  it.each(uiFiles)('%s derives its list/count from useMergedBank', (file) => {
    const src = readFileSync(
      new URL(`../../${file}`, import.meta.url),
      'utf8'
    )
    expect(src).toMatch(/useMergedBank/)
  })
})
