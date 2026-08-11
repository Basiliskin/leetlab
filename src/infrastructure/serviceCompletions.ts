/**
 * Editor autocomplete source for the 5 sandbox service handles (roadmap
 * phase 3). A second CompletionSource composed alongside
 * scopeCompletionSource(globalThis): typing `redis` surfaces the handle,
 * typing `redis.` surfaces that service's real public methods with their
 * live parameter lists. Member names are introspected from the same
 * aggregator constructors the sandbox worker instantiates, so they can
 * never drift from the surface actually exposed to solution code.
 *
 * The worker's traceService wraps every prototype method of a fresh
 * instance. TypeScript `private` is compile-time only, so this module
 * carries SERVICE_INTERNAL_METHODS as the runtime stand-in for that
 * intent: implementation details a class author marked private/@internal
 * (or that are otherwise not callable public API) stay out of the
 * completion list. The list only ever removes names; it cannot introduce
 * a name the worker does not expose.
 */

import type {
  Completion,
  CompletionContext,
  CompletionSource,
} from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { SANDBOX_SERVICE_CONSTRUCTORS } from '../services/sandbox-bindings'

export interface SandboxCompletionOption {
  label: string
  type: 'variable' | 'function'
  detail: string
}

export interface SandboxCompletionData {
  handles: SandboxCompletionOption[]
  members: Record<string, SandboxCompletionOption[]>
}

type AnyCtor = new (...args: never[]) => unknown

/**
 * Implementation-detail methods hidden from autocomplete, keyed by handle
 * name. Runtime prototype introspection cannot see TypeScript's `private`,
 * and the classes do not consistently mark internals `@internal`, so this
 * list is the deliberate stand-in. It is a pure denylist: it can only
 * suppress names, never invent ones the worker does not expose.
 */
export const SERVICE_INTERNAL_METHODS: Record<string, readonly string[]> = {
  redis: [
    'accountSize',
    'announceBye',
    'assertCommandsAllowed',
    'bumpVersion',
    'commit',
    'countReceivers',
    'defineCommands',
    'deleteKey',
    'deliverLocal',
    'emitEvent',
    'ensureBus',
    'getOrCreateHash',
    'getOrCreateList',
    'getOrCreateSet',
    'getOrCreateZSet',
    'getTyped',
    'guardMemory',
    'incrByFloatInternal',
    'isExpired',
    'loadFromStorage',
    'onBusMessage',
    'pickEvictionCandidate',
    'restore',
    'saveToStorage',
    'serialize',
    'sizeOfValue',
    'subscriptionCount',
    'sweep',
    'touchLru',
    'zEntries',
  ],
  pg: [],
  rabbitmq: ['tryDeliver'],
  kafka: [],
  queue: ['scheduleDelayedPromoter'],
}

/** Best-effort parameter list of a live prototype method, e.g. "(key, value)". */
function paramsOf(fn: unknown): string {
  if (typeof fn !== 'function') return '()'
  try {
    const src = fn.toString()
    const open = src.indexOf('(')
    if (open === -1) return '()'
    let depth = 0
    let quote: string | null = null
    for (let i = open; i < src.length; i++) {
      const ch = src[i]
      if (quote) {
        if (ch === quote && src[i - 1] !== '\\') quote = null
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch
        continue
      }
      if (ch === '(') {
        depth++
      } else if (ch === ')') {
        depth--
        if (depth === 0) return src.slice(open, i + 1)
      }
    }
  } catch {
    // Minified or otherwise unparseable source; fall through to "()".
  }
  return '()'
}

/**
 * Enumerate the public methods of a service class the same way
 * traceService does (own prototype methods, constructor excluded, names
 * starting with `_` treated as internal), minus the per-service denylist.
 */
export function publicMethodsOf(ctor: AnyCtor, internal: readonly string[]): string[] {
  const proto = (ctor as unknown as { prototype: Record<string, unknown> })
    .prototype
  return Object.getOwnPropertyNames(proto)
    .filter((key) => key !== 'constructor' && !key.startsWith('_'))
    .filter((key) => !internal.includes(key))
    .filter((key) => {
      const desc = Object.getOwnPropertyDescriptor(proto, key)
      return !!desc && typeof desc.value === 'function'
    })
    .sort()
}

export function buildSandboxCompletionData(
  constructors: Record<string, AnyCtor> = SANDBOX_SERVICE_CONSTRUCTORS
): SandboxCompletionData {
  const handles: SandboxCompletionOption[] = []
  const members: Record<string, SandboxCompletionOption[]> = {}
  for (const [name, ctor] of Object.entries(constructors)) {
    handles.push({ label: name, type: 'variable', detail: ctor.name })
    const internal = SERVICE_INTERNAL_METHODS[name] ?? []
    members[name] = publicMethodsOf(ctor, internal).map((methodName) => ({
      label: methodName,
      type: 'function',
      detail: paramsOf(ctor.prototype[methodName]),
    }))
  }
  return { handles, members }
}

const DATA = buildSandboxCompletionData()

/** The 5 handle identifiers, e.g. `redis`, `queue`. */
export const SANDBOX_HANDLE_OPTIONS: Completion[] = DATA.handles

/** Public method completions per handle, e.g. `redis` -> `set`, `get`, ... */
export const SANDBOX_MEMBER_OPTIONS: Record<string, Completion[]> = DATA.members

const MEMBER_RE = /[A-Za-z_$][\w$]*\.[\w$]*$/
const HANDLE_RE = /[A-Za-z_$][\w$]*$/

function insideCommentOrString(context: CompletionContext): boolean {
  const node = syntaxTree(context.state).resolveInner(context.pos, -1)
  const name = node.name
  return (
    name.includes('Comment') ||
    name === 'String' ||
    name === 'TemplateString' ||
    name === 'RegExp'
  )
}

/**
 * CodeMirror completion source for the sandbox service globals. Composed
 * into the same `javascriptLanguage.data` autocomplete facet as
 * scopeCompletionSource(globalThis), never replacing it: typing a handle
 * name offers the 5 globals, typing `handle.` offers that service's public
 * methods, and everything else falls through to the scope source.
 */
export const sandboxServiceCompletions: CompletionSource = (context) => {
  if (insideCommentOrString(context)) return null

  const member = context.matchBefore(MEMBER_RE)
  if (member) {
    const dot = member.text.lastIndexOf('.')
    const handle = member.text.slice(0, dot)
    const options = SANDBOX_MEMBER_OPTIONS[handle]
    if (options) {
      return {
        from: member.from + dot + 1,
        options,
        validFor: /^[\w$]*$/,
      }
    }
    return null
  }

  const ident = context.matchBefore(HANDLE_RE)
  if (!ident) return null
  const options = SANDBOX_HANDLE_OPTIONS.filter((o) =>
    o.label.startsWith(ident.text)
  )
  if (!options.length) return null
  return { from: ident.from, options, validFor: /^[\w$]*$/ }
}
