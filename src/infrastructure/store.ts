import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Problem } from '@domain/Problem'
import type { TestCase } from '@domain/TestCase'
import { PROBLEM_BANK } from './problemBank'

interface Submission {
  t: number
  lang: 'js' | 'ts'
  verdict: string
  passed: number
  total: number
  ms: number | null
}

interface ProblemState {
  subs: Submission[]
  cases: TestCase[] | null
  js: string | null
  ts: string | null
  solvedAt: number | null
}

interface AppState {
  lang: 'js' | 'ts'
  split: number
  lastSlug: string
  problems: Record<string, ProblemState>
  generatedProblems: Problem[]

  // In-memory only — a validated generated problem awaiting review (Phase 5).
  // Deliberately NOT in partialize: it never reaches localStorage, so a
  // reload clears it and it can't leak into full-state exports.
  pendingGenerated: Problem | null

  currentSlug: string
  selectedCaseIdx: number
  filter: 'All' | 'Easy' | 'Medium' | 'Hard'
  status: 'All' | 'Done' | 'Undone'
  search: string
  caseMarks: Record<string, string>
  cursorLine: number
  cursorCol: number

  getProblem: (slug: string) => Problem | undefined
  getProblemState: (slug: string) => ProblemState
  getCases: () => TestCase[]
  setLang: (lang: 'js' | 'ts') => void
  selectProblem: (slug: string) => void
  setFilter: (filter: AppState['filter']) => void
  setStatus: (status: AppState['status']) => void
  setSearch: (search: string) => void
  setSplit: (split: number) => void
  selectCase: (idx: number) => void
  updateCase: (idx: number, key: keyof TestCase, value: string) => void
  addCase: () => void
  deleteCase: (idx: number) => void
  restoreCases: () => void
  saveCode: (code: string) => void
  addSubmission: (sub: Submission) => void
  markSolved: () => void
  acceptGeneratedProblem: (problem: Problem) => AcceptGeneratedResult
  discardGeneratedProblem: (slug: string) => void
  setPendingGenerated: (problem: Problem | null) => void
  setCaseMark: (caseId: string, mark: string) => void
  resetCaseMarks: () => void
  setCursorPos: (line: number, col: number) => void
  // last run results per-problem
  lastRuns?: Record<string, any>
  setLastRun: (slug: string, payload: any) => void
  // typescript compiler status
  tsStatus?: string
  setTsStatus: (st: string) => void
  // which tab is active in the testcases/result drawer
  activeResultTab: 'test' | 'result' | 'console'
  setActiveResultTab: (tab: 'test' | 'result' | 'console') => void
}

const defaultProblemState = (): ProblemState => ({
  subs: [],
  cases: null,
  js: null,
  ts: null,
  solvedAt: null,
})

/* =========================================
   PURE DOMAIN HELPER (Moved outside store)
   ========================================= */
const defaultCasesCache = new Map<string, TestCase[]>()

export const getDefaultCases = (problem: Problem): TestCase[] => {
  const cached = defaultCasesCache.get(problem.slug)
  if (cached) return cached

  const cases = problem.tests.map((t, i) => ({
    id: `builtin-${i}`,
    inputText: JSON.stringify(problem.mode === 'class' ? t.calls : t.in, null, 1),
    expectedText: JSON.stringify(t.out),
    builtin: true,
  }))
  defaultCasesCache.set(problem.slug, cases)
  return cases
}

/* =========================================
  GENERATED-PROBLEM SLICE (pure helpers)
  ========================================= */

/**
 * Accepted generated problems are numbered from the 9000-series, which
 * collides with neither the real LeetCode nums in the bank (1..704) nor the
 * 8000-series custom range (8001..8012).
 */
const GENERATED_NUM_BASE = 9000

export type DuplicateReason =
  | 'duplicate-slug'
  | 'duplicate-title'
  | 'duplicate-signature'

export type AcceptGeneratedResult =
  | { ok: true }
  | { ok: false; reason: DuplicateReason; collidingWith: Problem }

