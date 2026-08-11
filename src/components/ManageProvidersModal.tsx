// Provider management modal (Phase 3 of
// docs/roadmaps/llm-provider-crud-roadmap.md).
//
// User-facing create/edit/delete surface for the provider registry, reachable
// from GenerateModal (the provider row's "Manage providers" link, or the empty
// state's "Add an LLM provider" button). Lists every provider and offers a form
// capturing exactly the editable fields the roadmap specifies — name, protocol
// (anthropic | openai), an origin-validated baseUrl (endpoint paths rejected by
// the registry), and a single modelName.
//
// The provider id is derived from the name on create and frozen afterwards:
// editing preserves the id (the registry's updateProvider(id, patch) signature
// enforces it), so the id that keys the provider's API key in leetlab.apiKeys is
// never silently changed by a rename. Delete confirms inline and the registry's
// deleteProvider clears the stored key — key material is never touched here.
// API keys are not edited on this surface; the generate form owns key entry.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  createProvider,
  deleteProvider,
  listProviders,
  updateProvider,
  type ProviderDefinition,
  type ProviderProtocol,
} from '../infrastructure/providerRegistry'

interface ManageProvidersModalProps {
  open: boolean
  onClose: () => void
  /** Open straight into the create form (used by GenerateModal's empty state). */
  initialMode?: 'list' | 'create'
  /** Called with the new provider's id after a successful create. */
  onCreated?: (id: string) => void
}

type Mode = 'list' | 'create' | 'edit'

interface FormState {
  name: string
  protocol: ProviderProtocol
  baseUrl: string
  modelName: string
}

const EMPTY_FORM: FormState = {
  name: '',
  protocol: 'openai',
  baseUrl: '',
  modelName: '',
}

// Ids are derived from names so the create form stays to the four editable
// fields the roadmap specifies (name, protocol, baseUrl, modelName). Once
// created the id is frozen — renaming a provider must never re-key its API key.
function slugifyProviderId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function describeFormError(error: string): string {
  switch (error) {
    case 'duplicate-id':
      return 'A provider with this name already exists (provider ids come from names). Choose a different name.'
    case 'invalid-base-url':
      return 'Enter a valid origin such as https://api.anthropic.com. Paths like /v1 are rejected — the adapter adds them.'
    case 'not-found':
      return 'This provider no longer exists. It may have been deleted elsewhere.'
    case 'empty-name':
      return 'Enter a provider name.'
    default:
      return 'The provider could not be saved.'
  }
}

