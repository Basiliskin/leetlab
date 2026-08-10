// Provider API keys for LLM generation (Anthropic / OpenAI / local), stored
// under their own localStorage key so key material stays out of the Zustand
// persist slice (`leetlab.v2`) and the full-state export/import path.
//
// This module is the single import point for key storage: provider adapters
// and the settings UI read/write keys only through getKey/setKey/clearKey and
// never touch localStorage for key material directly. Keys are excluded from
// full-state backups by construction (no consumer of this module is reachable
// from the export path).

export type ApiProvider = 'anthropic' | 'openai' | 'local'

// The one storage key holding all provider key state. Every read/write below
// operates exclusively on this constant.
const STORAGE_KEY = 'leetlab.apiKeys'

// Read the whole key store. Corrupt, truncated, or non-object JSON returns
// null instead of throwing so the settings UI can't be crashed by a bad write;
// non-string values are dropped rather than surfaced to callers.
function readAll(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }
    const entry: Record<string, string> = {}
    for (const [provider, value] of Object.entries(parsed)) {
      if (typeof value === 'string') entry[provider] = value
    }
    return Object.keys(entry).length > 0 ? entry : null
  } catch {
    return null
  }
}

// Persist the store; an empty store removes the entry entirely so a cleared
// key never lingers as an empty object.
function writeAll(entry: Record<string, string>): void {
  if (Object.keys(entry).length === 0) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  }
}

export function getKey(provider: ApiProvider): string | null {
  return readAll()?.[provider] ?? null
}

export function setKey(provider: ApiProvider, key: string): void {
  const entry = readAll() ?? {}
  if (key) {
    entry[provider] = key
  } else {
    delete entry[provider]
  }
  writeAll(entry)
}

export function clearKey(provider: ApiProvider): void {
  const entry = readAll()
  if (!entry) return
  delete entry[provider]
  writeAll(entry)
}

// Mask a key for UI readback: a few leading and trailing characters stay
// visible and the body is replaced with bullets. Short and empty inputs are
// fully masked — this never returns the raw value for a non-empty key.
export function redact(key: string): string {
  if (!key) return ''
  if (key.length <= 10) return '•'.repeat(key.length)
  return `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}`
}
