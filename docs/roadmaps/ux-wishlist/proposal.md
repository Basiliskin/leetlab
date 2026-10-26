# UX wishlist — status and proposal

Source request (2026-10-26): "collapsible, debugging maybe, other languages,
more autocomplete options, support for redis/mongo/postgresql problems — from
different levels".

## Shipped in this change

| Item | What landed |
|---|---|
| Collapsible | The problem list and problem pane each have a hide button (`«`). Hidden panels shrink to a slim rail you click to reopen (a horizontal bar on tablet widths). The state is saved under `collapsed` on `leetlab.v2`. The editor grows into the freed space. Code folding already existed (fold gutter). |
| Tests beside the description | Testcases / Result / Console moved out of the under-editor drawer into the problem pane, as tabs next to Description / Submissions. The editor now takes the full right column. A run jumps to Result and reveals the pane: it un-collapses it on desktop and opens the overlay on phones. |
| Help dialog | `? Help` in the top bar, or F1, opens a guide covering layout, run & test, shortcuts, autocomplete, the searchable snippet reference with previews, sandbox services, and data. |
| Shortcuts | The advertised Ctrl/⌘+Enter (run) and Ctrl/⌘+Shift+Enter (submit) were never bound. They work now. |
| More autocomplete | 28 algorithm snippets in `src/infrastructure/algoSnippets.ts`: loops (`fori`, `forr`, `forij`, `forgrid`), array idioms (`sortnum`, `arr2d`, `prefix`, `freq`, `dirs4`, `adj`), patterns (`twoptr`, `window`, `bsearch`, `bfs`, `dfs`, `memo`, `backtrack`, `stackmono`), data structures (`uf`, `heap`, `listnode`, `treenode`), and debug helpers (`clg`, `clv`, `cltable`). They work in JS and TS, use tab-stop fields, and are suppressed in strings, comments, and after `.`. |
| Bonus fix | The description pane's **Submissions** tab was never wired up and couldn't be clicked. It now switches views. |

## Not yet built: recommendations

Each of the items below is a separate horizon. They share no code.

### 1. Debugging: record-and-replay tracer (recommended), not a live stepper

A true pause-and-step debugger in the worker needs either
`SharedArrayBuffer` + `Atomics.wait` or an interpreter. The first needs
COOP/COEP headers, which the app does not set (see `sandbox-bindings.ts`).
The second makes every run 50–100× slower.

**Proposal:** add a "Debug" button that runs one case with instrumented code.
A small AST pass (the TS compiler is already loaded) inserts
`__trace(line, {locals})` before each statement. The run records a capped
snapshot timeline (for example 5,000 steps), then the UI replays it with a
step/scrub slider. The current line is highlighted in CodeMirror and a
variables panel sits in the problem pane. No pausing and no new headers are needed,
and it works with the existing 6s timeout.

A cheaper first step is to show `console.log` values inline at the line that
logged them (capture the line from `new Error().stack` in the worker).

### 2. Other languages: Python first, via Pyodide

Pyodide (CPython compiled to WASM) loads lazily from the jsDelivr CDN (about
10 MB, cached after the first load) inside the existing worker pattern. JSON
test cases already fit, since `in` arrays map to Python args. The per-problem
work is a `starter.py` and a `snake_case` function name. Class mode maps
directly. Java, Go, and C++ have no practical in-browser runtime of a
reasonable size, so they are out of scope.

### 3. Database problems by level

| DB | Engine | Example ladder |
|---|---|---|
| PostgreSQL | **PGlite** (real Postgres compiled to WASM, about 3 MB) replaces the current MVCC toy for SQL problems. Each problem seeds a schema and rows, and the judge compares the result rows. | Easy: SELECT/WHERE/ORDER. Medium: JOIN, GROUP BY/HAVING. Hard: window functions, recursive CTEs, upserts. |
| Redis | The existing `RedisEmulation` (strings, lists, hashes, sets, sorted sets, TTL, pub/sub) is already injected as the `redis` global. No problem uses it yet. | Easy: cache-aside with TTL. Medium: sliding-window rate limiter, ZSET leaderboard. Hard: distributed lock with expiry, stream consumer. |
| MongoDB | No WASM server exists. Wrap **mingo** (MongoDB query + aggregation in JS) as a `db.collection(name)` handle with seeded documents. | Easy: `find` with `$gt`/`$in`. Medium: `$group`/`$sort` pipelines. Hard: `$lookup`/`$unwind`, `$facet`. |

Redis is the cheapest: its engine already exists, so it only needs a new
category and about 9 problems. Postgres via PGlite is the most valuable,
because it gives real SQL. Mongo needs a new dependency and a new judge mode
(result documents).

## Suggested order

1. Redis problem track (problems only, no engine work)
2. SQL track on PGlite (new judge mode: `mode: 'sql'`, which compares rows)
3. Inline console values, then the record-and-replay debugger
4. MongoDB track on mingo
5. Python via Pyodide
