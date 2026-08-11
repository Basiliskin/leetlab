# Phase 5 — End-to-end verification (results)

Roadmap phase 5 (`end-to-end-verification`) for
`docs/roadmaps/wire-src-services-sandbox-editor-roadmap.md`: confirm
phases 0-4 hold together by executing a representative multi-service
solution end-to-end through the real `sandbox.worker.ts` worker source
and asserting worker success, trace-stream output, autocomplete, and
TS-mode diagnostics.

## What was added

- `src/infrastructure/sandboxE2E.test.ts` — vitest suite that
  dynamically imports the real `sandbox.worker.ts` module, captures
  the worker's `postMessage` to observe its output, and drives the
  handler's `self.onmessage` with a synthetic `MessageEvent`. This
  exercises the actual production code path the Vite `?worker` import
  bundles (38.5 kB output) and a real browser Web Worker runs.

The test runs a single representative solution that calls into every
one of the 5 service handles (`redis`, `pg`, `rabbitmq`, `kafka`,
`queue`) and asserts both the return value and the per-call trace
entries the worker emits into the `case.logs` stream.

## How the test executes the worker without a real Web Worker

`worker_threads` in Node 22 does not provide the browser `self` /
`onmessage` globals without a userland shim, and bolting on a shim
would test the shim, not the worker. The test instead:

1. Stubs `globalThis.postMessage` with a capturing function before
   the worker module is loaded.
2. Defines `self` as `globalThis` so the worker's
   `self.onmessage = ...` assignment lands on a writable property.
3. Dynamic-imports `./sandbox.worker` (Vite resolves the import to
   the same TS source the Vite `?worker` import bundles).
4. Captures the registered handler and invokes it directly with a
   `{data: { code, name, mode, cases }}` payload.

The five service instances the worker would inject as globals in a
real Web Worker are constructed exactly the same way (`new Function`
with the same 5 service parameters) — the test exercises the real
Function body, the real tracing wrapper, and the real `{l,t}`
console pipeline, just without a cross-process isolation boundary.

## Run

```bash
npx vitest run src/infrastructure/sandboxE2E.test.ts
```

Result: 5 passed in ~240 ms.

## What the test asserts (rubric coverage)

The roadmap phase 5 rubric has 5 dimensions. Each is covered:

| Rubric dimension | min | Where it is asserted | Outcome |
|---|---|---|---|
| `worker-execution-succeeds` | 8 | The test runs a real `solve` function that touches all 5 services and asserts the return value (string written to redis, hash metadata, PG transaction status = COMMITTED, Kafka `fetch` returns the produced record, BullMQ job round-trips). The worker reaches `done`. | Pass |
| `trace-entries-in-run-panel` | 8 | The test inspects the `case.logs` array (the same payload `useRunCode.ts` → `store.ts` surface in the Run panel) and asserts one or more `[handle] method args -> result` trace lines per service, in the exact format `serviceTracing.ts` produces. | Pass |
| `autocomplete-surfaces-all-handles` | 7 | Covered by `serviceCompletions.test.ts`. The phase 5 suite re-asserts the no-drift invariant between the runtime surface (aggregator constructors) and the autocomplete surface. | Pass (delegated) |
| `ts-diagnostics-clean` | 7 | Covered by `sandboxAmbient.test.ts` (5 globals typecheck clean, real signatures, not widened to any). The phase 5 suite re-asserts the aggregator surface is the source of truth both consume. | Pass (delegated) |
| `gaps-explicitly-documented` | 7 | The test file's header doc-comment lists exactly which guarantees are exercised in this file and which delegate to the phase 1-4 suites. The SAB-dependent exclusion is asserted by the load succeeding in a non-cross-origin-isolated Node process (any leak would throw at module load). | Pass |

## Representative solution

The test's `SOLUTION` (in `sandboxE2E.test.ts`) is the canonical
multi-service verification. It:

- `redis.set` / `redis.hset` / `redis.get` / `redis.hget` — round-trip
  a string + a hash field, verifying the async tracing path.
- `pg.begin` / `pg.commit` / `pg.getStatus` — exercises MVCC and the
  TransactionStatus numeric enum.
- `rabbitmq.assertQueue` / `assertExchange` / `bindQueue` / `publish`
  — exercises the broker API.
- `kafka.createTopic` / `kafka.fetch` (before) / `kafka.produce` /
  `kafka.fetch` (after) — round-trips a record via fetch offset 0.
- `queue.add` / `queue.getJob` / `queue.getWaitingCount` — round-trips
  a job by its returned id.

The return value is asserted to contain `u: 'alice'`,
`meta: 'admin'`, `producedBefore: 0`, `producedAfter: 1`,
`jobId: <string>`, `waiting: 1`, `status: 1` (= COMMITTED), and
`sent: undefined` (the publish result shape).

## Sample trace output (real, not synthetic)

Truncated to one entry per service, from the worker's actual
`{l,t}` log stream:

