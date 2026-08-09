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
}