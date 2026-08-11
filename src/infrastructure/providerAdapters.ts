// Browser-direct provider adapters for LLM problem generation.
//
// Each adapter POSTs the generation prompt straight to the provider's HTTP API
// from the browser (no backend) and returns the model's raw text. Wire-format
// knowledge (endpoint, auth headers, response shape) lives only in this module;
// callers get a uniform `generateProblemText` contract and a classified error
// result (`ProviderError.category`) they can switch on without string matching.
//
// Phase 2 of docs/roadmaps/llm-provider-crud-roadmap.md: dispatch keys off the
// provider's wire *protocol* (`anthropic` → `/v1/messages`, `openai` →
// `/v1/chat/completions`), never off a hardcoded provider id, so a user-added
// provider of either protocol works. The origin comes in as `baseUrl` (from the
// provider registry) and the adapter appends the protocol-specific path.
// Problem parsing is intentionally out of scope here — this returns raw text
// only.
//
// Key sourcing: the API key is passed per call (never captured at module scope
// and never read from localStorage here). The generate-settings UI sources it
// via `getKey` from `./apiKeys` and hands it in.

import type { ProviderProtocol } from "./providerRegistry";

export interface GenerateProblemTextOptions {
  /** Provider id — for error attribution only (e.g. `opencode`, `minimax`). */
  provider: string;
  /** API key for the provider. Required per call — never captured at module scope. */
  apiKey: string;
  /** Wire-format selector: `anthropic` → `/v1/messages`, `openai` → `/v1/chat/completions`. */
  protocol: ProviderProtocol;
  /** Origin of the provider API; the adapter appends the protocol-specific path. */
  baseUrl: string;
  model: string;
  prompt: string;
}

/** Machine-readable failure category — call sites switch on this, never on message text. */
export type ProviderErrorCategory =
  | "auth" // 401 / 403 — missing/invalid key, or no permission
  | "client" // other 4xx — 400 / 404 / 429 / etc.
  | "server" // 5xx — provider-side failure
  | "cors-network" // TypeError / Failed to fetch — CORS blocked, DNS, or offline
  | "invalid-response" // 2xx but the body isn't the expected shape / text is empty
  | "unknown";

export interface ProviderErrorInit {
  status: number | null;
  provider: string;
}

export class ProviderError extends Error {
  readonly category: ProviderErrorCategory;
  readonly status: number | null;
  readonly provider: string;

  constructor(
    category: ProviderErrorCategory,
    message: string,
    { status, provider }: ProviderErrorInit,
  ) {
    super(message);
    this.name = "ProviderError";
    this.category = category;
    this.status = status;
    this.provider = provider;
  }
}

// Required on every Anthropic Messages request; the browser-direct CORS header
// is mandatory for calls made from a web page with a user-supplied key.
const ANTHROPIC_VERSION_HEADER = "2023-06-01";

// Dev-only same-origin relay (see vite.config.ts's llmProxyPlugin). Many
// providers (OpenAI, most self-hosted/custom endpoints) don't send CORS
// headers for arbitrary browser origins, so a direct fetch is rejected before
// it ever reaches them. Routing through the dev server sidesteps that — it's
// a server-to-server request there, which CORS doesn't apply to. Production
// builds have no server to run this on, so requests there stay direct.
function resolveFetchUrl(url: string): string {
  if (!import.meta.env.DEV) return url;
  return `/__llm-proxy?url=${encodeURIComponent(url)}`;
}

const MAX_OUTPUT_TOKENS = 32_000;

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export function classifyHttpStatus(status: number): ProviderErrorCategory {
  if (status === 0) return "cors-network"; // opaque / aborted response
  if (status === 401 || status === 403) return "auth";
  if (status >= 500) return "server";
  return "client";
}

// In the browser, both CORS failures and network failures reject fetch with a
// TypeError ("Failed to fetch") — distinct from an HTTP error response, which
// fetch resolves normally.
export function classifyFetchError(err: unknown): ProviderErrorCategory {
  if (err instanceof TypeError) return "cors-network";
  if (err instanceof Error && /failed to fetch/i.test(err.message))
    return "cors-network";
  return "unknown";
}

