// Fixture suite for the Phase 6 review-before-add gate
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Covers: accept-clean-persists (accept lands in the bank, double accept
// yields exactly +1, queue clears after the UI flow), accept-dedupe-failure-
// never-silently-adds (slug/title/signature collisions leave the bank
// unchanged and return the colliding problem), discard-leaves-bank-unchanged
// (queue empties, bank identical, no-op on empty queue, never accepts), and
// dedupe-reason-distinguished (the duplicate message names the property and
// the colliding problem for all three reasons).

import { beforeEach, describe, expect, it } from 'vitest'
import type { Problem } from '@domain/Problem'
import { PROBLEM_BANK } from './problemBank'

// ---------------------------------------------------------------------------
// localStorage shim: the persisted zustand store reads `window.localStorage`
// at module evaluation, so both globals must be in place before the import
// (same pattern as mergedBank.test.ts / generateSettings.test.ts).
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
const { describeDuplicate, duplicateHeadline } = await import('./reviewGate')

beforeEach(() => {
  memory.clear()
  useAppStore.setState({ generatedProblems: [], pendingGenerated: null })
})

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

const bankBefore = (): { count: number; slugs: string[] } => ({
  count: useAppStore.getState().generatedProblems.length,
  slugs: useAppStore.getState().generatedProblems.map((p) => p.slug),
})

// ---------------------------------------------------------------------------
// accept-clean-persists
// ---------------------------------------------------------------------------

describe('accept-clean-persists', () => {
  it('a non-colliding accept makes the problem appear in the bank', () => {
    const st = useAppStore.getState()
    const result = st.acceptGeneratedProblem(generatedProblem)
    expect(result).toEqual({ ok: true })
    expect(st.getProblem(generatedProblem.slug)?.title).toBe(
      generatedProblem.title
    )
    expect(useAppStore.getState().generatedProblems).toHaveLength(1)
  })

  it('the accepted problem is persisted to localStorage', () => {
    useAppStore.getState().acceptGeneratedProblem(generatedProblem)
    const persisted = JSON.parse(memory.get('leetlab.v2') ?? '{}')
    const restored = (persisted.state?.generatedProblems ?? []) as Problem[]
    expect(restored).toHaveLength(1)
    expect(restored[0]?.slug).toBe(generatedProblem.slug)
  })

  it('the full accept flow clears the review queue', () => {
    // The Phase 6 UI flow: queue holds the pending problem, Accept persists
    // and then clears the queue so the review screen is unreachable.
    const st = useAppStore.getState()
    st.setPendingGenerated(generatedProblem)
    expect(st.acceptGeneratedProblem(generatedProblem)).toEqual({ ok: true })
    st.setPendingGenerated(null)
    const after = useAppStore.getState()
    expect(after.pendingGenerated).toBeNull()
    expect(after.generatedProblems).toHaveLength(1)
    expect(after.getProblem(generatedProblem.slug)).toBeDefined()
  })

  it('double accept yields exactly one new problem (+1, never +2)', () => {
    const st = useAppStore.getState()
    const first = st.acceptGeneratedProblem(generatedProblem)
    // The second Accept finds the just-added problem by slug: dedupe rejects
    // it instead of adding a duplicate.
    const second = st.acceptGeneratedProblem(generatedProblem)
    expect(first).toEqual({ ok: true })
    expect(second.ok).toBe(false)
    expect(useAppStore.getState().generatedProblems).toHaveLength(1)
    expect(useAppStore.getState().getProblem(generatedProblem.slug)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// accept-dedupe-failure-never-silently-adds
// ---------------------------------------------------------------------------

describe('accept-dedupe-failure-never-silently-adds', () => {
  it('a slug collision leaves the bank unchanged and names the colliding problem', () => {
    const st = useAppStore.getState()
    const colliding = {
      ...generatedProblem,
      slug: PROBLEM_BANK[0].slug,
      title: 'Totally Different Title',
    }
    const before = bankBefore()
    const result = st.acceptGeneratedProblem(colliding)
    const after = bankBefore()
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('duplicate-slug')
    expect(result.collidingWith).toBe(PROBLEM_BANK[0])
    expect(after.count).toBe(before.count)
    expect(after.slugs).toEqual(before.slugs)
    expect(st.getProblem(PROBLEM_BANK[0].slug)).toBe(PROBLEM_BANK[0])
  })

  it('a title collision against an accepted generated problem is rejected', () => {
    const st = useAppStore.getState()
    st.acceptGeneratedProblem(generatedProblem)
    const twin = {
      ...generatedProblem,
      slug: 'generated-different-slug',
      fnName: 'anotherFunction',
    }
    const before = bankBefore()
    const result = st.acceptGeneratedProblem(twin)
    const after = bankBefore()
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('duplicate-title')
    expect(result.collidingWith.slug).toBe(generatedProblem.slug)
    expect(after.count).toBe(before.count)
  })

  it('a signature collision is rejected and reported as duplicate-signature', () => {
    const st = useAppStore.getState()
    st.acceptGeneratedProblem(generatedProblem)
    const sameSig = {
      ...generatedProblem,
      slug: 'generated-yet-another-slug',
      title: 'Completely New Title',
    }
    const result = st.acceptGeneratedProblem(sameSig)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('duplicate-signature')
    expect(result.collidingWith.slug).toBe(generatedProblem.slug)
    expect(useAppStore.getState().generatedProblems).toHaveLength(1)
  })

  it('a failed accept keeps the pending problem in the queue (Discard still possible)', () => {
    const st = useAppStore.getState()
    const colliding = { ...generatedProblem, slug: PROBLEM_BANK[0].slug }
    st.setPendingGenerated(colliding)
    const result = st.acceptGeneratedProblem(colliding)
    expect(result.ok).toBe(false)
    // Queue untouched by the failed accept; the UI can still Discard.
    expect(useAppStore.getState().pendingGenerated).toEqual(colliding)
    expect(useAppStore.getState().generatedProblems).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// discard-leaves-bank-unchanged
// ---------------------------------------------------------------------------

describe('discard-leaves-bank-unchanged', () => {
  it('discarding a pending problem clears the queue and leaves the bank unchanged', () => {
    const st = useAppStore.getState()
    st.setPendingGenerated(generatedProblem)
    st.discardGeneratedProblem(generatedProblem.slug)
    const after = useAppStore.getState()
    expect(after.pendingGenerated).toBeNull()
    expect(after.generatedProblems).toHaveLength(0)
    expect(after.getProblem(generatedProblem.slug)).toBeUndefined()
  })

  it('discard never accepts or persists the generated problem', () => {
    const st = useAppStore.getState()
    st.setPendingGenerated(generatedProblem)
    st.discardGeneratedProblem(generatedProblem.slug)
    const persisted = JSON.parse(memory.get('leetlab.v2') ?? '{}')
    expect((persisted.state?.generatedProblems ?? [])).toHaveLength(0)
    expect(useAppStore.getState().generatedProblems).toHaveLength(0)
  })

  it('discard does not alter pre-existing accepted problems', () => {
    const st = useAppStore.getState()
    st.acceptGeneratedProblem(generatedProblem)
    const another: Problem = {
      ...generatedProblem,
      slug: 'generated-second',
      title: 'Second Problem',
      fnName: 'secondFn',
    }
    st.setPendingGenerated(another)
    const before = bankBefore()
    st.discardGeneratedProblem(another.slug)
    const after = bankBefore()
    expect(after.count).toBe(before.count)
    expect(after.slugs).toEqual(before.slugs)
    expect(useAppStore.getState().getProblem(generatedProblem.slug)).toBeDefined()
    expect(useAppStore.getState().pendingGenerated).toBeNull()
  })

  it('discard on an empty queue is a no-op with no error thrown', () => {
    expect(() => {
      useAppStore.getState().discardGeneratedProblem(generatedProblem.slug)
    }).not.toThrow()
    expect(useAppStore.getState().generatedProblems).toHaveLength(0)
    expect(useAppStore.getState().pendingGenerated).toBeNull()
  })

  it('discarding a slug that is not pending leaves the queue untouched', () => {
    const st = useAppStore.getState()
    st.setPendingGenerated(generatedProblem)
    st.discardGeneratedProblem('unrelated-slug')
    expect(useAppStore.getState().pendingGenerated).toEqual(generatedProblem)
  })
})

// ---------------------------------------------------------------------------
// dedupe-reason-distinguished
// ---------------------------------------------------------------------------

describe('dedupe-reason-distinguished', () => {
  const collidingWith = generatedProblem

  it('a slug collision message explicitly calls out the slug and the colliding problem', () => {
    const msg = describeDuplicate({
      reason: 'duplicate-slug',
      collidingWith,
    })
    expect(msg).toContain(generatedProblem.slug)
    expect(msg).toContain(generatedProblem.title)
    expect(duplicateHeadline('duplicate-slug')).toContain('slug')
  })

  it('a title collision message explicitly calls out the title and the colliding problem', () => {
    const msg = describeDuplicate({
      reason: 'duplicate-title',
      collidingWith,
    })
    expect(msg).toContain(generatedProblem.title)
    expect(duplicateHeadline('duplicate-title')).toContain('title')
  })

  it('a signature collision message calls out the signature and the colliding problem', () => {
    const msg = describeDuplicate({
      reason: 'duplicate-signature',
      collidingWith,
    })
    expect(msg).toContain(generatedProblem.fnName)
    expect(msg).toContain(generatedProblem.mode)
    expect(msg).toContain(generatedProblem.title)
    expect(duplicateHeadline('duplicate-signature')).toContain('signature')
  })

  it('the three messages are mutually distinguishable', () => {
    const slug = describeDuplicate({ reason: 'duplicate-slug', collidingWith })
    const title = describeDuplicate({ reason: 'duplicate-title', collidingWith })
    const sig = describeDuplicate({
      reason: 'duplicate-signature',
      collidingWith,
    })
    expect(slug).not.toBe(title)
    expect(title).not.toBe(sig)
    expect(slug).not.toBe(sig)
  })

  it('the surfaced reason matches the colliding property in each scenario', () => {
    const st = useAppStore.getState()
    st.acceptGeneratedProblem(generatedProblem)

    // slug collision reports the slug-owning problem even with a different title
    const resSlug = st.acceptGeneratedProblem({
      ...generatedProblem,
      slug: PROBLEM_BANK[0].slug,
      title: 'Renamed',
    })
    expect(resSlug).toEqual({
      ok: false,
      reason: 'duplicate-slug',
      collidingWith: PROBLEM_BANK[0],
    })

    // title collision reports the title-owning (accepted generated) problem
    const resTitle = st.acceptGeneratedProblem({
      ...generatedProblem,
      slug: 'brand-new-slug',
      fnName: 'renamedFn',
    })
    expect(resTitle).toMatchObject({
      ok: false,
      reason: 'duplicate-title',
      collidingWith: {
        slug: generatedProblem.slug,
        title: generatedProblem.title,
      },
    })

    // signature collision reports the signature-owning problem
    const resSig = st.acceptGeneratedProblem({
      ...generatedProblem,
      slug: 'another-new-slug',
      title: 'Yet Another Title',
    })
    expect(resSig).toMatchObject({
      ok: false,
      reason: 'duplicate-signature',
      collidingWith: {
        slug: generatedProblem.slug,
        mode: generatedProblem.mode,
        fnName: generatedProblem.fnName,
      },
    })

    // none of the failed accepts mutated the bank
    expect(useAppStore.getState().generatedProblems).toHaveLength(1)
  })
})
