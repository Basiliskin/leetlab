// Review-before-add gate copy for generated problems.
//
// Phase 6 of docs/roadmaps/llm-generated-problems-import-export-roadmap.md.
// Pure UI-facing helpers for the accept/discard review screen: turning a
// dedupe result (reason + colliding problem) into a distinct, collider-naming
// message per property. The accept/discard actions themselves live in the
// store (acceptGeneratedProblem / discardGeneratedProblem); this module only
// formats feedback, so it is trivially unit-testable without a DOM.

import type { Problem } from '@domain/Problem'
import type { DuplicateReason } from './store'

export interface DuplicateInfo {
  reason: DuplicateReason
  collidingWith: Problem
}

/**
 * Human-readable duplicate message that explicitly names the colliding
 * property (slug / title / signature) and the existing problem it collides
 * with, so all three collision types are distinguishable in the UI.
 */
export const describeDuplicate = (info: DuplicateInfo): string => {
  const { collidingWith } = info
  switch (info.reason) {
    case 'duplicate-slug':
      return `The slug "${collidingWith.slug}" is already used by "${collidingWith.title}" in the problem bank.`
    case 'duplicate-title':
      return `A problem with the same title already exists: "${collidingWith.title}".`
    case 'duplicate-signature':
      return `A problem with the same signature (${collidingWith.mode} "${collidingWith.fnName}") already exists: "${collidingWith.title}".`
  }
}

/** Short label for the duplicate alert heading, one per reason. */
export const duplicateHeadline = (reason: DuplicateReason): string => {
  switch (reason) {
    case 'duplicate-slug':
      return 'Duplicate slug'
    case 'duplicate-title':
      return 'Duplicate title'
    case 'duplicate-signature':
      return 'Duplicate signature'
  }
}
