/**
 * The CodeEditor's autocomplete facet wiring (roadmap phase
 * codeeditor-wire-builtin-completion): the three javascriptLanguage.data
 * autocomplete entries composed into the editor's extension set, exposed as
 * a pure function of the language mode so CodeEditor.tsx stays component-only
 * and the wiring is unit-testable without a DOM.
 *
 * - cachedScopeCompletion: bare-identifier completions from the JS global
 *   scope, served from a memoized list so the globalThis walk does not run
 *   on every keystroke. Property-access completions (`expr.`) are delegated
 *   to the underlying scope source, which has its own per-target cache.
 * - sandboxServiceCompletions: the 5 sandbox service handles and their live
 *   prototype members.
 * - builtInTsCompletion (TS mode only): the async LanguageService-backed
 *   source for built-in standard-library types.
 *
 * Each entry is deliberately a separate .of(), never an array: CodeMirror
 * reads a language-data array via completeFromList as a static completion
 * list, not as additional sources. The builtin is ordered after the service
 * source so the sync source keeps precedence for the 5 handles.
 */

import { javascriptLanguage, scopeCompletionSource } from '@codemirror/lang-javascript'
import type { Extension } from '@codemirror/state'
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete'
import { sandboxServiceCompletions } from './serviceCompletions'
import { builtInTsCompletion } from './builtInTsCompletion'

// scopeCompletionSource(globalThis) walks the global object graph on each
// call to a fresh target. CodeMirror re-queries every autocomplete source on
// every keystroke once activateOnTypingDelay is past, so the first walk on
// globalThis hits the typing tick. Memoize the bare-identifier (top-level
// path) options: invoke the underlying source at most once, lazily, and
// serve the cached list with validFor so CodeMirror filters in place rather
// than re-querying. Property-access paths (word containing a `.`) delegate
// to the underlying source, whose own per-target Map cache keeps subsequent
// calls on the same path cheap. This is the prototype fix for input lag —
// a fully path-keyed cache would exceed the prototype bar (deferred in
// decisions.md).
let cachedGlobalScopeOptions: readonly Completion[] | null = null

function cachedScopeCompletion(
  context: CompletionContext,
): CompletionResult | null | Promise<CompletionResult | null> {
  if (context.aborted) return null
  const word = context.matchBefore(/[\w$]+/)
  if (!word && !context.explicit) return null

  // Property-access path (e.g. `console.l`): the cached top-level list would
  // be wrong here, and the underlying source already memoizes per target.
  if (word && word.text.includes('.')) {
    // scopeCompletionSource is documented as synchronous; the Promise arm is
    // a structural artifact of CompletionSource's wider signature.
    const result = scopeCompletionSource(globalThis)(context)
    if (result === null) return null
    if (result instanceof Promise) return result
    return result
  }

  let options: readonly Completion[] | null = cachedGlobalScopeOptions
  if (options === null) {
    const result = scopeCompletionSource(globalThis)(context)
    if (result === null) return null
    if (result instanceof Promise) return result
    options = result.options
    cachedGlobalScopeOptions = options
  }

  return {
    from: word ? word.from : context.pos,
    options,
    validFor: /^[\w$]*$/,
  }
}

export function editorCompletionSources(lang: 'js' | 'ts'): Extension[] {
  return [
    javascriptLanguage.data.of({
      autocomplete: cachedScopeCompletion,
    }),
    javascriptLanguage.data.of({
      autocomplete: sandboxServiceCompletions,
    }),
    // Third entry, TS mode only: the async built-in type-aware source. While
    // the CDN TypeScript compiler/libs are unavailable it returns null and
    // the editor keeps serving the scope + service completions.
    ...(lang === 'ts'
      ? [javascriptLanguage.data.of({ autocomplete: builtInTsCompletion })]
      : []),
  ]
}