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
 *
 * Phase 3 (codeeditor-usage-templates) layers the template popover on
 * top of the existing constructor and bare-identifier paths: a curated
 * completion label (TransformStream, ReadableStream, WritableStream,
 * AbortController) gets a function-form `apply` whose only effect is to
 * open the `popoverBridge` with the accept-anchor payload. Accept is a
 * pure no-op on the document; the popover (phase 4) decides what gets
 * spliced. Non-curated entries keep their Phase 1 apply values byte-
 * for-byte, so this layer is a strict superset.
 */

import {
  closeCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import type { EditorView } from '@codemirror/view'
import { SANDBOX_SERVICE_CONSTRUCTORS } from '../services/sandbox-bindings'
import { open as openPopover } from './popoverBridge'
import { getCompletions, type TsCompletionEntry } from './tsCheck'
import { lookupUsageTemplates } from './usageTemplateInsert'

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
 * Render a tsCheck entry as a CodeMirror completion. Three branches, in
 * order of decreasing specificity:
 *
 *   1. Curated usage-template (Phase 3, codeeditor-usage-templates): the
 *      label is in `USAGE_TEMPLATES`. Accept opens the template popover
 *      via the bridge - no doc mutation in the apply hook, the picker
 *      decides what gets spliced. Works for both constructor and bare
 *      accept paths because Phase 1's range resolver handles both.
 *   2. Constructor signature (Phase 1): `entry.detail` starts with
 *      `new `. The identifier is already typed ahead of the open paren,
 *      so accepting must not paste it again - empty-string apply is the
 *      documented convention for this case (unchanged from Phase 1).
 *   3. Otherwise: no `apply` field - CodeMirror's default behavior
 *      replaces the partial with the label, matching the Phase 0 baseline.
 *
 * Non-curated entries keep this branch's exact `apply` value, byte-for-
 * byte, so the regression surface is zero (tests pin the constructor-
 * signature expectation explicitly).
 */
function toCompletion(entry: TsCompletionEntry): Completion {
  const templates = lookupUsageTemplates(entry.name)
  if (templates && templates.length > 0) {
    return {
      label: entry.name,
      type: typeOf(entry.kind),
      detail: entry.detail,
      apply: buildUsageTemplateApply(entry.name),
    }
  }
  const ctor = entry.detail?.startsWith('new ')
  return {
    label: entry.name,
    type: typeOf(entry.kind),
    detail: entry.detail,
    ...(ctor ? { apply: '' } : {}),
  }
}

/**
 * Build the function-form `apply` callback a curated completion item
 * carries. The callback opens the popover bridge at the accept site with
 * the resolved range, the current document text, and viewport coords
 * derived from the editor view - and intentionally does not itself
 * splice any document text, so the document is not mutated by accept
 * itself. The popover (phase 4) drives every later edit.
 *
 * It does dispatch one thing directly: `closeCompletion(view)`. When a
 * completion's `apply` is a function (as opposed to a string), CodeMirror's
 * `applyCompletion` just calls it and returns - it never dispatches a
 * transaction of its own, so nothing tells the native completion dropdown
 * to close. Left alone, the dropdown stays open and mounted (still
 * showing the accepted "WritableStream" row) forever, since neither
 * `tr.docChanged` nor `tr.selection` fire without an explicit dispatch.
 * It then sits on top of / behind the usage-template popover and keeps
 * eating keyboard input via `completionKeymap`. Closing it explicitly
 * here is what the string-`apply` path gets for free from
 * `insertCompletionText`'s own dispatch.
 *
 * Exported so the unit tests can drive it directly with a stub view,
 * sidestepping the brittleness of a real CoordinateEvent / DOM. The
 * callback is a plain `(view, completion, from, to) => void`, matching
 * CodeMirror's documented function-form `apply` signature.
 *
 * Three out-conditions fall through to no-op so a curio completion never
 * crashes the editor:
 *   - Empty / missing template list (defensive; data invariant forbids
 *     but we don't trust data we don't own).
 *   - `coordsAtPos` returns null (view not measured yet, off-screen,
 *     zero-sized editor, etc.). The popover positions itself later in
 *     Phase 4 via the bridge's `update`; we still open.
 *   - Both `from` and `to` coordinates are null. The popover without
 *     coords is unusable, so we skip - the user can accept again.
 */
export function buildUsageTemplateApply(
  label: string,
): (view: EditorView, completion: Completion, from: number, to: number) => void {
  return (view, _completion, from, to) => {
    const templates = lookupUsageTemplates(label)
    if (!templates || templates.length === 0) return
    const anchor = view.coordsAtPos(from) ?? view.coordsAtPos(to)
    if (!anchor) return
    openPopover({
      templates,
      label,
      coords: { x: anchor.left, y: anchor.bottom },
      source: view.state.doc.toString(),
      pos: to,
      from,
      to,
    })
    closeCompletion(view)
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
