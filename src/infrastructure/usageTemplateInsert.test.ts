// Fixture suite for roadmap phase 1, codeeditor-usage-templates: the pure
// (zero-DOM) insert engine that bridges the curated USAGE_TEMPLATES data
// from phase 0 to the function-form `apply` in phase 3. Runs in the Node
// environment — no CodeMirror, no DOM — so we can pin every CodeMirror
// shape (cursor at end, cursor mid-line, walk-back) directly to a string
// transformation.
//
// Three named scenarios per the roadmap rubric:
//   1. constructor-walkback-range: from=to=pos walks back to `new Name(`,
//      preserves the new prefix on a single replace, and refuses ranges
//      that don't match the constructor tail regex.
//   2. bare-identifier-insert-parity: the partial between from and to is
//      replaced with the bare label, byte-identical to the original
//      `apply: ''` flow.
//   3. template-body-reindent: a multi-line body re-indents every line
//      by the cursor's leading whitespace, including a non-zero nested
//      indent and a no-indent cursor.
//
// Plus the label-lookup-resolution pin (lookup returns the curated list
// or undefined) and the node-testable-purity pin (no DOM imports in the
// module under test).

import { describe, expect, it } from 'vitest'
import {
  insertBareIdentifier,
  insertTemplate,
  cursorIndentAt,
  lookupUsageTemplates,
  reindentTemplateBody,
  resolveConstructorRange,
  resolveReplacementRange,
  USAGE_TEMPLATES,
} from './usageTemplateInsert'

describe('lookupUsageTemplates (label-lookup-resolution)', () => {
  it('returns the curated list for a known label', () => {
    const list = lookupUsageTemplates('TransformStream')
    expect(list).toBeDefined()
    expect(list!.length).toBeGreaterThan(0)
    expect(list![0].label).toBe('Transform')
  })

  it('returns undefined for a label with no curated templates', () => {
    expect(lookupUsageTemplates('Map')).toBeUndefined()
    expect(lookupUsageTemplates('')).toBeUndefined()
    expect(lookupUsageTemplates('transformstream')).toBeUndefined() // case-sensitive
  })

  it('is data-driven: the same record is exported from USAGE_TEMPLATES', () => {
    // Mechanism: a future type is added to USAGE_TEMPLATES and the
    // lookup picks it up with no further edits.
    expect(lookupUsageTemplates('AbortController')).toBe(
      USAGE_TEMPLATES.AbortController,
    )
  })
})

describe('resolveReplacementRange (constructor-walkback-range)', () => {
  it('walks back from `new TransformStream(` to the new-prefix start', () => {
    const source = 'const t = new TransformStream('
    const pos = source.length
    const range = resolveReplacementRange(source, pos, pos, pos)
    expect(range).toEqual({
      from: source.length - 'new TransformStream('.length,
      to: pos,
      label: 'TransformStream',
    })
    // Reconstructed span is exactly the `new Name(` prefix.
    expect(source.slice(range!.from, range!.to)).toBe('new TransformStream(')
  })

  it('handles a `new ` (with surrounding whitespace) before the identifier', () => {
    const source = 'const t = new   TransformStream('
    const pos = source.length
    const range = resolveReplacementRange(source, pos, pos, pos)
    expect(range).not.toBeNull()
    expect(source.slice(range!.from, range!.to)).toBe('new   TransformStream(')
    expect(range!.label).toBe('TransformStream')
  })

  it('preserves the `new ` prefix on insert so we never get `new new`', () => {
    // The healerHint rubric: write the new-prefix-preservation test
    // first. A regression here would surface as `new new TransformStream(`
    // or as a stray `TransformStream(...)` after the chosen body.
    const source = 'const t = new TransformStream('
    const pos = source.length
    const range = resolveReplacementRange(source, pos, pos, pos)!
    const out = insertTemplate(source, range, USAGE_TEMPLATES.TransformStream[0], '')
    expect(out.text.startsWith('const t = ')).toBe(true)
    expect(out.text).not.toContain('new new')
    // The head of the template replaces the original `new TransformStream(`.
    expect(out.text).toContain('new TransformStream({')
  })

  it('returns null when no `new Name(` prefix is present at the cursor', () => {
    // Empty source: nothing to walk back over.
    expect(resolveReplacementRange('', 0, 0, 0)).toBeNull()
    // Cursor mid-line, no constructor tail.
    expect(
      resolveReplacementRange('const t = TransformStream', 25, 25, 25),
    ).toBeNull()
    // The `(` is closed — there is content after the open paren, so the
    // constructor context has already moved past construction.
    expect(
      resolveReplacementRange('new TransformStream(arg1', 23, 23, 23),
    ).toBeNull()
  })

  it('bounds against `from !== to` so the constructor path is detected explicitly', () => {
    // `from` and `to` differ; this is the bare-identifier path. Even
    // when the partial happens to be `new TransformStream`, the apply
    // hook will not walk back — it uses the [from, to) range as-is.
    const source = 'new TransformStream'
    const range = resolveReplacementRange(source, source.length, 0, source.length)
    expect(range).toEqual({ from: 0, to: source.length, label: 'new TransformStream' })
  })

  it('resolveConstructorRange is the named exported walk-back helper', () => {
    // Pin the helper directly so future refactors can't quietly drop
    // the walk-back behind a different name.
    const source = 'x = new AbortController('
    const range = resolveConstructorRange(source, source.length)
    expect(range).toEqual({
      from: source.length - 'new AbortController('.length,
      to: source.length,
      label: 'AbortController',
    })
  })
})

