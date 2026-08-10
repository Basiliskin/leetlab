// Fixture suite for the Phase 5 generate-settings UI
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Covers: buildGenerationPrompt (deterministic, full Problem schema spelled
// out) and the in-memory `pendingGenerated` review queue — a successful
// generation writes nothing to localStorage or the problem bank (acceptance is
// owned by the Phase 6 review gate), and the queue clears explicitly.

import { beforeEach, describe, expect, it } from 'vitest'
import type { Problem } from '@domain/Problem'
import { buildGenerationPrompt } from './generationPrompt'

// ---------------------------------------------------------------------------
// localStorage shim: the persisted zustand store reads `window.localStorage`
// at module evaluation, so both globals must be in place before the import
// (same pattern as mergedBank.test.ts).
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

beforeEach(() => {
  memory.clear()
  useAppStore.setState({ generatedProblems: [], pendingGenerated: null })
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validProblem: Problem = {
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
}

// ---------------------------------------------------------------------------
// buildGenerationPrompt
// ---------------------------------------------------------------------------

describe('buildGenerationPrompt', () => {
  it('is deterministic', () => {
    expect(buildGenerationPrompt()).toBe(buildGenerationPrompt())
  })

  it('spells out the full Problem schema', () => {
    const prompt = buildGenerationPrompt()
    for (const field of [
      'slug',
      'num',
      'title',
      'difficulty',
      'tags',
      'fnName',
      'mode',
      'starter',
      'tests',
      'hints',
      'desc',
    ]) {
      expect(prompt).toContain(`"${field}"`)
    }
  })

  it('covers both problem modes', () => {
    const prompt = buildGenerationPrompt()
    expect(prompt).toContain('"fn"')
    expect(prompt).toContain('"class"')
  })

  it('requires JSON-serializable, signature-matching tests', () => {
    const prompt = buildGenerationPrompt()
    expect(prompt).toContain('JSON.stringify')
    expect(prompt).toContain('arity')
  })
})

// ---------------------------------------------------------------------------
// pendingGenerated — in-memory review queue (success handler contract)
// ---------------------------------------------------------------------------

describe('pendingGenerated (in-memory review queue)', () => {
  it('holds the generated problem in memory only', () => {
    useAppStore.getState().setPendingGenerated(validProblem)
    expect(useAppStore.getState().pendingGenerated).toEqual(validProblem)
  })

  it('never persists the pending item to localStorage', () => {
    useAppStore.getState().setPendingGenerated(validProblem)
    const raw = memory.get('leetlab.v2')
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw!) as {
      state: Record<string, unknown>
    }
    expect(persisted.state).not.toHaveProperty('pendingGenerated')
    // the persisted boundary is exactly the partialize slice
    expect(persisted.state).toHaveProperty('generatedProblems')
    expect(persisted.state).toHaveProperty('lang')
  })

  it('leaves the problem bank untouched while pending', () => {
    useAppStore.getState().setPendingGenerated(validProblem)
    const { getProblem, generatedProblems, pendingGenerated } =
      useAppStore.getState()
    expect(pendingGenerated).toEqual(validProblem)
    expect(getProblem(validProblem.slug)).toBeUndefined()
    expect(generatedProblems).toHaveLength(0)
  })

  it('clears via setPendingGenerated(null)', () => {
    useAppStore.getState().setPendingGenerated(validProblem)
    useAppStore.getState().setPendingGenerated(null)
    expect(useAppStore.getState().pendingGenerated).toBeNull()
  })
})
