// Output validation and bounded re-prompt for LLM-generated problems.
//
// Phase 3 of docs/roadmaps/llm-generated-problems-import-export-roadmap.md.
// This module turns a provider adapter's raw model text into a validated
// `Problem` (or a list of named errors) and, when used through
// `generateValidatedProblem`, re-prompts the model with the collected errors a
// bounded number of times before giving up with a rejectable error.
//
// Never persists anything: on terminal failure nothing is written to
// localStorage, the problem bank, or the store (the review-before-add UI owns
// acceptance, Phase 6).

import type { Problem, ProblemMode } from '@domain/Problem'
import type { GenerateProblemTextOptions } from './providerAdapters'
import { generateProblemText } from './providerAdapters'

export const DEFAULT_MAX_ATTEMPTS = 3
export const MAX_GENERATION_ATTEMPTS = 5

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const
const MODES = ['fn', 'class'] as const

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

// The only HTML vocabulary DescPane can render (see src/components/DescPane.tsx
// and the desc strings in src/infrastructure/problemBank.ts). Keeping this as a
// single exported constant makes the contract auditable and testable.
export const DESC_ALLOWED_TAGS = [
  'p',
  'code',
  'em',
  'strong',
  'h4',
  'div',
  'b',
  'li',
  'ul',
  'sub',
  'sup',
] as const
export const DESC_ALLOWED_CLASSES = ['ex', 'exp', 'note'] as const

export type ValidateGeneratedProblemResult =
  | { ok: true; problem: Problem }
  | { ok: false; errors: string[] }

export class GenerationValidationError extends Error {
  readonly errors: string[]
  readonly attempts: number
  readonly rawText: string

  constructor(errors: string[], attempts: number, rawText: string) {
    super(
      `Generated problem failed validation after ${attempts} attempt(s): ${errors.join('; ')}`
    )
    this.name = 'GenerationValidationError'
    this.errors = errors
    this.attempts = attempts
    this.rawText = rawText
  }
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function typeOf(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function missingOrType(v: unknown, expected: string): string {
  if (v === undefined) return `missing (expected ${expected})`
  return `expected ${expected}, got ${typeOf(v)}`
}

function jsonDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  )
    return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!jsonDeepEqual(a[i], b[i])) return false
    }
    return true
  }
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false
    if (!jsonDeepEqual(aObj[key], bObj[key])) return false
  }
  return true
}

// Split a parameter list on top-level commas so type annotations containing
// generics or object literals (Map<K, V>, {a, b}) stay intact.
function splitTopLevelParams(src: string): string[] {
  const parts: string[] = []
  const openers = '([{<'
  const closers = ')]}>'
  let depth = 0
  let current = ''
  for (const ch of src) {
    if (openers.includes(ch)) depth += 1
    else if (closers.includes(ch)) depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current)
  return parts
    .map((p) => stripTypeAnnotation(p).trim())
    .filter((p) => p.length > 0)
}

// Cut a TS type annotation off one parameter (`nums: number[]` -> `nums`).
// The name/type colon sits at bracket depth 0, so `Map<number, number>` or a
// `{a: number}` default can't be mis-cut.
function stripTypeAnnotation(param: string): string {
  const openers = '([{<'
  const closers = ')]}>'
  let depth = 0
  for (let i = 0; i < param.length; i++) {
    const ch = param[i]
    if (openers.includes(ch)) depth += 1
    else if (closers.includes(ch)) depth = Math.max(0, depth - 1)
    else if (ch === ':' && depth === 0) return param.slice(0, i)
  }
  return param
}

// Number of declared parameters for `fnName` in a starter source, or null when
// the declaration can't be located (callers skip the arity check then rather
// than false-reject).
function countDeclaredParams(source: string, fnName: string): number | null {
  if (!source || !fnName) return null
  const patterns = [
    new RegExp(`function\\s+${fnName}\\s*\\(([^)]*)\\)`),
    new RegExp(
      `(?:var|let|const)\\s+${fnName}\\s*=\\s*(?:async\\s*)?function\\s*\\(([^)]*)\\)`
    ),
    new RegExp(
      `(?:var|let|const)\\s+${fnName}\\s*=\\s*(?:async\\s*)?\\(([^)]*)\\)\\s*=>`
    ),
  ]
  for (const re of patterns) {
    const m = source.match(re)
    if (m) return splitTopLevelParams(m[1]).length
  }
  return null
}

