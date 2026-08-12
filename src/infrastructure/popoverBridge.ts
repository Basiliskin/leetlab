/**
 * Component-free state carrier between the built-in TS completion `apply`
 * hook (infrastructure) and the React template-popover (interface) it
 * eventually drives — roadmap phase 2 of codeeditor-usage-templates.
 *
 * The two sides live in different layers:
 *   - `.ts` apply hook in `builtInTsCompletion.ts` calls `open(...)` when
 *     the user accepts a template-bearing completion. It must not import
 *     React; `editorCompletions.ts` is component-free by the react-refresh
 *     convention.
 *   - `.tsx` template popover in `src/components/` subscribes via
 *     `subscribe(listener)` and renders the picker when state is non-null.
 *     The picker reads the same payload to know which templates to show,
 *     where to anchor the overlay, and which source/pos/from/to to splice
 *     on choose/decline.
 *
 * The bridge deliberately exposes a plain pub/sub API (open / close / update
 * / clear / subscribe / getState) with no React import and no CodeMirror
 * import. It is the only seam between the completion mechanism and the
 * popover UI, so it has to be small, predictable, and 100% Node-testable.
 *
 * State lifecycle:
 *   - closed (null) -> open(payload) -> open(payload')  replace
 *   - open -> update(partial)                        merge
 *   - open -> close()                                back to closed
 *   - open -> clear()                                alias for close()
 *   - closed -> update(...)                          no-op (state stays null)
 *   - closed -> close()                              no-op (no notify)
 *
 * Subscribers receive `(state, prev)` so a re-render can diff; the bridge
 * itself fires synchronously inside the calling microtask so React sees a
 * stable snapshot by the time its render runs.
 */

import type { UsageTemplate } from './typeUsageTemplates'

/**
 * The viewport coordinates the popover should anchor at. The apply hook
 * derives these from the CodeMirror view's `coordsAtPos` (phase 4); the
 * bridge stores them as opaque numbers so the React side can pass them
 * straight into a CSS positioning transform.
 */
export interface PopoverCoords {
  x: number
  y: number
}

/**
 * The accept-anchor payload: everything the picker needs to render and
 * to act on choose/decline. `source` + `pos` + `from` + `to` are the
 * resolved document context at the moment the user accepted; templates
 * is the curated list to render; label is the bare identifier (decline
 * insert); coords is the viewport anchor.
 *
 * The shape is a frozen snapshot — the bridge never mutates it after
 * `open`, so a React listener can compare by reference safely.
 */
export interface PopoverState {
  /** Curated templates to render as popover rows. */
  templates: readonly UsageTemplate[]
  /** Bare identifier inserted on decline / dismiss. */
  label: string
  /** Viewport coordinates for the overlay anchor. */
  coords: PopoverCoords
  /** Document text at accept time (for choose-insert). */
  source: string
  /** Cursor position at accept time (for choose-insert). */
  pos: number
  /** Start of the resolved replacement range (inclusive). */
  from: number
  /** End of the resolved replacement range (exclusive). */
  to: number
}

export type PopoverListener = (state: PopoverState | null, prev: PopoverState | null) => void

/**
 * The module-level state. `null` means the popover is closed; the apply
 * hook calls `open(...)` to set it; the React popover subscribes and
 * unmounts when it sees null again.
 */
let currentState: PopoverState | null = null

/**
 * Subscribers are kept in a Set so add/remove are O(1) and the contract
 * is "fire every listener, in insertion order, on each transition."
 * A listener that throws is logged and skipped so a faulty React
 * listener can't wedge the bridge.
 */
const listeners = new Set<PopoverListener>()

/**
 * Read the current state without subscribing. `null` means the popover
 * is closed. The React popover calls this on mount to decide whether to
 * render its initial frame.
 */
export function getState(): PopoverState | null {
  return currentState
}

/**
 * Subscribe to state transitions. The listener fires synchronously on
 * every transition, including the one that results from the very next
 * `open`/`close`/`update`/`clear` call. Returns an unsubscribe function.
 *
 * Duplicate subscriptions are deduped by Set semantics, so the same
 * listener reference isn't fired twice.
 */
export function subscribe(listener: PopoverListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Fire every listener with the new state and the previous state. Errors
 * are swallowed so a single bad listener cannot break the others or the
 * bridge's own invariants.
 */
function notify(prev: PopoverState | null): void {
  for (const listener of listeners) {
    try {
      listener(currentState, prev)
    } catch (err) {
      // Bridge runtime errors must not wedge the editor; log to console.
      console.error('[popoverBridge] listener threw', err)
    }
  }
}

/**
 * Open the popover with the supplied payload. If the popover is already
 * open, the new payload replaces the old one (subscribers see a single
 * transition with both states). Returns true if a transition fired.
 *
 * The apply hook in phase 3 calls this with the resolved anchor info
 * derived from the accept site; the React popover in phase 4 picks up
 * the change via `subscribe`.
 */
export function open(state: PopoverState): boolean {
  const prev = currentState
  currentState = state
  notify(prev)
  return true
}

/**
 * Patch the current open state. A no-op when the popover is closed (the
 * caller probably meant to call `open` instead) or when the partial is
 * empty (no keys to merge). Fires subscribers on a real merge only.
 * Returns true if a transition fired.
 *
 * Designed for the cursor-moves-after-accept case where the overlay
 * needs to track the viewport coords without rebuilding the whole
 * payload.
 */
export function update(partial: Partial<PopoverState>): boolean {
  if (currentState === null) return false
  if (Object.keys(partial).length === 0) return false
  const prev = currentState
  currentState = { ...prev, ...partial }
  notify(prev)
  return true
}

/**
 * Close the popover. No-op when already closed (no notification fires).
 * Returns true if a transition fired.
 *
 * The picker calls this on Escape, click-outside, or blur; the apply
 * hook never calls it directly — the bridge is closed by the React
 * side after the user picks or declines.
 */
export function close(): boolean {
  if (currentState === null) return false
  const prev = currentState
  currentState = null
  notify(prev)
  return true
}

/**
 * Reset the bridge. Wipes state and all subscribers in one shot, with
 * no listener notification — the dedicated name documents the "throw
 * everything away" intent for paths that swap the editor view (e.g.
 * language change, problem switch) where firing the preview UI during
 * teardown only adds churn. Returns true if the popover was open.
 */
export function clear(): boolean {
  const wasOpen = currentState !== null
  currentState = null
  listeners.clear()
  return wasOpen
}

// Test-only escape hatch: the bridge is a module-level singleton so the
// .ts production code shares one instance with the React popover. Tests
// reset it between cases via this hook; the export is non-underscored
// because it is part of the public surface (the picker relies on it
// during hot-reload). Production callers should not use it.
export function __resetForTests(): void {
  currentState = null
  listeners.clear()
}
