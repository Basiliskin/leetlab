/**
 * Curated "usage template" data for built-in TS completion items (roadmap
 * phase 0, codeeditor-usage-templates). Each construct that surfaces as a
 * CodeMirror completion item (e.g. accepting `TransformStream` in the TS
 * editor) can carry a small set of static constructor-call snippets the
 * pickable popover in phase 4 shows. The mechanism is purely data-driven:
 * adding a new type's templates is a one-line edit to USAGE_TEMPLATES, with
 * no changes to the completion source or the editor wiring.
 *
 * Conventions mirror the other curated records in this layer:
 * - SERVICE_INTERNAL_METHODS in serviceCompletions.ts: `Record<string, readonly X[]>`
 *   keyed by handle, pure denylist data.
 * - DOM_AUGMENT_TEXT in sandboxAmbient.ts: hand-written static text appended
 *   to the ambient declaration file.
 * Like both, this module carries no logic and no React imports — it is the
 * ground-truth data the insert logic of phase 1 reads and the accept wiring
 * of phase 3 mutates the editor through.
 *
 * Template text shape (validated by typeUsageTemplates.test.ts):
 *   - No leading indentation on the first line. Phase 1 re-indents the body
 *     to the cursor's indent so the inserted snippet is correct at any nesting.
 *   - Each `text` is a self-contained, syntactically valid JS/TS snippet:
 *     a constructor call with a complete source-object literal. Templates
 *     that reference undefined locals (e.g. placeholder variable names) are
 *     tolerated as illustrative, not a gate.
 *   - The constructor identifier in `text` matches the record key so the
 *     constructor-walkback in phase 1 can locate the new `Name(` prefix
 *     and replace it cleanly.
 */

/**
 * A single template option in the popover. The popover renders `label` as
 * the row title, `description` (when present) as a one-line subtitle, and
 * `text` as the snippet that gets inserted when the user picks it.
 */
export interface UsageTemplate {
  /** Short popover row title, e.g. "Pull", "Transform", "Filter". */
  label: string
  /** Constructor-call snippet; multi-line, indent-free at the head. */
  text: string
  /** Optional one-line description shown beneath the label. */
  description?: string
}

/**
 * Curated usage templates for built-in TS completion items, keyed by the
 * completion label that builtInTsCompletion will render. The four required
 * types come from the Web Streams API + AbortController — the canonical
 * examples that motivated the feature. Subsequent additions are data-only.
 */
export const USAGE_TEMPLATES: Record<string, readonly UsageTemplate[]> = {
  TransformStream: [
    {
      label: 'Transform',
      description: 'Map each chunk: enqueue one output per input',
      text: `new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk);
  },
})`,
    },
    {
      label: 'Filter',
      description: 'Drop chunks that fail a predicate',
      text: `new TransformStream({
  transform(chunk, controller) {
    if (chunk) {
      controller.enqueue(chunk);
    }
  },
})`,
    },
  ],
  ReadableStream: [
    {
      label: 'Pull',
      description: 'Backpressure-aware source: emit one chunk per pull',
      text: `new ReadableStream({
  pull(controller) {
    controller.enqueue(/* chunk */);
    controller.close();
  },
})`,
    },
    {
      label: 'Start',
      description: 'Eager source: emit all chunks in start()',
      text: `new ReadableStream({
  start(controller) {
    controller.enqueue(/* chunk */);
    controller.close();
  },
})`,
    },
  ],
  WritableStream: [
    {
      label: 'Write',
      description: 'Sink: consume each chunk in write()',
      text: `new WritableStream({
  write(chunk) {
    // consume chunk
  },
})`,
    },
    {
      label: 'Write with error',
      description: 'Abort the stream via controller.error(...)',
      text: `new WritableStream({
  write(chunk, controller) {
    if (!chunk) {
      controller.error(new Error('invalid chunk'));
      return;
    }
    // consume chunk
  },
})`,
    },
  ],
  AbortController: [
    {
      label: 'Signal + abort',
      description: 'Cancel a fetch / stream via controller.signal',
      text: `const controller = new AbortController();
const signal = controller.signal;
controller.abort();`,
    },
  ],
}
