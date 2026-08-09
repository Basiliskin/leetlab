export interface TestCase {
  id: string
  inputText: string
  expectedText: string
  builtin: boolean
}

export interface ParsedTestCase {
  id: string
  input?: unknown[]
  calls?: unknown[][]
  expected?: unknown
  parseError?: string
}