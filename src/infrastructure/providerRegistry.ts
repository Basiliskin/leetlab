// User-managed LLM provider registry, stored under its own localStorage key
// (`leetlab.providers`) so provider definitions stay out of the Zustand persist
// slice (`leetlab.v2`) and the full-state export/import path.
//
// Phase 1 of docs/roadmaps/llm-provider-crud-roadmap.md. A provider definition
// carries an id, a display name, a wire protocol (`anthropic` | `openai`), a
// baseUrl origin (the adapter appends the protocol-specific path), and a single
// modelName. The built-in Anthropic/OpenAI/Local rows are only the initial
// seed — once written they are ordinary user-managed rows, never special-cased.
//
// The registry reads localStorage lazily (per call) and defensively: a corrupt
// store reads back as an empty registry instead of throwing, and garbage rows
// are dropped. Invalid baseUrls (endpoint paths, non-http schemes) are rejected
// at write time because the adapter appends `/v1/...` itself.
//
// This module is the only writer to `leetlab.providers`; it never touches
// `leetlab.v2` or the export path. Deleting a provider also clears its API key
// from `leetlab.apiKeys` (via `clearKey`) so a removed provider never leaves
// orphaned key material behind.

import { clearKey } from './apiKeys'

export type ProviderProtocol = 'anthropic' | 'openai'

export interface ProviderDefinition {
  /** Stable identity — also the key for the provider's API key in `leetlab.apiKeys`. */
  id: string
  name: string
  /** Wire-format selector: `anthropic` → `/v1/messages`, `openai` → `/v1/chat/completions`. */
  protocol: ProviderProtocol
  /** Origin of the provider API; the adapter appends the protocol-specific path. */
  baseUrl: string
  /** The single model string used for generation (may be empty for local servers). */
  modelName: string
}

export type ProviderRegistryError =
  | 'duplicate-id'
  | 'empty-id'
  | 'empty-name'
  | 'invalid-base-url'
  | 'not-found'

export type ProviderMutationResult =
  | { ok: true; provider: ProviderDefinition }
  | { ok: false; error: ProviderRegistryError }

export type DeleteProviderResult = { ok: true } | { ok: false; error: 'not-found' }

// The one storage key holding all provider definitions.
const STORAGE_KEY = 'leetlab.providers'

// Initial definitions, mirroring the pre-registry constants that used to live
// in providerAdapters.ts (`DEFAULT_BASE_URLS` / `PROVIDERS`, removed in Phase 2),
// collapsed to a single modelName. `local` speaks the openai-compatible wire
// protocol. These are written once on first use and afterwards behave like any
// user-managed row.
const SEED_PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    modelName: 'claude-opus-5',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    protocol: 'openai',
    baseUrl: 'https://api.openai.com',
    modelName: 'gpt-5.4',
  },
  {
    id: 'local',
    name: 'Local (OpenAI-compatible)',
    protocol: 'openai',
    baseUrl: 'http://localhost:11434',
    modelName: '',
  },
]

// Validate and normalize a baseUrl down to its origin. The adapter appends
// `/v1/...` itself, so endpoint paths, query strings, and fragments are
// rejected here — they would otherwise produce a doubled path at generation
// time. Accepts http/https only, tolerates casing, and strips a trailing slash.
export type BaseUrlNormalization = { ok: true; baseUrl: string } | { ok: false }

export function normalizeBaseUrl(input: string): BaseUrlNormalization {
  const trimmed = input.trim()
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return { ok: false }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false }
  // `url.origin` excludes any path/query/hash; the input must equal it exactly
  // (modulo casing and a trailing slash) or it is an endpoint path, not an
  // origin.
  const noSlash = trimmed.replace(/\/+$/, '')
  if (noSlash.toLowerCase() !== url.origin.toLowerCase()) return { ok: false }
  return { ok: true, baseUrl: url.origin }
}

function isProviderDefinition(value: unknown): value is ProviderDefinition {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    (v.protocol === 'anthropic' || v.protocol === 'openai') &&
    typeof v.baseUrl === 'string' &&
    typeof v.modelName === 'string'
  )
}

// Read the whole registry, seeding on first use. A missing key means the store
// has never been written, so the built-in seeds are installed (and persisted).
// A present-but-invalid store reads back as an empty registry rather than
// throwing; garbage rows are dropped. A store emptied by deleting every
// provider is `[]`, not a missing key, so seeds never resurrect. A storage
// failure reads as an empty registry without attempting any write.
function readAll(): ProviderDefinition[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return []
  }
  if (raw === null) {
    const seeds = [...SEED_PROVIDERS]
    writeAll(seeds)
    return seeds
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isProviderDefinition)
  } catch {
    return []
  }
}

// Persist the registry. An empty registry writes `[]` rather than removing the
// key — the key's presence is what distinguishes "seeded" from "user deleted
// everything", so removing it here would resurrect the seeds on the next read.
function writeAll(providers: ProviderDefinition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

export function listProviders(): ProviderDefinition[] {
  return readAll()
}

export function getProvider(id: string): ProviderDefinition | null {
  return readAll().find((p) => p.id === id) ?? null
}

export function createProvider(input: ProviderDefinition): ProviderMutationResult {
  const id = input.id.trim()
  if (!id) return { ok: false, error: 'empty-id' }
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'empty-name' }
  const base = normalizeBaseUrl(input.baseUrl)
  if (!base.ok) return { ok: false, error: 'invalid-base-url' }
  const providers = readAll()
  if (providers.some((p) => p.id === id)) return { ok: false, error: 'duplicate-id' }
  const provider: ProviderDefinition = {
    id,
    name,
    protocol: input.protocol,
    baseUrl: base.baseUrl,
    modelName: input.modelName.trim(),
  }
  writeAll([...providers, provider])
  return { ok: true, provider }
}

export function updateProvider(
  id: string,
  patch: Omit<ProviderDefinition, 'id'>,
): ProviderMutationResult {
  const name = patch.name.trim()
  if (!name) return { ok: false, error: 'empty-name' }
  const base = normalizeBaseUrl(patch.baseUrl)
  if (!base.ok) return { ok: false, error: 'invalid-base-url' }
  const providers = readAll()
  const index = providers.findIndex((p) => p.id === id)
  if (index === -1) return { ok: false, error: 'not-found' }
  // The id is preserved across edits so the provider's API key in
  // `leetlab.apiKeys` keeps its association.
  const provider: ProviderDefinition = {
    id,
    name,
    protocol: patch.protocol,
    baseUrl: base.baseUrl,
    modelName: patch.modelName.trim(),
  }
  const next = [...providers]
  next[index] = provider
  writeAll(next)
  return { ok: true, provider }
}

export function deleteProvider(id: string): DeleteProviderResult {
  const providers = readAll()
  const next = providers.filter((p) => p.id !== id)
  if (next.length === providers.length) return { ok: false, error: 'not-found' }
  writeAll(next)
  // Deleting a provider clears its stored API key so a removed provider never
  // leaves orphaned key material behind.
  clearKey(id)
  return { ok: true }
}
