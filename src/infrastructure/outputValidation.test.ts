// Fixture suite for the Phase 3 output-validation module
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Covers: complete-shape-contract (valid + one-missing/mistyped per field),
// tests-signature-contract (arity, constructor/method names), json-
// serializability, desc-html-vocabulary, hints-array-contract, and the bounded
// re-prompt loop (termination, corrective feedback, provider-error passthrough).

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Problem } from '@domain/Problem'
import {
  DEFAULT_MAX_ATTEMPTS,
  GenerationValidationError,
  MAX_GENERATION_ATTEMPTS,
  appendValidationErrors,
  extractJsonObject,
  generateValidatedProblem,
  validateGeneratedProblem,
  validateGeneratedProblemObject,
} from './outputValidation'
import { generateProblemText } from './providerAdapters'

vi.mock('./providerAdapters', () => ({
  generateProblemText: vi.fn(),
}))

const mockedGenerate = vi.mocked(generateProblemText)

beforeEach(() => {
  mockedGenerate.mockReset()
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validFnProblem: Problem = {
  slug: 'generated-sum-pair',
  num: 9001,
  title: 'Find Pair Sum',
  difficulty: 'Easy',
  tags: ['Array', 'Hash Table'],
  fnName: 'findPairSum',
  mode: 'fn',
  starter: {
    js: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction findPairSum(nums, target) {\n  \n}\n',
    ts: 'function findPairSum(nums: number[], target: number): number[] {\n  \n}\n',
  },
  tests: [
    { in: [[1, 2, 3], 4], out: [0, 2] },
    { in: [[], 5], out: [-1, -1] },
  ],
  hints: ['Walk the array once.', 'Remember seen values.'],
  desc: '<p>Find the pair that sums to <code>target</code>. <em>Exactly</em> <strong>one</strong> solution exists.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,2,3], target = 4</div><div><b>Output:</b>[0,2]</div></div><ul><li>2 ≤ nums.length ≤ 10<sup>4</sup></li><li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li></ul><p class="note">Note text.</p>',
  category: 'Generated',
}

const validClassProblem: Problem = {
  slug: 'generated-queue-stack',
  num: 9002,
  title: 'Queue from Stacks',
  difficulty: 'Medium',
  tags: ['Stack', 'Design'],
  fnName: 'MyStackQueue',
  mode: 'class',
  starter: {
    js: 'class MyStackQueue {\n  constructor() {\n    \n  }\n\n  push(val) {\n    \n  }\n\n  pop() {\n    \n  }\n\n  peek() {\n    \n  }\n}\n',
    ts: 'class MyStackQueue {\n  constructor() {\n    \n  }\n\n  push(val: number): void {\n    \n  }\n\n  pop(): number {\n    return 0;\n  }\n\n  peek(): number {\n    return 0;\n  }\n}\n',
  },
  tests: [
    {
      calls: [
        ['MyStackQueue', []],
        ['push', [1]],
        ['push', [2]],
        ['pop', []],
        ['peek', []],
      ],
      out: [null, null, null, 1, 2],
    },
  ],
  hints: [],
  desc: '<p>Implement a queue using two stacks.</p><p class="note">Judge protocol: <code>undefined</code> becomes <code>null</code>.</p>',
  category: 'Generated',
}

function without<T extends object, K extends keyof T>(p: T, key: K): unknown {
  const { [key]: removed, ...rest } = p
  void removed
  return rest
}

function mistyped(p: Problem, key: keyof Problem, value: unknown): unknown {
  return { ...p, [key]: value }
}

function errorsOf(value: unknown): string[] {
  const result = validateGeneratedProblemObject(value)
  if (result.ok) throw new Error('expected validation to fail, got ok')
  return result.errors
}

// ---------------------------------------------------------------------------
// JSON extraction
// ---------------------------------------------------------------------------

describe('extractJsonObject', () => {
  it('parses a plain JSON object', () => {
    expect(extractJsonObject(JSON.stringify(validFnProblem))).toEqual(validFnProblem)
  })

  it('parses a fenced json block wrapped in prose', () => {
    const raw = 'Here is the problem:\n```json\n' + JSON.stringify(validFnProblem) + '\n```\nGood luck!'
    expect(extractJsonObject(raw)).toEqual(validFnProblem)
  })

  it('falls back to the first { .. last } span inside prose', () => {
    const raw = 'Sure! ' + JSON.stringify(validFnProblem) + ' Hope that helps.'
    expect(extractJsonObject(raw)).toEqual(validFnProblem)
  })

  it('returns undefined when nothing parses', () => {
    expect(extractJsonObject('this is not json at all')).toBeUndefined()
  })

  it('returns non-object JSON values as-is (object check happens later)', () => {
    expect(extractJsonObject('[1, 2]')).toEqual([1, 2])
  })
})

// ---------------------------------------------------------------------------
// Complete shape contract
// ---------------------------------------------------------------------------

describe('validateGeneratedProblem', () => {
  it('accepts a valid fn-mode problem from raw text', () => {
    const result = validateGeneratedProblem(JSON.stringify(validFnProblem))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.problem).toEqual(validFnProblem)
  })

  it('accepts a valid class-mode problem from raw text', () => {
    const result = validateGeneratedProblem(JSON.stringify(validClassProblem))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.problem).toEqual(validClassProblem)
  })

  it('rejects non-JSON raw text with a raw error', () => {
    const result = validateGeneratedProblem('not json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toMatch(/^raw:/)
  })

  it('rejects JSON that is not an object', () => {
    const result = validateGeneratedProblem('[1, 2]')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toBe('raw: expected a JSON object, got array')
  })
})

describe('validateGeneratedProblemObject — one missing field per field', () => {
  const missingCases: Array<[keyof Problem, string]> = [
    ['slug', 'slug:'],
    ['num', 'num:'],
    ['title', 'title:'],
    ['difficulty', 'difficulty:'],
    ['tags', 'tags:'],
    ['fnName', 'fnName:'],
    ['mode', 'mode:'],
    ['starter', 'starter:'],
    ['tests', 'tests:'],
    ['hints', 'hints:'],
    ['desc', 'desc:'],
  ]

  it.each(missingCases)('rejects when %s is missing', (key, prefix) => {
    const errors = errorsOf(without(validFnProblem, key))
    expect(errors.some((e) => e.startsWith(prefix))).toBe(true)
  })
})

describe('validateGeneratedProblemObject — one mistyped field per field', () => {
  const mistypedCases: Array<[string, unknown, string]> = [
    ['slug', 123, 'slug:'],
    ['slug', 'TwoSum', 'slug:'],
    ['num', '9001', 'num:'],
    ['num', 1.5, 'num:'],
    ['title', [], 'title:'],
    ['difficulty', 'easy', 'difficulty:'],
    ['difficulty', 'Insane', 'difficulty:'],
    ['tags', 'not-an-array', 'tags:'],
    ['tags', [1, 2], 'tags[0]:'],
    ['fnName', 'two-sum', 'fnName:'],
    ['fnName', '', 'fnName:'],
    ['mode', 'function', 'mode:'],
    ['mode', 'Class', 'mode:'],
    ['starter', 'str', 'starter:'],
    ['starter', { js: 1, ts: 2 }, 'starter.js:'],
    ['tests', {}, 'tests:'],
    ['tests', [], 'tests:'],
    ['hints', 'hint', 'hints:'],
    ['hints', ['ok', 3], 'hints[1]:'],
    ['desc', 5, 'desc:'],
  ]

  it.each(mistypedCases)('rejects mistyped %s with %s', (_label, value, prefix) => {
    const errors = errorsOf(mistyped(validFnProblem, _label as keyof Problem, value))
    expect(errors.some((e) => e.startsWith(prefix))).toBe(true)
  })

  it('is deterministic: identical input yields identical results', () => {
    const first = validateGeneratedProblemObject(validFnProblem)
    const second = validateGeneratedProblemObject(validFnProblem)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })
})

// ---------------------------------------------------------------------------
// Tests-signature contract
// ---------------------------------------------------------------------------

describe('tests-signature-contract (fn mode)', () => {
  it('rejects wrong arity against fnName params', () => {
    const bad = mistyped(validFnProblem, 'tests', [
      { in: [[1, 2, 3], 4, 9], out: [0, 2] },
    ])
    expect(errorsOf(bad)).toContain(
      'tests[0].in: expected 2 argument(s) for findPairSum(...), got 3'
    )
  })

  it('counts TS-annotated params correctly', () => {
    const result = validateGeneratedProblemObject(validFnProblem)
    expect(result.ok).toBe(true)
  })

  it('rejects a test missing its in array', () => {
    const bad = mistyped(validFnProblem, 'tests', [{ out: [0, 2] }])
    expect(errorsOf(bad)).toContain('tests[0].in: missing')
  })

  it('rejects a test missing its out value', () => {
    const bad = mistyped(validFnProblem, 'tests', [{ in: [[1, 2, 3], 4] }])
    expect(errorsOf(bad)).toContain('tests[0].out: missing')
  })

  it('rejects a non-object test entry', () => {
    const bad = mistyped(validFnProblem, 'tests', [42])
    expect(errorsOf(bad)).toContain('tests[0]: expected an object, got number')
  })
})

describe('tests-signature-contract (class mode)', () => {
  const withCalls = (calls: unknown[]): unknown =>
    mistyped(validClassProblem, 'tests', [{ calls, out: calls.map(() => null) }])

  it('rejects a constructor call not named after fnName', () => {
    const bad = withCalls([
      ['Wrong', []],
      ['push', [1]],
    ])
    expect(errorsOf(bad)).toContain(
      'tests[0].calls[0]: constructor call must be named "MyStackQueue" (the class name / fnName), got "Wrong"'
    )
  })

  it('rejects an unknown method not present in the starter class', () => {
    const bad = withCalls([
      ['MyStackQueue', []],
      ['bogusMethod', []],
    ])
    expect(errorsOf(bad)).toContain(
      'tests[0].calls[1]: unknown method "bogusMethod" (expected one of: push, pop, peek)'
    )
  })

  it('rejects non-array args on a call', () => {
    const bad = withCalls([
      ['MyStackQueue', []],
      ['push', 5],
    ])
    expect(errorsOf(bad)).toContain('tests[0].calls[1].args: expected an array, got number')
  })

  it('rejects an empty calls array', () => {
    const bad = mistyped(validClassProblem, 'tests', [{ calls: [], out: [] }])
    expect(errorsOf(bad)).toContain(
      'tests[0].calls: expected a non-empty array of [name, args] calls'
    )
  })

  it('rejects a call entry that is not an array', () => {
    const bad = withCalls([['MyStackQueue', []], 'push'])
    expect(errorsOf(bad)).toContain('tests[0].calls[1]: expected [name, args], got string')
  })

  it('rejects a non-array class-mode out', () => {
    const bad = mistyped(validClassProblem, 'tests', [
      { calls: [['MyStackQueue', []]], out: 7 },
    ])
    expect(errorsOf(bad)).toContain(
      'tests[0].out: class-mode expected output must be an array of results (one per call), got number'
    )
  })

  it('rejects an out whose length does not match the calls', () => {
    const bad = mistyped(validClassProblem, 'tests', [
      {
        calls: [['MyStackQueue', []], ['push', [1]]],
        out: [null],
      },
    ])
    expect(errorsOf(bad)).toContain('tests[0].out: expected 2 result(s) (one per call), got 1')
  })

  it('rejects a test missing its calls array', () => {
    const bad = mistyped(validClassProblem, 'tests', [{ out: [null] }])
    expect(errorsOf(bad)).toContain('tests[0].calls: missing')
  })
})

// ---------------------------------------------------------------------------
// JSON serializability
// ---------------------------------------------------------------------------

describe('json-serializability', () => {
  it('rejects a non-serializable value with its location', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    const bad = mistyped(validFnProblem, 'tests', [{ in: [[1], 2], out: cyclic }])
    expect(errorsOf(bad)).toContain('tests[0]: value is not JSON-serializable')
  })

  it('rejects a value that does not survive a JSON round-trip', () => {
    const bad = mistyped(validFnProblem, 'tests', [
      { in: [[1], 2], out: undefined },
    ])
    expect(errorsOf(bad)).toContain('tests[0]: value does not survive a JSON round-trip')
  })
})

