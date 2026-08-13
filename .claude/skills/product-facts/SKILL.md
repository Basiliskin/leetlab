---
name: product-facts
description: Analyze an SPA repository and write a grounded, five-section Product Facts document at docs/marketing/00-product-facts.md that every other marketing skill treats as the single source of truth. Runs repo analysis first (never inventing features), then asks the user only for information the repository cannot provide (production URL, primary goal, open-source status, features not yet visible in the repo), then writes and validates the document. Use when the user asks to prepare marketing or promotion materials, gather product facts, build a positioning or launch foundation, or run "product facts" on a project — invoked from inside the target repository. Not for writing promotional copy itself (positioning, launch, content, and review are separate skills), not for repositories the user does not own, and not a license to invent claims — anything without a traced source is recorded as Unknown or parked under Forbidden assumptions.
---

# Product Facts

Produce `docs/marketing/00-product-facts.md` in the target repository — the single source of truth
that every downstream marketing skill must read before writing anything promotional. Nothing may
claim more than the evidence supports.

The pipeline has four phases, always in this order:

1. **Analyze the repo** — gather evidence, cite file paths, never invent features.
2. **Ask the user** — only for information the repo cannot provide.
3. **Write the document** — the five-section shape, every fact traced to a source.
4. **Validate** — mechanical checks first, judgment checks after, no forbidden claims.

## Resolve the target repository root

The skill runs inside the target SPA repo. Resolve its root from the current working directory — the
directory containing `.git/`, or `${CLAUDE_PROJECT_DIR}` if it is set — never from where this skill
is installed. All evidence paths in the document are relative to that root. If no repository root can
be resolved, stop and tell the user.

## Write target

Write the document to `docs/marketing/00-product-facts.md` relative to the repository root (create
`docs/marketing/` if needed). The populated document is the single source of truth for all downstream
marketing skills.

## The five sections

Every Product Facts document has exactly these five sections, in this order. **Unknown** records a
gap as open; it is never filled by invention.

1. **Verified facts** — claims each traced to a repository file, the README, or the user.
2. **Repository evidence** — the concrete file paths in the repo that back the Verified facts.
3. **User-provided facts** — non-derivable information the user supplied: production URL, primary
   goal, open-source status, features not visible in the repo.
4. **Unknown** — gaps (active users, performance benchmarks, browser support) recorded as open.
5. **Forbidden assumptions** — claims never emitted without explicit evidence:
   - fastest
   - most secure
   - better than competitors
   - privacy-preserving

## Phase 1 — Analyze the repo

Follow `references/analyze-guide.md`. Scan the README, package.json, source, tests, docs, and assets;
collect repo-relative file-path evidence per finding; treat the README as self-published (code is
stronger evidence); degrade gracefully to **Unknown** when a source is missing. Map findings into the
five sections.

## Phase 2 — Ask the user

Only after analysis, follow `references/user-questions.md`. Ask for the non-derivable items only —
production URL, primary goal, open-source status, features not visible in the repo — one at a time,
with a stop condition and a decline path. Record answers as User-provided facts. Never solicit the
forbidden claims as leading questions.

## Phase 3 — Write the document

Fill in `references/product-facts-template.md` and write it to the write target. Every fact slot
carries a `source:` field restricted to `repo file path` | `README` | `user`.

## Phase 4 — Validate

Run `references/validation-rules.md`: mechanical checks first (forbidden-claim keyword scan,
five-section completeness, traceability, no invented features), then judgment checks. Fix every
violation before delivering.

## Non-negotiables

- Never invent a feature. Unsupported gaps go to **Unknown**.
- Every Verified fact is traceable to a repo file, the README, or the user.
- The four forbidden claims are never emitted without explicit evidence.
- No project-specific details are hardcoded — every run analyzes its own repo.
