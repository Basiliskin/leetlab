# Blockers — editor-folding-autocomplete-run-logging

Open questions (newest last; resolved entries stay, marked in place).

- 2026-08-30 | horizon 1 | Is scopeCompletionSource(globalThis) in fact the dominant typing-tick cost, or does measurable lag remain after caching it? (no profiling done — prototype bar accepted this untested)
- 2026-08-30 | horizon 1 | Does Vite's ?worker bundling produce assets that resolve in the hashed static surge.sh build? (only matters if a future horizon adds a worker)
- 2026-08-30 | horizon 1 | Which concrete object shape did the implementer use for the run-log `result` second argument (LastRun summary vs raw {results,logs})?
- 2026-08-30 | horizon 1 | Do foldGutter markers and the .cm-foldPlaceholder pill actually read well against the dark editorTheme once rendered, or do they need further CSS iteration?
- 2026-08-30 | horizon 1 | Is folding state being lost on every language switch acceptable to users in practice?
