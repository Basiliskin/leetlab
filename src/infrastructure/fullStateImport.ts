// Validated full-state JSON import (Phase 8 of
// docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Restores a Phase 7 export document ({version, persisted, generatedProblems}):
// 1. version gate   — reject any version other than FULL_STATE_VERSION;
// 2. schema check   — field-level validation of the persisted slice and the
//                     generated bank (reusing the Phase 3 Problem validator);
// 3. bank checks    — `lastSlug` must resolve in the merged bank (built-ins +
//                     the file's generated problems) and imported generated
//                     problems must not collide with PROBLEM_BANK;
// 4. atomic apply   — one setState write; a pre-import snapshot of the restore
//                     boundary restores the live store if the apply throws.
//
// Every rejection path returns errors and leaves the live store (and therefore
// the persisted `leetlab.v2` JSON) untouched. API keys are never involved:
// the export format omits them by construction and this module reads no key.

import type { Problem } from '@domain/Problem'
import { FULL_STATE_VERSION, type FullStateExport } from './fullStateExport'
import { validateGeneratedProblemObject } from './outputValidation'
import { PROBLEM_BANK } from './problemBank'
import { describeDuplicate } from './reviewGate'
import {
  findGeneratedCollision,
  getMergedBank,
  useAppStore,
  type ProblemState,
} from './store'

export type ImportResult =
  | { ok: true }
  | { ok: false; errors: string[] }

export type ValidateImportResult =
  | { doc: FullStateExport }
  | { errors: string[] }

type UnknownRecord = Record<string, unknown>