function toProviderError(provider: string, err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new ProviderError(classifyFetchError(err), message, {
    status: null,
    provider,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Anthropic and OpenAI both wrap a human-readable explanation under
// `error.message` in non-2xx bodies.
function extractErrorMessage(data: unknown): string | undefined {
  if (!isRecord(data) || !isRecord(data.error)) return undefined;
  return typeof data.error.message === "string"
    ? data.error.message
    : undefined;
}

async function httpError(
  response: Response,
  provider: string,
): Promise<ProviderError> {
  const status = response.status;
  let message = response.statusText || `HTTP ${status}`;
  try {
    const data: unknown = await response.json();
    const detail = extractErrorMessage(data);
    if (detail) message = detail;
  } catch {
    // Non-JSON error body — fall back to the status text.
  }
  return new ProviderError(classifyHttpStatus(status), message, {
    status,
    provider,
  });
}

function extractAnthropicText(data: unknown): string | undefined {
  if (!isRecord(data) || !Array.isArray(data.content)) return undefined;
  for (const block of data.content) {
    if (
      isRecord(block) &&
      typeof block.text === "string" &&
      block.text.trim() !== ""
    ) {
      return block.text;
    }
  }
  return undefined;
}

async function parseAnthropicResponse(
  response: Response,
  provider: string,
): Promise<string> {
  if (!response.ok) throw await httpError(response, provider);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ProviderError(
      "invalid-response",
      "Response body is not valid JSON",
      {
        status: response.status,
        provider,
      },
    );
  }
  const text = extractAnthropicText(data);
  if (text) return text;
  throw new ProviderError(
    "invalid-response",
    "Response did not contain a non-empty text block (content[].text)",
    { status: response.status, provider },
  );
}

function extractOpenAiContent(data: unknown): unknown {
  if (!isRecord(data)) return undefined;
  const choices = data.choices;
  if (!Array.isArray(choices) || !isRecord(choices[0])) return undefined;
  const message = choices[0].message;
  if (!isRecord(message)) return undefined;
  return message.content;
}

async function parseOpenAiResponse(
  response: Response,
  provider: string,
): Promise<string> {
  if (!response.ok) throw await httpError(response, provider);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ProviderError(
      "invalid-response",
      "Response body is not valid JSON",
      {
        status: response.status,
        provider,
      },
    );
  }
  const content = extractOpenAiContent(data);
  if (typeof content === "string" && content.trim() !== "") return content;
  throw new ProviderError(
    "invalid-response",
    "Response did not contain a non-empty message content (choices[0].message.content)",
    { status: response.status, provider },
  );
}

// ---------------------------------------------------------------------------
// Protocol adapters
// ---------------------------------------------------------------------------

async function generateAnthropic(
  options: GenerateProblemTextOptions,
): Promise<string> {
  const body = {
    model: options.model,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [{ role: "user", content: options.prompt }],
  };
  let response: Response;
  try {
    response = await fetch(resolveFetchUrl(`${options.baseUrl}/v1/messages`), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": options.apiKey,
        "anthropic-version": ANTHROPIC_VERSION_HEADER,
        // Mandatory for browser-direct requests; without it Anthropic returns 403.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw toProviderError(options.provider, err);
  }
  return parseAnthropicResponse(response, options.provider);
}

async function generateOpenAiCompatible(
  options: GenerateProblemTextOptions,
): Promise<string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  // Local servers commonly accept an empty key; only attach the header when a
  // key was actually supplied.
  if (options.apiKey) headers["Authorization"] = `Bearer ${options.apiKey}`;
  const body = {
    model: options.model,
    messages: [{ role: "user", content: options.prompt }],
  };
  let response: Response;
  try {
    response = await fetch(
      resolveFetchUrl(`${options.baseUrl}/v1/chat/completions`),
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    );
  } catch (err) {
    throw toProviderError(options.provider, err);
  }
  return parseOpenAiResponse(response, options.provider);
}

/**
 * Generate problem text from the selected provider and return the model's raw
 * text. Dispatches on the provider's wire protocol — a user-added provider of
 * either protocol reaches the right endpoint. Throws {@link ProviderError} on
 * any failure; call sites switch on `error.category`, never on message text.
 */
export async function generateProblemText(
  options: GenerateProblemTextOptions,
): Promise<string> {
  switch (options.protocol) {
    case "anthropic":
      return generateAnthropic(options);
    case "openai":
      return generateOpenAiCompatible(options);
  }
}
