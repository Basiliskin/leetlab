// Full-state import modal (Phase 8 of
// docs/roadmaps/llm-generated-problems-import-export-roadmap.md).
//
// Topbar 'Import' entry: a file picker feeding the file text to
// `importFullState`. The import validates version + schema and the merged-bank
// rules before touching anything; malformed or wrong-version files surface a
// visible, field-naming error list and leave the live store untouched. A
// successful import replaces the persisted slice + generated bank atomically
// and shows a confirmation. API keys are never part of a backup file, so this
// modal neither reads nor writes the apiKeys module.

import { useEffect, useRef, useState } from 'react'
import { importFullState } from '../infrastructure/fullStateImport'

interface ImportModalProps {
  open: boolean
  onClose: () => void
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [inFlight, setInFlight] = useState(false)
  const [errors, setErrors] = useState<string[] | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset the form whenever the modal opens. Done by adjusting state during
  // render (React's documented pattern for "state that resets when a prop
  // changes") so the reset never runs as an effect.
  const [synced, setSynced] = useState({ open })
  if (synced.open !== open) {
    setSynced({ open })
    setFileName(null)
    setErrors(null)
    setSuccess(false)
    setInFlight(false)
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

  const handleImport = async () => {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setErrors(['Choose a backup file (.json) first.'])
      return
    }
    setInFlight(true)
    setErrors(null)
    try {
      const text = await file.text()
      const result = importFullState(text)
      if (result.ok) {
        setSuccess(true)
      } else {
        setErrors(result.errors)
      }
    } catch {
      setErrors(['The file could not be read.'])
    } finally {
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
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="import-modal-title">
              {success ? 'State restored' : 'Import a backup'}
            </h2>
            <p className="modal-sub">
              Restores progress, saved code, custom test cases, submissions,
              and generated problems from a leetlab backup file. API keys are
              never part of a backup.
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

        {success ? (
          <div className="gen-confirm" role="status">
            <div className="gen-success-head">
              <h3 className="gen-success-title">Imported</h3>
            </div>
            <p>
              The backup&apos;s state is now live and persisted. It replaces
              the previous state, including any generated problems.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-submit"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleImport()
            }}
          >
            <div className="form-row">
              <label htmlFor="import-file">Backup file</label>
              <input
                id="import-file"
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) =>
                  setFileName(e.target.files?.[0]?.name ?? null)
                }
                disabled={inFlight}
              />
              <div className="field-hint">
                {fileName
                  ? `Selected: ${fileName}`
                  : 'Pick the .json file exported with “Export” in the top bar.'}
              </div>
            </div>

            {errors && (
              <div className="gen-error" role="alert">
                <b>Import failed — your current state is untouched.</b>
                <ul className="import-errors">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="gen-note">
              Importing replaces the current state with the file&apos;s state.
              The file is fully validated first; nothing changes if it is
              malformed, a wrong version, or collides with the built-in
              problem bank.
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                disabled={inFlight}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-submit"
                disabled={inFlight}
              >
                {inFlight ? 'Importing…' : 'Import & restore'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
