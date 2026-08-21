# leetlab

**An in-browser judge for LeetCode-style problems. Pick a problem, write JavaScript or TypeScript, and run it against test cases — 100% client-side, no backend, no account.**

leetlab is a coding-practice app that runs entirely in your browser. Code executes in a Web Worker sandbox, progress is saved in localStorage, and even LLM-powered problem generation talks straight to the model provider from your machine.

- **Live app:** [leetlab.surge.sh](https://leetlab.surge.sh)
- **Source:** [github.com/Basiliskin/leetlab](https://github.com/Basiliskin/leetlab)

## Features

### Problem bank
- **110 built-in problems** across 20 categories — Classic, Async, Generators, React, Streaming, Design System, Backpressure, Events, Job Queue, Promises, Advanced Promises/Events/Queues, Infrastructure, Distributed Systems, Observability, API Integration, State Machines, Validation & Transformation, and Cache Storage.
- Each problem ships a title, difficulty (Easy / Medium / Hard), tags, **starter code in both JavaScript and TypeScript**, test cases, hints, and a formatted description.
- Accepted LLM-generated problems live in a separate **Generated** category and are merged into the bank at runtime.
- Filter the list by difficulty, solved status, category, or search.

### The judge
- Solutions run against test cases in a **per-run Web Worker**, each run bounded by a 6-second timeout.
- Supports **function-style** (`fn`) and LeetCode **class-style** (`class`) problems.
- Output is compared with a **NaN-aware, key-order-independent deep-equality** check.
- `console` output from your solution is captured and shown alongside results.
- Verdicts: Accepted, Wrong Answer, Time Limit Exceeded, Compile Error, No Expected Cases.

### Editor
- Built on **CodeMirror 6** with TypeScript autocomplete.
- Toggle between JavaScript and TypeScript per problem.
- **Format** with Prettier on demand.
- TypeScript is compiled in the browser — the runtime is loaded from the jsDelivr CDN, with a regex-based type-stripper fallback if the CDN is unavailable.
- `Ctrl-/` (⌘-/ on macOS) toggles comments.

### Test cases & persistence
- Add, edit, delete, and restore **custom test cases** for any problem.
- Code, custom cases, submission history (last 60), and solved status are **persisted in localStorage** — close the tab and pick up where you left off.
- The top bar shows solved/total progress across the merged bank.

### LLM problem generation
- Generate new problems from a large-language model without leaving the app.
- Providers are **user-managed** — Anthropic and OpenAI-compatible endpoints (including local servers) are pre-seeded, and you can add your own with per-provider API keys stored in your browser.
- Generated output is **strictly validated**, and the model is re-prompted with the collected errors on failure (bounded retries).
- Every generated problem goes through a **review-before-add gate**: accept or discard it, and acceptance dedupes against the existing bank by slug, title, and signature.

### Full-state backup
- Export your entire state to a **versioned JSON file** and import it back later.
- Imports are validated (version, schema, bank rules) before anything changes.
- **API keys are never included** in backups.

### Infrastructure practice
leetlab is built to practice the patterns that live *around* algorithms: it ships **in-browser emulations of five real backend systems** — **Redis, PostgreSQL, RabbitMQ, Kafka, and BullMQ** — exposed to your solution as the global handles `redis`, `pg`, `rabbitmq`, `kafka`, and `queue`. Problems in the Infrastructure, Distributed Systems, Observability, and Job Queue categories expect you to build against them, with editor autocomplete for every exposed method. Worked examples live in `src/services/*/*.example.ts`.

### Mobile
- At phone widths the editor takes the full workspace and the description becomes a tabbed overlay; the sidebar slides in as a drawer.
- The soft keyboard is accounted for so Run/Submit stay visible.

## How it works

Everything happens in the browser:

```
Problem → your JS/TS in CodeMirror
       → (TypeScript) transpiled in-browser
       → Web Worker sandbox with mocked console / module / process
       → per-test-case judge (deep-equal on output)
       → verdict, per-case results, and logs back in the UI
```

There is no leetlab backend. In production builds even LLM calls go directly from your browser to the provider; the dev server adds a same-origin relay only to work around CORS for providers that don't allow browser origins.

## Tech stack

- React 19, TypeScript, Vite
- CodeMirror 6 (editor), Prettier (formatting)
- Zustand (state) with localStorage persistence
- Vitest (unit tests) — 23 test files

## Getting started

```bash
npm install     # install dependencies
npm run dev     # start the Vite dev server (HMR)
npm run build   # typecheck (tsc -b) + production build into dist/
npm run lint    # eslint . (flat config)
npm test        # vitest run
npm run preview # preview the production build
```

## Project structure

```
src/
  domain/           # pure types: Problem, Category, TestCase
  infrastructure/   # the engine: problem bank, store, sandbox worker, TS compiler,
                    #   provider adapters, output validation, import/export
  components/       # UI: CodeEditor, EditorPane, DescPane, Drawer, Sidebar,
                    #   Topbar, StatusBar, and the Generate/Import/Providers modals
  services/         # in-browser backend emulations: Redis, PostgreSQL, RabbitMQ,
                    #   Kafka, BullMQ + sandbox bindings
  hooks/            # useRunCode (worker orchestration)
docs/
  done/             # completed feature roadmaps
  marketing/        # product facts — single source of truth for claims
```

See [AGENTS.md](./AGENTS.md) for the full architecture and data-flow walkthrough.

## Adding a problem

Append an object to a sub-bank in `src/infrastructure/problemBanks/` following the shape in `src/domain/Problem.ts`: unique `slug`, `num`, `title`, `difficulty`, `tags`, `fnName`, `mode` (`fn` | `class`), `starter` (js + ts), `tests`, `hints`, and an HTML `desc`. The category is stamped automatically from the sub-bank. See [AGENTS.md](./AGENTS.md) for details.

## Deploying

Deploy instructions (surge.sh) live in [docs/README.md](./docs/README.md). The live build is served from `leetlab.surge.sh`.

## Honest caveats

- **The sandbox is for ergonomics, not security.** Solutions run through a `new Function` factory inside a Worker — it keeps `require`, `process`, and real I/O away from solution code, but it is not an isolation boundary. Don't run code you don't trust.
- **TypeScript compilation needs a network on first load** unless the CDN fallback takes over. The TS badge in the top bar shows whether the full compiler or the fallback stripper is active.
- **LLM API keys live in your browser's localStorage** — never on a server, never in exports. Treat them as secrets, and clear the key for any provider you stop using.

## License

This repository does not currently declare a license.
