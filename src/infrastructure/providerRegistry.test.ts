// Suite for the user-managed provider registry (providerRegistry.ts).
//
// Phase 1 of docs/roadmaps/llm-provider-crud-roadmap.md — a localStorage-backed
// provider registry (own key `leetlab.providers`) with full CRUD, origin
// validation, duplicate-id rejection, edit-preserves-id, and delete-clears-key.
// The Anthropic/OpenAI/Local rows are only the initial seed; once written they
// are ordinary user-managed rows and never resurrect after a full delete.
//
// Like apiKeys, the registry reads localStorage lazily (per call), so the shim
// is installed up front and each test starts from a cleared store. apiKeys
// shares the same shim, which is what lets the delete-clears-key and
// edit-preserves-key tests exercise the key coupling for real.

import { beforeEach, describe, expect, it } from 'vitest'
import { getKey, setKey } from './apiKeys'
import {
  createProvider,
  deleteProvider,
  getProvider,
  listProviders,
  normalizeBaseUrl,
  updateProvider,
  type ProviderDefinition,
} from './providerRegistry'

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

function defineProvider(
  overrides: Partial<ProviderDefinition> = {},
): ProviderDefinition {
  return {
    id: 'opencode',
    name: 'opencode',
    protocol: 'openai',
    baseUrl: 'http://localhost:3456',
    modelName: 'deepseek-v3',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Seed + storage-key isolation
// ---------------------------------------------------------------------------

describe('seed', () => {
  it('seeds Anthropic/OpenAI/Local on first read and persists them', () => {
    const providers = listProviders()
    expect(providers.map((p) => p.id)).toEqual(['anthropic', 'openai', 'local'])
    expect(providers[0]).toEqual(
      expect.objectContaining({
        name: 'Anthropic',
        protocol: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        modelName: 'claude-opus-5',
      }),
    )
    expect(providers[1]).toEqual(
      expect.objectContaining({ protocol: 'openai', modelName: 'gpt-5.4' }),
    )
    expect(providers[2]).toEqual(
      expect.objectContaining({
        protocol: 'openai',
        baseUrl: 'http://localhost:11434',
        modelName: '',
      }),
    )
    expect(JSON.parse(memory.get('leetlab.providers')!)).toHaveLength(3)
  })

  it('does not resurrect the seeds after every provider is deleted', () => {
    listProviders()
    for (const p of listProviders()) deleteProvider(p.id)
    expect(listProviders()).toEqual([])
    expect(listProviders()).toEqual([])
  })

  it('reads a corrupt store as an empty registry without throwing', () => {
    memory.set('leetlab.providers', '{not json')
    expect(listProviders()).toEqual([])
    memory.set('leetlab.providers', '{"not":"an array"}')
    expect(listProviders()).toEqual([])
    expect(() => createProvider(defineProvider())).not.toThrow()
  })

  it('writes only to leetlab.providers, never to leetlab.v2 or apiKeys', () => {
    createProvider(defineProvider())
    expect(memory.has('leetlab.providers')).toBe(true)
    expect(memory.has('leetlab.v2')).toBe(false)
    expect(memory.has('leetlab.apiKeys')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createProvider
// ---------------------------------------------------------------------------

describe('createProvider', () => {
  it('adds a custom provider alongside the seeds', () => {
    const result = createProvider(defineProvider())
    expect(result).toEqual({ ok: true, provider: defineProvider() })
    expect(getProvider('opencode')).toEqual(defineProvider())
    expect(listProviders()).toHaveLength(4)
  })

  it('trims the id, name, and modelName, and normalizes the baseUrl', () => {
    const result = createProvider(
      defineProvider({
        id: '  opencode  ',
        name: '  opencode  ',
        baseUrl: 'http://localhost:3456/',
        modelName: '  deepseek-v3  ',
      }),
    )
    expect(result).toEqual({
      ok: true,
      provider: expect.objectContaining({
        id: 'opencode',
        name: 'opencode',
        baseUrl: 'http://localhost:3456',
        modelName: 'deepseek-v3',
      }),
    })
  })

  it('rejects a duplicate id (including a collision with a seed)', () => {
    createProvider(defineProvider())
    expect(createProvider(defineProvider())).toEqual({
      ok: false,
      error: 'duplicate-id',
    })
    expect(
      createProvider(
        defineProvider({ id: 'anthropic', baseUrl: 'https://api.anthropic.com' }),
      ),
    ).toEqual({ ok: false, error: 'duplicate-id' })
  })

  it('rejects an empty id', () => {
    expect(createProvider(defineProvider({ id: '   ' }))).toEqual({
      ok: false,
      error: 'empty-id',
    })
  })

  it('rejects an empty name', () => {
    expect(createProvider(defineProvider({ name: ' ' }))).toEqual({
      ok: false,
      error: 'empty-name',
    })
  })

  it('rejects an endpoint path in baseUrl', () => {
    expect(
      createProvider(defineProvider({ baseUrl: 'http://localhost:3456/v1' })),
    ).toEqual({ ok: false, error: 'invalid-base-url' })
  })
})

// ---------------------------------------------------------------------------
// normalizeBaseUrl — origin validation
// ---------------------------------------------------------------------------

describe('normalizeBaseUrl', () => {
  it.each(['https://api.anthropic.com', 'http://localhost:11434', 'https://host:8443'])(
    'accepts a valid origin: %s',
    (url) => {
      expect(normalizeBaseUrl(url)).toEqual({ ok: true, baseUrl: url })
    },
  )

  it('accepts a trailing slash and normalizes it away', () => {
    expect(normalizeBaseUrl('https://api.anthropic.com/')).toEqual({
      ok: true,
      baseUrl: 'https://api.anthropic.com',
    })
  })

  it('accepts and normalizes casing', () => {
    expect(normalizeBaseUrl('HTTPS://API.ANTHROPIC.COM')).toEqual({
      ok: true,
      baseUrl: 'https://api.anthropic.com',
    })
  })

  it.each([
    'https://api.anthropic.com/v1',
    'https://api.anthropic.com/v1/messages',
    'http://localhost:11434/v1/chat/completions',
    'https://api.anthropic.com?x=1',
    'https://api.anthropic.com#frag',
    'ftp://api.anthropic.com',
    'api.anthropic.com',
    'localhost:11434',
    'not a url',
    'https://',
    '',
    '   ',
  ])('rejects a non-origin: %s', (url) => {
    expect(normalizeBaseUrl(url)).toEqual({ ok: false })
  })
})

// ---------------------------------------------------------------------------
// listProviders / getProvider
// ---------------------------------------------------------------------------

describe('listProviders / getProvider', () => {
  it('returns providers in creation order', () => {
    createProvider(defineProvider({ id: 'a', baseUrl: 'http://localhost:1' }))
    createProvider(defineProvider({ id: 'b', baseUrl: 'http://localhost:2' }))
    expect(listProviders().map((p) => p.id)).toEqual([
      'anthropic',
      'openai',
      'local',
      'a',
      'b',
    ])
  })

  it('returns null for an unknown id', () => {
    expect(getProvider('ghost')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// updateProvider
// ---------------------------------------------------------------------------

describe('updateProvider', () => {
  it('edits fields while preserving the id', () => {
    createProvider(defineProvider())
    const result = updateProvider('opencode', {
      name: 'opencode Go server',
      protocol: 'openai',
      baseUrl: 'http://localhost:3456',
      modelName: 'gpt-oss-20b',
    })
    expect(result).toEqual({
      ok: true,
      provider: expect.objectContaining({
        id: 'opencode',
        name: 'opencode Go server',
        modelName: 'gpt-oss-20b',
      }),
    })
    expect(getProvider('opencode')?.id).toBe('opencode')
  })

  it('preserves the API key association across an edit', () => {
    createProvider(defineProvider())
    setKey('opencode', 'sk-opencode-1')
    updateProvider('opencode', {
      name: 'renamed',
      protocol: 'openai',
      baseUrl: 'http://localhost:3456',
      modelName: 'm',
    })
    expect(getKey('opencode')).toBe('sk-opencode-1')
  })

  it('can edit the seeded providers', () => {
    const result = updateProvider('local', {
      name: 'Local',
      protocol: 'openai',
      baseUrl: 'http://localhost:11434',
      modelName: 'llama3.1',
    })
    expect(result.ok).toBe(true)
    expect(getProvider('local')?.modelName).toBe('llama3.1')
  })

  it('rejects an unknown id', () => {
    expect(
      updateProvider('ghost', {
        name: 'x',
        protocol: 'openai',
        baseUrl: 'http://localhost:1',
        modelName: '',
      }),
    ).toEqual({ ok: false, error: 'not-found' })
  })

  it('rejects an invalid baseUrl without changing the registry', () => {
    createProvider(defineProvider())
    expect(
      updateProvider('opencode', {
        name: 'x',
        protocol: 'openai',
        baseUrl: 'http://localhost:3456/v1',
        modelName: '',
      }),
    ).toEqual({ ok: false, error: 'invalid-base-url' })
    expect(getProvider('opencode')?.name).toBe('opencode')
  })

  it('rejects an empty name', () => {
    createProvider(defineProvider())
    expect(
      updateProvider('opencode', {
        name: ' ',
        protocol: 'openai',
        baseUrl: 'http://localhost:3456',
        modelName: '',
      }),
    ).toEqual({ ok: false, error: 'empty-name' })
  })
})

// ---------------------------------------------------------------------------
// deleteProvider
// ---------------------------------------------------------------------------

describe('deleteProvider', () => {
  it('removes the provider from the registry', () => {
    createProvider(defineProvider())
    expect(deleteProvider('opencode')).toEqual({ ok: true })
    expect(getProvider('opencode')).toBeNull()
  })

  it('clears the provider API key', () => {
    createProvider(defineProvider())
    setKey('opencode', 'sk-opencode-1')
    deleteProvider('opencode')
    expect(getKey('opencode')).toBeNull()
  })

  it('leaves other providers and their keys untouched', () => {
    createProvider(defineProvider())
    setKey('opencode', 'sk-opencode-1')
    setKey('anthropic', 'sk-ant-1')
    deleteProvider('opencode')
    expect(getProvider('anthropic')).toBeTruthy()
    expect(getKey('anthropic')).toBe('sk-ant-1')
  })

  it('reports not-found for an unknown id and does not clear its key', () => {
    setKey('ghost', 'sk-ghost-1')
    expect(deleteProvider('ghost')).toEqual({ ok: false, error: 'not-found' })
    expect(getKey('ghost')).toBe('sk-ghost-1')
  })
})