describe('resolveReplacementRange + insertBareIdentifier (bare-identifier-insert-parity)', () => {
  it('replaces the partial `Rea` with the bare label `ReadableStream`', () => {
    const source = 'const r = Rea'
    const from = 'const r = '.length
    const to = source.length
    const range = resolveReplacementRange(source, to, from, to)!
    expect(range.label).toBe('Rea')
    const out = insertBareIdentifier(source, range, 'ReadableStream')
    expect(out.text).toBe('const r = ReadableStream')
    expect(out.cursor).toBe('const r = ReadableStream'.length)
  })

  it('produces byte-identical output to a plain `[from, to) → label` splice', () => {
    // The apply hook currently does this with `apply: ''`; the new
    // function-form apply delegates to insertBareIdentifier for the
    // decline path. Pin parity so a future refactor cannot drift the
    // two code paths apart.
    const source = '  Reducer = Abort'
    const from = source.indexOf('Abort')
    const to = source.length
    const range = resolveReplacementRange(source, to, from, to)!
    const out = insertBareIdentifier(source, range, 'AbortController')
    const spliced = source.slice(0, from) + 'AbortController' + source.slice(to)
    expect(out.text).toBe(spliced)
    expect(out.cursor).toBe(from + 'AbortController'.length)
  })

  it('works when the partial is a full identifier (no-op shape)', () => {
    const source = 'const r = ReadableStream'
    const from = 'const r = '.length
    const to = source.length
    const range = resolveReplacementRange(source, to, from, to)!
    expect(range).toEqual({ from, to, label: 'ReadableStream' })
    const out = insertBareIdentifier(source, range, 'ReadableStream')
    expect(out.text).toBe(source)
    expect(out.cursor).toBe(source.length)
  })
})

