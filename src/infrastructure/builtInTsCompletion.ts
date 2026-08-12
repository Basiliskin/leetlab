/**
 * Type-aware autocomplete for the TS editor (roadmap phase
 * builtin-ts-completion-source): the repo's first async CompletionSource,
 * composed as a third autocomplete facet entry beside the two sync sources
 * (scopeCompletionSource(globalThis) and sandboxServiceCompletions). It
 * answers member context (`reader.`), constructor calls (`new ReadableStream(`)
 * and bare identifiers through the TypeScript LanguageService's
 * getCompletions entrypoint in tsCheck, so built-in standard-library types
 * surface their real members and constructor parameter signatures.
 *
 * It abstains (returns null) for the 5 sandbox service handles - bare,
 * `handle.` and `new handle(` - so the sync service source that introspects
 * live prototypes keeps winning them. Degradation mirrors tsLint: while
 * window.ts is absent (CDN cold start) or whenever the tsCheck call throws,
 * the source returns null - never [] and never a pending state - and the
 * editor simply falls back to the scope + service sources.
 */

import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { SANDBOX_SERVICE_CONSTRUCTORS } from '../services/sandbox-bindings'
import { getCompletions, type TsCompletionEntry } from './tsCheck'

/** The 5 sandbox handle names; these belong to the sync service source. */
const SERVICE_HANDLES = new Set(Object.keys(SANDBOX_SERVICE_CONSTRUCTORS))

const MEMBER_RE = /[A-Za-z_$][\w$]*\.[\w$]*$/
const IDENT_RE = /[A-Za-z_$][\w$]*$/
// Cursor right after the open paren of a `new Identifier(` call (CodeMirror's
// `(` is an explicit completion trigger). Mirrors tsCheck's own constructor
// context regex so the two stay in lockstep.
const CONSTRUCTOR_RE = /new\s+([A-Za-z_$][\w$]*)\s*\(\s*$/

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
 * The runtime TypeScript namespace loaded into window.ts from the CDN, or
 * undefined while it is still loading/failed. Same guard tsLint uses.
 */
function runtimeTs(): (typeof import('typescript')) | undefined {
  const ts = (window as unknown as { ts?: typeof import('typescript') }).ts
  return ts && typeof ts.createLanguageService === 'function' ? ts : undefined
}

/** CodeMirror completion-type hint mapped from a TS completion kind. */
function typeOf(kind: string): Completion['type'] {
  switch (kind) {
    case 'class':
      return 'class'
    case 'interface':
      return 'interface'
    case 'enum':
      return 'enum'
    case 'method':
      return 'method'
    case 'function':
      return 'function'
    case 'property':
      return 'property'
    case 'keyword':
      return 'keyword'
    case 'module':
      return 'namespace'
    case 'type':
      return 'type'
    default:
      return 'variable'
  }
}

/**
 * Render a tsCheck entry as a CodeMirror completion. Constructor-signature
 * entries (Phase 1: detail starts `new Identifier(`) apply the empty string:
 * the identifier is already typed ahead of the open paren, so accepting must
 * not paste it again - the detail text carries the parameter info.
 */
function toCompletion(entry: TsCompletionEntry): Completion {
  const ctor = entry.detail?.startsWith('new ')
  return {
    label: entry.name,
    type: typeOf(entry.kind),
    detail: entry.detail,
    ...(ctor ? { apply: '' } : {}),
  }
}

/**
 * Shared async path: run the LanguageService against the live document and
 * render its entries at the caller's `from`. Every exit before the actual
 * getCompletions await is a cheap null - absent runtime ts, aborted context,
 * empty result, or a thrown tsCheck call - so the source degrades exactly
 * like tsLint rather than ever surfacing [] or a pending completion.
 */
async function typeAwareCompletions(
  context: CompletionContext,
  from: number,
): Promise<CompletionResult | null> {
  const ts = runtimeTs()
  if (!ts) return null
  try {
    const code = context.state.doc.toString()
    const entries = await getCompletions(code, context.pos, ts)
    if (context.aborted) return null
    if (!entries.length) return null
    return { from, options: entries.map(toCompletion), validFor: /^[\w$]*$/ }
  } catch {
    return null
  }
}

/**
 * Async CompletionSource for built-in JS/TS type completion. All null paths
 * are synchronous: comment/string, the 5 service handles, no identifier
 * context. Member, constructor and bare-identifier contexts run the
 * LanguageService.
 */
export const builtInTsCompletion: CompletionSource = (context) => {
  if (insideCommentOrString(context)) return null

  // Member context: `expr.`. The sync service source owns `handle.` for the
  // 5 handles; everything else is answered by the LanguageService.
  const member = context.matchBefore(MEMBER_RE)
  if (member) {
    const dot = member.text.lastIndexOf('.')
    const base = member.text.slice(0, dot)
    if (SERVICE_HANDLES.has(base)) return null
    return typeAwareCompletions(context, member.from + dot + 1)
  }

  // Constructor context: `new Type(`. The LanguageService renders the
  // constructor's parameter signature as the single entry's detail.
  const ctor = context.matchBefore(CONSTRUCTOR_RE)
  if (ctor) {
    const name = ctor.text.match(CONSTRUCTOR_RE)?.[1] ?? ''
    if (SERVICE_HANDLES.has(name)) return null
    return typeAwareCompletions(context, context.pos)
  }

  // Bare identifier. The 5 handles stay with the sync source; non-service
  // identifiers complete from the LanguageService's global scope.
  const ident = context.matchBefore(IDENT_RE)
  if (ident && SERVICE_HANDLES.has(ident.text)) return null
  if (ident) return typeAwareCompletions(context, ident.from)
  return null
}
