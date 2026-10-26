import { describe, expect, it } from 'vitest'
import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import { ALGO_SNIPPETS, algoSnippetCompletions } from './algoSnippets'

function complete(doc: string, lang: 'js' | 'ts' = 'js', explicit = false) {
  const state = EditorState.create({
    doc,
    extensions: javascript(lang === 'ts' ? { typescript: true } : undefined),
  })
  // The snippet source is synchronous; narrow away the Promise arm.
  return algoSnippetCompletions(
    new CompletionContext(state, doc.length, explicit),
  ) as CompletionResult | null
}

describe('algo snippet completions', () => {
  it('has unique labels, each with a detail and an apply function', () => {
    const labels = ALGO_SNIPPETS.map((c) => c.label)
    expect(new Set(labels).size).toBe(labels.length)
    for (const c of ALGO_SNIPPETS) {
      expect(c.detail).toBeTruthy()
      expect(typeof c.apply).toBe('function')
    }
  })

  it('offers snippets at a statement position in both modes', () => {
    for (const lang of ['js', 'ts'] as const) {
      const res = complete('function f(nums) {\n  bse', lang)
      expect(res).not.toBeNull()
      expect(res!.options.map((o) => o.label)).toContain('bsearch')
      expect(res!.from).toBe('function f(nums) {\n  '.length)
    }
  })

  it('stays out of strings, comments and member access', () => {
    expect(complete('const s = "fori')).toBeNull()
    expect(complete('// fori')).toBeNull()
    expect(complete('arr.fori')).toBeNull()
  })

  it('does not open on an empty prefix unless explicitly requested', () => {
    expect(complete('')).toBeNull()
    expect(complete('', 'js', true)).not.toBeNull()
  })

  it('expands every template into syntactically valid code', () => {
    // A snippet's apply(view, completion, from, to) only touches view.state
    // and view.dispatch, so a minimal stand-in captures the expansion.
    for (const c of ALGO_SNIPPETS) {
      const state = EditorState.create({ doc: '', extensions: javascript() })
      let inserted = ''
      const view = {
        state,
        dispatch: (spec: Parameters<EditorState['update']>[0]) => {
          inserted = state.update(spec).state.doc.toString()
        },
      }
      const apply = c.apply as (v: unknown, c: unknown, f: number, t: number) => void
      apply(view, c, 0, 0)
      expect(inserted.length, c.label).toBeGreaterThan(0)
      expect(() => new Function(inserted), `${c.label}:\n${inserted}`).not.toThrow()
    }
  })
})
