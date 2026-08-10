// Phase 7 full-state versioned JSON export
// (docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Canonical backup format: one JSON document with exactly the top-level keys
// `version` / `persisted` / `generatedProblems`. The persisted slice mirrors
// the zustand `partialize` boundary ({lang, split, lastSlug, problems}) and
// every per-problem entry keeps solvedAt / js / ts / cases / subs. API keys
// are excluded by construction: this module reads only the five allowlisted
// fields from the store (which rehydrates `leetlab.v2`) and never touches the
// `leetlab.apiKeys` key or the apiKeys module.

import type { Problem } from '@domain/Problem'
import type { ProblemState } from './store'
import { useAppStore } from './store'

/** Bump when the schema changes; Phase 8 import gates on this exact value. */
export const FULL_STATE_VERSION = 1

export interface FullStateExport {
  version: number
  persisted: {
    lang: 'js' | 'ts'
    split: number
    lastSlug: string
    problems: Record<string, ProblemState>
  }
  generatedProblems: Problem[]
}

export interface FullStateSource {
  lang: 'js' | 'ts'
  split: number
  lastSlug: string
  problems: Record<string, ProblemState>
  generatedProblems: Problem[]
}

/**
 * Build the export document from an explicit allowlist of the persisted slice
 * plus the accepted generated bank. Never spreads a whole store state, so no
 * in-memory-only field (caseMarks, lastRuns, tsStatus, pendingGenerated, ...)
 * and no key material can leak into the backup.
 */
export const buildFullStateExport = (state: FullStateSource): FullStateExport => ({
  version: FULL_STATE_VERSION,
  persisted: {
    lang: state.lang,
    split: state.split,
    lastSlug: state.lastSlug,
    problems: state.problems,
  },
  generatedProblems: state.generatedProblems,
})

/**
 * Serialize the live store state and trigger exactly one `.json` download.
 * Pure read: mutates no store state.
 */
export const downloadFullState = (): void => {
  const state = useAppStore.getState()
  const payload = buildFullStateExport({
    lang: state.lang,
    split: state.split,
    lastSlug: state.lastSlug,
    problems: state.problems,
    generatedProblems: state.generatedProblems,
  })
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `leetlab-backup-v${FULL_STATE_VERSION}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