// ---------------------------------------------------------------------------
// Hints array contract
// ---------------------------------------------------------------------------

describe('hints-array-contract', () => {
  it('accepts an empty hints array', () => {
    const result = validateGeneratedProblemObject(validClassProblem)
    expect(result.ok).toBe(true)
  })

  it('rejects a string hints field', () => {
    expect(errorsOf(mistyped(validFnProblem, 'hints', 'hint'))).toContain(
      'hints: expected an array of strings'
    )
  })

  it('rejects non-string entries inside hints', () => {
    expect(errorsOf(mistyped(validFnProblem, 'hints', ['ok', 3]))).toContain(
      'hints[1]: expected a string, got number'
    )
  })
})

// ---------------------------------------------------------------------------
// Desc HTML vocabulary
// ---------------------------------------------------------------------------

describe('desc-html-vocabulary', () => {
  const withDesc = (desc: string): unknown => mistyped(validFnProblem, 'desc', desc)

  it.each(['<table><tr><td>x</td></tr></table>', '<script>alert(1)</script>', '<iframe src="x"></iframe>'])(
    'rejects disallowed tag in %s',
    (desc) => {
      const errors = errorsOf(withDesc(desc))
      expect(errors.some((e) => e.startsWith('desc: tag <'))).toBe(true)
    }
  )

  it('rejects event-handler attributes', () => {
    const errors = errorsOf(
      withDesc('<p onclick="evil()">hello</p>')
    )
    expect(errors).toContain('desc: event-handler attribute "onclick" is not allowed')
  })

  it('rejects javascript: URLs', () => {
    const errors = errorsOf(withDesc('<p href="javascript:alert(1)">x</p>'))
    expect(errors).toContain('desc: "javascript:" URLs are not allowed')
  })

  it('rejects unknown class attributes', () => {
    const errors = errorsOf(withDesc('<div class="evil">x</div>'))
    expect(errors).toContain('desc: class "evil" is not allowed')
  })

  it('rejects HTML comments', () => {
    const errors = errorsOf(withDesc('<p>before<!-- comment -->after</p>'))
    expect(errors).toContain('desc: HTML comments are not allowed')
  })

  it('accepts the full allowed vocabulary', () => {
    const rich =
      '<p>a <code>c</code> <em>e</em> <strong>s</strong> <b>b</b></p>' +
      '<h4>Examples</h4>' +
      '<div class="ex"><div class="exp">x</div></div>' +
      '<ul><li>i<sub>1</sub></li><li>j<sup>2</sup></li></ul>' +
      '<p class="note">n</p>'
    const result = validateGeneratedProblemObject(mistyped(validFnProblem, 'desc', rich))
    expect(result.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Bounded re-prompt loop
// ---------------------------------------------------------------------------

describe('appendValidationErrors', () => {
  it('keeps the original prompt and embeds each error as a bullet', () => {
    const prompt = 'Original prompt'
    const appended = appendValidationErrors(prompt, ['slug: missing', 'tests[0].in: missing'])
    expect(appended.startsWith(prompt)).toBe(true)
    expect(appended).toContain('- slug: missing')
    expect(appended).toContain('- tests[0].in: missing')
  })
})

describe('generateValidatedProblem (bounded re-prompt)', () => {
  const options = {
    provider: 'openai' as const,
    apiKey: 'test-key',
    protocol: 'openai' as const,
    baseUrl: 'https://api.openai.com',
    model: 'gpt-test',
    prompt: 'Generate a problem as JSON',
  }

  it('returns the problem on the first valid attempt and stops', async () => {
    mockedGenerate.mockResolvedValue(JSON.stringify(validFnProblem))
    const problem = await generateValidatedProblem(options)
    expect(problem).toEqual(validFnProblem)
    expect(mockedGenerate).toHaveBeenCalledTimes(1)
  })

  it('re-prompts with corrective feedback after a malformed attempt', async () => {
    mockedGenerate
      .mockResolvedValueOnce('not json at all')
      .mockResolvedValueOnce(JSON.stringify(validFnProblem))
    const problem = await generateValidatedProblem(options)
    expect(problem).toEqual(validFnProblem)
    expect(mockedGenerate).toHaveBeenCalledTimes(2)
    const retryPrompt = mockedGenerate.mock.calls[1][0].prompt
    expect(retryPrompt).toContain('- raw: not valid JSON (expected a JSON object)')
  })

  it('rejects with GenerationValidationError after all attempts on always-malformed output', async () => {
    mockedGenerate.mockResolvedValue('still not json')
    const error: unknown = await generateValidatedProblem(options).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(GenerationValidationError)
    expect(error).toMatchObject({ attempts: DEFAULT_MAX_ATTEMPTS })
    expect(mockedGenerate).toHaveBeenCalledTimes(DEFAULT_MAX_ATTEMPTS)
  })

  it('embeds the previous errors into every retry prompt', async () => {
    mockedGenerate.mockResolvedValue('bad')
    await expect(generateValidatedProblem(options)).rejects.toBeInstanceOf(
      GenerationValidationError
    )
    for (let i = 1; i < mockedGenerate.mock.calls.length; i++) {
      expect(mockedGenerate.mock.calls[i][0].prompt).toContain('- raw:')
    }
  })

  it('honors a maxAttempts of 1 (no retry)', async () => {
    mockedGenerate.mockResolvedValue('bad')
    await expect(
      generateValidatedProblem(options, { maxAttempts: 1 })
    ).rejects.toMatchObject({ attempts: 1 })
    expect(mockedGenerate).toHaveBeenCalledTimes(1)
  })

  it('clamps maxAttempts to the hard upper bound', async () => {
    mockedGenerate.mockResolvedValue('bad')
    await expect(
      generateValidatedProblem(options, { maxAttempts: 99 })
    ).rejects.toMatchObject({ attempts: MAX_GENERATION_ATTEMPTS })
    expect(mockedGenerate).toHaveBeenCalledTimes(MAX_GENERATION_ATTEMPTS)
  })

  it('propagates provider errors immediately without burning retries', async () => {
    mockedGenerate.mockRejectedValue(new Error('network down'))
    await expect(generateValidatedProblem(options)).rejects.toThrow('network down')
    expect(mockedGenerate).toHaveBeenCalledTimes(1)
  })
})
