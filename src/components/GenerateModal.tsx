// Generate modal — pure generation (Phase 1 of
// docs/roadmaps/separate-providers-from-generation-roadmap.md).
//
// Topbar 'Generate' entry: pick a provider (from the user-managed provider
// registry), optionally enter a (masked) API key that persists through the
// apiKeys module, and run generation. Classified provider errors are surfaced
// distinctly (auth vs network/CORS vs server vs validation) and a retry re-runs
// without resetting the chosen provider/key.
//
// Provider MANAGEMENT is not here: it is a top-level Topbar peer
// (`ManageProvidersModal`, launched from the 'Providers' entry). This modal owns
// no create/edit/delete surface and no per-session model/baseUrl overrides — the
// provider definition in the registry is the single source of truth for protocol,
// base URL, and model name. `runGeneration` re-reads that definition via
// `getProvider(id)` at click time, so a provider edited between opening this
// modal and pressing Generate is honoured rather than sent stale.
//
// Because the registry is read lazily per render, a deleted selection falls back
// to the first remaining provider, and an empty registry renders an empty
// `<select>` with Generate disabled (the user adds providers from the Topbar).
//
// On success the validated `Problem` is written ONLY to the store's in-memory
// `pendingGenerated` slice — nothing reaches localStorage or the problem bank
// here (the review-before-add gate, Phase 6, owns acceptance).

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clearKey, getKey, redact, setKey } from '../infrastructure/apiKeys'
import { generateValidatedProblem, GenerationValidationError } from '../infrastructure/outputValidation'
import { ProviderError } from '../infrastructure/providerAdapters'
import { getProvider, listProviders } from '../infrastructure/providerRegistry'
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

  // Render-time state resync snapshot (React's documented pattern for "state
  // that resets when a prop changes"): this tracks the last-synced open /
  // provider / pending values, and the adjustment block below (after the
  // selection is resolved) re-prefills the key field and clears stale feedback
  // when any of them changed. Declared before the early return so the hook runs
  // unconditionally.
  const [synced, setSynced] = useState({
    open,
    provider,
    pending: pendingGenerated,
  })

  // Close on Escape. This modal no longer layers a management surface on top,
  // so it owns Escape unconditionally while open.
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
  // current id was deleted, and to null when the registry is empty (the form
  // then renders an empty <select> with Generate disabled).
  const providers = listProviders()
  const selected = providers.find((p) => p.id === provider) ?? providers[0] ?? null
  const storedKey = getKey(selected?.id ?? '')

  // Adjustment block: re-prefill the key field from the apiKeys module and
  // clear stale errors whenever the modal opens, the pending item changes, or
  // the provider switches (including a deleted selection falling back).
  if (
    synced.open !== open ||
    synced.provider !== provider ||
    synced.pending !== pendingGenerated
  ) {
    setSynced({ open, provider, pending: pendingGenerated })
    setKeyInput(getKey(selected?.id ?? '') ?? '')
    setError(null)
    // The provider state id no longer resolves (it was deleted from the
    // Providers surface) and `selected` fell back to the first remaining
    // provider: pin the provider state to the resolved id. No model/baseUrl to
    // resync — those are read from the definition at generation time.
    if (selected && provider !== selected.id) setProvider(selected.id)
    // A different problem entered (or left) the review queue: drop stale
    // duplicate feedback. `acceptedSnapshot` is NOT reset here — a successful
    // Accept clears the queue and this block would otherwise wipe the
    // confirmation panel.
    if (synced.pending !== pendingGenerated) setDuplicateError(null)
  }

  // Review-gate view state: a pending problem awaiting review, a confirmation
  // for the problem just accepted (queue already cleared), or the form.
  const showReview = pendingGenerated !== null
  const showAccepted = acceptedSnapshot !== null

  const onProviderChange = (id: string) => {
    const next = providers.find((p) => p.id === id)
    if (!next) return
    setProvider(id)
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
    // Re-read the definition from the registry at click time rather than using
    // closed-over render state: the provider may have been edited from the
    // Topbar 'Providers' surface since this modal opened, and the definition —
    // not any per-session form value — is the source of truth.
    const definition = getProvider(selected.id)
    if (!definition) {
      setError(
        'The selected provider no longer exists. Reopen this dialog to pick another.'
      )
      return
    }
    const effectiveModel = definition.modelName.trim()
    if (!effectiveModel) {
      setError(
        `The provider "${definition.name}" has no model name. Set one from the Providers entry in the top bar.`
      )
      return
    }
    inFlightRef.current = true
    setInFlight(true)
    setError(null)
    try {
      const key = keyInput.trim()
      // Persist the key through the apiKeys module; an empty field removes it.
      if (key) setKey(definition.id, key)
      else clearKey(definition.id)
      const problem = await generateValidatedProblem({
        provider: definition.id,
        apiKey: key,
        protocol: definition.protocol,
        baseUrl: definition.baseUrl,
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

  return createPortal(
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
                value={selected?.id ?? ''}
                onChange={(e) => onProviderChange(e.target.value)}
                disabled={inFlight || !selected}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="field-hint">
                {selected ? (
                  <>
                    Model <code>{selected.modelName || 'not set'}</code> ·{' '}
                    <code>{selected.baseUrl}</code> (
                    {selected.protocol === 'anthropic'
                      ? '/v1/messages'
                      : '/v1/chat/completions'}
                    ). Change these from the Providers entry in the top bar.
                  </>
                ) : (
                  'No providers configured. Add one from the Providers entry in the top bar.'
                )}
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
                disabled={inFlight || !selected}
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
                disabled={inFlight || !selected}
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
      </div>,
    document.body,
  )
}
