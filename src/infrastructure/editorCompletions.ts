/**
 * The CodeEditor's autocomplete facet wiring (roadmap phase
 * codeeditor-wire-builtin-completion): the three javascriptLanguage.data
 * autocomplete entries composed into the editor's extension set, exposed as
 * a pure function of the language mode so CodeEditor.tsx stays component-only
 * and the wiring is unit-testable without a DOM.
 *
 * - scopeCompletionSource(globalThis): bare-identifier completions from the
 *   JS global scope.
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
import { sandboxServiceCompletions } from './serviceCompletions'
import { builtInTsCompletion } from './builtInTsCompletion'

export function editorCompletionSources(lang: 'js' | 'ts'): Extension[] {
  return [
    javascriptLanguage.data.of({
      autocomplete: scopeCompletionSource(globalThis),
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
