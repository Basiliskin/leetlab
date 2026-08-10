# AGENTS.md

leetlab is a LeetCode-style practice app: pick a problem, write JS/TS in an in-browser editor, and run it against test cases. All code execution happens **100% client-side** (a Web Worker sandbox). There is no backend, no server, and no API.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # tsc -b && vite build (typecheck happens here)
npm run lint     # eslint . (flat config)
npm test         # vitest run (unit tests live next to sources as *.test.ts)
npm run preview  # preview the built app
```

- Unit tests run under **vitest** (added for the LLM-generation roadmap, Phase 3). Currently `src/infrastructure/outputValidation.test.ts` and `src/infrastructure/mergedBank.test.ts` (Phase 4) exist; tests live next to their source. `npm test` is `vitest run`. The merged-bank test file defines a `window`/`localStorage` shim before dynamically importing the store — zustand persist reads `window.localStorage` at module evaluation, which does not exist in the node test env.
- There is no CI config in the repo.
- `npm run build` is the de-facto typecheck gate (`tsc -b` with `strict: true`, `noUnusedLocals`, `noUnusedParameters`). Run it before considering changes done.

## Architecture

Clean-ish three-layer split inside `src/` (no `domain` layer logic beyond types):

- `src/domain/` — pure types only: `Problem.ts` (problem shape, `mode: 'fn' | 'class'`), `TestCase.ts` (case + parse-result shapes). No behavior.
- `src/infrastructure/` — the "engine":
  - `problemBank.ts` — static `PROBLEM_BANK` array, the single source of truth for all problems (slug, difficulty, starter code, tests, hints, HTML `desc`).
  - `store.ts` — zustand store `useAppStore`, persisted to `localStorage` under key `leetlab.v2` (`lang`, `split`, `lastSlug`, `problems`, `generatedProblems` are persisted via `partialize`). Per-problem state: `subs` (submission history, capped at last 60), `cases` (custom test cases; `null` = fall back to builtins), `js`/`ts` code, `solvedAt`. The generated-problem slice (`generatedProblems: Problem[]`, `acceptGeneratedProblem`, `discardGeneratedProblem`) holds LLM-generated problems accepted via the review gate; exported pure helpers `findGeneratedCollision` (slug > title > signature dedupe against `PROBLEM_BANK` + accepted) and `nextGeneratedNum` (smallest free 9000-series num) back it. **Runtime-merged read path (Phase 4):** `getProblem` resolves from the merged bank via `getMergedBank(PROBLEM_BANK, generatedProblems)` (built-ins win on slug collisions), and the `useMergedBank()` hook is the single UI source for the merged list — Sidebar and Topbar import it and never touch `PROBLEM_BANK` directly.
  - `sandbox.worker.ts` — the judge. Receives `{code, name, mode, cases}`, builds a `new Function` factory with mocked `console`/`module`/`exports`/`require`(throws)/`process`, and posts back messages.
  - `tsCompiler.ts` — loads TypeScript from the jsDelivr CDN at runtime; falls back to a regex-based type stripper if the CDN fails.
- `src/hooks/useRunCode.ts` — spawns the worker per run, 6s timeout, aggregates results; also exports `parseCases` (JSON-string text → parsed cases with `parseError`).
- `src/components/` — Topbar, Sidebar, EditorPane, CodeEditor, DescPane, Drawer, StatusBar.
- `src/styles/globals.css` — **all** styling. `src/App.css` is an unused Vite template leftover; `src/index.css` is only imported by `main.tsx`. `components/` import styles via `src/App.tsx` → `./styles/globals.css`.

### Control / data flow for a run

1. `EditorPane.handleRun()` (src/components/EditorPane.tsx) reads code from the store (or starter).
2. If `lang === 'ts'`, code is transpiled in-browser via `tsCompiler.compile()`; a compile error aborts with a `Compile Error` `lastRun` payload.
3. `parseCases` converts each case's JSON text into `{input | calls, expected}`.
4. Code + cases are posted to a fresh `SandboxWorker`. Protocol: `compile` (compile error), `case` (per-case `{i, ms, ok, hasExp, pass, output, error, logs}`), `done`.
5. Results drive `caseMarks` (`pass`/`fail`/`err`/`tle`), `addSubmission`, `setLastRun`, and `markSolved` on Accepted.

### Test-case semantics

- `mode: 'fn'` — cases are `{in: [...args], out}`; the sandbox calls the function with `in` spread as arguments.
- `mode: 'class'` — cases are `{calls: [["Ctor",[]],["method",[args]],...], out}`; the first call constructs the class, subsequent calls invoke methods. `undefined` returns are normalized to `null` before comparison.
- Comparison uses a custom `deepEq` (NaN-aware, key-count/order-independent). Expected output is compared structurally, not by identity.

## Path aliases

Vite (`vite.config.ts`) and tsconfig both define: `@` → `src`, `@domain` → `src/domain`, `@infra` → `src/infrastructure`, `@components` → `src/components`. **Convention is currently mixed**: `App.tsx`, `hooks/`, and `infrastructure/` use the `@`-aliases; the components themselves use relative imports (`../infrastructure/store`). Follow whichever style the file you're editing already uses.

## Known gotchas and non-obvious behavior

- **CodeMirror 6 powers the editor.** `CodeEditor.tsx` mounts a single `EditorView` (from `@codemirror/view`) into a `.cm-host` container, composed from `@codemirror/state`, `@codemirror/lang-javascript` (`javascript({typescript: true})` for TS mode), `@codemirror/autocomplete` (`autocompletion()`, `closeBrackets()` + `closeBracketsKeymap`), and `@codemirror/commands` (`defaultKeymap`, `history`, `indentWithTab`, `toggleComment` bound to both `Mod-/` and `Ctrl-/`). Layout lives partly in `globals.css` (`.cm-host`) and partly in an `EditorView.theme` inside CodeEditor.tsx (font metrics, gutter, caret, selection colors). `@monaco-editor/react` remains in package.json but is unused; `clsx` and `lucide-react` are also installed but unused. Don't assume these deps are wired up.
- **Editor store bridge**: the editor is a zero-prop component. `EditorView.updateListener` calls `saveCode(doc)` on user transactions and `setCursorPos(line, col+1)` on selection changes (CodeMirror's column is 0-based, the store is 1-based). Programmatic transactions (doc replace on lang/problem switch, language reconfigure) are tagged with an `external` annotation and skipped, which prevents a saveCode/store render ping-pong. Doc semantics: `state[lang] ?? starter[lang] ?? ""` — a saved empty string stays empty, only `null` falls back to the starter (the old `||` made clearing the editor resurrect the starter).
- **`prototype/local-leetcode.html` is the behavioral reference.** It's the original single-file implementation (~1600 lines). The React port (`src/`) has known regressions vs. it, tracked in `docs/done/src-vs-prototype-refactor-roadmap.md` — read that file before touching run/submit or the submissions UI. Notable open findings: Run and Submit share one handler (submissions recorded on every Run), submissions/hints/ACCEPTED badge not rendered in DescPane. (Editor keyboard handling, line numbers, and caret status are now provided by CodeMirror 6, not the hand-rolled overlay; Topbar/Sidebar read the store reactively via hooks.)
- **TS badge state**: `tsStatus` in the store is `'loading' | 'ready' | 'fallback'`. `fallback` means the CDN TypeScript failed to load and a lossy regex stripper is used — TS code can then mis-behave. Requires network on first load.
- **`getProblemState` lazily writes to the store** (`set` on first access) — it's safe to call from render bodies, but be aware it mutates state during render.
- `getCases` returns a fresh array each call; `Drawer` selects it via `useAppStore((s) => s.getCases())`, which re-renders on any store change. Don't "fix" this casually without checking the roadmap's stance.
- Builtin cases have `id: 'builtin-${i}'` and `deleteCase` silently no-ops on them; `restoreCases` sets `cases: null`.
- Timeout (6s) in `useRunCode` rejects with `{type: 'timeout'}` — currently surfaced as a generic alert and **drops all per-case results** (known finding, `tle-drops-run-results`).
- Problem descriptions in `problemBank.ts` are raw HTML strings rendered with `dangerouslySetInnerHTML` in DescPane; new problems must follow the same HTML shape (`<div class="ex">`, `<code>`, `<p class="note">`).
- Problem numbers in the bank are sparse (1, 3, 20, 42, 56, 155…) plus the 8000-series custom range (8001–8012); generated problems get 9000-series nums. `Topbar` derives its progress segments and denominator from the **merged** bank (`useMergedBank().length` = built-ins + accepted generated), not a hardcoded count.
- Store file has inconsistent indentation around the `lastRuns`/`tsStatus` block (extra indent) — match surrounding style when editing there, or normalize carefully.
- Persisted shape lives under a versioned key (`leetlab.v2`). Adding a persisted field is decided per-field: additive fields with a safe default (e.g. `generatedProblems: []`) stay on `leetlab.v2` — zustand's shallow merge keeps the default for existing users — while fields needing prior-data transformation require a `leetlab.v3` bump with a `migrate`.
- The sandbox `new Function` factory re-declares `console`, `module`, `exports`, `require`, `process` as locals, so user code that references e.g. `window`/`fetch` will run (it's a real window scope) — don't rely on the sandbox for security/isolation; it's purely for ergonomics.

## Adding a new problem

Append an object to `PROBLEM_BANK` in `src/infrastructure/problemBank.ts` following the existing shape: unique `slug`, `num`, `title`, `difficulty` (`Easy|Medium|Hard`), `tags`, `fnName`, `mode` (`'fn'` for function-style, `'class'` for LeetCode class-style), `starter` (both `js` and `ts`), `tests`, `hints`, and `desc` (HTML string). Keep `tests` representative (include edge cases); for `class` mode the first `calls` entry must be the constructor.
