// Fixture suite for the Phase 7 full-state versioned JSON export
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Covers: versioned-canonical-schema (top-level keys exactly
// version/persisted/generatedProblems + one .json download),
// persisted-state-completeness (lang/split/lastSlug/problems with
// solvedAt/js/ts/cases/subs intact), generated-bank-included (full Problem
// shape, empty bank emits []), api-keys-excluded (recursive scan of the
// serialized document for key-shaped values, seeded leetlab.apiKeys never
// read), round-trip-fidelity (parse/stringify stability, numeric types
// retained), and repeatable-export (two exports data-identical, no mutation).

import { beforeEach, describe, expect, it } from 'vitest'
import type { Problem } from '@domain/Problem'

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
const { useAppStore } = await import('./store')
const { FULL_STATE_VERSION, buildFullStateExport, downloadFullState } =
  await import('./fullStateExport')

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
    js: 'function findPairSum(nums, target) {\n  \n}\n',
    ts: 'function findPairSum(nums: number[], target: number[]): number[] {\n  \n}\n',
  },
  tests: [
    { in: [[1, 2, 3], 4], out: [0, 2] },
    { in: [[], 5], out: [-1, -1] },
  ],
  hints: ['Walk the array once.', 'Remember seen values.'],
  desc: '<p>Find the pair that sums to <code>target</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,2,3], target = 4</div><div><b>Output:</b>[0,2]</div></div><p class="note">Note text.</p>',
  category: 'Generated',
}

const solvedAt = 1_712_000_000_000

const seededState = {
  lang: 'ts' as const,
  split: 0.44,
  lastSlug: 'generated-sum-pair',
  problems: {
    'two-sum': {
      subs: [
        {
          t: 1_712_000_000_000,
          lang: 'js' as const,
          verdict: 'Accepted',
          passed: 3,
          total: 3,
          ms: 12,
        },
      ],
      cases: [
        {
          id: 'custom-1',
          inputText: '[1, 2, 3]\n6',
          expectedText: '[0, 2]',
          builtin: false,
        },
      ],
      js: 'function twoSum(nums, target) { return [0, 2]; }',
      ts: 'function twoSum(nums: number[], target: number): number[] { return [0, 2]; }',
      solvedAt,
    },
  },
  generatedProblems: [generatedProblem],
}

beforeEach(() => {
  memory.clear()
  useAppStore.setState({
    lang: 'js',
    split: 0.44,
    lastSlug: 'two-sum',
    problems: {},
    generatedProblems: [],
  })
})

// ---------------------------------------------------------------------------
// Versioned canonical schema
// ---------------------------------------------------------------------------

describe('versioned-canonical-schema', () => {
  it('top-level keys are exactly version / persisted / generatedProblems', () => {
    const doc = buildFullStateExport(seededState)
    expect(Object.keys(doc).sort()).toEqual([
      'generatedProblems',
      'persisted',
      'version',
    ])
  })

  it('persisted holds exactly lang / split / lastSlug / problems', () => {
    const doc = buildFullStateExport(seededState)
    expect(Object.keys(doc.persisted).sort()).toEqual([
      'lang',
      'lastSlug',
      'problems',
      'split',
    ])
  })

  it('carries the canonical version constant', () => {
    expect(buildFullStateExport(seededState).version).toBe(FULL_STATE_VERSION)
    expect(FULL_STATE_VERSION).toBe(1)
  })

  it('download triggers exactly one .json download and mutates no state', () => {
    const clicked: string[] = []
    const anchor: Record<string, unknown> = { remove: () => undefined }
    const append = (el: unknown) => {
      const a = el as { click: () => void }
      a.click = () => clicked.push(String(anchor.download ?? ''))
    }
    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL: (blob: Blob) => `blob:mock-${blob.size}`,
        revokeObjectURL: () => undefined,
      },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: () => anchor,
        body: { appendChild: append },
      },
      configurable: true,
      writable: true,
    })

    const before = JSON.stringify(useAppStore.getState())
    downloadFullState()
    const after = JSON.stringify(useAppStore.getState())

    expect(clicked).toHaveLength(1)
    expect(clicked[0]).toMatch(/^leetlab-backup-v1-\d{4}-\d{2}-\d{2}\.json$/)
    expect(before).toBe(after)
  })
})

// ---------------------------------------------------------------------------
// Persisted state completeness
// ---------------------------------------------------------------------------

describe('persisted-state-completeness', () => {
  it('keeps every per-problem field: subs, cases, js, ts, solvedAt', () => {
    const doc = buildFullStateExport(seededState)
    const entry = doc.persisted.problems['two-sum']
    expect(entry).toEqual(seededState.problems['two-sum'])
    expect(entry.subs).toHaveLength(1)
    expect(entry.subs[0].verdict).toBe('Accepted')
    expect(entry.cases?.[0]).toEqual({
      id: 'custom-1',
      inputText: '[1, 2, 3]\n6',
      expectedText: '[0, 2]',
      builtin: false,
    })
    expect(entry.js).toContain('function twoSum')
    expect(entry.ts).toContain('function twoSum')
    expect(entry.solvedAt).toBe(solvedAt)
  })

  it('problem count matches the live store', () => {
    const doc = buildFullStateExport(seededState)
    expect(Object.keys(doc.persisted.problems)).toHaveLength(
      Object.keys(seededState.problems).length
    )
  })

  it('a null cases / null code problem survives the round trip', () => {
    const doc = buildFullStateExport({
      ...seededState,
      problems: {
        'two-sum': {
          subs: [],
          cases: null,
          js: null,
          ts: null,
          solvedAt: null,
        },
      },
    })
    expect(JSON.parse(JSON.stringify(doc)).persisted.problems['two-sum']).toEqual(
      doc.persisted.problems['two-sum']
    )
  })
})