export function ManageProvidersModal({
  open,
  onClose,
  initialMode = 'list',
  onCreated,
}: ManageProvidersModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset whenever the modal opens. Done by adjusting state during render
  // (React's documented pattern for "state that resets when a prop changes")
  // so the reset never runs as an effect.
  const [synced, setSynced] = useState({ open })
  if (synced.open !== open) {
    setSynced({ open })
    setMode(initialMode)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setConfirmingId(null)
  }

  // Close on Escape: un-confirm a delete, then cancel the form, then close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (confirmingId) {
        setConfirmingId(null)
      } else if (mode !== 'list') {
        setMode('list')
        setEditingId(null)
        setFormError(null)
        setForm(EMPTY_FORM)
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, confirmingId, mode])

  // Focus the name field when the form opens (create or edit).
  useEffect(() => {
    if (open && mode !== 'list') nameInputRef.current?.focus()
  }, [open, mode])

  if (!open) return null

  // The registry is read lazily per render (like apiKeys), so the list always
  // reflects the latest CRUD.
  const providers = listProviders()

  const startCreate = () => {
    setMode('create')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const startEdit = (provider: ProviderDefinition) => {
    setMode('edit')
    setEditingId(provider.id)
    setForm({
      name: provider.name,
      protocol: provider.protocol,
      baseUrl: provider.baseUrl,
      modelName: provider.modelName,
    })
    setFormError(null)
  }

  const backToList = () => {
    setMode('list')
    setEditingId(null)
    setFormError(null)
  }

  const handleSave = () => {
    const name = form.name.trim()
    if (!name) {
      setFormError('Enter a provider name.')
      return
    }
    if (mode === 'create') {
      const id = slugifyProviderId(name)
      if (!id) {
        setFormError(
          'The name must contain letters or numbers so it can be used as the provider id.'
        )
        return
      }
      const result = createProvider({
        id,
        name,
        protocol: form.protocol,
        baseUrl: form.baseUrl,
        modelName: form.modelName,
      })
      if (!result.ok) {
        setFormError(describeFormError(result.error))
        return
      }
      onCreated?.(result.provider.id)
    } else if (mode === 'edit' && editingId) {
      // updateProvider(id, patch) preserves the id, keeping the API key (keyed
      // by id in leetlab.apiKeys) attached across a rename.
      const result = updateProvider(editingId, {
        name,
        protocol: form.protocol,
        baseUrl: form.baseUrl,
        modelName: form.modelName,
      })
      if (!result.ok) {
        setFormError(describeFormError(result.error))
        return
      }
    }
    backToList()
  }

  const title =
    mode === 'list'
      ? 'Manage providers'
      : mode === 'create'
        ? 'Add a provider'
        : 'Edit provider'

  return createPortal(
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
        aria-labelledby="manage-modal-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="manage-modal-title">{title}</h2>
            <p className="modal-sub">
              Providers are stored in this browser and drive generation. Deleting
              a provider also removes its saved API key.
            </p>
          </div>
          <button
            type="button"
            className="modal-x"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {mode === 'list' ? (
          <>
            {providers.length === 0 ? (
              <div className="gen-empty" role="status">
                No providers yet. Add your first provider to start generating
                problems.
              </div>
            ) : (
              <ul className="providers">
                {providers.map((p) => {
                  const confirming = confirmingId === p.id
                  return (
                    <li key={p.id} className="provider-row">
                      <div className="provider-main">
                        <div className="provider-name">
                          {p.name}
                          <span className={`protocol-pill ${p.protocol}`}>
                            {p.protocol}
                          </span>
                        </div>
                        <div className="provider-detail">
                          <code>{p.baseUrl}</code>
                          {p.modelName ? ` · ${p.modelName}` : ' · no model set'}
                        </div>
                      </div>
                      <div className="provider-actions">
                        <button
                          type="button"
                          className="prow-btn"
                          onClick={() => startEdit(p)}
                          aria-label={`Edit ${p.name}`}
                        >
                          Edit
                        </button>
                        {confirming ? (
                          <>
                            <button
                              type="button"
                              className="prow-btn danger"
                              onClick={() => {
                                deleteProvider(p.id)
                                setConfirmingId(null)
                              }}
                              aria-label={`Confirm delete ${p.name}`}
                            >
                              Delete?
                            </button>
                            <button
                              type="button"
                              className="prow-btn"
                              onClick={() => setConfirmingId(null)}
                            >
                              Keep
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="prow-btn danger"
                            onClick={() => setConfirmingId(p.id)}
                            aria-label={`Delete ${p.name}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-submit"
                onClick={startCreate}
              >
                Add provider
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div className="form-row">
              <label htmlFor="prov-name">Name</label>
              <input
                id="prov-name"
                ref={nameInputRef}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. opencode, minimax"
              />
              <div className="field-hint">
                {mode === 'edit' && editingId
                  ? `Id: ${editingId} — kept on edit so the saved API key stays attached.`
                  : 'The provider id is derived from the name and cannot be changed after saving.'}
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="prov-protocol">Protocol</label>
              <select
                id="prov-protocol"
                value={form.protocol}
                onChange={(e) =>
                  setForm({ ...form, protocol: e.target.value as ProviderProtocol })
                }
              >
                <option value="openai">openai — /v1/chat/completions</option>
                <option value="anthropic">anthropic — /v1/messages</option>
              </select>
              <div className="field-hint">
                Select the wire format the provider speaks; generation dispatches
                on this.
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="prov-baseurl">Base URL</label>
              <input
                id="prov-baseurl"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://api.example.com"
              />
              <div className="field-hint">
                Enter the origin only — the adapter appends /v1/… itself. Endpoint
                paths are rejected.
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="prov-model">Model name</label>
              <input
                id="prov-model"
                value={form.modelName}
                onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                placeholder="e.g. claude-opus-5, deepseek-v3"
              />
              <div className="field-hint">
                The single model used for generation. May be left empty for local
                servers.
              </div>
            </div>

            {formError && (
              <div className="gen-error" role="alert">
                {formError}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={backToList}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {mode === 'edit' ? 'Save changes' : 'Add provider'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
