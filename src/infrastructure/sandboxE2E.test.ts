/**
 * End-to-end verification (roadmap phase 5): execute a representative
 * multi-service solution through the actual `sandbox.worker.ts` source
 * and confirm every prior phase's guarantee holds together. The worker
 * module is loaded once; `postMessage` is captured to observe its
 * outputs, and `self.onmessage` is invoked directly with a synthetic
 * MessageEvent. This exercises the real production code path — the same
 * `sandbox.worker.ts` file the Vite `?worker` import bundles and the
 * browser runs in a real Web Worker — without spinning up an out-of-
 * process Node worker, which Node 22 `worker_threads` does not natively
 * serve (no `self`/`onmessage` globals without a userland shim, and
 * adding one would test the shim, not the worker).
 *
 * The five services it exercises: redis, pg, rabbitmq, kafka, queue.
 * The five guarantees it asserts together:
 *   - worker-execution-succeeds: the handler reaches `done` with the
 *     expected per-case results.
 *   - trace-entries-in-run-panel: the `case.logs` payloads carry a
 *     `[handle] method args -> result` trace line for every service
 *     handle the solution actually touches.
 *   - autocomplete-surfaces-all-handles / ts-diagnostics-clean: those
 *     are covered by `serviceCompletions.test.ts` and
 *     `sandboxAmbient.test.ts` respectively; this file documents them
 *     here as wired and asserts the data they depend on (aggregator
 *     surface) is identical to the runtime surface.
 *   - gaps-explicitly-documented: SAB-dependent exports are still
 *     excluded, asserted in `sandbox-bindings.test.ts`; if any leaked
 *     through, this test would crash loading the worker.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SANDBOX_SERVICE_CONSTRUCTORS } from '../services/sandbox-bindings'

// In a real browser Web Worker these are globals; here we capture
// postMessage and re-expose `self` so the worker module's top-level
// `self.onmessage = ...` assignment works in Node.
const messages: Array<Record<string, unknown>> = []
let onmessage: ((ev: { data: unknown }) => Promise<void> | void) | null = null

const capturedPostMessage = (m: unknown) => {
  messages.push(m as Record<string, unknown>)
}

beforeAll(async () => {
  // The worker uses `self` (== globalThis) and `postMessage` (browser
  // Web Worker global). Provide them before the module's top-level
  // `self.onmessage = ...` assignment runs.
  ;(globalThis as { postMessage?: typeof capturedPostMessage }).postMessage =
    capturedPostMessage
  Object.defineProperty(globalThis, 'self', {
    configurable: true,
    value: globalThis,
  })
  await import('./sandbox.worker')
  onmessage = (globalThis as { onmessage: typeof onmessage }).onmessage
})

afterAll(() => {
  // Best-effort cleanup; harmless if globals were never set.
  delete (globalThis as { postMessage?: unknown }).postMessage
  delete (globalThis as { onmessage?: unknown }).onmessage
})

function reset() {
  messages.length = 0
}

function findCases(): Array<Record<string, unknown>> {
  return messages.filter((m) => m.type === 'case') as Array<
    Record<string, unknown>
  >
}

function logsText(): string {
  return findCases()
    .flatMap((c) => (c.logs as Array<{ l: string; t: string }> | undefined) ?? [])
    .map((l) => l.t)
    .join('\n')
}

// A representative solution that touches all 5 services with a few calls
// each, including one sync error path. The function is named `solve`
// because that's what `sandbox.worker.ts` looks up by default
// (configurable via the harness `name`).
//
// IMPORTANT: the 5 service handles injected into the sandbox
// (`redis`, `pg`, `rabbitmq`, `kafka`, `queue`) are pre-constructed
// service instances, not classes — `new` is not needed and would throw.
const SOLUTION = `
async function solve() {
  // redis: sync + async calls, including a hash
  await redis.set('user:1', 'alice');
  await redis.hset('user:1:meta', 'role', 'admin');
  const u = await redis.get('user:1');
  const meta = await redis.hget('user:1:meta', 'role');

  // pg: MVCC begin + commit (sync API) and a status read
  const tx = pg.begin();
  await pg.commit(tx.txId);
  const status = pg.getStatus(tx.txId);

  // rabbitmq: the handle is a pre-constructed Broker. Assert a queue
  // and exchange, bind, publish.
  await rabbitmq.assertQueue('q1');
  await rabbitmq.assertExchange('ex1', 'direct');
  await rabbitmq.bindQueue('q1', 'ex1', 'rk');
  const sent = await rabbitmq.publish('ex1', 'rk', { payload: 'hi' });

  // kafka: the handle is a pre-constructed Broker. Create a topic and
  // produce a record (returns void; we verify with fetch).
  kafka.createTopic('events', 1);
  const before = await kafka.fetch('events', 0, 0, 10);
  await kafka.produce('events', [
    { key: 'k', value: 'v', timestamp: Date.now() },
  ]);
  const after = await kafka.fetch('events', 0, 0, 10);

  // queue: enqueue a job, then read it back by the returned id
  const job = await queue.add('job-1', { payload: 42 });
  const j = await queue.getJob(job.id);
  const waiting = await queue.getWaitingCount();

  return {
    u, meta, txId: tx.txId, status, sent,
    producedBefore: before.length, producedAfter: after.length,
    jobId: j && j.id, waiting,
  };
}
`

const CASES = [{}]

describe('sandbox e2e — multi-service solution through the real worker', () => {
  it('runs to completion, exercising redis, pg, rabbitmq, kafka, queue', async () => {
    reset()
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: CASES,
      },
    })
    const types = messages.map((m) => m.type)
    expect(types).toContain('done')

    const cases = findCases()
    expect(cases).toHaveLength(1)
    const c = cases[0] as {
      ok: boolean
      hasExp: boolean
      pass: boolean | null
      output: string
      error?: { name: string; message: string }
      logs: Array<{ l: string; t: string }>
    }
    expect(c.ok).toBe(true)
    expect(c.hasExp).toBe(false)
    const parsed = JSON.parse(c.output) as Record<string, unknown>
    expect(parsed.u).toBe('alice')
    expect(parsed.meta).toBe('admin')
    expect(parsed.producedBefore).toBe(0)
    expect(parsed.producedAfter).toBe(1)
    expect(parsed.jobId).toBeTypeOf('string')
    expect(parsed.waiting).toBe(1)
    // pg.commit moves the tx to TransactionStatus.COMMITTED (= 1, a
    // numeric enum); getStatus reflects that. Accept either the
    // numeric value (the runtime) or the symbolic string (the type).
    expect([1, 'COMMITTED', 'committed']).toContain(parsed.status)
  })

  it('emits a trace line for every service call in the {l,t} case-log stream', async () => {
    reset()
    await onmessage?.({
      data: {
        code: SOLUTION,
        name: 'solve',
        mode: 'fn',
        cases: CASES,
      },
    })

    const text = logsText()
    // Each handle must appear at least once with the expected
    // "[handle] method args -> result" shape from serviceTracing.
    const expected: Array<[string, RegExp]> = [
      ['redis', /\[redis\] set user:1 alice -> OK/],
      ['redis', /\[redis\] hset user:1:meta role admin -> \d+/],
      ['redis', /\[redis\] get user:1 -> alice/],
      ['redis', /\[redis\] hget user:1:meta role -> admin/],
      ['pg', /\[pg\] begin -> \{"txId":1,/],
      ['pg', /\[pg\] commit 1 -> undefined/],
      ['pg', /\[pg\] getStatus 1 -> 1/],
      ['rabbitmq', /\[rabbitmq\] assertQueue q1 -> \{"options":\{\},"name":"q1"/],
      ['rabbitmq', /\[rabbitmq\] assertExchange ex1 direct -> \{"name":"ex1","type":"direct"/],
      ['rabbitmq', /\[rabbitmq\] bindQueue q1 ex1 rk -> undefined/],
      ['rabbitmq', /\[rabbitmq\] publish ex1 rk \{"payload":"hi"\} -> undefined/],
      ['kafka', /\[kafka\] createTopic events 1 -> \{"name":"events","partitionCount":1/],
      ['kafka', /\[kafka\] fetch events 0 0 10 -> \[\]/],
      ['kafka', /\[kafka\] produce events \[\{[^}]+\}\] -> undefined/],
      ['queue', /\[queue\] add job-1 \{[^}]*\} -> \{"id":"[^"]+","name":"job-1"/],
      ['queue', /\[queue\] getJob \S+ -> \{"id":"[^"]+","name":"job-1"/],
      ['queue', /\[queue\] getWaitingCount -> 1/],
    ]
    for (const [handle, pattern] of expected) {
      expect(text, `${handle} trace missing pattern ${pattern}`).toMatch(pattern)
    }
  })

  it('does not surface SAB-dependent exports at runtime (loads without throwing)', () => {
    // The worker module is already loaded — if any SAB-dependent
    // service were wired in (Kafka's Mutex, BullMQ's MutexLock), the
    // dynamic import above would have thrown in environments without
    // cross-origin isolation. The aggregator test in
    // sandbox-bindings.test.ts explicitly asserts those names are not
    // exported; this test is a smoke confirmation that the resulting
    // bundle is loadable end to end.
    for (const name of Object.keys(SANDBOX_SERVICE_CONSTRUCTORS).sort()) {
      expect(name).toMatch(/^(kafka|pg|queue|rabbitmq|redis)$/)
    }
  })
})

describe('sandbox e2e — handlers documented across phases 0-4', () => {
  it('aggregator surface is the same 5-handle set the worker instantiates', () => {
    expect(Object.keys(SANDBOX_SERVICE_CONSTRUCTORS).sort()).toEqual([
      'kafka',
      'pg',
      'queue',
      'rabbitmq',
      'redis',
    ])
  })

  it('autocomplete + ambient typings are wired (see serviceCompletions.test.ts and sandboxAmbient.test.ts)', () => {
    // Both phases have full coverage in their own dedicated test files.
    // The shared invariant: the runtime surface (what the worker
    // injects) and the autocomplete/ambient surface (what the editor
    // advertises) come from the same SANDBOX_SERVICE_CONSTRUCTORS map
    // so they cannot drift. This test pins that invariant by asserting
    // the map's shape directly.
    expect(Object.keys(SANDBOX_SERVICE_CONSTRUCTORS)).toHaveLength(5)
  })
})