// ---------------------------------------------------------------------------
// Generated bank included
// ---------------------------------------------------------------------------

describe('generated-bank-included', () => {
  it('serializes the accepted set with the full Problem shape', () => {
    const doc = buildFullStateExport(seededState)
    expect(doc.generatedProblems).toEqual([generatedProblem])
    const round = JSON.parse(JSON.stringify(doc)) as typeof doc
    expect(round.generatedProblems[0]).toMatchObject({
      slug: 'generated-sum-pair',
      num: 9001,
      title: 'Find Pair Sum',
      difficulty: 'Medium',
      tags: ['Array', 'Hash Table'],
      fnName: 'findPairSum',
      mode: 'fn',
      hints: ['Walk the array once.', 'Remember seen values.'],
    })
    expect(round.generatedProblems[0].starter.js).toBe(
      generatedProblem.starter.js
    )
    expect(round.generatedProblems[0].tests).toEqual(generatedProblem.tests)
    expect(round.generatedProblems[0].desc).toContain('<div class="ex">')
  })

  it('an empty generated bank still emits an array', () => {
    const doc = buildFullStateExport({ ...seededState, generatedProblems: [] })
    expect(doc.generatedProblems).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// API keys excluded
// ---------------------------------------------------------------------------

describe('api-keys-excluded', () => {
  it('seeded leetlab.apiKeys content never appears in the exported JSON', () => {
    // Seed the dedicated keys key with a realistic Anthropic + OpenAI pair,
    // as if a user had entered them in the settings UI.
    memory.set(
      'leetlab.apiKeys',
      JSON.stringify({
        anthropic: 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789',
        openai: 'sk-proj-0123456789abcdefghijklmnopqrstuvwxyz',
      })
    )

    const doc = buildFullStateExport(seededState)
    const json = JSON.stringify(doc)

    expect(json).not.toContain('sk-ant-')
    expect(json).not.toContain('sk-proj-')
    expect(json).not.toContain('apiKeys')
    expect(json).not.toContain('api_key')
  })

  it('top-level keys contain no key-shaped field even when one is added to the store', () => {
    // Defense in depth: even if some future field named like a key existed in
    // the store, the allowlist builder would still omit it.
    const doc = buildFullStateExport(seededState)
    const walk = (value: unknown, path: string[] = []): string[] => {
      if (typeof value === 'string' && /^sk-/.test(value)) {
        return [path.join('.')]
      }
      if (Array.isArray(value)) {
        return value.flatMap((v, i) => walk(v, [...path, String(i)]))
      }
      if (value !== null && typeof value === 'object') {
        const hits: string[] = []
        for (const [k, v] of Object.entries(value)) {
          if (/api[-_]?key/i.test(k)) hits.push(path.concat(k).join('.'))
          hits.push(...walk(v, [...path, k]))
        }
        return hits
      }
      return []
    }
    expect(walk(doc)).toEqual([])
  })

  it('a redacted readback of the keys store stays out of exports', () => {
    memory.set('leetlab.apiKeys', JSON.stringify({ local: 'ollama-secret' }))
    const json = JSON.stringify(buildFullStateExport(seededState))
    expect(json).not.toContain('ollama-secret')
    expect(json).not.toContain('local')
  })
})

// ---------------------------------------------------------------------------
// Round-trip fidelity + repeatable export
// ---------------------------------------------------------------------------

describe('round-trip-fidelity', () => {
  it('parse -> stringify reproduces the live state exactly', () => {
    const doc = buildFullStateExport(seededState)
    const round = JSON.parse(JSON.stringify(doc)) as typeof doc
    expect(round).toEqual(doc)
  })

  it('numeric types are retained: split, solvedAt, num, ms', () => {
    const round = JSON.parse(
      JSON.stringify(buildFullStateExport(seededState))
    ) as typeof seededState
    expect(round).toBeDefined()
    const doc = buildFullStateExport(seededState)
    expect(typeof doc.persisted.split).toBe('number')
    expect(doc.persisted.split).toBe(0.44)
    expect(doc.persisted.problems['two-sum'].solvedAt).toBe(solvedAt)
    expect(doc.persisted.problems['two-sum'].subs[0].ms).toBe(12)
    expect(doc.generatedProblems[0].num).toBe(9001)
  })

  it('undefined is omitted consistently (no undefined survives stringify)', () => {
    const doc = buildFullStateExport(seededState)
    expect(JSON.stringify(doc)).not.toContain('undefined')
  })
})

describe('repeatable-export', () => {
  it('two exports are data-identical', () => {
    const first = JSON.stringify(buildFullStateExport(seededState))
    const second = JSON.stringify(buildFullStateExport(seededState))
    expect(second).toBe(first)
  })

  it('the export action mutates no store state', () => {
    const before = JSON.stringify(useAppStore.getState())
    buildFullStateExport({
      lang: useAppStore.getState().lang,
      split: useAppStore.getState().split,
      lastSlug: useAppStore.getState().lastSlug,
      problems: useAppStore.getState().problems,
      generatedProblems: useAppStore.getState().generatedProblems,
    })
    const after = JSON.stringify(useAppStore.getState())
    expect(after).toBe(before)
  })
})
