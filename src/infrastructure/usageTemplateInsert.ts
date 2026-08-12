/**
 * Pure (zero-DOM) usage-template insert engine for built-in TS completion
 * items (roadmap phase 1, codeeditor-usage-templates). Phase 0 hands us the
 * curated `USAGE_TEMPLATES` data; this module is the data → editor bridge
 * the function-form `apply` in phase 3 calls to compute exact replacement
 * ranges, the bare-identifier insert, and an indentation-aware re-indent of
 * the multi-line template bodies.
 *
 * It deliberately avoids CodeMirror types: every entry point is a pure
 * `(source, pos, from, to) -> ...` function on plain strings, so the suite
 * runs in the Node environment without a DOM or `@codemirror/view`. Phase
 * 4's React popover consumes the same exports; phase 3's apply wiring
 * composes the lookup + range + insert steps into one document edit.
 *
 * Two accept paths (mirrored from builtInTsCompletion):
 *   1. bare-identifier: from = start of partial, to = cursor, range covers
 *      the partial. Decline inserts the bare label, choose inserts the
 *      re-indented template.
 *   2. constructor: from = to = pos (right after `(`), the walk-back
 *      extends the range over the trailing `new Name(` already on the
 *      line so we never end up with `new new TransformStream(`.
 */

import { USAGE_TEMPLATES, type UsageTemplate } from './typeUsageTemplates'

export { USAGE_TEMPLATES, type UsageTemplate }

/**
 * Return the curated usage templates for a given completion label, or
 * `undefined` if the label carries no templates. Empty arrays are
 * treated as "no templates" so callers can use a single truthy check.
 */
export function lookupUsageTemplates(
  label: string,
): readonly UsageTemplate[] | undefined {
  const list = USAGE_TEMPLATES[label]
  return list && list.length > 0 ? list : undefined
}

/**
 * The resolved replacement range for a built-in TS completion accept.
 * `from` and `to` are document positions; `label` is the constructor
 * identifier the editor will treat as the bare insert on decline.
 */
export interface TemplateRange {
  from: number
  to: number
  label: string
}

// Tail of the document up to the cursor: a `new Name(` prefix with the
// identifier captured. Mirrors CONSTRUCTOR_RE in builtInTsCompletion so
// the apply hook's walk-back stays in lockstep with the source's match.
const NEW_CTX_TAIL_RE = /new\s+([A-Za-z_$][\w$]*)\s*\(\s*$/

/**
 * Resolve the [from, to) range the editor will replace.
 *
 * The two accept paths have different inputs:
 *   - Bare-identifier: from and to bracket the partial the user typed;
 *     from !== to. We pass them through and return the partial text
 *     (which equals the completion label) as `label`.
 *   - Constructor: from === to === pos (cursor right after `(`). We
 *     walk back over `new Name(` and return that span with `label`
 *     equal to `Name`. Returns `null` if no constructor prefix is
 *     found at the cursor, so the apply hook can fall back to a
 *     minimal edit.
 *
 * Defensive: when `from === to` but no `new Name(` prefix matches,
 * returns `null`. The apply hook can then fall back to inserting the
 * bare label at the cursor.
 */
export function resolveReplacementRange(
  source: string,
  pos: number,
  from: number,
  to: number,
): TemplateRange | null {
  if (pos < 0 || pos > source.length) return null
  if (from < 0 || to < from || to > source.length) return null
  if (from === to) {
    return resolveConstructorRange(source, pos)
  }
  // Bare-identifier: the partial is the text the user typed; the
  // completion's label equals that text.
  return { from, to, label: source.slice(from, to) }
}

/**
 * Walk back from the cursor to find the `new Name(` prefix and return
 * its [from, pos) span. Exported so the unit tests can pin the
 * boundary conditions (space before `(`, multiple spaces, etc.)
 * directly against the implementation.
 */
export function resolveConstructorRange(
  source: string,
  pos: number,
): TemplateRange | null {
  if (pos < 0 || pos > source.length) return null
  const before = source.slice(0, pos)
  const match = before.match(NEW_CTX_TAIL_RE)
  if (!match) return null
  const from = pos - match[0].length
  if (from < 0) return null
  return { from, to: pos, label: match[1] }
}

/**
 * Indentation extracted from the start of the line containing `pos`:
 * the run of leading spaces/tabs up to the first non-whitespace on
 * that line. Cursor position only matters for picking the line; the
 * returned indent is the line's own leading whitespace, not a slice
 * that ends at the cursor, so a cursor at column 0 of an indented
 * line still reports the full indent.
 *
 * This is what the editor's `apply` will splice the chosen template
 * in at, and what the multi-line re-indent in `reindentTemplateBody`
 * prepends to every body line.
 */
export function cursorIndentAt(source: string, pos: number): string {
  if (pos < 0) pos = 0
  if (pos > source.length) pos = source.length
  let lineStart = pos
  while (lineStart > 0 && source[lineStart - 1] !== '\n') lineStart--
  // Scan the line's own leading whitespace, regardless of where the
  // cursor sits within it, so an out-of-range or at-column-0 cursor
  // still reports the line's real indent.
  let i = lineStart
  while (i < source.length && (source[i] === ' ' || source[i] === '\t')) i++
  return source.slice(lineStart, i)
}

/**
 * Re-indent every line of a template by prepending `cursorIndent`.
 * The first line lives at the cursor column, where the line's own
 * leading whitespace is already present, so prepending `cursorIndent`
 * to it yields the correct visual column. Subsequent lines are
 * offset by the same amount, which keeps the body of the snippet
 * nested relative to the head.
 *
 * The template data invariant (enforced by typeUsageTemplates.test.ts)
 * is that the head line carries no leading whitespace, so a pure
 * `indent + line` join produces a correctly-indented body for any
 * `cursorIndent`. Returns the input unchanged when `cursorIndent` is
 * empty so zero-indent sites do not allocate a new string.
 */
export function reindentTemplateBody(text: string, cursorIndent: string): string {
  if (!cursorIndent) return text
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    lines[i] = cursorIndent + lines[i]
  }
  return lines.join('\n')
}

/**
 * Splice a chosen template into the source at the resolved range,
 * body re-indented to match the cursor's line. Returns the new
 * document text and the cursor position that lands the caret on
 * the line immediately after the inserted block, where the user
 * will continue typing.
 *
 * The returned `cursor` is the document position just past the
 * inserted text. The CodeMirror apply hook uses that to position
 * the caret after the dispatch; the React popover in phase 4 will
 * use the same offset to draw the overlay at the accepted row.
 */
export function insertTemplate(
  source: string,
  range: { from: number; to: number },
  template: UsageTemplate,
  cursorIndent: string,
): { text: string; cursor: number } {
  const reindented = reindentTemplateBody(template.text, cursorIndent)
  const text = source.slice(0, range.from) + reindented + source.slice(range.to)
  return { text, cursor: range.from + reindented.length }
}

/**
 * Splice the bare identifier into the source at the resolved range.
 * This is the decline / dismiss path: the user did not pick a
 * template, so we replicate what the original `apply: ''` did —
 * replace the partial with the label — but go through the same
 * range resolution as the choose path so the two code paths share
 * one splice.
 */
export function insertBareIdentifier(
  source: string,
  range: { from: number; to: number },
  label: string,
): { text: string; cursor: number } {
  const text = source.slice(0, range.from) + label + source.slice(range.to)
  return { text, cursor: range.from + label.length }
}
