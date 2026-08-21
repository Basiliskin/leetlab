# Product Facts

> Single source of truth for all downstream marketing skills. No promotional material may claim more
> than this document supports.

## Verified facts

Every fact traced to a repository file, the README, or the user. The `source:` field is restricted to
`<repo-relative path>` | `README` | `user`.

- leetlab is a LeetCode-style coding practice app: pick a problem, write JavaScript or TypeScript in an in-browser editor, and run it against test cases — source: `AGENTS.md`
- All code execution is 100% client-side, in a Web Worker sandbox; the app has no backend, no server, and no API of its own — source: `AGENTS.md`, `src/infrastructure/sandbox.worker.ts`, `src/hooks/useRunCode.ts`
- Built with React 19 and TypeScript, bundled with Vite — source: `package.json`
- Ships a built-in problem bank of 110 problems across 20 authored categories (Classic, Async, Generators, React, Streaming, Design System, Backpressure, Events, Job Queue, Promises, Advanced Promises, Advanced Events, Advanced Queues, Infrastructure, Distributed Systems, Observability, API Integration, State Machines, Validation & Transformation, Cache Storage), plus a separate "Generated" category for accepted LLM problems — source: `src/infrastructure/problemBanks/`, `src/domain/Category.ts`
- Every problem carries a title, difficulty (Easy / Medium / Hard), tags, starter code in both JS and TS, test cases, hints, and an HTML description — source: `src/domain/Problem.ts`, `src/infrastructure/problemBanks/`
- The editor is built on CodeMirror 6 and provides TypeScript autocomplete and code formatting — source: `src/components/CodeEditor.tsx`, `package.json` (`@codemirror/*`)
- TypeScript solutions are compiled in the browser (the TypeScript runtime is loaded from the jsDelivr CDN; a regex-based type stripper is the fallback if the CDN is unavailable) — source: `src/infrastructure/tsCompiler.ts`
- Solutions run against test cases in a per-run Web Worker, each run bounded by a 6-second timeout, with results judged by a NaN-aware deep-equality comparison — source: `src/infrastructure/sandbox.worker.ts`, `src/hooks/useRunCode.ts`
- Supports both function-style (`fn`) and LeetCode class-style (`class`) problems — source: `src/domain/Problem.ts`, `src/infrastructure/sandbox.worker.ts`
- Per-problem state — saved code, custom test cases, submission history (last 60), and solved status — is persisted in the browser's localStorage via zustand — source: `src/infrastructure/store.ts`
- Users can add, edit, delete, and restore custom test cases for any problem — source: `src/infrastructure/store.ts`
- The problem list supports filtering by difficulty, solved status, category, and search — source: `src/infrastructure/store.ts`, `src/components/Sidebar.tsx`, `src/components/Topbar.tsx`
- Users can generate new problems with an LLM: providers are user-managed (Anthropic and OpenAI-compatible wire protocols), API keys are stored per provider, and generation runs directly from the browser — source: `src/infrastructure/providerRegistry.ts`, `src/infrastructure/providerAdapters.ts`, `src/infrastructure/apiKeys.ts`, `src/components/GenerateModal.tsx`
- Generated problems are strictly validated and the model is re-prompted with the collected errors on failure (bounded retries); acceptance is a separate review step that dedupes against the existing bank by slug, title, and signature — source: `src/infrastructure/outputValidation.ts`, `src/infrastructure/reviewGate.ts`, `src/infrastructure/store.ts`
- Accepted generated problems are merged into the runtime problem bank under the "Generated" category — source: `src/domain/Category.ts`, `src/infrastructure/store.ts`
- Full state can be exported to and imported from a versioned JSON document; imports are validated before any change, and API keys are never part of the export — source: `src/infrastructure/fullStateExport.ts`, `src/infrastructure/fullStateImport.ts`, `src/components/ImportModal.tsx`
- Five in-browser backend-emulation services — Redis, PostgreSQL, RabbitMQ, Kafka, and BullMQ — are exposed to solution code as global handles (`redis`, `pg`, `rabbitmq`, `kafka`, `queue`), enabling practice of real-world infrastructure patterns without a real backend — source: `src/services/sandbox-bindings.ts`, `src/services/`
- The UI is responsive to phone widths, with Editor/Description tabs and soft-keyboard handling — source: `src/App.tsx`, `src/infrastructure/visualViewport.ts`
- 23 test files under Vitest cover the infrastructure and services — source: `src/**/*.test.ts`

## Repository evidence

Concrete file paths in this repository that back the Verified facts.

- `AGENTS.md` — authoritative project description (what it is, architecture, data flow)
- `package.json` — stack, scripts, dependency list
- `index.html`, `src/main.tsx`, `src/App.tsx` — entry points and app shell
- `src/domain/` — pure domain types (`Problem.ts`, `Category.ts`, `TestCase.ts`)
- `src/infrastructure/problemBanks/` — the 110 built-in problems across 20 sub-banks
- `src/infrastructure/sandbox.worker.ts`, `src/hooks/useRunCode.ts` — the in-browser judge
- `src/infrastructure/tsCompiler.ts` — in-browser TypeScript compilation
- `src/infrastructure/store.ts` — zustand store, localStorage persistence (`leetlab.v2`)
- `src/infrastructure/providerRegistry.ts`, `providerAdapters.ts`, `apiKeys.ts`, `outputValidation.ts`, `reviewGate.ts`, `generationPrompt.ts` — LLM generation pipeline
- `src/infrastructure/fullStateExport.ts`, `fullStateImport.ts` — versioned backup/restore
- `src/services/` — backend-emulation services (redis, postgresql, rabbit-mq, kafka, BullMQ) plus `sandbox-bindings.ts`
- `src/components/` — UI (CodeEditor, EditorPane, DescPane, Drawer, Sidebar, Topbar, StatusBar, GenerateModal, ImportModal, ManageProvidersModal, UsageTemplatePopover)
- `docs/README.md` — deploy instructions and production URL (leetlab.surge.sh)
- `docs/done/` — completed roadmap docs for the major feature work

Note: the top-level `README.md` is the untouched Vite starter template and describes none of leetlab's
actual product. No claim in this document is sourced to it.

## User-provided facts

Only the four non-derivable categories: production URL, primary goal, open-source status, features
not visible in the repository.

- Production URL: `leetlab.surge.sh` (confirmed by the user; also recorded in `docs/README.md`)
- Primary goal: serves both as a personal practice tool and as a portfolio/showcase piece
- Open-source status: public on GitHub at `github.com/Basiliskin/leetlab`
- Features not visible in the repository: none — the repository shows the full feature set

## Unknown

Gaps recorded as open. Never invent an answer here.

- Number of active users (no analytics or user-tracking exists in the repo)
- Performance benchmarks for the judge (the sandbox reports per-case `ms`, but no aggregate benchmarks are published)
- Supported-browser matrix (not documented in the repo)
- Long-term roadmap beyond the completed `docs/done/` work
- Version history / release notes (the package version is `0.0.0` — pre-release)

## Forbidden assumptions

Never claim the following without explicit evidence. Un-evidenced occurrences are parked here, not in
Verified facts.

- fastest
- most secure
- better than competitors
- privacy-preserving