/**
 * First built-in or accepted generated problem colliding with `problem`,
 * or null. Priority is slug, then title, then signature (mode + fnName),
 * each searched across the merged bank.
 */
export const findGeneratedCollision = (
  problem: Problem,
  builtin: Problem[],
  accepted: Problem[]
): { reason: DuplicateReason; collidingWith: Problem } | null => {
  const bank = builtin.concat(accepted)
  const bySlug = bank.find((p) => p.slug === problem.slug)
  if (bySlug) return { reason: 'duplicate-slug', collidingWith: bySlug }
  const byTitle = bank.find((p) => p.title === problem.title)
  if (byTitle) return { reason: 'duplicate-title', collidingWith: byTitle }
  const bySignature = bank.find(
    (p) => p.mode === problem.mode && p.fnName === problem.fnName
  )
  if (bySignature) return { reason: 'duplicate-signature', collidingWith: bySignature }
  return null
}

/** Smallest free number >= GENERATED_NUM_BASE not present in `taken`. */
export const nextGeneratedNum = (taken: number[]): number => {
  const used = new Set(taken)
  let num = GENERATED_NUM_BASE
  while (used.has(num)) num += 1
  return num
}

/* =========================================
  RUNTIME-MERGED BANK READ PATH
  ========================================= */

/**
 * Runtime-merged problem bank: built-ins first, then accepted generated
 * problems in stable accept order. Pure concat — never mutates either input,
 * so PROBLEM_BANK keeps its reference identity and length.
 */
export const getMergedBank = (
  builtin: readonly Problem[],
  accepted: readonly Problem[]
): Problem[] => builtin.concat(accepted)

/**
 * Store-derived merged bank for the UI (Sidebar list/counts, Topbar
 * denominator/segments). PROBLEM_BANK is a static constant, so the merged
 * result only changes when the accepted generated slice changes.
 */
