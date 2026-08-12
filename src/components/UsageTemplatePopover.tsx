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
 * Keyboard handling: handled keys (`Enter`, `Space`, `Escape`,
 * `ArrowUp`, `ArrowDown`) call `event.stopPropagation()` so the
 * editor's keymap does not see them — Escape would otherwise dismiss
 * the autocomplete widget, ArrowDown would otherwise re-navigate the
 * completion list, and Enter would otherwise re-trigger accept.
 *
 * The class name on the wrapper is `usage-template-popover` and is
 * styled in `CodeEditor.tsx`'s `editorTheme`. The popover inherits
 * the panel chrome (background, border, font) from the `.cm-tooltip`
 * block, which CodeMirror applies to every `TooltipView.dom`.
 *
 * State design:
 *   - `highlight` is local state (useState). It tracks which row is
 *     currently selected by mouse or keyboard.
 *   - The picker intentionally has no useEffect for the highlight
 *     reset: the extension tears down and remounts the React root
 *     for every `bridge.open` (each `open` replaces the tooltip
 *     field, which CodeMirror reads as a brand-new tooltip). A new
 *     component instance starts with `highlight = -1`.
 *   - Focus is moved into the popover via a callback ref on mount
 *     (not a useEffect) so keyboard navigation works without a
 *     click, and so the lint rule against setState-in-effect is
 *     never tripped.
 */

import { useRef, useState } from 'react'
import type { PopoverState } from '../infrastructure/popoverBridge'
import {
  onPickerKeyDown,
  shouldRenderPopover,
} from '../infrastructure/usageTemplateDispatch'
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

/**
 * Bounded `currentIndex` (0..N-1) so the highlight wraps cleanly.
 * The reducer returns `'next'` / `'prev'` for the arrow keys; this
 * helper applies the wrap so the picker doesn't need to know the
 * row count itself.
 */
function wrapIndex(next: number, length: number): number {
  if (length <= 0) return -1
  // JS's `%` can be negative; normalize to [0, length).
  return ((next % length) + length) % length
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
  // The highlight index for keyboard navigation. Resets to -1 on
  // each fresh mount: the extension tears down the React tree and
  // mounts a new one for every open (each `open` call replaces the
  // tooltip field, which CodeMirror reads as a brand-new tooltip).
  // The new component instance starts with `highlight = -1`.
  const [highlight, setHighlight] = useState<number>(-1)
  const rootRef = useRef<HTMLUListElement | null>(null)

  if (!isVisible) return null
  // The narrowing above lets TS see `state` as non-null here.
  const visibleState = state as PopoverState
  const templates = visibleState.templates

  return (
    <ul
      ref={(node) => {
        // Focus the popover on a fresh mount so keyboard navigation
        // works without a click. This is a callback ref, not an
        // effect: when React assigns a new DOM node (after a
        // remount) we focus it. When the node goes away (unmount),
        // we don't focus — the editor's focus returns naturally.
        rootRef.current = node
        if (node) node.focus()
      }}
      className="usage-template-popover"
      role="listbox"
      aria-label="Usage templates"
      tabIndex={-1}
      onKeyDown={(event) => {
        const action = onPickerKeyDown(event, highlight)
        if (action === null) return
        // Suppress handled keys from reaching the editor keymap.
        // `preventDefault` stops Escape from dismissing the
        // autocomplete widget and Enter from triggering a re-accept.
        event.preventDefault()
        event.stopPropagation()
        if (action === 'decline') {
          onDecline()
          return
        }
        if (action === 'next') {
          setHighlight((cur) => wrapIndex(cur + 1, templates.length))
          return
        }
        if (action === 'prev') {
          setHighlight((cur) => wrapIndex(cur - 1, templates.length))
          return
        }
        if (action === 'pick' && highlight >= 0 && highlight < templates.length) {
          onPick(templates[highlight])
        }
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
