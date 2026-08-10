// Suite for the protocol-driven provider adapters (providerAdapters.ts).
//
// Phase 2 of docs/roadmaps/llm-provider-crud-roadmap.md — generation dispatches
// on the provider's wire *protocol* (`anthropic` → `/v1/messages`, `openai` →
// `/v1/chat/completions`), never on a hardcoded provider id, so a user-added
// provider of either protocol reaches the right endpoint with the right auth
// headers. Errors attribute to the passed-in provider id and auth failures
// surface as `ProviderError` category 'auth'.
//
// The adapters talk to the network only through global `fetch`, so the whole
// suite mocks it with a bare `vi.fn()` and a minimal fake Response (the adapter
// only reads `.ok` / `.status` / `.statusText` / `.json()`).

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateProblemText, ProviderError } from './providerAdapters'

const fetchMock = vi.fn()
Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  configurable: true,
  writable: true,
})

beforeEach(() => {
  fetchMock.mockReset()
})

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText:
      status === 401 ? 'Unauthorized' : status === 500 ? 'Server Error' : 'OK',
    json: async () => body,
  } as Response
}

// A user-added provider speaking the anthropic wire protocol (the roadmap's
// minimax fixture). The provider id is arbitrary — only the protocol matters.
function anthropicOptions() {
  return {
    provider: 'minimax',
    apiKey: 'sk-minimax-1',
    protocol: 'anthropic' as const,
    baseUrl: 'https://api.minimax.io',
    model: 'minimax-text',
    prompt: 'Write a problem',
  }
}

// A user-added provider speaking the openai-compatible wire protocol (the
// roadmap's opencode fixture), matching the registry test fixture.
function openAiOptions() {
  return {
    provider: 'opencode',
    apiKey: 'sk-opencode-1',
    protocol: 'openai' as const,
    baseUrl: 'http://localhost:3456',
    model: 'deepseek-v3',
    prompt: 'Write a problem',
  }
}

// ---------------------------------------------------------------------------
// Dispatch — protocol only, never provider id
// ---------------------------------------------------------------------------

describe('generateProblemText dispatch', () => {
  it('dispatches on protocol, not on the provider id', async () => {
    // A provider whose id resembles a built-in but speaks the other protocol
    // must hit the protocol's endpoint — there are no provider-id arms.
    fetchMock.mockResolvedValue(
      jsonResponse(200, { content: [{ type: 'text', text: 'ok' }] })
    )
    await generateProblemText({
      provider: 'openai',
      apiKey: 'sk-1',
      protocol: 'anthropic',
      baseUrl: 'https://llm.example.com',
      model: 'm',
      prompt: 'p',
    })
    expect(fetchMock.mock.calls[0][0]).toBe('https://llm.example.com/v1/messages')
  })
})

// ---------------------------------------------------------------------------
// anthropic protocol arm
// ---------------------------------------------------------------------------

describe('anthropic protocol', () => {
  it('posts a user-added provider to /v1/messages with the anthropic headers', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { content: [{ type: 'text', text: 'result' }] })
    )
    const text = await generateProblemText(anthropicOptions())
    expect(text).toBe('result')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.minimax.io/v1/messages')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      'x-api-key': 'sk-minimax-1',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    })
    // The anthropic wire path never uses a Bearer header.
    expect(init.headers).not.toHaveProperty('Authorization')
    expect(JSON.parse(init.body)).toMatchObject({
      model: 'minimax-text',
      max_tokens: 8192,
      messages: [{ role: 'user', content: 'Write a problem' }],
    })
  })

  it('surfaces a 401 as ProviderError auth attributed to the provider id', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { message: 'Invalid API key' } })
    )
    const error: unknown = await generateProblemText(anthropicOptions()).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(ProviderError)
    expect(error).toMatchObject({ category: 'auth', status: 401, provider: 'minimax' })
  })

  it('reports an unparseable 2xx body as invalid-response on the provider id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { notContent: true }))
    const error: unknown = await generateProblemText(anthropicOptions()).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(ProviderError)
    expect(error).toMatchObject({ category: 'invalid-response', provider: 'minimax' })
  })
})

// ---------------------------------------------------------------------------
// openai protocol arm
// ---------------------------------------------------------------------------

describe('openai protocol', () => {
  it('posts a user-added provider to /v1/chat/completions with Bearer auth', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { choices: [{ message: { content: 'result' } }] })
    )
    const text = await generateProblemText(openAiOptions())
    expect(text).toBe('result')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3456/v1/chat/completions')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      Authorization: 'Bearer sk-opencode-1',
    })
    // The openai wire path never carries the anthropic x-api-key header.
    expect(init.headers).not.toHaveProperty('x-api-key')
    expect(JSON.parse(init.body)).toMatchObject({
      model: 'deepseek-v3',
      messages: [{ role: 'user', content: 'Write a problem' }],
    })
  })

  it('omits the Authorization header when no key is supplied (local servers)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { choices: [{ message: { content: 'result' } }] })
    )
    await generateProblemText({ ...openAiOptions(), provider: 'local', apiKey: '' })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('surfaces a 401 as ProviderError auth attributed to the provider id', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { message: 'Bad key' } })
    )
    const error: unknown = await generateProblemText(openAiOptions()).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(ProviderError)
    expect(error).toMatchObject({ category: 'auth', status: 401, provider: 'opencode' })
  })

  it('classifies a network/CORS rejection as cors-network on the provider id', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error: unknown = await generateProblemText(openAiOptions()).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(ProviderError)
    expect(error).toMatchObject({ category: 'cors-network', provider: 'opencode' })
  })
})
