// Fixture suite for roadmap phase 4, codeeditor-usage-templates: the pure
// dispatch glue that turns a `PopoverState` plus a `pick` / `decline` /
// `next` / `prev` picker action into a CodeMirror `view.dispatch` payload.
// Runs in the Node environment (no DOM, no jsdom, no editor view) by
// composing the phase-1 insert helpers and a tiny keyboard-event stub.
//
// The extension in `CodeEditor.tsx` is the only place that calls
// `view.dispatch`, but every value the extension hands the editor comes
// from this module — so this suite is the seam that pins the public
// surface the picker depends on.
//
// Surfaces under test:
//   - shouldRenderPopover: null state, empty templates, non-finite coords,
//     and the happy path.
//   - dispatchChoose: splices the re-indented template at the resolved
//     range, positions the cursor past the inserted block, marks the
//     transaction with the dispatch annotation, and re-indents the body
//     at nested cursors.
//   - dispatchDecline: splices the bare identifier at the same range and
//     stays byte-identical to a phase-1 `insertBareIdentifier` call.
//   - onPickerKeyDown: pure reducer for Escape, Enter, Space, ArrowUp,
//     ArrowDown, plus the "no row highlighted" Edge case.

import { describe, expect, it } from 'vitest'
import {
  dispatchChoose,
  dispatchDecline,
  onPickerKeyDown,
  shouldRenderPopover,
  type PopoverDispatch,
} from './usageTemplateDispatch'
import { type PopoverState } from './popoverBridge'
import { USAGE_TEMPLATES } from './typeUsageTemplates'

// A canonical payload the tests reuse. The values are picked so the
// resolved range and the template rows are non-trivial: a `new
// TransformStream(` constructor context the phase-1 helpers will
// replace with the re-indented body.
function fixtureState(overrides: Partial<PopoverState> = {}): PopoverState {
  const base: PopoverState = {
    templates: USAGE_TEMPLATES.TransformStream,
    label: 'TransformStream',
    coords: { x: 120, y: 48 },
    source: 'const t = new TransformStream(',
    pos: 'const t = new TransformStream('.length,
    from: 'const t = '.length,
    to: 'const t = new TransformStream('.length,
  }
  return { ...base, ...overrides }
}

describe('shouldRenderPopover (render-time-guard)', () => {
  it('returns false for a null state', () => {
    expect(shouldRenderPopover(null)).toBe(false)
  })

  it('returns false when the curated template list is empty', () => {
    expect(shouldRenderPopover(fixtureState({ templates: [] }))).toBe(false)
  })

  it('returns false when the x coordinate is non-finite', () => {
    expect(shouldRenderPopover(fixtureState({ coords: { x: NaN, y: 0 } }))).toBe(false)
    expect(shouldRenderPopover(fixtureState({ coords: { x: Infinity, y: 0 } }))).toBe(false)
    expect(shouldRenderPopover(fixtureState({ coords: { x: -Infinity, y: 0 } }))).toBe(false)
  })

  it('returns false when the y coordinate is non-finite', () => {
    expect(shouldRenderPopover(fixtureState({ coords: { x: 0, y: NaN } }))).toBe(false)
    expect(shouldRenderPopover(fixtureState({ coords: { x: 0, y: Infinity } }))).toBe(false)
  })

  it('returns true for a non-null state with finite coords and templates', () => {
    expect(shouldRenderPopover(fixtureState())).toBe(true)
  })
})

describe('dispatchChoose (choose-inserts-full-template)', () => {
  it('splices the re-indented template at the resolved range', () => {
    const state = fixtureState()
    const template = state.templates[0]
    const out = dispatchChoose(state, template)

    // The body shape matches `reindentTemplateBody` from phase 1:
    // the inserted segment is the re-indented template text. The
    // surrounding `const t = ` lives in the *document*, not in the
    // insert, so it doesn't appear here.
    expect(out.changes.from).toBe(state.from)
    expect(out.changes.to).toBe(state.to)
    expect(out.changes.insert).toContain('new TransformStream({')
    expect(out.changes.insert).toContain('controller.enqueue(chunk);')
    // No `new new` regression even at the same call site.
    expect(out.changes.insert).not.toContain('new new')
    // The post-splice document concatenates prefix + insert + suffix.
    const post = state.source.slice(0, state.from) + out.changes.insert + state.source.slice(state.to)
    expect(post.startsWith('const t = new TransformStream({')).toBe(true)
  })

  it('positions the cursor just past the inserted block', () => {
    const state = fixtureState()
    const template = state.templates[0]
    const out = dispatchChoose(state, template)
    expect(out.selection.anchor).toBe(state.from + out.changes.insert.length)
  })

  it('marks the transaction with the external annotation so it can be filtered', () => {
    const out = dispatchChoose(fixtureState(), fixtureState().templates[0])
    // Annotation is an object with a `.value` field set to `true` —
    // `tr.annotation(external)` would return this value on the
    // extension side. The shape is enough to pin the contract
    // without leaning on the internal AnnotationType ref.
    expect(out.annotations).toBeDefined()
    expect((out.annotations as { value: boolean }).value).toBe(true)
  })

  it('re-indents the template body at a nested (4-space) cursor site', () => {
    const source = 'function f() {\n    const t = new TransformStream('
    const pos = source.length
    const from = source.indexOf('new')
    const to = pos
    const state = fixtureState({ source, from, to, pos })
    const out = dispatchChoose(state, state.templates[0])
    // Head sits at the cursor's 4-space indent; inner body lines
    // are shifted by 4 more spaces relative to the template's own
    // 2-/4-space offsets.
    expect(out.changes.insert).toContain('    new TransformStream({')
    expect(out.changes.insert).toContain('      transform(chunk, controller) {')
    expect(out.changes.insert).toContain('        controller.enqueue(chunk);')
  })

  it('leaves a zero-indent cursor site un-reindented (the template keeps its own shape)', () => {
    const out = dispatchChoose(fixtureState(), fixtureState().templates[0])
    // `insert` is the inserted segment (the re-indented template
    // body), not the post-splice document. The template's head
    // sits at the cursor's indent; at a zero-indent cursor the
    // template's own first line is `new TransformStream({` (no
    // leading whitespace), so the insert starts there.
    expect(out.changes.insert.startsWith('new TransformStream({')).toBe(true)
  })

  it('chooses the picked template (different row produces different text)', () => {
    const state = fixtureState()
    const [transform, filter] = state.templates
    const transformOut = dispatchChoose(state, transform)
    const filterOut = dispatchChoose(state, filter)
    expect(transformOut.changes.insert).not.toBe(filterOut.changes.insert)
    // The filter template's first body line is its `if (chunk) {` shape.
    expect(filterOut.changes.insert).toContain('if (chunk)')
  })
})

