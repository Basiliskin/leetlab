// Fixture suite for roadmap phase 0, codeeditor-usage-templates. The
// mechanism is purely data-driven, so the entire test surface here is
// invariant checks on the curated record: required keys, non-empty
// templates, the constructor name appearing in each snippet, and a
// first-line-without-leading-indent rule so phase 1's re-indent can
// compute the body's indent from the cursor context.
//
// We deliberately keep these tests cheap and pure-Node — no DOM, no
// codemirror, no fetch — so the data module is a stable compilation
// target for the editor work in phases 1–4.

import { describe, expect, it } from 'vitest'
import {
  USAGE_TEMPLATES,
  type UsageTemplate,
} from './typeUsageTemplates'

// The four required types the roadmap names in this phase. A future
// type is added here AND to USAGE_TEMPLATES in the same edit; the test
// fails if either side drifts.
const REQUIRED_TYPES = [
  'TransformStream',
  'ReadableStream',
  'WritableStream',
  'AbortController',
] as const

// Each template's snippet must call out the record's key as a
// constructor so the constructor-walkback in phase 1 can locate the
// `new Name(` prefix at the accept site. Capture the substring we
// expect to find.
function constructorCallOf(label: string): string {
  return `new ${label}(`
}

describe('USAGE_TEMPLATES curated record', () => {
  it('exposes all four required type keys', () => {
    const keys = Object.keys(USAGE_TEMPLATES).sort()
    expect(keys).toEqual([...REQUIRED_TYPES].sort())
  })

  it('has at least one template per required type', () => {
    for (const key of REQUIRED_TYPES) {
      const templates = USAGE_TEMPLATES[key]
      expect(
        templates,
        `${key} must carry at least one usage template`,
      ).toBeDefined()
      expect(templates.length, `${key}.length`).toBeGreaterThan(0)
    }
  })

  it('every template is a well-formed UsageTemplate', () => {
    for (const [key, templates] of Object.entries(USAGE_TEMPLATES)) {
      for (const t of templates) {
        expect(typeof t.label, `${key}.label`).toBe('string')
        expect(t.label.length, `${key}.label non-empty`).toBeGreaterThan(0)
        expect(typeof t.text, `${key}.text`).toBe('string')
        expect(t.text.length, `${key}.text non-empty`).toBeGreaterThan(0)
        if (t.description !== undefined) {
          expect(typeof t.description, `${key}.description`).toBe('string')
          expect(t.description.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('every template text contains a `new <Key>(` constructor call', () => {
    // The constructor-walkback in phase 1 searches for `\bnew <Key>(`
    // to extend the replacement span over the partial `new Name(` the
    // user already typed. A snippet missing that prefix would be
    // inserted as a stray e.g. `new new TransformStream(`.
    for (const [key, templates] of Object.entries(USAGE_TEMPLATES)) {
      const needle = constructorCallOf(key)
      for (const t of templates) {
        expect(
          t.text.includes(needle),
          `${key} template "${t.label}" must contain "${needle}"`,
        ).toBe(true)
      }
    }
  })

  it('the first line of every template has no leading whitespace', () => {
    // Phase 1 re-indents the whole body to the cursor's indent by
    // re-indenting lines 2..N. The first line lives at the current
    // cursor column, so any leading whitespace would double-indent.
    for (const [key, templates] of Object.entries(USAGE_TEMPLATES)) {
      for (const t of templates) {
        const firstLine = t.text.split('\n', 1)[0]
        expect(
          firstLine,
          `${key} template "${t.label}" first line`,
        ).toBe(firstLine.trimStart())
      }
    }
  })

  it('uses unique labels inside each type so the popover rows are unambiguous', () => {
    for (const [key, templates] of Object.entries(USAGE_TEMPLATES)) {
      const labels = templates.map((t) => t.label)
      expect(
        new Set(labels).size,
        `${key} has duplicate template labels: ${labels.join(', ')}`,
      ).toBe(labels.length)
    }
  })

  it('arrives as a typed Record with readonly arrays (no accidental mutation)', () => {
    // The shape mirrors SERVICE_INTERNAL_METHODS so the same
    // mutation-guard reasoning applies: a downstream caller cannot
    // accidentally push into the curated record.
    const w: Record<string, readonly UsageTemplate[]> = USAGE_TEMPLATES
    expect(w).toBe(USAGE_TEMPLATES)
    expect(Array.isArray(USAGE_TEMPLATES.TransformStream)).toBe(true)
  })
})
