// Fixture suite for the Phase 8 validated full-state JSON import
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Covers: version-gate (wrong/missing/non-number version rejected before any
// write, localStorage byte-identical), schema-validation (non-JSON, missing
// root/key, type-mismatch — field-naming errors, no crash, no mutation),
// atomic-rollback-on-failure (injected mid-apply fault restores the pre-import
// snapshot), merged-bank-slug-resolution (dangling lastSlug rejected and named;
// built-in and imported-generated slugs resolve), generated-bank-dedupe
// (slug/title/signature collisions vs PROBLEM_BANK rejected, unique set
// imports), and restore-fidelity-roundtrip (export -> mutate -> import
// reproduces the exact slice + bank, and the restored state survives a reload
// via the persisted leetlab.v2 key).

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

const { useAppStore } = await import('./store')
const { buildFullStateExport } = await import('./fullStateExport')
const { FULL_STATE_VERSION } = await import('./fullStateExport')
const { importFullState, validateFullStateImport } = await import(
  './fullStateImport'
)
const { PROBLEM_BANK } = await import('./problemBank')

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
          t: solvedAt,
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

const validRaw = JSON.stringify(buildFullStateExport(seededState))

/** A generated problem variant for collision fixtures (always shape-valid). */
const mkProblem = (overrides: Partial<Problem>): Problem => ({
  ...generatedProblem,
  ...overrides,
})

/** Live-state baseline helper: a modest pre-import store + persisted JSON. */
const liveBaseline = {
  lang: 'js' as const,
  split: 0.44,
  lastSlug: 'two-sum',
  problems: {
    'two-sum': {
      subs: [] as { t: number; lang: 'js'; verdict: string; passed: number; total: number; ms: number | null }[],
      cases: null,
      js: 'function twoSum(nums, target) { return [0, 2]; }',
      ts: null,
      solvedAt: null,
    },
  },
  generatedProblems: [] as Problem[],
}

/** Assert the live store and the persisted leetlab.v2 JSON are both intact. */
const expectUnchanged = (before: string) => {
  const s = useAppStore.getState()
  expect({
    lang: s.lang,
    split: s.split,
    lastSlug: s.lastSlug,
    problems: s.problems,
    generatedProblems: s.generatedProblems,
  }).toEqual(liveBaseline)
  expect(memory.get('leetlab.v2')).toBe(before)
}

beforeEach(() => {
  memory.clear()
  useAppStore.setState({
    ...liveBaseline,
    currentSlug: 'two-sum',
    selectedCaseIdx: 0,
    caseMarks: {},
  })
})

// ---------------------------------------------------------------------------
// Version gate
// ---------------------------------------------------------------------------

describe('version-gate', () => {
  it.each([
    ['wrong version', { version: FULL_STATE_VERSION + 1 }],
    ['missing version', { version: undefined }],
    ['non-number version', { version: 'v1' }],
  ])('rejects %s before any write', (_label, patch) => {
    const before = memory.get('leetlab.v2')!
    const bad = JSON.stringify({ ...JSON.parse(validRaw), ...patch })
    const result = importFullState(bad)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/version: expected 1/)
    expectUnchanged(before)
  })

  it('validateFullStateImport reports the version mismatch deterministically', () => {
    const bad = JSON.stringify({ ...JSON.parse(validRaw), version: 99 })
    const result = validateFullStateImport(bad)
    expect('errors' in result).toBe(true)
    if ('errors' in result) expect(result.errors).toEqual(['version: expected 1, got 99'])
  })
})

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe('schema-validation', () => {
  it.each([
    ['non-JSON text', '{"version": 1, trun', /raw: not valid JSON/],
    ['root is an array', '[1, 2, 3]', /raw: expected a JSON object/],
    ['missing persisted', '{"version": 1, "generatedProblems": []}', /persisted: missing/],
    ['missing generatedProblems', '{"version": 1, "persisted": {"lang":"js","split":0.5,"lastSlug":"two-sum","problems":{}}}', /generatedProblems: missing/],
  ])('rejects %s with a named error, no crash, no mutation', (_label, raw, pattern) => {
    const before = memory.get('leetlab.v2')!
    const result = importFullState(raw)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join(' ')).toMatch(pattern)
    expectUnchanged(before)
  })

  it('rejects a bad persisted.lang and names the field', () => {
    const before = memory.get('leetlab.v2')!
    const doc = JSON.parse(validRaw) as { persisted: { lang: string } }
    doc.persisted.lang = 'python'
    const result = importFullState(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(
        /persisted\.lang: expected "js" or "ts", got "python"/
      )
    expectUnchanged(before)
  })

  it('rejects a type-mismatched per-problem field and names the problem', () => {
    const before = memory.get('leetlab.v2')!
    const doc = JSON.parse(validRaw) as {
      persisted: { problems: Record<string, { subs: unknown }> }
    }
    doc.persisted.problems['two-sum'].subs = 'nope'
    const result = importFullState(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(
        /persisted\.problems\["two-sum"\]\.subs: expected an array, got string/
      )
    expectUnchanged(before)
  })

  it('rejects a malformed generated problem and names the entry + field', () => {
    const before = memory.get('leetlab.v2')!
    const doc = JSON.parse(validRaw) as { generatedProblems: Array<Record<string, unknown>> }
    delete doc.generatedProblems[0].fnName
    const result = importFullState(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(/generatedProblems\[0\]: fnName: missing/)
    expectUnchanged(before)
  })

  it('rejects duplicate slugs inside the file itself', () => {
    const before = memory.get('leetlab.v2')!
    const doc = JSON.parse(validRaw) as { generatedProblems: Problem[] }
    doc.generatedProblems = [
      generatedProblem,
      mkProblem({ slug: 'generated-sum-pair', title: 'Another Pair Sum' }),
    ]
    const result = importFullState(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(
        /generatedProblems: duplicate slug "generated-sum-pair" within the file/
      )
    expectUnchanged(before)
  })
})

// ---------------------------------------------------------------------------
// Atomic rollback on failure
// ---------------------------------------------------------------------------

describe('atomic-rollback-on-failure', () => {
  it('an injected mid-apply fault restores the pre-import snapshot, not a half-apply', () => {
    const before = memory.get('leetlab.v2')!
    const originalSetState = useAppStore.setState

    // Make exactly the import-apply setState (the one whose currentSlug is the
    // imported lastSlug) throw; every other call, including the restore,
    // passes through unchanged.
    useAppStore.setState = ((partial: unknown) => {
      const patch = partial as { currentSlug?: string }
      if (patch.currentSlug === seededState.lastSlug) {
        throw new Error('injected mid-apply fault')
      }
      return originalSetState(partial as Parameters<typeof originalSetState>[0])
    }) as typeof useAppStore.setState

    let result
    try {
      result = importFullState(validRaw)
    } finally {
      useAppStore.setState = originalSetState
    }

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(/restored unchanged/)
    // The live store is byte-for-byte the pre-import state...
    expectUnchanged(before)
  })
})

// ---------------------------------------------------------------------------
// Merged-bank slug resolution
// ---------------------------------------------------------------------------

describe('merged-bank-slug-resolution', () => {
  it('rejects a dangling lastSlug and names it', () => {
    const before = memory.get('leetlab.v2')!
    const doc = JSON.parse(validRaw) as {
      persisted: { lastSlug: string }
    }
    doc.persisted.lastSlug = 'no-such-slug'
    const result = importFullState(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(
        /persisted\.lastSlug "no-such-slug" does not resolve in the merged problem bank/
      )
    expectUnchanged(before)
  })

  it('accepts a built-in lastSlug with an empty generated bank', () => {
    const doc = buildFullStateExport({
      lang: 'js',
      split: 0.5,
      lastSlug: PROBLEM_BANK[0].slug,
      problems: {},
      generatedProblems: [],
    })
    const result = importFullState(JSON.stringify(doc))

    expect(result.ok).toBe(true)
    const s = useAppStore.getState()
    expect(s.lastSlug).toBe(PROBLEM_BANK[0].slug)
    expect(s.currentSlug).toBe(PROBLEM_BANK[0].slug)
    expect(s.generatedProblems).toEqual([])
  })

  it('accepts a generated lastSlug that resolves through the imported bank', () => {
    const result = importFullState(validRaw)

    expect(result.ok).toBe(true)
    const s = useAppStore.getState()
    expect(s.lastSlug).toBe('generated-sum-pair')
    expect(s.currentSlug).toBe('generated-sum-pair')
    expect(s.getProblem('generated-sum-pair')?.title).toBe('Find Pair Sum')
    // View state mirrors selectProblem: case marks cleared for the new slug.
    expect(s.caseMarks).toEqual({})
    expect(s.selectedCaseIdx).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Generated-bank dedupe against PROBLEM_BANK
// ---------------------------------------------------------------------------

describe('generated-bank-dedupe', () => {
  const bank = (slug: string, title: string, fnName: string, mode: Problem['mode']) => {
    const doc = JSON.parse(validRaw) as { generatedProblems: Problem[] }
    doc.generatedProblems = [mkProblem({ slug, title, fnName, mode })]
    return JSON.stringify(doc)
  }

  it('rejects an imported problem whose slug collides with PROBLEM_BANK', () => {
    const before = memory.get('leetlab.v2')!
    const result = importFullState(
      bank(PROBLEM_BANK[0].slug, 'Different Title', 'differentFn', 'fn')
    )

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(
        new RegExp(`generatedProblems\\[0\\]: The slug "${PROBLEM_BANK[0].slug}" is already used by`)
      )
    expectUnchanged(before)
  })

  it('rejects an imported problem whose title collides with PROBLEM_BANK', () => {
    const before = memory.get('leetlab.v2')!
    const result = importFullState(
      bank('brand-new-slug', PROBLEM_BANK[0].title, 'differentFn', 'fn')
    )

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(/A problem with the same title already exists/)
    expectUnchanged(before)
  })

  it('rejects an imported problem whose signature collides with PROBLEM_BANK', () => {
    const before = memory.get('leetlab.v2')!
    const result = importFullState(
      bank('brand-new-slug', 'Brand New Title', PROBLEM_BANK[0].fnName, PROBLEM_BANK[0].mode)
    )

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(/A problem with the same signature/)
    expectUnchanged(before)
  })

  it('imports a unique generated set exactly once', () => {
    const result = importFullState(validRaw)

    expect(result.ok).toBe(true)
    expect(useAppStore.getState().generatedProblems).toEqual([generatedProblem])
    expect(PROBLEM_BANK.length).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// Restore fidelity round-trip
// ---------------------------------------------------------------------------

describe('restore-fidelity-roundtrip', () => {
  it('export -> mutate -> import reproduces the exact slice and generated bank', () => {
    // Rich live state that a user would export.
    useAppStore.setState({
      ...liveBaseline,
      lang: 'ts',
      lastSlug: 'generated-sum-pair',
      problems: {
        'two-sum': {
          subs: [
            {
              t: solvedAt,
              lang: 'js',
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
      currentSlug: 'generated-sum-pair',
    })

    const s = useAppStore.getState()
    const raw = JSON.stringify(
      buildFullStateExport({
        lang: s.lang,
        split: s.split,
        lastSlug: s.lastSlug,
        problems: s.problems,
        generatedProblems: s.generatedProblems,
      })
    )

    // Mutate the live state away from the export.
    useAppStore.setState({ lang: 'js', lastSlug: 'two-sum', problems: {}, generatedProblems: [] })

    const result = importFullState(raw)
    expect(result.ok).toBe(true)

    const restored = useAppStore.getState()
    expect(restored.lang).toBe('ts')
    expect(restored.lastSlug).toBe('generated-sum-pair')
    expect(restored.generatedProblems).toEqual([generatedProblem])
    expect(restored.problems['two-sum'].solvedAt).toBe(solvedAt)
    expect(restored.problems['two-sum'].subs).toHaveLength(1)
    expect(restored.problems['two-sum'].subs[0].verdict).toBe('Accepted')
    expect(restored.problems['two-sum'].cases?.[0]).toEqual({
      id: 'custom-1',
      inputText: '[1, 2, 3]\n6',
      expectedText: '[0, 2]',
      builtin: false,
    })
  })

  it('the restored state survives a reload (persisted leetlab.v2 key)', () => {
    const result = importFullState(validRaw)
    expect(result.ok).toBe(true)

    // Simulate a reload: the persisted key must carry the imported state.
    // zustand persist wraps the partialized slice under `state`.
    const persisted = JSON.parse(memory.get('leetlab.v2')!) as {
      state: {
        lang: string
        lastSlug: string
        problems: Record<string, unknown>
        generatedProblems: Problem[]
      }
    }
    expect(persisted.state.lang).toBe('ts')
    expect(persisted.state.lastSlug).toBe('generated-sum-pair')
    expect(persisted.state.generatedProblems).toEqual([generatedProblem])
    expect(persisted.state.problems['two-sum']).toEqual(
      seededState.problems['two-sum']
    )
  })
})