// Public (non-constructor) method names of a class starter, or null when the
// class body can't be located. The body is delimited by brace counting (a lazy
// regex would stop at the first `}` inside the constructor).
function classMethodNames(source: string, className: string): string[] | null {
  if (!source || !className) return null
  const open = source.search(
    new RegExp(`class\\s+${className}\\s*\\{`)
  )
  if (open === -1) return null
  const bodyStart = source.indexOf('{', open)
  let depth = 0
  let bodyEnd = -1
  for (let i = bodyStart; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        bodyEnd = i
        break
      }
    }
  }
  if (bodyEnd === -1) return null
  const names: string[] = []
  const re = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)/gm
  const body = source.slice(bodyStart + 1, bodyEnd)
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    if (m[1] !== 'constructor') names.push(m[1])
  }
  return names.length > 0 ? names : null
}

function validateDescHtml(desc: string): string[] {
  const errors: string[] = []
  if (/<!--/.test(desc)) errors.push('desc: HTML comments are not allowed')
  if (/javascript\s*:/i.test(desc))
    errors.push('desc: "javascript:" URLs are not allowed')

  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
  let tag: RegExpExecArray | null
  while ((tag = tagRe.exec(desc)) !== null) {
    const raw = tag[0]
    const name = tag[1].toLowerCase()
    if (!(DESC_ALLOWED_TAGS as readonly string[]).includes(name)) {
      errors.push(`desc: tag <${name}> is not allowed`)
    }
    const attrRe = /\s([a-zA-Z-]+)\s*=/g
    let attr: RegExpExecArray | null
    while ((attr = attrRe.exec(raw)) !== null) {
      const attrName = attr[1].toLowerCase()
      if (attrName.startsWith('on')) {
        errors.push(
          `desc: event-handler attribute "${attrName}" is not allowed`
        )
      }
    }
    const cls = raw.match(/\sclass\s*=\s*["']([^"']*)["']/i)
    if (cls) {
      for (const c of cls[1].split(/\s+/)) {
        if (c && !(DESC_ALLOWED_CLASSES as readonly string[]).includes(c)) {
          errors.push(`desc: class "${c}" is not allowed`)
        }
      }
    }
  }
  return errors
}

// ---------------------------------------------------------------------------
// JSON extraction (raw model text -> a JSON value)
// ---------------------------------------------------------------------------

/**
 * Extract the first parseable JSON value from raw model text. Tries the text as
 * a whole, then a fenced ```json block, then the span between the first `{`
 * and the last `}` (models often wrap the answer in prose). Returns undefined
 * when nothing parses. `undefined` can never be a successful parse result, so
 * it doubles as the failure sentinel.
 */
export function extractJsonObject(rawText: string): unknown {
  const text = rawText.trim()
  const candidates: string[] = []
  if (text) candidates.push(text)
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) candidates.push(fence[1].trim())
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) candidates.push(text.slice(start, end + 1))

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      // Try the next candidate form.
    }
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Strict Problem validation
// ---------------------------------------------------------------------------

interface TestContext {
  mode: ProblemMode | undefined
  fnName: string | undefined
  starterJs: string | undefined
  starterTs: string | undefined
}

