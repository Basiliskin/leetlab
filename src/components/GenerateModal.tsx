// Generate-settings modal (Phase 2 of
// docs/roadmaps/llm-provider-crud-roadmap.md).
//
// Topbar 'Generate' entry: pick a provider (from the user-managed provider
// registry), optionally enter a (masked) API key that persists through the
// apiKeys module, and run generation. The provider's protocol, base URL, and
// model name are derived from the registry, not hardcoded; the base URL and
// model fields are pre-filled from the selected provider and remain editable
// for this session. Classified provider errors are surfaced distinctly (auth vs
// network/CORS vs server vs validation) and a retry re-runs without resetting
// the chosen provider/model/key.
//
// On success the validated `Problem` is written ONLY to the store's in-memory
// `pendingGenerated` slice — nothing reaches localStorage or the problem bank
// here (the review-before-add gate, Phase 6, owns acceptance).

import { useEffect, useRef, useState } from 'react'
import { clearKey, getKey, redact, setKey } from '../infrastructure/apiKeys'
import { generateValidatedProblem, GenerationValidationError } from '../infrastructure/outputValidation'
import { ProviderError } from '../infrastructure/providerAdapters'
import { listProviders } from '../infrastructure/providerRegistry'
import { buildGenerationPrompt } from '../infrastructure/generationPrompt'
import {
  describeDuplicate,
  duplicateHeadline,
  type DuplicateInfo,
} from '../infrastructure/reviewGate'
import { useAppStore } from '../infrastructure/store'
import type { Problem } from '../domain/Problem'

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
  const acceptGeneratedProblem = useAppStore((s) => s.acceptGeneratedProblem)
  const discardGeneratedProblem = useAppStore((s) => s.discardGeneratedProblem)

  const [provider, setProvider] = useState<string>(
    () => listProviders()[0]?.id ?? ''
  )
  const [model, setModel] = useState<string>(
    () => listProviders()[0]?.modelName ?? ''
  )
  const [baseUrl, setBaseUrl] = useState<string>(
    () => listProviders()[0]?.baseUrl ?? ''
  )
  const [keyInput, setKeyInput] = useState('')
  const [inFlight, setInFlight] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Review-gate state (Phase 6): `acceptedSnapshot` holds the problem just
  // accepted so the confirmation panel can render after the queue clears;
  // `duplicateError` holds the dedupe failure (reason + colliding problem)
  // surfaced on a failed Accept. Neither is persisted.
  const [acceptedSnapshot, setAcceptedSnapshot] = useState<Problem | null>(null)
  const [duplicateError, setDuplicateError] = useState<DuplicateInfo | null>(
    null
  )

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
    // A different problem entered (or left) the review queue: drop stale
    // duplicate feedback. `acceptedSnapshot` is NOT reset here — a successful
    // Accept clears the queue and this block would otherwise wipe the
    // confirmation panel.
    if (synced.pending !== pendingGenerated) setDuplicateError(null)
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

  // Registry-derived selection. The registry is read lazily per render (like
  // apiKeys); `selected` falls back to the first remaining provider when the
  // current id was deleted, and to null when the registry is empty (the form is
  // replaced by an empty state below).
  const providers = listProviders()
  const selected = providers.find((p) => p.id === provider) ?? providers[0] ?? null
  const storedKey = getKey(selected?.id ?? '')

  // Empty registry: there is nothing to generate with. No provider is
  // special-cased, so this is the defensive empty state (the CRUD surface in
  // Phase 3 is where a user would re-add a provider).
  if (!selected) {
    return (
      <div
        className="modal-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gen-modal-title"
        >
          <div className="modal-head">
            <div>
              <h2 id="gen-modal-title">Generate a problem</h2>
              <p className="modal-sub">No LLM providers are configured.</p>
            </div>
            <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="gen-empty" role="status">
            Add an LLM provider to start generating problems.
          </div>
        </div>
      </div>
    )
  }

  // Review-gate view state: a pending problem awaiting review, a confirmation
  // for the problem just accepted (queue already cleared), or the form.
  const showReview = pendingGenerated !== null
  const showAccepted = acceptedSnapshot !== null

  const onProviderChange = (id: string) => {
    const next = providers.find((p) => p.id === id)
    if (!next) return
    setProvider(id)
    setModel(next.modelName)
    setBaseUrl(next.baseUrl)
    setError(null)
  }

  // Accept: branch on the dedupe result. A collision renders a distinct
  // collider-naming message and keeps the pending problem in the queue (only
  // Discard empties the queue on this path); a clean accept persists, clears
  // the queue and switches to the confirmation panel.
  const handleAccept = () => {
    const pending = pendingGenerated
    if (!pending || acceptedSnapshot) return
    const result = acceptGeneratedProblem(pending)
    if (result.ok) {
      setAcceptedSnapshot(pending)
      setPendingGenerated(null)
      setDuplicateError(null)
    } else {
      setDuplicateError(result)
    }
  }

  // Discard: removes the pending problem from the queue and never persists.
  // No-op when the queue is empty.
  const handleDiscard = () => {
    if (!pendingGenerated) return
    discardGeneratedProblem(pendingGenerated.slug)
    setDuplicateError(null)
    setAcceptedSnapshot(null)
  }

  const closeAfterAccept = () => {
    setAcceptedSnapshot(null)
    setDuplicateError(null)
    onClose()
  }

  const runGeneration = async () => {
    if (inFlightRef.current || !selected) return
    const effectiveModel = model.trim() || selected.modelName
    if (!effectiveModel.trim()) {
      setError('Enter a model name.')
      return
    }
    inFlightRef.current = true
    setInFlight(true)
    setError(null)
    try {
      const key = keyInput.trim()
      // Persist the key through the apiKeys module; an empty field removes it.
      if (key) setKey(selected.id, key)
      else clearKey(selected.id)
      const problem = await generateValidatedProblem({
        provider: selected.id,
        apiKey: key,
        protocol: selected.protocol,
        baseUrl: baseUrl.trim() || selected.baseUrl,
        model: effectiveModel,
        prompt: buildGenerationPrompt(),
      })
      // The only write on success: the in-memory pending slice. The view
      // switches to the review panel once pendingGenerated is set.
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
              {showReview
                ? 'Review generated problem'
                : showAccepted
                  ? 'Problem added'
                  : 'Generate a problem'}
            </h2>
            {showReview ? (
              <p className="modal-sub">
                Nothing is added to the problem bank until you accept it.
              </p>
            ) : showAccepted ? (
              <p className="modal-sub">
                The problem is saved in this browser alongside the built-in
                problems.
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

        {showReview && pendingGenerated ? (
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
            <div className="gen-tests">
              <div className="gen-tests-label">Test preview</div>
              {pendingGenerated.tests.length === 0 ? (
                <div className="gen-tests-empty">No tests in this problem.</div>
              ) : (
                pendingGenerated.tests.map((t, i) => (
                  <div key={i} className="gen-test">
                    <div className="gen-test-row">
                      <span className="gen-test-tag">
                        {pendingGenerated.mode === 'class' ? 'calls' : 'in'}
                      </span>
                      <code>
                        {JSON.stringify(
                          pendingGenerated.mode === 'class' ? t.calls : t.in
                        )}
                      </code>
                    </div>
                    <div className="gen-test-row">
                      <span className="gen-test-tag out">out</span>
                      <code>{JSON.stringify(t.out)}</code>
                    </div>
                  </div>
                ))
              )}
            </div>
            {duplicateError && (
              <div className="gen-dupe" role="alert">
                <b>{duplicateHeadline(duplicateError.reason)} — not added.</b>{' '}
                {describeDuplicate(duplicateError)}
              </div>
            )}
            <div className="gen-note">
              Accepting adds this problem to your problem bank. Discard removes
              it from the review queue without changing the bank.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDiscard}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn btn-submit"
                onClick={handleAccept}
              >
                Accept & add
              </button>
            </div>
          </div>
        ) : showAccepted && acceptedSnapshot ? (
          <div className="gen-confirm" role="status">
            <div className="gen-success-head">
              <span className={`pill ${acceptedSnapshot.difficulty}`}>
                {acceptedSnapshot.difficulty}
              </span>
              <h3 className="gen-success-title">{acceptedSnapshot.title}</h3>
            </div>
            <p>
              Added to your problem bank. It appears in the sidebar alongside
              the built-in problems and persists across reloads.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-submit"
                onClick={closeAfterAccept}
              >
                Done
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
                value={selected.id}
                onChange={(e) => onProviderChange(e.target.value)}
                disabled={inFlight}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="gen-model">Model name</label>
              <input
                id="gen-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. claude-opus-5, gpt-5.4, llama3.1"
                disabled={inFlight}
              />
              <div className="field-hint">
                Pre-filled from the provider definition; editable for this
                session.
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="gen-baseurl">Base URL</label>
              <input
                id="gen-baseurl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={selected.baseUrl}
                disabled={inFlight}
              />
              <div className="field-hint">
                The adapter appends{' '}
                {selected.protocol === 'anthropic'
                  ? '/v1/messages'
                  : '/v1/chat/completions'}
                . The server must allow browser (CORS) requests.
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="gen-key">API key</label>
              <input
                id="gen-key"
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-… (optional)"
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
                disabled={inFlight}
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
