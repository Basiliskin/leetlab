# Decisions — editor-folding-autocomplete-run-logging

- 2026-08-30 | horizon 1 | Autocomplete lag is fixed by memoizing/deferring scopeCompletionSource(globalThis) only, not by a Web Worker — because discovery showed the TS completion source is already async and the global-scope walk is the sole synchronous per-keystroke cost.
- 2026-08-30 | horizon 1 | The run counter is a module-level in-memory integer (resets on page reload), not persisted to the store — because item 3 is a prototype console diagnostic and a module-level counter avoids React StrictMode double-fire.
- 2026-08-30 | horizon 1 | "TS/linter not working when deployed" is confirmed a false alarm and permanently out of scope — user investigated it directly.
