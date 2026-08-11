/**
 * Service-call tracing (roadmap phase 2): one generic helper wraps every
 * public method on a fresh service instance so each call emits a formatted
 * trace line into the sandbox's existing {l,t} console stream. No new
 * WorkerMsg variant is introduced.
 */

export type TraceEmit = (line: string) => void

/** Per-line cap so a tight loop over a service cannot flood the run log. */
const MAX_LINE = 160

function isThenable(v: unknown): v is PromiseLike<unknown> {
  return (
    !!v &&
    (typeof v === 'object' || typeof v === 'function') &&
    typeof (v as PromiseLike<unknown>).then === 'function'
  )
}

export function fmtTraceValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') return v
  if (
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    typeof v === 'bigint'
  )
    return String(v)
  if (v instanceof Error) return `${v.name}: ${v.message}`
  try {
    const json = JSON.stringify(v)
    return json === undefined ? String(v) : json
  } catch {
    return String(v)
  }
}

function truncate(s: string): string {
  if (s.length <= MAX_LINE) return s
  return `${s.slice(0, MAX_LINE - 3)}...`
}

function wrapMethod(
  name: string,
  methodName: string,
  original: (...args: unknown[]) => unknown,
  emit: TraceEmit
) {
  return function traced(this: unknown, ...args: unknown[]) {
    const argText = args.map(fmtTraceValue).join(' ')
    const call = argText
      ? `[${name}] ${methodName} ${argText}`
      : `[${name}] ${methodName}`
    let result: unknown
    try {
      result = original.apply(this, args)
    } catch (e) {
      emit(truncate(`${call} -> ERROR: ${fmtTraceValue(e)}`))
      throw e
    }
    if (isThenable(result)) {
      result.then(
        (v) => emit(truncate(`${call} -> ${fmtTraceValue(v)}`)),
        (e) => emit(truncate(`${call} -> ERROR: ${fmtTraceValue(e)}`))
      )
    } else {
      emit(truncate(`${call} -> ${fmtTraceValue(result)}`))
    }
    return result
  }
}

/**
 * Wrap every public (prototype) method of a fresh service instance so each
 * call emits a `[name] method args -> result` trace line through `emit`.
 * Wrappers are installed as per-instance own properties, so the class
 * prototype is never mutated (non-invasive). Async methods are traced when
 * their promise settles; the returned promise is passed through unchanged.
 * Constructor and accessor properties are skipped.
 */
export function traceService<T extends object>(
  name: string,
  instance: T,
  emit: TraceEmit
): T {
  const proto = Object.getPrototypeOf(instance) as
    | Record<string, unknown>
    | null
  if (!proto) return instance
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue
    const desc = Object.getOwnPropertyDescriptor(proto, key)
    if (!desc || typeof desc.value !== 'function') continue
    Object.defineProperty(instance, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: wrapMethod(name, key, desc.value, emit),
    })
  }
  return instance
}
