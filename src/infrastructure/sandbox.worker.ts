// Same worker logic as before, but now a proper TypeScript file
// Vite handles bundling automatically

import {
  createSandboxServices,
  SANDBOX_SERVICE_CONSTRUCTORS,
  type SandboxServiceName,
} from '../services/sandbox-bindings'
import { traceService } from './serviceTracing'

// The 5 global handles exposed to sandboxed solution code, in the exact order
// they appear in the `new Function` signature and its call-site arguments.
// Derived from the aggregator so names can never drift from the
// autocomplete source or the service-constructor map.
const SERVICE_HANDLE_NAMES = Object.keys(
  SANDBOX_SERVICE_CONSTRUCTORS
) as SandboxServiceName[]

function safeOut(v: unknown): string {
  if (v === undefined) return 'undefined'
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function deepEq(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    typeof a === 'number' &&
    typeof b === 'number' &&
    Number.isNaN(a) &&
    Number.isNaN(b)
  )
    return true
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  )
    return a === b
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  for (let i = 0; i < ka.length; i++) {
    const k = ka[i]
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!deepEq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
      return false
  }
  return true
}

function errInfo(e: unknown) {
  return {
    name: (e && (e as Error).name) || 'Error',
    message: (e && (e as Error).message) || String(e),
  }
}

function typeName(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'object')
    return Object.prototype.toString.call(v).slice(8, -1).toLowerCase()
  return typeof v
}

function isGeneratorLike(v: unknown): boolean {
  const g = v as { next?: unknown; [Symbol.iterator]?: unknown }
  return !!(
    v &&
    typeof v === 'object' &&
    typeof g.next === 'function' &&
    typeof g[Symbol.iterator] === 'function'
  )
}

function isThenable(v: unknown): v is PromiseLike<unknown> {
  return (
    !!v &&
    (typeof v === 'object' || typeof v === 'function') &&
    typeof (v as PromiseLike<unknown>).then === 'function'
  )
}

function judgeWarn(msg: string) {
  cns.warn(`[judge] ${msg}`)
}

// Compare the harness call arity against the declared fn.length. Advisory
// only: rest params / default values shrink fn.length, so this never fails a
// case, it just surfaces likely signature mixups.
function signatureNote(
  name: string,
  declared: number,
  args: unknown[]
): string | null {
  if (typeof declared !== 'number' || declared === args.length) return null
  const call = args.map(safeOut).join(', ')
  return `${name} is called with ${args.length} argument(s): ${call} — but the function declares ${declared} parameter(s). Check the expected signature in the problem description.`
}

// Explain common wrong-return-value shapes so a failing case is diagnosable
// without opening DevTools. Emitted only when the comparison already failed.
function returnHints(
  out: unknown,
  expected: unknown,
  name: string
): string[] {
  const hints: string[] = []
  if (isGeneratorLike(out)) {
    hints.push(
      `${name} returned a Generator object. The judge compares the return value directly, so drain the generator with gen.next(v) in a loop and return a plain array.`
    )
  }
  if (out === undefined && expected !== undefined) {
    hints.push(
      `${name} returned undefined. Did you forget a return statement?`
    )
  }
  const expArr = Array.isArray(expected)
  const outArr = Array.isArray(out)
  const expObj = expected !== null && typeof expected === 'object'
  const outObj = out !== null && typeof out === 'object'
  if (expArr && outObj && !outArr) {
    hints.push(`${name} should return an array, but got ${typeName(out)}.`)
  } else if (!expArr && expObj && outArr) {
    hints.push(
      `${name} should return ${typeName(expected)}, but got an array.`
    )
  } else if (!expArr && !expObj && typeof out !== typeof expected) {
    hints.push(
      `${name} should return ${typeof expected}, but got ${typeName(out)}.`
    )
  }
  return hints
}

const LOG: Array<{ l: string; t: string }> = []
function drain() {
  return LOG.splice(0, LOG.length)
}
function fmtArg(a: unknown): string {
  if (typeof a === 'string') return a
  if (a instanceof Error) return `${a.name}: ${a.message}`
  return safeOut(a)
}
function mkLog(lvl: string) {
  return function (...args: unknown[]) {
    const parts: string[] = []
    for (let i = 0; i < args.length; i++) parts.push(fmtArg(args[i]))
    LOG.push({ l: lvl, t: parts.join(' ') })
    try {
      postMessage({ type: 'console', level: lvl, args })
    } catch {
      postMessage({ type: 'console', level: lvl, args: [parts.join(' ')] })
    }
  }
}
// Surface a sandbox error to the browser console and the UI console tab.
function reportError(prefix: string, err: unknown) {
  const info = errInfo(err)
  const line = `${prefix}: ${info.name}: ${info.message}`
  LOG.push({ l: 'error', t: line })
  try {
    postMessage({ type: 'console', level: 'error', args: [line] })
  } catch {
    /* noop */
  }
}
const cns = {
  log: mkLog('log'),
  info: mkLog('info'),
  warn: mkLog('warn'),
  error: mkLog('error'),
  debug: mkLog('debug'),
}

interface RunCaseMsg {
  input?: unknown[]
  calls?: Array<[string, unknown[]]>
  expected?: unknown
}

interface RunMsg {
  code: string
  name: string
  mode: 'fn' | 'class'
  cases: RunCaseMsg[]
}