describe('dispatchDecline (decline-inserts-bare-identifier)', () => {
  it('splices the bare identifier at the resolved range', () => {
    const state = fixtureState()
    const out = dispatchDecline(state)
    expect(out.changes.from).toBe(state.from)
    expect(out.changes.to).toBe(state.to)
    expect(out.changes.insert).toBe('TransformStream')
  })

  it('positions the cursor just past the inserted bare identifier', () => {
    const state = fixtureState()
    const out = dispatchDecline(state)
    expect(out.selection.anchor).toBe(state.from + state.label.length)
  })

  it('is byte-identical to a phase-1 `insertBareIdentifier` call', () => {
    // The decline path must produce the same splice a bare-identifier
    // accept would have before phase 3. Pin parity here so a future
    // refactor cannot drift the two code paths apart. The dispatch
    // returns the *inserted* segment; the full post-splice document
    // is `source.slice(0, from) + insert + source.slice(to)`.
    const state = fixtureState()
    const out: PopoverDispatch = dispatchDecline(state)
    expect(out.changes.insert).toBe(state.label)
    const doc = state.source.slice(0, state.from) + out.changes.insert + state.source.slice(state.to)
    expect(doc).toBe('const t = TransformStream')
  })

  it('marks the transaction with the external annotation', () => {
    const out = dispatchDecline(fixtureState())
    expect((out.annotations as { value: boolean }).value).toBe(true)
  })

  it('on a constructor context the bare identifier replaces only the `new Name(` span', () => {
    // The decline path uses the same walk-back the apply hook
    // computed, so the `new ` prefix is replaced along with the
    // identifier — we never end up with `new TransformStream` left
    // dangling.
    const source = 'const t = new TransformStream('
    const state = fixtureState({ source, from: source.indexOf('new'), to: source.length })
    const out = dispatchDecline(state)
    expect(state.source.slice(0, state.from) + out.changes.insert + state.source.slice(state.to))
      .toBe('const t = TransformStream')
    expect(out.changes.insert).toBe('TransformStream')
  })
})

describe('onPickerKeyDown (key-handling-reducer)', () => {
  it("maps 'Escape' to 'decline'", () => {
    expect(onPickerKeyDown({ key: 'Escape' }, 0)).toBe('decline')
    // Decline fires regardless of which row is highlighted.
    expect(onPickerKeyDown({ key: 'Escape' }, -1)).toBe('decline')
    expect(onPickerKeyDown({ key: 'Escape' }, 2)).toBe('decline')
  })

  it("maps 'Enter' / Space to 'pick' when a row is highlighted", () => {
    expect(onPickerKeyDown({ key: 'Enter' }, 1)).toBe('pick')
    expect(onPickerKeyDown({ key: ' ' }, 0)).toBe('pick')
  })

  it("returns null for 'Enter' / Space when no row is highlighted yet", () => {
    // The picker is responsible for not committing when no row is
    // selected; the reducer encodes the contract that "Enter without
    // a highlight is a no-op", not a fall-through to decline.
    expect(onPickerKeyDown({ key: 'Enter' }, -1)).toBeNull()
    expect(onPickerKeyDown({ key: ' ' }, -1)).toBeNull()
  })

  it("maps 'ArrowDown' to 'next'", () => {
    expect(onPickerKeyDown({ key: 'ArrowDown' }, 0)).toBe('next')
    expect(onPickerKeyDown({ key: 'ArrowDown' }, -1)).toBe('next')
  })

  it("maps 'ArrowUp' to 'prev'", () => {
    expect(onPickerKeyDown({ key: 'ArrowUp' }, 0)).toBe('prev')
    expect(onPickerKeyDown({ key: 'ArrowUp' }, -1)).toBe('prev')
  })

  it('returns null for unrelated keys (so they bubble to the editor keymap)', () => {
    expect(onPickerKeyDown({ key: 'a' }, 0)).toBeNull()
    expect(onPickerKeyDown({ key: 'Tab' }, 0)).toBeNull()
    expect(onPickerKeyDown({ key: 'Backspace' }, 0)).toBeNull()
    expect(onPickerKeyDown({ key: 'PageDown' }, 0)).toBeNull()
  })
})