const LANGS = ['js', 'ts'] as const

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function typeOf(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function missingOrType(v: unknown, expected: string): string {
  if (v === undefined) return `missing (expected ${expected})`
  return `expected ${expected}, got ${typeOf(v)}`
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

// ---------------------------------------------------------------------------
// Persisted-slice validation
// ---------------------------------------------------------------------------

function validateSubmission(v: unknown, label: string): string[] {
  const errors: string[] = []
  if (!isPlainObject(v)) {
    return [`${label}: expected an object, got ${typeOf(v)}`]
  }
  if (!isFiniteNumber(v.t)) errors.push(`${label}.t: ${missingOrType(v.t, 'number')}`)
  if (typeof v.lang !== 'string' || !(LANGS as readonly string[]).includes(v.lang)) {
    errors.push(`${label}.lang: ${missingOrType(v.lang, '"js" or "ts"')}`)
  }
  if (typeof v.verdict !== 'string') {
    errors.push(`${label}.verdict: ${missingOrType(v.verdict, 'string')}`)
  }
  if (!isFiniteNumber(v.passed)) {
    errors.push(`${label}.passed: ${missingOrType(v.passed, 'number')}`)
  }
  if (!isFiniteNumber(v.total)) {
    errors.push(`${label}.total: ${missingOrType(v.total, 'number')}`)
  }
  if (v.ms !== null && !isFiniteNumber(v.ms)) {
    errors.push(`${label}.ms: expected a number or null, got ${typeOf(v.ms)}`)
  }
  return errors
}

function validateCase(v: unknown, label: string): string[] {
  const errors: string[] = []
  if (!isPlainObject(v)) {
    return [`${label}: expected an object, got ${typeOf(v)}`]
  }
  if (typeof v.id !== 'string') errors.push(`${label}.id: ${missingOrType(v.id, 'string')}`)
  if (typeof v.inputText !== 'string') {
    errors.push(`${label}.inputText: ${missingOrType(v.inputText, 'string')}`)
  }
  if (typeof v.expectedText !== 'string') {
    errors.push(`${label}.expectedText: ${missingOrType(v.expectedText, 'string')}`)
  }
  if (typeof v.builtin !== 'boolean') {
    errors.push(`${label}.builtin: ${missingOrType(v.builtin, 'boolean')}`)
  }
  return errors
}

function validateProblemState(v: unknown, slug: string): string[] {
  const errors: string[] = []
  const label = `persisted.problems["${slug}"]`
  if (!isPlainObject(v)) {
    return [`${label}: expected an object, got ${typeOf(v)}`]
  }
  if (!Array.isArray(v.subs)) {
    errors.push(`${label}.subs: ${missingOrType(v.subs, 'an array')}`)
  } else {
    for (let i = 0; i < v.subs.length; i++) {
      errors.push(...validateSubmission(v.subs[i], `${label}.subs[${i}]`))
    }
  }
  if (v.cases !== null && !Array.isArray(v.cases)) {
    errors.push(`${label}.cases: expected an array or null, got ${typeOf(v.cases)}`)
  } else if (Array.isArray(v.cases)) {
    for (let i = 0; i < v.cases.length; i++) {
      errors.push(...validateCase(v.cases[i], `${label}.cases[${i}]`))
    }
  }
  if (v.js !== null && typeof v.js !== 'string') {
    errors.push(`${label}.js: expected a string or null, got ${typeOf(v.js)}`)
  }
  if (v.ts !== null && typeof v.ts !== 'string') {
    errors.push(`${label}.ts: expected a string or null, got ${typeOf(v.ts)}`)
  }
  if (v.solvedAt !== null && !isFiniteNumber(v.solvedAt)) {
    errors.push(`${label}.solvedAt: expected a number or null, got ${typeOf(v.solvedAt)}`)
  }
  return errors
}

// ---------------------------------------------------------------------------
// Top-level document validation
// ---------------------------------------------------------------------------

/**
 * Parse and validate a raw import file against the canonical export schema.
 * Returns the typed document on success; otherwise a deterministic list of
 * field-naming errors. Never mutates anything.
 */
export function validateFullStateImport(raw: string): ValidateImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { errors: ['raw: not valid JSON (expected a JSON document)'] }
  }

  if (!isPlainObject(parsed)) {
    return { errors: [`raw: expected a JSON object, got ${typeOf(parsed)}`] }
  }

  const errors: string[] = []
  const doc = parsed

  // --- version gate: exact match or reject before any further checks ---
  if (doc.version !== FULL_STATE_VERSION) {
    errors.push(
      `version: expected ${FULL_STATE_VERSION}, got ${JSON.stringify(doc.version)}`
    )
    return { errors }
  }

  // --- persisted slice ---
  if (!isPlainObject(doc.persisted)) {
    errors.push(
      `persisted: ${doc.persisted === undefined ? 'missing' : 'expected an object with lang, split, lastSlug, problems'}`
    )
  } else {
    const persisted = doc.persisted
    if (typeof persisted.lang !== 'string' || !(LANGS as readonly string[]).includes(persisted.lang)) {
      errors.push(
        `persisted.lang: expected "js" or "ts", got ${JSON.stringify(persisted.lang)}`
      )
    }
    if (!isFiniteNumber(persisted.split)) {
      errors.push(`persisted.split: ${missingOrType(persisted.split, 'number')}`)
    }
    if (typeof persisted.lastSlug !== 'string' || !persisted.lastSlug.trim()) {
      errors.push(
        `persisted.lastSlug: ${persisted.lastSlug === undefined ? 'missing' : 'expected a non-empty string'}`
      )
    }
    if (!isPlainObject(persisted.problems)) {
      errors.push(
        `persisted.problems: ${persisted.problems === undefined ? 'missing' : 'expected an object of per-problem state'}`
      )
    } else {
      for (const [slug, state] of Object.entries(persisted.problems)) {
        errors.push(...validateProblemState(state, slug))
      }
    }
  }

  // --- generated problem bank ---
  const importedGenerated: Problem[] = []
  if (!Array.isArray(doc.generatedProblems)) {
    errors.push(
      `generatedProblems: ${doc.generatedProblems === undefined ? 'missing' : 'expected an array of problems'}`
    )
  } else {
    const seenSlugs = new Set<string>()
    for (let i = 0; i < doc.generatedProblems.length; i++) {
      const result = validateGeneratedProblemObject(doc.generatedProblems[i])
      if (result.ok) {
        if (seenSlugs.has(result.problem.slug)) {
          errors.push(
            `generatedProblems: duplicate slug "${result.problem.slug}" within the file`
          )
        }
        seenSlugs.add(result.problem.slug)
        importedGenerated.push(result.problem)
      } else {
        errors.push(
          ...result.errors.map((e) => `generatedProblems[${i}]: ${e}`)
        )
      }
    }
    // PROBLEM_BANK collisions: slug/title/signature dedupe at import time, the
    // same rule acceptGeneratedProblem enforces at accept time.
    for (let i = 0; i < importedGenerated.length; i++) {
      const collision = findGeneratedCollision(importedGenerated[i], PROBLEM_BANK, [])
      if (collision) {
        errors.push(`generatedProblems[${i}]: ${describeDuplicate(collision)}`)
      }
    }
  }

  if (errors.length > 0) return { errors }

  const persisted = doc.persisted as UnknownRecord
  return {
    doc: {
      version: FULL_STATE_VERSION,
      persisted: {
        lang: persisted.lang as 'js' | 'ts',
        split: persisted.split as number,
        lastSlug: persisted.lastSlug as string,
        problems: persisted.problems as Record<string, ProblemState>,
      },
      generatedProblems: importedGenerated,
    },
  }
}

