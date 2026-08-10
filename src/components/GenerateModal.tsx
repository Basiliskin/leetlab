// Generate-settings modal (Phase 5 of
// docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Topbar 'Generate' entry: pick a provider/model, enter (masked) and persist an
// API key through the apiKeys module, optionally set a base URL for local
// OpenAI-compatible servers, then run generation. Classified provider errors
// are surfaced distinctly (auth vs network/CORS vs server vs validation) and a
// retry re-runs without resetting the chosen provider/model/key.
//
// On success the validated `Problem` is written ONLY to the store's in-memory
// `pendingGenerated` slice — nothing reaches localStorage or the problem bank
// here (the review-before-add gate, Phase 6, owns acceptance).

import { useEffect, useRef, useState } from 'react'
import { clearKey, getKey, redact, setKey, type ApiProvider } from '../infrastructure/apiKeys'
import { generateValidatedProblem, GenerationValidationError } from '../infrastructure/outputValidation'
import { PROVIDERS, ProviderError } from '../infrastructure/providerAdapters'
import { buildGenerationPrompt } from '../infrastructure/generationPrompt'
import { useAppStore } from '../infrastructure/store'

interface GenerateModalProps {
  open: boolean
  onClose: () => void
}

function describeGenerationError(err: unknown): string {
  if (err instanceof ProviderError) {
    switch (err.category) {
      case 'auth':
        return `The API key was rejected (HTTP ${err.status ?? 'auth error'}). Check the key for ${err.provider} and try again.`
      case 'cors-network':
        return 'Network or CORS error: the request could not reach the provider. Check your connection and that the provider/base URL allows browser (CORS) requests.'
      case 'server':
        return 'The provider reported a server error (5xx). Please try again in a moment.'
      case 'client':
        return `The provider rejected the request (HTTP ${err.status ?? '4xx'}). Try a different model or check the settings.`
      case 'invalid-response':
        return 'The provider returned an unexpected response. Try again.'
      default:
        return err.message || 'Unknown generation error.'
    }
  }
  if (err instanceof GenerationValidationError) {
    const sample = err.errors.slice(0, 3).join('; ')
    return `The model output failed validation after ${err.attempts} attempt(s): ${sample}`
  }
  return err instanceof Error ? err.message : String(err)
}