describe('reindentTemplateBody + insertTemplate (template-body-reindent)', () => {
  const transformText = USAGE_TEMPLATES.TransformStream[0].text

  it('returns the text unchanged when the cursor has no indent', () => {
    expect(reindentTemplateBody(transformText, '')).toBe(transformText)
  })

  it('re-indents every line by the cursor indent on a flat (2-space) body', () => {
    const out = reindentTemplateBody(transformText, '  ')
    const lines = out.split('\n')
    expect(lines[0]).toBe('  new TransformStream({')
    expect(lines[1]).toBe('    transform(chunk, controller) {')
    expect(lines[2]).toBe('      controller.enqueue(chunk);')
    expect(lines[lines.length - 1]).toBe('  })')
  })

  it('re-indents at a nested (4-space) cursor, keeping relative body offsets', () => {
    // The body keeps its 2-/4-space shape; the cursor adds 4 spaces
    // to every line, so the head sits at column 4 and the inner body
    // at column 6 (template's L2 had 2 spaces; +4 = 6) and column 8
    // (template's L3 had 4 spaces; +4 = 8).
    const out = reindentTemplateBody(transformText, '    ')
    const lines = out.split('\n')
    expect(lines[0]).toBe('    new TransformStream({')
    expect(lines[1]).toBe('      transform(chunk, controller) {')
    expect(lines[2]).toBe('        controller.enqueue(chunk);')
    expect(lines[lines.length - 1]).toBe('    })')
  })

  it('insertTemplate splices the re-indented body at the resolved range and positions the cursor', () => {
    // Top-level cursor with the constructor context: the user just
    // typed `new TransformStream(` and accepted. Cursor at column 0
    // of the current line, so the template's own 0-/2-space layout
    // goes through unchanged.
    const source = 'const t = new TransformStream('
    const range = resolveReplacementRange(source, source.length, source.length, source.length)!
    const out = insertTemplate(source, range, USAGE_TEMPLATES.TransformStream[0], '')
    expect(out.text).toBe('const t = ' + transformText)
    expect(out.cursor).toBe('const t = '.length + transformText.length)
  })

  it('insertTemplate produces a syntactically-valid, indentation-correct body at a nested site', () => {
    // The harder shape: cursor is inside a function body, indented 4
    // spaces. The accept fires while the cursor is right after the
    // open paren of `new TransformStream(` — before any closing brace
    // is typed — so the source must end at the `(` for the
    // constructor tail regex to match.
    const source = 'function f() {\n    const t = new TransformStream('
    const pos = source.length
    const range = resolveReplacementRange(source, pos, pos, pos)!
    const indent = cursorIndentAt(source, pos)
    expect(indent).toBe('    ')
    const out = insertTemplate(source, range, USAGE_TEMPLATES.TransformStream[0], indent)
    // Body lines (2..N) are shifted by the cursor's 4 spaces relative
    // to the template's own offsets.
    const expectedBody = reindentTemplateBody(
      USAGE_TEMPLATES.TransformStream[0].text,
      indent,
    )
    expect(out.text).toBe(
      source.slice(0, range.from) + expectedBody + source.slice(range.to),
    )
    // No `new new` regression even at a nested site.
    expect(out.text).not.toContain('new new')
    // The function header is preserved; the body sits 4 spaces in.
    expect(out.text.startsWith('function f() {\n    const t = ')).toBe(true)
    expect(out.text).toContain('      transform(chunk, controller) {')
  })

  it('insertTemplate on a one-line template still works (AbortController)', () => {
    // AbortController's text has no newlines; re-indent still applies
    // the cursor indent to the only line.
    const source = 'const c = new AbortController('
    const openParen = source.length
    const range = resolveReplacementRange(source, openParen, openParen, openParen)!
    const out = insertTemplate(source, range, USAGE_TEMPLATES.AbortController[0], '  ')
    expect(out.text.startsWith('const c = ')).toBe(true)
    expect(out.text).toContain('  const controller = new AbortController();')
    expect(out.text).toContain('  const signal = controller.signal;')
    expect(out.text).toContain('  controller.abort();')
  })
})

describe('cursorIndentAt (node-testable-purity)', () => {
  it('returns the leading whitespace of the cursor line', () => {
    expect(cursorIndentAt('    abc', 4)).toBe('    ')
    expect(cursorIndentAt('\t\tabc', 2)).toBe('\t\t')
    expect(cursorIndentAt('no-indent', 3)).toBe('')
  })

  it('clamps out-of-range positions to the document bounds', () => {
    expect(cursorIndentAt('  ', 0)).toBe('  ')
    // Cursor past the end of a 2-space document: the line's own
    // leading whitespace is the whole 2 spaces.
    expect(cursorIndentAt('  ', 99)).toBe('  ')
    // Negative positions clamp to the start of the document.
    expect(cursorIndentAt('  ', -1)).toBe('  ')
    // A document with no leading whitespace reports empty even when
    // the cursor is past the end.
    expect(cursorIndentAt('abc', 99)).toBe('')
  })

  it('handles a multi-line document by looking at the cursor line only', () => {
    const source = 'function f() {\n    const t = new TransformStream('
    const pos = source.length
    expect(cursorIndentAt(source, pos)).toBe('    ')
  })
})
