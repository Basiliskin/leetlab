// Same worker logic as before, but now a proper TypeScript file
// Vite handles bundling automatically

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
    if (!deepEq((a as any)[k], (b as any)[k])) return false
  }
  return true
}

function errInfo(e: unknown) {
  return {
    name: (e && (e as Error).name) || 'Error',
    message: (e && (e as Error).message) || String(e),
  }
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

self.onmessage = async function (ev: MessageEvent) {
  const m = ev.data
  const moduleObj: { exports: any } = { exports: {} }
  const req = () => {
    throw new Error('require() is not available in sandbox')
  }
  const proc = {
    env: {},
    argv: ['node', 'sandbox'],
    platform: 'linux',
    version: 'v20.x (web-sandbox)',
  }
  let entry: any
  try {
    const factory = new Function(
      'console',
      'module',
      'exports',
      'require',
      'process',
      `${m.code}\n;return (typeof ${m.name} !== "undefined") ? ${m.name} : (module.exports && (module.exports["${m.name}"] || module.exports.default));`
    )
    entry = factory(cns, moduleObj, moduleObj.exports, req, proc)
  } catch (e) {
    reportError('Compile error', e)
    postMessage({ type: 'compile', error: errInfo(e), logs: drain() })
    return
  }
  if (m.mode === 'class') await runClass(entry, m)
  else await runFn(entry, m)
}

async function runFn(fn: Function, m: any) {
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
  for (let i = 0; i < m.cases.length; i++) {
    const c = m.cases[i]
    const t0 = performance.now()
    try {
      const raw = fn.apply(null, c.input)
      const out =
        raw && typeof (raw as any).then === 'function' ? await raw : raw
      const ms = performance.now() - t0
      const hasExp = Object.prototype.hasOwnProperty.call(c, 'expected')
      postMessage({
        type: 'case',
        i,
        ms,
        ok: true,
        hasExp,
        pass: hasExp ? deepEq(out, c.expected) : null,
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

async function runClass(Cls: unknown, m: any) {
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

  const Ctor = Cls as new (...args: any[]) => any

  for (let i = 0; i < m.cases.length; i++) {
    const c = m.cases[i]
    const t0 = performance.now()

    let inst: any = null
    const results: unknown[] = []
    let err: unknown = null

    try {
      for (let j = 0; j < c.calls.length; j++) {
        const [methodName, rawArgs = []] = c.calls[j] ?? []
        const args = rawArgs as any[]

        if (j === 0) {
          // First call is the constructor: ["MinStack", []]
          inst = new Ctor(...args)
          results.push(null)
        } else {
          // Later calls are methods: ["push", [-2]]
          const method = inst?.[methodName]

          if (typeof method !== 'function') {
            throw new TypeError(
              `Method "${String(methodName)}" does not exist on the instance.`
            )
          }

          const raw = method.apply(inst, args)
          const ret =
            raw && typeof (raw as any).then === 'function' ? await raw : raw

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