export const useMergedBank = (): Problem[] => {
  const generated = useAppStore((s) => s.generatedProblems)
  return useMemo(() => getMergedBank(PROBLEM_BANK, generated), [generated])
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'js',
      split: 0.44,
      lastSlug: PROBLEM_BANK[0].slug,
      problems: {},
      generatedProblems: [],
      pendingGenerated: null,
      currentSlug: PROBLEM_BANK[0].slug,
      selectedCaseIdx: 0,
      filter: 'All',
      status: 'All',
      search: '',
      caseMarks: {},
      cursorLine: 1,
      cursorCol: 1,

      getProblem: (slug) =>
        getMergedBank(PROBLEM_BANK, get().generatedProblems).find(
          (p) => p.slug === slug
        ),

      getProblemState: (slug) => {
        const state = get().problems[slug]
        if (!state) {
          const def = defaultProblemState()
          set((s) => ({ problems: { ...s.problems, [slug]: def } }))
          return def
        }
        return state
      },

      // Helper to get current cases (uses the external pure function)
      getCases: () => {
        const { currentSlug, problems, getProblem } = get()
        const prob = getProblem(currentSlug)
        if (!prob) return []
        const ps = problems[currentSlug]
        return ps?.cases || getDefaultCases(prob)
      },

      setLang: (lang) => set({ lang }),

      selectProblem: (slug) =>
        set({
          currentSlug: slug,
          lastSlug: slug,
          selectedCaseIdx: 0,
          caseMarks: {},
        }),

      setFilter: (filter) => set({ filter }),
      setStatus: (status) => set({ status }),
      setSearch: (search) => set({ search }),
      setSplit: (split) => set({ split }),
      selectCase: (idx) => set({ selectedCaseIdx: idx }),

      updateCase: (idx, key, value) => {
        const { currentSlug, problems, getCases } = get()
        const ps = problems[currentSlug] || defaultProblemState()
        const cases = [...getCases()]
        cases[idx] = { ...cases[idx], [key]: value }
        set({
          problems: {
            ...problems,
            [currentSlug]: { ...ps, cases },
          },
        })
      },

      addCase: () => {
        const { currentSlug, problems, getProblem, getCases } = get()
        const prob = getProblem(currentSlug)!
        const ps = problems[currentSlug] || defaultProblemState()
        const cases = [...getCases()]
        cases.push({
          id: crypto.randomUUID(),
          inputText: prob.mode === 'class' ? `[["${prob.fnName}",[]]]` : '[]',
          expectedText: '',
          builtin: false,
        })
        set({
          problems: { ...problems, [currentSlug]: { ...ps, cases } },
          selectedCaseIdx: cases.length - 1,
        })
      },

      deleteCase: (idx) => {
        const { currentSlug, problems, getCases } = get()
        const ps = problems[currentSlug] || defaultProblemState()
        const cases = [...getCases()]
        if (cases[idx]?.builtin) return
        cases.splice(idx, 1)
        set({
          problems: { ...problems, [currentSlug]: { ...ps, cases } },
          selectedCaseIdx: Math.max(0, idx - 1),
        })
      },

      restoreCases: () => {
        const { currentSlug, problems } = get()
        const ps = problems[currentSlug] || defaultProblemState()
        set({
          problems: { ...problems, [currentSlug]: { ...ps, cases: null } },
          selectedCaseIdx: 0,
          caseMarks: {},
        })
      },

      saveCode: (code) => {
        const { currentSlug, lang, problems } = get()
        const ps = problems[currentSlug] || defaultProblemState()
        set({
          problems: { ...problems, [currentSlug]: { ...ps, [lang]: code } },
        })
      },

      addSubmission: (sub) => {
        const { currentSlug, problems } = get()
        const ps = problems[currentSlug] || defaultProblemState()
        const subs = [...(ps.subs || []), sub].slice(-60)
        set({
          problems: { ...problems, [currentSlug]: { ...ps, subs } },
        })
      },

      markSolved: () => {
        const { currentSlug, problems } = get()
        const ps = problems[currentSlug] || defaultProblemState()
        set({
          problems: { ...problems, [currentSlug]: { ...ps, solvedAt: Date.now() } },
        })
      },

      acceptGeneratedProblem: (problem) => {
        const { generatedProblems } = get()
        const collision = findGeneratedCollision(problem, PROBLEM_BANK, generatedProblems)
        if (collision) return { ok: false, ...collision }
        const num = nextGeneratedNum([
          ...PROBLEM_BANK.map((p) => p.num),
          ...generatedProblems.map((p) => p.num),
        ])
        const accepted = { ...problem, num }
        set({ generatedProblems: [...generatedProblems, accepted] })
        return { ok: true }
      },

      discardGeneratedProblem: (slug) =>
        set((s) => ({
          generatedProblems: s.generatedProblems.filter((p) => p.slug !== slug),
        })),

      setPendingGenerated: (problem) => set({ pendingGenerated: problem }),

      setCaseMark: (caseId, mark) =>
        set((s) => ({ caseMarks: { ...s.caseMarks, [caseId]: mark } })),

      resetCaseMarks: () => set({ caseMarks: {} }),
      setCursorPos: (line, col) => set({ cursorLine: line, cursorCol: col }),
        // last run results per-problem
        lastRuns: {},
        setLastRun: (slug: string, payload: any) =>
          set((s) => ({ lastRuns: { ...(s.lastRuns || {}), [slug]: payload } })),

        // typescript compiler status
        tsStatus: 'loading',
        setTsStatus: (st: string) => set({ tsStatus: st }),

        // which tab is active in the testcases/result drawer
        activeResultTab: 'test',
        setActiveResultTab: (tab) => set({ activeResultTab: tab }),
    }),
    {
      name: 'leetlab.v2',
      // Persist strategy: additive default, no key bump.
      // `generatedProblems` is additive with a safe default ([]), and
      // zustand's shallow merge keeps that default for existing users whose
      // persisted state predates the field, so prior state
      // ({lang, split, lastSlug, problems}) survives without a leetlab.v3
      // bump or a migrate. A bump would only be warranted for a field that
      // needs prior data transformed on upgrade.
      partialize: (state) => ({
        lang: state.lang,
        split: state.split,
        lastSlug: state.lastSlug,
        problems: state.problems,
        generatedProblems: state.generatedProblems,
      }),
    }
  )
)