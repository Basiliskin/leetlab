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

  currentSlug: string
  selectedCaseIdx: number
  filter: 'All' | 'Easy' | 'Medium' | 'Hard'
  search: string
  caseMarks: Record<string, string>

  getProblem: (slug: string) => Problem | undefined
  getProblemState: (slug: string) => ProblemState
  getCases: () => TestCase[]
  setLang: (lang: 'js' | 'ts') => void
  selectProblem: (slug: string) => void
  setFilter: (filter: AppState['filter']) => void
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
  setCaseMark: (caseId: string, mark: string) => void
  resetCaseMarks: () => void
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
export const getDefaultCases = (problem: Problem): TestCase[] => {
  return problem.tests.map((t, i) => ({
    id: `builtin-${i}`,
    inputText: JSON.stringify(problem.mode === 'class' ? t.calls : t.in, null, 1),
    expectedText: JSON.stringify(t.out),
    builtin: true,
  }))
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'js',
      split: 0.44,
      lastSlug: PROBLEM_BANK[0].slug,
      problems: {},
      currentSlug: PROBLEM_BANK[0].slug,
      selectedCaseIdx: 0,
      filter: 'All',
      search: '',
      caseMarks: {},

      getProblem: (slug) => PROBLEM_BANK.find((p) => p.slug === slug),

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

      setCaseMark: (caseId, mark) =>
        set((s) => ({ caseMarks: { ...s.caseMarks, [caseId]: mark } })),

      resetCaseMarks: () => set({ caseMarks: {} }),
    }),
    {
      name: 'leetlab.v2',
      partialize: (state) => ({
        lang: state.lang,
        split: state.split,
        lastSlug: state.lastSlug,
        problems: state.problems,
      }),
    }
  )
)