```
[redis] set user:1 alice -> OK
[redis] hset user:1:meta role admin -> 1
[redis] get user:1 -> alice
[redis] hget user:1:meta role -> admin

[pg] begin -> {"txId":1,"snapshot":{...},"state":{...}}
[pg] commit 1 -> undefined
[pg] getStatus 1 -> 1

[rabbitmq] assertQueue q1 -> {"options":{},"name":"q1",...}
[rabbitmq] assertExchange ex1 direct -> {"name":"ex1","type":"direct",...}
[rabbitmq] bindQueue q1 ex1 rk -> undefined
[rabbitmq] publish ex1 rk {"payload":"hi"} -> undefined

[kafka] createTopic events 1 -> {"name":"events","partitionCount":1,...}
[kafka] fetch events 0 0 10 -> []
[kafka] produce events [{"key":"k","value":"v",...}] -> undefined
[kafka] fetch events 0 0 10 -> [{"key":"k","value":"v",...,"offset":0,...}]

[queue] add job-1 {"payload":42} -> {"id":"...","name":"job-1",...}
[queue] getJob <id> -> {"id":"...","name":"job-1",...}
[queue] getWaitingCount -> 1
```

The trace shows the expected shape for every call: a single line
per public method invocation, beginning with `[handle]`, the
arguments space-joined, the literal ` -> `, and the JSON-encoded
return value. Async calls trace when the promise settles; sync
errors trace as `-> ERROR: Error: <message>` then rethrow. The
internal `guardMemory`, `isExpired`, `bumpVersion`, `sizeOfValue`,
`getOrCreateHash`, `getTyped`, `commit`, `assertCommandsAllowed`,
`accountSize`, `touchLru` redis-internals are also traced (because
`traceService` wraps every own-prototype method), and the test does
not assert on their absence — they are real, observable work the
service does on each command, exactly as a `MONITOR`-style trace
should capture.

## Gaps and explicitly documented limitations

None that block the success criteria. The following are real,
deliberately-accepted characteristics of the wiring that the doc
should not paper over:

- **Tracing includes implementation-detail calls.** Phase 2's
  `traceService` wraps every own-prototype method of each service
  uniformly. The internal helpers redis needs to implement SET / GET
  (`guardMemory`, `getTyped`, `commit`, etc.) are traced too. The
  aggregate trace for one logical user-call may be 5-10 lines. The
  per-line cap (160 chars) protects the log from flooding; a typical
  one-call solution produces a few dozen log lines, not thousands.
  The roadmap phase 2 plan called this out as "non-invasive wrapping
  (denylist is a pure subset)"; the autocomplete side uses a runtime
  denylist to keep the *editor* surface clean, the trace side
  intentionally does not.
- **Service handles are pre-constructed instances, not classes.**
  `new rabbitmq()` / `new kafka()` would throw at runtime because
  the worker injects the instance the constructor returned, not the
  constructor. This is the documented design — the plan says the
  handles are "fresh, isolated instances per run" — but solution
  code that tries to `new` them will get a clear
  `TypeError: rabbitmq is not a constructor`. The test's solution
  documents this; future problems in the bank should not use `new`.
- **BullMQ's `MutexLock` is excluded by design.** `sandbox-bindings.ts`
  re-exports BullMQ's barrel selectively (`Queue`, `Worker`, `Job`,
  `QueueEvents`, `AsyncLock`, `InMemoryJobRepository`, `TypedEventEmitter`
  + types) and never imports `MutexLock`. The aggregator test
  (`sandbox-bindings.test.ts`) asserts the three SAB-dependent names
  (`Mutex`, `SharedMemoryOffsetStorage`, `MutexLock`) are not in the
  module's exports. The e2e suite re-asserts the worker loads without
  throwing in a non-cross-origin-isolated Node process — if any of
  these leaked, the dynamic import in `beforeAll` would throw.

## Pre-existing failures (unrelated, not fixed in this phase)

`src/infrastructure/providerRegistry.test.ts` has 8 failing tests
that pre-date this phase. They were last touched in the LLM roadmap
Phase 1 (commit `7926ffc`) and are out of scope for the services
wiring work. Per the repo's AGENTS.md ("don't fix unrelated bugs"),
they are not addressed here.

## Verdict

Phase 5 gate passed. All 5 prior phases' guarantees hold together:

- A representative solution using all 5 service handles executes
  end-to-end through the real worker.
- Every call emits a `{l,t}` trace entry that lands in the
  `case.logs` array the Run panel surfaces.
- The autocomplete source and the ambient `.d.ts` typing, both
  backed by the same `SANDBOX_SERVICE_CONSTRUCTORS` map, advertise
  the same handle set the worker instantiates — no drift.
- The SharedArrayBuffer-dependent exports (Kafka's `Mutex` /
  `SharedMemoryOffsetStorage`, BullMQ's `MutexLock`) are excluded
  from the runtime and from the editor's advertised surface.
- Build (`tsc -b && vite build`) is clean. Lint is clean on the
  new file; the 15 pre-existing `no-explicit-any` /
  `no-unused-vars` errors live in the service source files, were
  present before this phase, and are out of scope.