self.onmessage = async function (ev: MessageEvent) {
  const m: RunMsg = ev.data
  // Fresh per-run service instances, built inside the handler (never at module
  // top level): no state may leak across runs. Each instance's public methods
  // are wrapped so every call emits a {l,t} trace entry into the same console
  // stream user logs use.
  const services = createSandboxServices()
  for (const name of SERVICE_HANDLE_NAMES) {
    traceService(name, services[name], (line) => cns.log(line))
  }
  const moduleObj: { exports: Record<string, unknown> } = { exports: {} }
  const req = () => {
    throw new Error('require() is not available in sandbox')
  }
  const proc = {
    env: {},
    argv: ['node', 'sandbox'],
    platform: 'linux',
    version: 'v20.x (web-sandbox)',
  }
  let entry: unknown
  try {
    const factory = new Function(
      'console',
      'module',
      'exports',
      'require',
      'process',
      ...SERVICE_HANDLE_NAMES,
      `${m.code}\n;return (typeof ${m.name} !== "undefined") ? ${m.name} : (module.exports && (module.exports["${m.name}"] || module.exports.default));`
    )
    entry = factory(
      cns,
      moduleObj,
      moduleObj.exports,
      req,
      proc,
      ...SERVICE_HANDLE_NAMES.map((name) => services[name])
    )
  } catch (e) {
    reportError('Compile error', e)
    postMessage({ type: 'compile', error: errInfo(e), logs: drain() })
    return
  }
  if (m.mode === 'class') await runClass(entry, m)
  else await runFn(entry, m)
}

async function runFn(fn: unknown, m: RunMsg) {
  if (typeof fn !== 'function') {
    reportError('Compile error', new ReferenceError(`No callable "${m.name}" found.`))
    postMessage({
      type: 'compile',
      error: {
        name: 'ReferenceError',
        message: `No callable "${m.name}" found.`,
        stack: '',
      },
      logs: drain(),
    })
    return
  }
  const f = fn as (...args: unknown[]) => unknown
  for (let i = 0; i < m.cases.length; i++) {
    const c = m.cases[i]
    const t0 = performance.now()
    try {
      const note = signatureNote(m.name, f.length, c.input ?? [])
      if (note) judgeWarn(note)
      const raw = f(...(c.input ?? []))
      const out = isThenable(raw) ? await raw : raw
      const ms = performance.now() - t0
      const hasExp = Object.prototype.hasOwnProperty.call(c, 'expected')
      const pass = hasExp ? deepEq(out, c.expected) : null
      if (hasExp && !pass) {
        returnHints(out, c.expected, m.name).forEach(judgeWarn)
      }
      postMessage({
        type: 'case',
        i,
        ms,
        ok: true,
        hasExp,
        pass,
        output: safeOut(out),
        logs: drain(),
      })
    } catch (e) {
      reportError(`Case ${i + 1}`, e)
      postMessage({
        type: 'case',
        i,
        ms: performance.now() - t0,
        ok: false,
        hasExp: true,
        pass: false,
        error: errInfo(e),
        logs: drain(),
      })
    }
  }
  postMessage({ type: 'done' })
}

async function runClass(Cls: unknown, m: RunMsg) {
  if (typeof Cls !== 'function') {
    reportError('Compile error', new ReferenceError(`No class "${m.name}" found.`))
    postMessage({
      type: 'compile',
      error: {
        name: 'ReferenceError',
        message: `No class "${m.name}" found.`,
        stack: '',
      },
      logs: drain(),
    })
    return
  }

  const Ctor = Cls as new (...args: unknown[]) => unknown

  for (let i = 0; i < m.cases.length; i++) {
    const c = m.cases[i]
    const t0 = performance.now()

    let inst: Record<string, unknown> | null = null
    const results: unknown[] = []
    let err: unknown = null

    try {
      const calls = c.calls ?? []
      for (let j = 0; j < calls.length; j++) {
        const [methodName, rawArgs = []] = calls[j] ?? []
        const args = rawArgs

        if (j === 0) {
          // First call is the constructor: ["MinStack", []]
          inst = new Ctor(...args) as Record<string, unknown>
          results.push(null)
        } else {
          // Later calls are methods: ["push", [-2]]
          const method = inst?.[methodName]

          if (typeof method !== 'function') {
            throw new TypeError(
              `Method "${String(methodName)}" does not exist on the instance.`
            )
          }

          const note = signatureNote(
            `${m.name}.${String(methodName)}`,
            method.length,
            args
          )
          if (note) judgeWarn(note)

          const raw = method.apply(inst, args)
          const ret = isThenable(raw) ? await raw : raw

          // Normalize undefined -> null for LeetCode-style comparison
          results.push(ret === undefined ? null : ret)
        }
      }
    } catch (e) {
      err = e
    }

    const ms = performance.now() - t0

    if (err) {
      reportError(`Case ${i + 1}`, err)
      postMessage({
        type: 'case',
        i,
        ms,
        ok: false,
        hasExp: true,
        pass: false,
        error: errInfo(err),
        logs: drain(),
      })
    } else {
      const hasExp = Object.prototype.hasOwnProperty.call(c, 'expected')

      postMessage({
        type: 'case',
        i,
        ms,
        ok: true,
        hasExp,
        pass: hasExp ? deepEq(results, c.expected) : null,
        output: safeOut(results),
        logs: drain(),
      })
    }
  }

  postMessage({ type: 'done' })
}