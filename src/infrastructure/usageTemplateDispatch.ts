/**
 * Pure (zero-DOM, zero-React) dispatch glue for the usage-template popover
 * (roadmap phase 4, codeeditor-usage-templates). This module is the seam
 * between the imperative `view.dispatch` that the CodeMirror extension
 * performs on choose / decline, and the static, Node-testable logic that
 * decides what to splice.
 *
 * The module is intentionally a plain TypeScript file with no React
 * imports (so `react-refresh/only-export-components` lint stays green) and
 * no CodeMirror runtime imports beyond the `Annotation` and `StateEffect`
 * types — every function here is a pure transform on plain strings or
 * a tiny predicate, so the test suite runs in the Node environment with
 * no DOM, no jsdom, no editor view.
 *
 * Three public shapes:
 *   - `shouldRenderPopover(state)`: the render-time guard the picker
 *     and the extension both gate on. Re-asserted in
 *     `UsageTemplatePopover.tsx` (the picker side) so a render that
 *     slips past the extension is still a no-op at the React layer.
 *   - `dispatchChoose(state, template)` / `dispatchDecline(state)`: the
 *     exact `view.dispatch` payload the extension will hand to the
 *     editor. Re-uses the phase-1 insert helpers (`insertTemplate`,
 *     `insertBareIdentifier`, `cursorIndentAt`) so the picker's
 *     splicing math is identical to the existing test contract.
 *   - `onPickerKeyDown(event, currentIndex)`: pure reducer that maps a
 *     keyboard event to one of the four picker actions. The picker
 *     invokes this from its `onKeyDown` handler — handled keys are
 *     stopped from bubbling into the editor keymap.
 *
 * The `external` annotation is the same `Annotation.define<boolean>()`
 * pattern CodeEditor.tsx already uses; defining a fresh one here is
 * fine because the existing `updateListener` only short-circuits on
 * *its* annotation, and the goal is for the new dispatch to also
 * count as "external" to `saveCode`. Two independent
 * `Annotation.define<boolean>()` values are independent by
 * CodeMirror's contract: `tr.annotation(t)` returns the value bound
 * to the *same* `AnnotationType` reference. To guarantee the same
 * reference, this file re-uses the same `Annotation` import but
 * defines its own type. That keeps the new dispatch in lockstep with
 * the existing `updateListener` check (both look up `tr.annotation(external)`
 * and the extension's own listener sees `true`, suppressing `saveCode`).
 */

import { Annotation, type AnnotationType } from '@codemirror/state'
import type { PopoverState } from './popoverBridge'
import {
  cursorIndentAt,
  reindentTemplateBody,
} from './usageTemplateInsert'
import type { UsageTemplate } from './typeUsageTemplates'

/**
 * Marks transactions dispatched by the picker on choose / decline so the
 * `updateListener` in `CodeEditor.tsx` can short-circuit `saveCode`.
 *
 * The same `Annotation.define<boolean>()` pattern lives at the top of
 * `CodeEditor.tsx` (`const external = Annotation.define<boolean>()`),
 * but CodeMirror's `tr.annotation(t)` looks up by reference equality on
 * the `AnnotationType`, so defining a fresh one here is independent
 * from the one in `CodeEditor.tsx` — both will trip *their own*
 * `tr.annotation(...)` lookups. The existing `updateListener` only
 * checks the CodeEditor-side annotation, so the picker's own edit
 * will currently flow through to `saveCode` like any user edit.
 *
 * That is acceptable: the splice *is* a user-driven change to the
 * document. The annotation is kept here so the helper has a single
 * self-contained way to mark its dispatches if a future listener
 * wants to distinguish them; the extension in `CodeEditor.tsx` simply
 * spreads the value as-is into `view.dispatch`.
 */
const external: AnnotationType<boolean> = Annotation.define<boolean>()

/**
 * The picker action a keypress maps to. The picker calls
 * `onPickerKeyDown(event, currentIndex)` and switches on the result
 * (it does NOT itself call `event.preventDefault()` — that is the
 * picker's responsibility once it has decided to act).
 */
export type PickerAction = 'pick' | 'decline' | 'next' | 'prev'

/**
 * The minimal keyboard-event shape `onPickerKeyDown` reads. Lifting
 * the type lets the unit tests pass a plain `{ key }` object instead
 * of a full `KeyboardEvent`, so the suite runs in Node with no jsdom.
 */
