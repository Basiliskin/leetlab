import type { Category } from './Category'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ProblemMode = 'fn' | 'class'

export interface ProblemStarter {
  js: string
  ts: string
}

// Explicitly define the shape of a test to prevent 'any' type errors
export interface ProblemTest {
  in?: unknown[]
  calls?: unknown[][]
  out: unknown
}

export interface Problem {
  slug: string
  num: number
  title: string
  difficulty: Difficulty
  tags: string[]
  fnName: string
  mode: ProblemMode
  starter: ProblemStarter
  tests: ProblemTest[] // Now strictly typed!
  hints: string[]
  desc: string
  // Top-level grouping (e.g. Classic/Async/Generators). Assigned at the
  // problem-bank aggregation boundary in problemBanks/index.ts, never by
  // individual problem authors.
  category: Category
}

/**
 * Author-facing shape used inside the per-category sub-banks. Sub-banks
 * never assign `category` themselves — problemBanks/index.ts stamps it
 * from the sub-bank's own mapping. Excluding it here keeps the
 * single-source-of-truth for category in one place and means new problems
 * are added without copying a category literal into every file.
 */
export type ProblemDraft = Omit<Problem, 'category'>