export function GenerateModal({ open, onClose }: GenerateModalProps) {
  const pendingGenerated = useAppStore((s) => s.pendingGenerated)
  const setPendingGenerated = useAppStore((s) => s.setPendingGenerated)

  const [provider, setProvider] = useState<ApiProvider>('anthropic')
  const [model, setModel] = useState(() => PROVIDERS[0].models[0].id)
  const [baseUrl, setBaseUrl] = useState(
    () => PROVIDERS.find((p) => p.id === 'local')!.defaultBaseUrl
  )
  const [keyInput, setKeyInput] = useState('')
  const [inFlight, setInFlight] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Synchronous guard: a second click before React re-renders must not start a
  // second request (the state-based `inFlight` alone is not enough).
  const inFlightRef = useRef(false)

  // Re-prefill the key field from the apiKeys module and clear stale errors
  // whenever the modal opens, the pending item changes, or the provider
  // switches. Done by adjusting state during render (React's documented
  // pattern for "state that resets when a prop changes") instead of an effect.
  const [synced, setSynced] = useState({
    open,
    provider,
    pending: pendingGenerated,
  })
  if (
    synced.open !== open ||
    synced.provider !== provider ||
    synced.pending !== pendingGenerated
  ) {
    setSynced({ open, provider, pending: pendingGenerated })
    setKeyInput(getKey(provider) ?? '')
    setError(null)
  }

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const cfg = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0]
  const storedKey = getKey(provider)
  const keyRequired = provider !== 'local'
  const showSuccess = pendingGenerated !== null

  const onProviderChange = (id: ApiProvider) => {
    const next = PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]
    setProvider(id)
    setModel(next.models[0]?.id ?? '')
    setError(null)
  }

  const runGeneration = async () => {
    if (inFlightRef.current) return
    if (provider === 'local' && !model.trim()) {
      setError('Enter a model name for the local server.')
      return
    }
    inFlightRef.current = true
    setInFlight(true)
    setError(null)
    try {
      const key = keyInput.trim()
      // Persist the key through the apiKeys module; an empty field removes it.
      if (key) setKey(provider, key)
      else clearKey(provider)
      const problem = await generateValidatedProblem({
        provider,
        apiKey: key,
        baseUrl:
          provider === 'local' && baseUrl.trim() ? baseUrl.trim() : undefined,
        model: model.trim() || cfg.models[0]?.id || '',
        prompt: buildGenerationPrompt(),
      })
      // The only write on success: the in-memory pending slice. The view
      // switches to the success panel once pendingGenerated is set.
      setPendingGenerated(problem)
    } catch (err) {
      setError(describeGenerationError(err))
    } finally {
      inFlightRef.current = false
      setInFlight(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gen-modal-title">
        <div className="modal-head">
          <div>
            <h2 id="gen-modal-title">
              {showSuccess ? 'Generated problem' : 'Generate a problem'}
            </h2>
            {showSuccess ? (
              <p className="modal-sub">
                Validated and ready for the review step — nothing has been added
                to the problem bank yet.
              </p>
            ) : (
              <p className="modal-sub">
                Calls the provider straight from your browser. Keys are stored
                locally and excluded from backups.
              </p>
            )}
          </div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {showSuccess && pendingGenerated ? (
          <div className="gen-success">
            <div className="gen-success-head">
              <span className={`pill ${pendingGenerated.difficulty}`}>
                {pendingGenerated.difficulty}
              </span>
              <h3 className="gen-success-title">{pendingGenerated.title}</h3>
            </div>
            <div className="gen-success-sig">
              <code>{pendingGenerated.fnName}</code> · mode{' '}
              <code>{pendingGenerated.mode}</code> ·{' '}
              {pendingGenerated.tests.length} test case
              {pendingGenerated.tests.length === 1 ? '' : 's'}
            </div>
            {pendingGenerated.tags.length > 0 && (
              <div className="gen-success-row">
                {pendingGenerated.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="gen-note">
              This problem is held in memory for review (accept or discard).
              Generating a new problem replaces it.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-submit"
                onClick={() => {
                  setError(null)
                  setPendingGenerated(null)
                }}
              >
                New problem
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void runGeneration()
            }}
          >
            <div className="form-row">
              <label htmlFor="gen-provider">Provider</label>
              <select
                id="gen-provider"
                value={provider}
                onChange={(e) => onProviderChange(e.target.value as ApiProvider)}
                disabled={inFlight}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="gen-model">
                {cfg.models.length > 0 ? 'Model' : 'Model name'}
              </label>
              {cfg.models.length > 0 ? (
                <select
                  id="gen-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={inFlight}
                >
                  {cfg.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="gen-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={cfg.modelPlaceholder}
                  disabled={inFlight}
                />
              )}
            </div>

            {provider === 'local' && (
              <div className="form-row">
                <label htmlFor="gen-baseurl">Base URL</label>
                <input
                  id="gen-baseurl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  disabled={inFlight}
                />
                <div className="field-hint">
                  The adapter appends /v1/chat/completions. The server must
                  allow browser (CORS) requests.
                </div>
              </div>
            )}

            <div className="form-row">
              <label htmlFor="gen-key">API key</label>
              <input
                id="gen-key"
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={keyRequired ? 'sk-…' : 'optional for local servers'}
                autoComplete="off"
                disabled={inFlight}
              />
              <div className="field-hint">
                {storedKey
                  ? `Saved key: ${redact(storedKey)}`
                  : 'Stored only in this browser (leetlab.apiKeys) and excluded from exports.'}
              </div>
            </div>

            {error && (
              <div className="gen-error" role="alert">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                disabled={inFlight}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-submit${inFlight ? ' busy' : ''}`}
                disabled={inFlight || (keyRequired && !keyInput.trim())}
              >
                <span className="spin" />
                {inFlight
                  ? 'Generating…'
                  : error
                    ? 'Retry generation'
                    : 'Generate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