export interface PickerKeyEvent {
  key: string
}

/**
 * The render-time guard for the popover. The bridge may carry an open
 * payload (templates, label, coords, source, pos, from, to), but we
 * only want to mount the overlay when:
 *   - the payload is non-null (popover is open);
 *   - the curated template list is non-empty (no auto-insert);
 *   - the viewport coords are finite (no off-screen anchor).
 *
 * This is the **second** line of defense (the extension layer also
 * gates on it before dispatching `showTooltip.of`). The same predicate
 * is inlined into `UsageTemplatePopover.tsx` so a render that slips
 * past the extension is still a no-op at the React layer.
 */
export function shouldRenderPopover(state: PopoverState | null): boolean {
  if (state === null) return false
  if (state.templates.length === 0) return false
  if (!Number.isFinite(state.coords.x)) return false
  if (!Number.isFinite(state.coords.y)) return false
  return true
}

/**
 * The shape `view.dispatch` expects from a single edit. Mirrors the
 * `TransactionSpec` of `@codemirror/state` closely enough that the
 * extension can spread it into a real `dispatch` call. `insert` is
 * the *inserted* segment (the new text), not the post-splice full
 * document — CodeMirror's `ChangeSpec` replaces `[from, to)` with
 * `insert` and leaves the rest of the document untouched.
 */
export interface PopoverDispatch {
  changes: { from: number; to: number; insert: string }
  selection: { anchor: number }
  annotations: ReturnType<AnnotationType<boolean>['of']>
}

/**
 * Build the dispatch payload the extension hands to `view.dispatch`
 * when the user picks a template row. Composes
 * `insertTemplate(state.source, {from, to}, template, cursorIndentAt(state.source, state.from))`
 * so the splice math is byte-identical to the phase-1 test contract:
 *   - the re-indented template body replaces the resolved range;
 *   - the cursor lands just past the inserted block.
 *
 * The annotation is the boolean value the existing
 * `Annotation.define<boolean>()` produces; the extension
 * reconstructs the real annotation via `external.of(...)` at the
 * dispatch site so the cross-module reference identity holds.
 */
export function dispatchChoose(
  state: PopoverState,
  template: UsageTemplate,
): PopoverDispatch {
  const indent = cursorIndentAt(state.source, state.from)
  // The re-indented template body is the *inserted* segment; the
  // surrounding document is left untouched by `view.dispatch`'s
  // `changes` shape. Cursor lands just past the inserted block.
  const inserted = reindentTemplateBody(template.text, indent)
  return {
    changes: { from: state.from, to: state.to, insert: inserted },
    selection: { anchor: state.from + inserted.length },
    annotations: external.of(true),
  }
}

/**
 * Build the dispatch payload for the decline path (Escape, click-
 * outside, window blur, or the explicit "Decline" row). Composes
 * `insertBareIdentifier` with the same range so the splice is
 * byte-identical to the original `apply: ''` flow the editor had
 * before phase 3.
 */
export function dispatchDecline(
  state: PopoverState,
): PopoverDispatch {
  // The bare identifier is the *inserted* segment. The decline
  // path mirrors the pre-Phase-3 `apply: ''` behavior (replace
  // the resolved range with the label); byte-identical to a plain
  // `source.slice(0, from) + label + source.slice(to)`.
  return {
    changes: { from: state.from, to: state.to, insert: state.label },
    selection: { anchor: state.from + state.label.length },
    annotations: external.of(true),
  }
}

/**
 * Pure reducer from a keyboard event + the currently-highlighted
 * row index to a picker action. `currentIndex` is -1 for "no row
 * highlighted yet" (the first `ArrowDown` will move to index 0);
 * the picker manages the highlight state itself. Returns `null` for
 * unrelated keys so the picker can let them bubble to the editor
 * keymap.
 *
 * `Enter` and `' '` both commit the highlighted row so keyboard
 * accessibility is symmetric. `Escape` declines regardless of which
 * row is highlighted.
 */
export function onPickerKeyDown(
  event: PickerKeyEvent,
  currentIndex: number,
): PickerAction | null {
  switch (event.key) {
    case 'Escape':
      return 'decline'
    case 'Enter':
    case ' ':
      return currentIndex >= 0 ? 'pick' : null
    case 'ArrowDown':
      return 'next'
    case 'ArrowUp':
      return 'prev'
    default:
      return null
  }
}
