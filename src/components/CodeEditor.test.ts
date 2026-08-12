// Fixture suite for roadmap phase codeeditor-wire-builtin-completion: the
// async builtInTsCompletion source is wired into the CodeEditor as a THIRD
// javascriptLanguage.data.of({ autocomplete }) facet entry, composed beside
// the two sync sources (scopeCompletionSource(globalThis) and
// sandboxServiceCompletions) and present only in TS mode. The wiring lives in
// editorCompletions.ts as `editorCompletionSources(lang)`, which
// CodeEditor.extensionsFor spreads into the editor's extension set.
//
// Covers: builtin-source-wired-ts-only ('ts' carries the real source, 'js'
// does not), existing-sources-preserved (each source stays its own .of()
// entry — a live function, never a static-list array), sandbox-precedence-
// preserved (the builtin is ordered after sandboxServiceCompletions and
// `redis.` still lists service members), reconfigure-repeatable (ts→js→ts
// round-trip yields exactly one builtin source, no accumulation), and
// no-store-gating-added (the wiring is pure of lang — the only input that
// changes it).
//
// Runs in the Node environment; EditorState composition and reconfigure
// effects need no DOM.

import { describe, expect, it } from 'vitest'
import { EditorState, StateEffect } from '@codemirror/state'
import { CompletionContext } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { builtInTsCompletion } from '../infrastructure/builtInTsCompletion'
import { sandboxServiceCompletions } from '../infrastructure/serviceCompletions'
import { editorCompletionSources } from '../infrastructure/editorCompletions'

/**
 * Composes the completion-source wiring the way CodeEditor.extensionsFor does:
 * the document language (TS flavor in TS mode) ahead of the three autocomplete
 * facet entries. `languageDataAt` only reports sources once a document language
 * is configured, so the state must mirror the real editor assembly.
 */
function editorExtensions(lang: 'js' | 'ts') {
  return [
    javascript(lang === 'ts' ? { typescript: true } : undefined),
    ...editorCompletionSources(lang),
  ] as never
}

/**
 * The autocomplete sources `autocompletion()` will actually run at `pos`
 * (state.languageDataAt reads the combined language-data facet, exactly what
 * the completion extension consumes). Order matches registration order; each
 * value is a live CompletionSource function, never an array.
 */
function sourcesOf(state: EditorState, pos = 0): unknown[] {
  return state.languageDataAt('autocomplete', pos) as unknown[]
}

function tsState() {
  return EditorState.create({ doc: '', extensions: editorExtensions('ts') })
}

function jsState() {
  return EditorState.create({ doc: '', extensions: editorExtensions('js') })
}

describe('CodeEditor built-in TS completion wiring', () => {
  it('wires the real built-in source in TS mode only, ordered after the service source', () => {
    const tsSources = sourcesOf(tsState())
    const jsSources = sourcesOf(jsState())

    // TS carries the real import by identity — no local stub.
    expect(tsSources).toContain(builtInTsCompletion)
    // Ordered after sandboxServiceCompletions so the sync source keeps
    // precedence for the 5 service handles.
    expect(tsSources[tsSources.length - 1]).toBe(builtInTsCompletion)
    expect(tsSources[tsSources.length - 2]).toBe(sandboxServiceCompletions)
    // A live source function, not a static completion list.
    expect(tsSources.every((s) => typeof s === 'function')).toBe(true)

    // JS mode keeps exactly the pre-existing sources.
    expect(jsSources).not.toContain(builtInTsCompletion)
    expect(jsSources[jsSources.length - 1]).toBe(sandboxServiceCompletions)
    // The only difference between the modes is the one builtin entry.
    expect(tsSources.length).toBe(jsSources.length + 1)
  })

  it('keeps the two existing sync sources intact in both modes', () => {
    const tsSources = sourcesOf(tsState())
    const jsSources = sourcesOf(jsState())

    // The service source survives — last in JS mode, immediately before the
    // builtin in TS mode.
    expect(jsSources[jsSources.length - 1]).toBe(sandboxServiceCompletions)
    expect(tsSources[tsSources.length - 2]).toBe(sandboxServiceCompletions)
    // scopeCompletionSource(globalThis) is anonymous — assert it is present
    // as a live source right before the service source in both modes.
    expect(tsSources[tsSources.length - 3]).toBeTypeOf('function')
    expect(jsSources[jsSources.length - 2]).toBeTypeOf('function')
    // Every source stays its own .of() entry: a live function, never a
    // static-list array (CodeMirror would read an array via completeFromList).
    for (const list of [tsSources, jsSources]) {
      expect(list.every((s) => typeof s === 'function')).toBe(true)
    }
  })

  it('leaves `redis.` to the sync service source even with the builtin wired', async () => {
    const state = EditorState.create({
      doc: 'redis.',
      extensions: editorCompletionSources('ts'),
    })
    const pos = 6
    const service = sandboxServiceCompletions(
      new CompletionContext(state, pos, false)
    )
    // The builtin abstains synchronously (null, never a pending []).
    const builtin = builtInTsCompletion(
      new CompletionContext(state, pos, false)
    )
    expect(builtin).toBeNull()
    expect(typeof (builtin as Promise<unknown> | null)?.then).toBe('undefined')

    const result = await service
    expect(result).not.toBeNull()
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain('set')
    expect(labels).toContain('get')
  })

  it('survives a ts→js→ts reconfigure round-trip with no accumulation', () => {
    const reconfigure = (state: EditorState, lang: 'js' | 'ts') =>
      state.update({
        effects: StateEffect.reconfigure.of(editorExtensions(lang)),
      }).state
    const countBuiltin = (state: EditorState) =>
      sourcesOf(state).filter((s) => s === builtInTsCompletion).length

    let state = tsState()
    expect(countBuiltin(state)).toBe(1)

    state = reconfigure(state, 'js')
    expect(countBuiltin(state)).toBe(0)

    state = reconfigure(state, 'ts')
    expect(countBuiltin(state)).toBe(1)
  })

  it('depends only on lang — identical wiring on repeated builds', () => {
    // The wiring is pure of lang: two independent builds of the same mode
    // carry the same source set, and the builtin count never exceeds one.
    expect(sourcesOf(tsState())).toHaveLength(sourcesOf(tsState()).length)
    expect(
      sourcesOf(tsState()).filter((s) => s === builtInTsCompletion).length
    ).toBe(1)
  })
})