// ---------------------------------------------------------------------------
// Atomic import against the live store
// ---------------------------------------------------------------------------

interface RestoreSnapshot {
  lang: 'js' | 'ts'
  split: number
  lastSlug: string
  problems: Record<string, ProblemState>
  generatedProblems: Problem[]
  currentSlug: string
  selectedCaseIdx: number
  caseMarks: Record<string, string>
}

/**
 * Deep-copy the restore boundary (the persisted slice, the generated bank,
 * plus the ephemeral view fields touched by a successful apply) so a failed
 * apply can put the store back byte-for-byte.
 */
function snapshotState(): RestoreSnapshot {
  const s = useAppStore.getState()
  return JSON.parse(
    JSON.stringify({
      lang: s.lang,
      split: s.split,
      lastSlug: s.lastSlug,
      problems: s.problems,
      generatedProblems: s.generatedProblems,
      currentSlug: s.currentSlug,
      selectedCaseIdx: s.selectedCaseIdx,
      caseMarks: s.caseMarks,
    })
  )
}

function restoreSnapshot(snapshot: RestoreSnapshot): void {
  useAppStore.setState(snapshot)
}

/**
 * Validate `raw` against the canonical schema and the merged-bank rules, then
 * restore the persisted slice and generated bank in a single atomic write.
 *
 * Rejection (version, schema, dangling lastSlug, PROBLEM_BANK collision) never
 * touches the live store; an unexpected throw during the apply restores the
 * pre-import snapshot.
 */
export function importFullState(raw: string): ImportResult {
  const snapshot = snapshotState()
  const validated = validateFullStateImport(raw)
  if ('errors' in validated) {
    return { ok: false, errors: validated.errors }
  }
  const doc = validated.doc

  // `lastSlug` must resolve in the merged bank: built-ins plus the file's own
  // generated problems. A dangling slug would leave the app pointing at a
  // problem that does not exist after the restore.
  const merged = getMergedBank(PROBLEM_BANK, doc.generatedProblems)
  if (!merged.some((p) => p.slug === doc.persisted.lastSlug)) {
    return {
      ok: false,
      errors: [
        `persisted.lastSlug "${doc.persisted.lastSlug}" does not resolve in the merged problem bank.`,
      ],
    }
  }

  try {
    useAppStore.setState({
      lang: doc.persisted.lang,
      split: doc.persisted.split,
      lastSlug: doc.persisted.lastSlug,
      problems: doc.persisted.problems,
      generatedProblems: doc.generatedProblems,
      // Mirror selectProblem so the app behaves as if the restored lastSlug
      // had just been opened (currentSlug is in-memory-only, not part of the
      // backup format).
      currentSlug: doc.persisted.lastSlug,
      selectedCaseIdx: 0,
      caseMarks: {},
    })
  } catch {
    restoreSnapshot(snapshot)
    return {
      ok: false,
      errors: ['Import failed mid-apply; the live state was restored unchanged.'],
    }
  }
  return { ok: true }
}
