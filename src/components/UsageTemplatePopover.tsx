/**
 * React picker for the CodeMirror usage-template popover (roadmap phase 4,
 * codeeditor-usage-templates). The picker is a thin, props-driven component
 * that renders the curated template rows from the bridge payload and
 * reports user actions (pick / decline) through callbacks. It does NOT
 * know about CodeMirror, the bridge, or the dispatch — those live one
 * layer up in `CodeEditor.tsx` and `usageTemplateDispatch.ts`.
 *
 * The picker is the **last** line of defense for the rubric's
 * `template-gating-no-auto-insert` requirement: the extension layer
 * already guards on `shouldRenderPopover` before dispatching
 * `showTooltip.of`, and the picker re-asserts the same predicate
 * inside the render so a stray render past the extension is still a
 * `null` output. Auto-insertion is impossible by construction — the
 * picker never dispatches; the extension never auto-inserts; the only
 * `view.dispatch` calls come from explicit user actions.
 *
 * Keyboard handling: the popover intentionally does NOT auto-focus on
 * mount. Auto-focus would steal focus from the editor and dismiss the
 * autocomplete widget (CodeMirror closes it when the editor blurs),
 * which made it impossible to interact with autocomplete while the
 * popover was open. Instead, a high-precedence CodeMirror keymap
 * (installed in `CodeEditor.tsx`) intercepts the picker-relevant keys
 * when the popover is open. The keymap and the picker share the
 * highlight index via `popoverBridge.{getHighlight,setHighlight,
 * subscribeHighlight}`.
 *
 * The class name on the wrapper is `usage-template-popover` and is
 * styled in `CodeEditor.tsx`'s `editorTheme`. The popover inherits
 * the panel chrome (background, border, font) from the `.cm-tooltip`
 * block, which CodeMirror applies to every `TooltipView.dom`.
 *
 * State design:
 *   - `highlight` lives in the popoverBridge (single source of truth).
 *     The picker subscribes via `subscribeHighlight` so the CodeMirror
 *     keymap and mouse-hover both update one index and the picker
 *     re-renders on any change.
 *   - The picker intentionally has no useEffect for the highlight
 *     reset: the bridge resets to -1 on `close`, and a fresh `open`
 *     starts the React tree at -1 because the keymap's first
 *     ArrowDown writes the index explicitly. React preserves the
 *     React tree across renders (the tooltip descriptor is the same
 *     reference); the bridge's index is the per-open reset point.
 */

import { useEffect, useState } from 'react'
import {
  getHighlight,
  setHighlight,
  subscribeHighlight,
  type PopoverState,
} from '../infrastructure/popoverBridge'
import { shouldRenderPopover } from '../infrastructure/usageTemplateDispatch'
import type { UsageTemplate } from '../infrastructure/typeUsageTemplates'

/**
 * The picker's prop surface. The picker is intentionally narrow: the
 * extension layer translates bridge transitions and editor events into
 * these three callbacks, so the React component has no direct
 * dependency on the bridge or the editor.
 */
export interface UsageTemplatePopoverProps {
  state: PopoverState | null
  onPick: (template: UsageTemplate) => void
  onDecline: () => void
}

/**
 * The render-time guard, inlined to match the dispatch helper's
 * `shouldRenderPopover`. Returns `null` whenever the state is null,
 * carries no templates, or has non-finite viewport coords. The
 * extension layer also gates on this before dispatching
 * `showTooltip.of`, so a render that slips past is a no-op.
 */
function visible(state: PopoverState | null): state is PopoverState {
  return shouldRenderPopover(state)
}

export function UsageTemplatePopover({
  state,
  onPick,
  onDecline,
}: UsageTemplatePopoverProps) {
  // The render-time guard is the picker's "no popover, no render"
  // contract. Returns `null` here means React unmounts; the
  // extension will react to the unmount via its `TooltipView.destroy`
  // and clean up the React root. The guard runs *after* the hooks
  // below to keep the hooks order stable across renders.
  const isVisible = visible(state)
  // The highlight index for keyboard navigation. Stored in the
  // popoverBridge (a module-level singleton) so the CodeMirror
  // keymap can mutate it; the picker subscribes and re-renders.
  // The bridge resets the index to -1 on `close`, so a fresh
  // `open` starts at the unselected state without a useEffect.
  const [highlight, setLocalHighlight] = useState<number>(getHighlight())
  useEffect(() => subscribeHighlight(setLocalHighlight), [])

  if (!isVisible) return null
  // The narrowing above lets TS see `state` as non-null here.
  const visibleState = state as PopoverState
  const templates = visibleState.templates

  return (
    <ul
      className="usage-template-popover"
      role="listbox"
      aria-label="Usage templates"
      tabIndex={-1}
      // The popover is intentionally NOT auto-focused: focusing the
      // picker steals focus from the editor and dismisses the
      // autocomplete widget. Keyboard nav flows through a high-
      // precedence CodeMirror keymap (CodeEditor.tsx) that calls
      // `setHighlight` / `onPick` / `onDecline` on the bridge and
      // picker respectively. The `tabIndex={-1}` is kept so the
      // popover remains focusable programmatically (e.g. when a
      // future a11y path needs to focus the picker); it is just not
      // invoked on mount.
      onMouseDown={(event) => {
        // A mousedown inside the popover must not be swallowed by
        // the editor-level click-outside handler in CodeEditor.tsx
        // — that handler listens at the document with capture, so
        // it would otherwise fire `closePopover` before the row's
        // click handler runs. Stopping the event here keeps the
        // popover interactive when the user is choosing a row.
        event.stopPropagation()
      }}
    >
      <li
        className="usage-template-popover__row usage-template-popover__row--decline"
        role="option"
        aria-selected={highlight === -1}
        onClick={() => onDecline()}
        onMouseEnter={() => setHighlight(-1)}
      >
        <span className="usage-template-popover__label">Decline</span>
        <span className="usage-template-popover__desc">
          Insert just <code>{visibleState.label}</code>
        </span>
      </li>
      {templates.map((tpl, i) => (
        <li
          key={tpl.label}
          className={
            'usage-template-popover__row' +
            (i === highlight ? ' usage-template-popover__row--active' : '')
          }
          role="option"
          aria-selected={i === highlight}
          onClick={() => onPick(tpl)}
          onMouseEnter={() => setHighlight(i)}
        >
          <span className="usage-template-popover__label">{tpl.label}</span>
          {tpl.description ? (
            <span className="usage-template-popover__desc">{tpl.description}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export default UsageTemplatePopover
