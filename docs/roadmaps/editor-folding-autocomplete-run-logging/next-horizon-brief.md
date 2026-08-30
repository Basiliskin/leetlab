# Next-Horizon Planning Brief — editor-folding-autocomplete-run-logging

Prepared at the end of horizon 1. Describes the *next* unstarted horizon.

## Unknowns
- Whether scopeCompletionSource(globalThis) is in fact the dominant typing-tick cost, or whether measurable lag remains after caching it (no profiling was done).
- Whether Vite's `?worker` bundling produces assets that resolve in the hashed static surge.sh build (only matters if a future horizon adds any worker).
- Which concrete object shape horizon 1 chose for the run-log `result` second argument (LastRun summary vs raw `{results,logs}`).
- Whether foldGutter markers and the `.cm-foldPlaceholder` pill actually read well against the dark editorTheme once rendered.
- Whether folding state being lost on every language switch is acceptable to users in practice.

## Research (do before planning the next horizon)
- Run the app locally after horizon 1 ships and profile typing in a large document (Performance tab) to confirm whether completion cost is actually gone or merely reduced.
- Read `src/components/CodeEditor.tsx` `extensionsFor(lang)` and the `editorTheme` object as they stand post-horizon before layering anything else on the editor.
- Inspect the production surge.sh build output (`dist/`) for how `sandbox.worker.ts` is emitted and referenced, if any worker-based feature is being considered.
- Review `src/infrastructure/editorCompletions.ts` for the final caching/deferral strategy and whether `validFor` stickiness behaves correctly.
- Check the `@codemirror/lint` wiring already present (`linter` + `lintGutter`) to understand what a future "surface diagnostics" feature would build on.

## Decisions the next horizon can't avoid
- Whether to invest in a real autocomplete latency benchmark/profiling harness, or continue accepting manual-only verification.
- Whether the TypeScript LanguageService completion source should move to a Web Worker (deferred this horizon) if TS-mode completion lag is still reported.
- Whether to persist editor state (fold state, language preference, run counter) to localStorage / app store, or keep everything in-memory.
- Whether to introduce a Compartment / pluggable completion-backend abstraction in `CodeEditor.tsx`, or keep the full-reconfigure-per-language approach.
- Whether run diagnostics graduate from `console.log` to a visible in-app run-counter / run-history panel.

## Artifacts to inspect
- `src/components/CodeEditor.tsx` — `extensionsFor(lang)` assembly, `editorTheme` object, reconfigure dispatch (~881 lines, no basicSetup, no Compartment).
- `src/infrastructure/editorCompletions.ts` — three `javascriptLanguage.data.of` autocomplete registrations; scope source is the sync one.
- `src/components/EditorPane.tsx` — `handleRun` branch structure A–G, module-level `runCounter`, `logRun` helper.
- `src/hooks/useRunCode.ts` — `?worker` import pattern, `WorkerMsg` union, 6s guard, `run()` return shape, existing sandbox console forwarding.
- `src/infrastructure/sandbox.worker.ts` — only existing worker; reference pattern for any future worker.
- `src/infrastructure/tsCompiler.ts` and `tsCheck.ts` — load TS from CDN on the main thread.
- `src/styles/globals.css` around line 218 — `.cm-host` chrome.
- `vite.config.ts` — `worker: { format: 'es' }`.

## Recommended next-horizon scope
Horizon 1's three items are small, additive, single-file, and independent, so the next horizon should first verify they actually landed and held up — deploy to surge.sh, manually exercise folding in both modes, profile typing latency, and confirm the run log fires on exactly the intended paths. Beyond verification, the natural next scope is whichever deferred editor concern the user prioritizes: deepening autocomplete performance (measured benchmark, then a TS-completion worker only if TS-mode lag persists), OR surfacing editor diagnostics by wiring the already-installed `@codemirror/lint` into the editor, OR adding lightweight persistence (fold state / language / preferences). Keep it to one theme; they don't share code and bundling them would recreate the oversized-horizon problem this chain avoids.
