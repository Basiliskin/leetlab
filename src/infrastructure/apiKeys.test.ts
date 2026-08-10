// Suite for the provider-key storage module (apiKeys.ts).
//
// Phase 0 of docs/roadmaps/llm-provider-crud-roadmap.md — keys widen from the
// closed `ApiProvider` union to arbitrary provider-id strings so user-added
// providers (opencode, minimax, ...) can hold a key before the generate path
// dispatches on protocol. Storage is already `Record<string, string>` at
// runtime, so the widening is type-only; these tests pin the runtime behavior.
//
// Unlike the persisted zustand store, apiKeys reads localStorage lazily (per
// call, inside readAll), so the shim can be installed before the import
// without ordering concerns.

import { beforeEach, describe, expect, it } from 'vitest'
import { clearKey, getKey, redact, setKey } from './apiKeys'

const memory = new Map<string, string>()
const storageShim = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size
  },
}
Object.defineProperty(globalThis, 'localStorage', {
  value: storageShim,
  configurable: true,
  writable: true,
})

beforeEach(() => {
  memory.clear()
})

// ---------------------------------------------------------------------------
// Round-trip fidelity (including ids outside the built-in union)
// ---------------------------------------------------------------------------

describe('setKey/getKey', () => {
  it('round-trips a key for a built-in provider id', () => {
    setKey('anthropic', 'sk-ant-123')
    expect(getKey('anthropic')).toBe('sk-ant-123')
  })

  it('round-trips a key for an arbitrary non-union provider id', () => {
    setKey('opencode', 'sk-custom-456')
    expect(getKey('opencode')).toBe('sk-custom-456')
  })

  it('stores distinct ids without cross-talk', () => {
    setKey('anthropic', 'sk-ant-123')
    setKey('minimax', 'sk-mini-789')
    expect(getKey('anthropic')).toBe('sk-ant-123')
    expect(getKey('minimax')).toBe('sk-mini-789')
  })

  it('returns null for a missing id and an empty store', () => {
    expect(getKey('anthropic')).toBeNull()
    setKey('openai', 'sk-openai-1')
    expect(getKey('local')).toBeNull()
  })

  it('clears the entry when set with an empty string', () => {
    setKey('openai', 'sk-openai-1')
    setKey('openai', '')
    expect(getKey('openai')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Existing entries preserved
// ---------------------------------------------------------------------------

describe('existing entries', () => {
  it('reads back a store written under the old format untouched', () => {
    memory.set('leetlab.apiKeys', JSON.stringify({ local: 'ollama-key' }))
    expect(getKey('local')).toBe('ollama-key')
    expect(getKey('anthropic')).toBeNull()
  })

  it('preserves other providers when writing to one id', () => {
    memory.set('leetlab.apiKeys', JSON.stringify({ local: 'ollama-key' }))
    setKey('anthropic', 'sk-ant-123')
    expect(getKey('local')).toBe('ollama-key')
    expect(getKey('anthropic')).toBe('sk-ant-123')
  })
})

// ---------------------------------------------------------------------------
// clearKey
// ---------------------------------------------------------------------------

describe('clearKey', () => {
  it('removes only the targeted provider id', () => {
    setKey('anthropic', 'sk-ant-123')
    setKey('openai', 'sk-openai-1')
    clearKey('anthropic')
    expect(getKey('anthropic')).toBeNull()
    expect(getKey('openai')).toBe('sk-openai-1')
  })

  it('is a no-op when the store is empty or the id is absent', () => {
    expect(() => clearKey('anthropic')).not.toThrow()
    setKey('openai', 'sk-openai-1')
    expect(() => clearKey('minimax')).not.toThrow()
    expect(getKey('openai')).toBe('sk-openai-1')
  })
})

// ---------------------------------------------------------------------------
// redact (unchanged surface — sanity)
// ---------------------------------------------------------------------------

describe('redact', () => {
  it('fully masks short keys', () => {
    expect(redact('short')).toBe('•••••')
  })

  it('keeps a few edge characters of long keys', () => {
    expect(redact('sk-ant-1234567890')).toBe('sk-a•••••••••7890')
  })

  it('returns empty string for empty input', () => {
    expect(redact('')).toBe('')
  })
})
