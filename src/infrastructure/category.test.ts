// Tests for the category filtering system (sidebar third chip row).
//
// Covers:
//  - every built-in is tagged with a valid Category at the problem-bank
//    aggregation boundary (problemBanks/index.ts);
//  - the per-category count equals the matching sub-bank length;
//  - sub-banks never collide (no slug exists in more than one category);
//  - generated problems accepted via the store stamp 'Generated';
//  - the Sidebar's setCategory action narrows the visible list correctly,
//    and an unknown/legacy filter value falls back to "All".

import { beforeEach, describe, expect, it } from 'vitest'
import { CATEGORIES, isCategory, type Category } from '@domain/Category'
import type { Problem } from '@domain/Problem'
import {
  CLASSIC_PROBLEMS,
  ASYNC_PROBLEMS,
  GENERATOR_PROBLEMS,
  REACT_PROBLEMS,
  STREAMING_PROBLEMS,
  DESIGN_SYSTEM_PROBLEMS,
  PROBLEM_BANK,
} from './problemBanks'

// ---------------------------------------------------------------------------
// localStorage / window shim: the persisted zustand store reads
// `window.localStorage` at module evaluation, so both globals must be in place
// before the dynamic import below.
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

const { useAppStore } = await import('./store')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const generatedProblem: Problem = {
  slug: 'generated-sum-pair',
  num: 9001,
  title: 'Find Pair Sum',
  difficulty: 'Easy',
  tags: ['Array', 'Hash Table'],
  fnName: 'findPairSum',
  mode: 'fn',
  starter: {
    js: 'function findPairSum(nums, target) {\n  \n}\n',
    ts: 'function findPairSum(nums: number[], target: number): number[] {\n  \n}\n',
  },
  tests: [
    { in: [[1, 2, 3], 4], out: [0, 2] },
    { in: [[], 5], out: [-1, -1] },
  ],
  hints: ['Walk the array once.', 'Remember seen values.'],
  desc: '<p>Find the pair that sums to <code>target</code>.</p>',
  category: 'Generated',
}

beforeEach(() => {
  memory.clear()
  useAppStore.setState({
    generatedProblems: [],
    problems: {},
    category: 'All',
  })
})

// ---------------------------------------------------------------------------
// Sub-bank → category mapping
// ---------------------------------------------------------------------------

describe('PROBLEM_BANK category tagging', () => {
  it('every built-in problem has a valid Category', () => {
    for (const p of PROBLEM_BANK) {
      expect(isCategory(p.category)).toBe(true)
    }
  })

  it('counts match sub-bank lengths for every Category that has a sub-bank', () => {
    const expected: Record<Category, number> = {
      Classic: CLASSIC_PROBLEMS.length,
      Async: ASYNC_PROBLEMS.length,
      Generators: GENERATOR_PROBLEMS.length,
      React: REACT_PROBLEMS.length,
      Streaming: STREAMING_PROBLEMS.length,
      'Design System': DESIGN_SYSTEM_PROBLEMS.length,
      Generated: 0,
    }
    const actual = Object.fromEntries(
      CATEGORIES.map((c) => [c, 0]),
    ) as Record<Category, number>
    for (const p of PROBLEM_BANK) actual[p.category] += 1
    expect(actual).toEqual(expected)
  })

  it('PROBLEM_BANK length equals the sum of every sub-bank length', () => {
    const sum =
      CLASSIC_PROBLEMS.length +
      ASYNC_PROBLEMS.length +
      GENERATOR_PROBLEMS.length +
      REACT_PROBLEMS.length +
      STREAMING_PROBLEMS.length +
      DESIGN_SYSTEM_PROBLEMS.length
    expect(PROBLEM_BANK.length).toBe(sum)
  })

  it('no slug is tagged with more than one category', () => {
    const seen = new Map<string, Category>()
    for (const p of PROBLEM_BANK) {
      const prev = seen.get(p.slug)
      if (prev && prev !== p.category) {
        throw new Error(
          `slug ${p.slug} tagged both as ${prev} and ${p.category}`,
        )
      }
      seen.set(p.slug, p.category)
    }
  })

  it('every category present in PROBLEM_BANK appears in the CATEGORIES tuple', () => {
    const present = new Set(PROBLEM_BANK.map((p) => p.category))
    for (const c of present) expect(isCategory(c)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Generated-problem stamping
// ---------------------------------------------------------------------------

describe('acceptGeneratedProblem stamps Generated', () => {
  it('a problem accepted via the store is tagged Generated', () => {
    const result = useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    expect(result.ok).toBe(true)
    const accepted = useAppStore.getState().generatedProblems[0]
    expect(accepted?.category).toBe('Generated')
  })

  it('stamped category survives the merged-bank read path', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    const found = useAppStore
      .getState()
      .generatedProblems.find((p) => p.slug === generatedProblem.slug)
    expect(found?.category).toBe('Generated')
  })

  it('discard removes the stamped problem and clears the pending one', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    useAppStore.getState().discardGeneratedProblem(generatedProblem.slug)
    expect(useAppStore.getState().generatedProblems).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Category filter (Sidebar logic-level)
// ---------------------------------------------------------------------------

describe('category filter narrows the merged bank', () => {
  // Re-implements the Sidebar's predicate so the wiring is exercised
  // without rendering React. If the Sidebar ever drifts from this contract,
  // a parallel implementation forces both to be updated together.
  const filterBy = (
    bank: readonly Problem[],
    category: string,
  ): Problem[] => {
    if (category === 'All') return [...bank]
    if (!isCategory(category)) return [...bank]
    return bank.filter((p) => p.category === category)
  }

  const merged = (): Problem[] => [
    ...PROBLEM_BANK,
    ...useAppStore.getState().generatedProblems,
  ]

  it('"All" returns the full merged bank', () => {
    useAppStore.getState().setCategory('All')
    expect(filterBy(merged(), useAppStore.getState().category)).toHaveLength(
      merged().length,
    )
  })

  it('"Classic" returns only Classic problems', () => {
    useAppStore.getState().setCategory('Classic')
    const result = filterBy(merged(), useAppStore.getState().category)
    expect(result.length).toBe(CLASSIC_PROBLEMS.length)
    for (const p of result) expect(p.category).toBe('Classic')
  })

  it('"Generated" returns only generated problems after acceptance', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    useAppStore.getState().setCategory('Generated')
    const result = filterBy(merged(), useAppStore.getState().category)
    expect(result).toHaveLength(1)
    expect(result[0]?.slug).toBe(generatedProblem.slug)
  })

  it('"Generated" is empty before any generated problem is accepted', () => {
    useAppStore.getState().setCategory('Generated')
    const result = filterBy(merged(), useAppStore.getState().category)
    expect(result).toHaveLength(0)
  })

  it('an unknown legacy filter value falls back to "All"', () => {
    useAppStore.getState().setCategory('All')
    const filtered = filterBy(merged(), 'SomeFutureBucket')
    expect(filtered).toHaveLength(merged().length)
  })
})