function validateFnInput(
  t: Record<string, unknown>,
  label: string,
  ctx: TestContext
): string[] {
  const errors: string[] = []
  if (!Object.prototype.hasOwnProperty.call(t, 'in')) {
    errors.push(`${label}.in: missing`)
    return errors
  }
  if (!Array.isArray(t.in)) {
    errors.push(`${label}.in: expected an array of arguments, got ${typeOf(t.in)}`)
    return errors
  }
  const paramCount =
    countDeclaredParams(ctx.starterJs ?? '', ctx.fnName ?? '') ??
    countDeclaredParams(ctx.starterTs ?? '', ctx.fnName ?? '')
  if (paramCount !== null && t.in.length !== paramCount) {
    errors.push(
      `${label}.in: expected ${paramCount} argument(s) for ${ctx.fnName}(...), got ${t.in.length}`
    )
  }
  return errors
}

function validateClassCalls(
  t: Record<string, unknown>,
  label: string,
  ctx: TestContext
): string[] {
  const errors: string[] = []
  if (!Object.prototype.hasOwnProperty.call(t, 'calls')) {
    errors.push(`${label}.calls: missing`)
    return errors
  }
  if (!Array.isArray(t.calls) || t.calls.length === 0) {
    errors.push(`${label}.calls: expected a non-empty array of [name, args] calls`)
    return errors
  }
  const methods =
    classMethodNames(ctx.starterJs ?? '', ctx.fnName ?? '') ??
    classMethodNames(ctx.starterTs ?? '', ctx.fnName ?? '')
  for (let j = 0; j < t.calls.length; j++) {
    const call = t.calls[j]
    const callLabel = `${label}.calls[${j}]`
    if (!Array.isArray(call)) {
      errors.push(`${callLabel}: expected [name, args], got ${typeOf(call)}`)
      continue
    }
    const [name, args] = call
    if (typeof name !== 'string' || !IDENT_RE.test(name)) {
      errors.push(
        `${callLabel}: method name must be a valid identifier, got ${JSON.stringify(name)}`
      )
    } else if (j === 0) {
      if (name !== ctx.fnName) {
        errors.push(
          `${callLabel}: constructor call must be named "${ctx.fnName}" (the class name / fnName), got "${name}"`
        )
      }
    } else if (methods && methods.length > 0 && !methods.includes(name)) {
      errors.push(
        `${callLabel}: unknown method "${name}" (expected one of: ${methods.join(', ')})`
      )
    }
    if (args !== undefined && !Array.isArray(args)) {
      errors.push(`${callLabel}.args: expected an array, got ${typeOf(args)}`)
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(t, 'out') &&
    Array.isArray(t.calls)
  ) {
    if (!Array.isArray(t.out)) {
      errors.push(
        `${label}.out: class-mode expected output must be an array of results (one per call), got ${typeOf(t.out)}`
      )
    } else if (t.out.length !== t.calls.length) {
      errors.push(
        `${label}.out: expected ${t.calls.length} result(s) (one per call), got ${t.out.length}`
      )
    }
  }
  return errors
}

function validateTest(
  test: unknown,
  index: number,
  ctx: TestContext
): string[] {
  const errors: string[] = []
  const label = `tests[${index}]`
  if (!isPlainObject(test)) {
    return [`${label}: expected an object, got ${typeOf(test)}`]
  }
  const t = test
  if (ctx.mode === 'class') {
    errors.push(...validateClassCalls(t, label, ctx))
  } else if (ctx.mode === 'fn') {
    errors.push(...validateFnInput(t, label, ctx))
  }
  if (!Object.prototype.hasOwnProperty.call(t, 'out')) {
    errors.push(`${label}.out: missing`)
  }
  // JSON-serializability: a generated problem must survive the persist
  // round-trip, so every test value has to stringify and re-parse identically.
  try {
    const roundTripped = JSON.parse(JSON.stringify(t))
    if (!jsonDeepEqual(t, roundTripped)) {
      errors.push(`${label}: value does not survive a JSON round-trip`)
    }
  } catch {
    errors.push(`${label}: value is not JSON-serializable`)
  }
  return errors
}

/**
 * Validate an already-parsed JSON value against the exact `Problem` shape.
 * Returns `{ok: true, problem}` only when every field is present, correctly
 * typed, and internally consistent; otherwise `{ok: false, errors}` with one
 * deterministic, field-naming error per problem. Never returns a partial
 * problem and never throws on malformed input.
 */
export function validateGeneratedProblemObject(
  value: unknown
): ValidateGeneratedProblemResult {
  if (!isPlainObject(value)) {
    return {
      ok: false,
      errors: [`raw: expected a JSON object, got ${typeOf(value)}`],
    }
  }
  const p = value
  const errors: string[] = []

  if (typeof p.slug !== 'string') {
    errors.push(`slug: ${missingOrType(p.slug, 'string')}`)
  } else if (!p.slug.trim()) {
    errors.push('slug: must be a non-empty string')
  } else if (!SLUG_RE.test(p.slug)) {
    errors.push(
      `slug: must be kebab-case (lowercase letters, digits, hyphens), got "${p.slug}"`
    )
  }

  if (
    typeof p.num !== 'number' ||
    !Number.isInteger(p.num) ||
    p.num < 1
  ) {
    errors.push(
      `num: ${p.num === undefined ? 'missing' : `expected a positive integer, got ${typeOf(p.num)}`}`
    )
  }

  if (typeof p.title !== 'string' || !p.title.trim()) {
    errors.push(
      `title: ${p.title === undefined ? 'missing' : 'expected a non-empty string'}`
    )
  }

  if (
    typeof p.difficulty !== 'string' ||
    !(DIFFICULTIES as readonly string[]).includes(p.difficulty)
  ) {
    errors.push(
      `difficulty: expected one of Easy | Medium | Hard, got ${JSON.stringify(p.difficulty)}`
    )
  }

  if (!Array.isArray(p.tags)) {
    errors.push(
      `tags: ${p.tags === undefined ? 'missing' : 'expected an array of strings'}`
    )
  } else {
    for (let i = 0; i < p.tags.length; i++) {
      if (typeof p.tags[i] !== 'string' || !p.tags[i].trim()) {
        errors.push(
          `tags[${i}]: expected a non-empty string, got ${typeOf(p.tags[i])}`
        )
      }
    }
  }

  if (typeof p.fnName !== 'string' || !p.fnName.trim()) {
    errors.push(
      `fnName: ${p.fnName === undefined ? 'missing' : 'expected a non-empty string'}`
    )
  } else if (!IDENT_RE.test(p.fnName)) {
    errors.push(`fnName: "${p.fnName}" is not a valid identifier`)
  }

  if (
    typeof p.mode !== 'string' ||
    !(MODES as readonly string[]).includes(p.mode)
  ) {
    errors.push(`mode: expected "fn" or "class", got ${JSON.stringify(p.mode)}`)
  }

  if (!isPlainObject(p.starter)) {
    errors.push(
      `starter: ${p.starter === undefined ? 'missing' : 'expected an object with js and ts strings'}`
    )
  } else {
    if (typeof p.starter.js !== 'string') {
      errors.push(`starter.js: ${missingOrType(p.starter.js, 'string')}`)
    }
    if (typeof p.starter.ts !== 'string') {
      errors.push(`starter.ts: ${missingOrType(p.starter.ts, 'string')}`)
    }
  }

  if (!Array.isArray(p.hints)) {
    errors.push(
      `hints: ${p.hints === undefined ? 'missing' : 'expected an array of strings'}`
    )
  } else {
    for (let i = 0; i < p.hints.length; i++) {
      if (typeof p.hints[i] !== 'string') {
        errors.push(`hints[${i}]: expected a string, got ${typeOf(p.hints[i])}`)
      }
    }
  }

  if (typeof p.desc !== 'string' || !p.desc.trim()) {
    errors.push(
      `desc: ${p.desc === undefined ? 'missing' : 'expected a non-empty string'}`
    )
  } else {
    errors.push(...validateDescHtml(p.desc))
  }

  if (!Array.isArray(p.tests) || p.tests.length === 0) {
    errors.push(
      `tests: ${p.tests === undefined ? 'missing' : 'expected a non-empty array'}`
    )
  } else {
    const ctx: TestContext = {
      mode:
        typeof p.mode === 'string' && (MODES as readonly string[]).includes(p.mode)
          ? (p.mode as ProblemMode)
          : undefined,
      fnName: typeof p.fnName === 'string' ? p.fnName : undefined,
      starterJs:
        isPlainObject(p.starter) && typeof p.starter.js === 'string'
          ? p.starter.js
          : undefined,
      starterTs:
        isPlainObject(p.starter) && typeof p.starter.ts === 'string'
          ? p.starter.ts
          : undefined,
    }
    for (let i = 0; i < p.tests.length; i++) {
      errors.push(...validateTest(p.tests[i], i, ctx))
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  // Model-authored problems are always stamped as 'Generated' on accept; the
  // model itself never picks a category. Stamping here keeps `Problem`'s
  // `category` field required without leaking the policy into the prompt.
  const problem: Problem = {
    slug: p.slug as string,
    num: p.num as number,
    title: p.title as string,
    difficulty: p.difficulty as Problem['difficulty'],
    tags: p.tags as string[],
    fnName: p.fnName as string,
    mode: p.mode as ProblemMode,
    starter: {
      js: (p.starter as Record<string, unknown>).js as string,
      ts: (p.starter as Record<string, unknown>).ts as string,
    },
    tests: p.tests as Problem['tests'],
    hints: p.hints as string[],
    desc: p.desc as string,
    category: 'Generated',
  }
  return { ok: true, problem }
}

/**
 * Parse raw model text into a validated `Problem`, or a list of named errors.
 * Same strictness as {@link validateGeneratedProblemObject}, plus JSON
 * extraction from prose/fenced output. Deterministic: identical input always
 * yields the identical result.
 */
export function validateGeneratedProblem(
  rawText: string
): ValidateGeneratedProblemResult {
  const parsed = extractJsonObject(rawText)
  if (parsed === undefined) {
    return { ok: false, errors: ['raw: not valid JSON (expected a JSON object)'] }
  }
  return validateGeneratedProblemObject(parsed)
}

// ---------------------------------------------------------------------------
// Bounded re-prompt loop
// ---------------------------------------------------------------------------

/**
 * Build the corrective re-prompt for a retry: the original prompt plus the
 * validation errors from the previous attempt, each as a bullet.
 */
export function appendValidationErrors(
  prompt: string,
  errors: string[]
): string {
  const bullets = errors.map((e) => `- ${e}`).join('\n')
  return [
    prompt,
    '',
    'Your previous response failed validation. Fix ALL of the following issues and return ONLY the corrected JSON object, nothing else:',
    bullets,
  ].join('\n')
}

export interface GenerateValidatedProblemOptions {
  /** Total LLM calls (initial attempt + retries). Clamped to [1, MAX_GENERATION_ATTEMPTS]. */
  maxAttempts?: number
}

/**
 * Generate a problem and validate it, re-prompting with the collected errors
 * on failure up to `maxAttempts` calls in total. Returns the first validated
 * `Problem`, or throws {@link GenerationValidationError} when every attempt is
 * malformed. Provider-level failures (`ProviderError`: auth, CORS/network,
 * 5xx) propagate immediately: a re-prompt cannot fix them, so they never burn
 * the bounded budget. On terminal failure nothing is persisted.
 */
export async function generateValidatedProblem(
  options: GenerateProblemTextOptions,
  opts: GenerateValidatedProblemOptions = {}
): Promise<Problem> {
  const maxAttempts = Math.min(
    MAX_GENERATION_ATTEMPTS,
    Math.max(1, opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)
  )
  let prompt = options.prompt
  let lastErrors: string[] = []
  let lastRawText = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastRawText = await generateProblemText({ ...options, prompt })
    const result = validateGeneratedProblem(lastRawText)
    if (result.ok) return result.problem
    lastErrors = result.errors
    prompt = appendValidationErrors(prompt, lastErrors)
  }
  throw new GenerationValidationError(lastErrors, maxAttempts, lastRawText)
}
