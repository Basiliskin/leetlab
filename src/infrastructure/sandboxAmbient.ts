// Ambient .d.ts generation for the 5 sandbox service globals (roadmap phase
// 4, tscheck-ambient-declarations). tsCheck.ts's virtual language-service
// host serves the synthetic declaration file below so TS-mode solution code
// can reference `redis`, `pg`, `rabbitmq`, `kafka` and `queue` without false
// "Cannot find name" diagnostics.
//
// The declarations point at the real types from the same aggregator module
// the worker instantiates (`SandboxServices` in sandbox-bindings.ts) via
// `import()` type queries. An `import()` type is not a top-level import
// statement, so this file stays a global script and the handles land in
// global scope rather than module scope. The service source texts are
// inlined with Vite's `?raw` so the host can resolve the aggregator's whole
// module graph with no runtime file system or network access, and handle
// names come from the aggregator's constructor map so they can never drift.

import { SANDBOX_SERVICE_CONSTRUCTORS } from '../services/sandbox-bindings'

import sandboxBindingsSource from '../services/sandbox-bindings.ts?raw'
import redisServiceSource from '../services/redis-service/redis.service.ts?raw'
import postgresqlServiceSource from '../services/postgresql-service/postgresql.service.ts?raw'
import rabbitMqServiceSource from '../services/rabbit-mq-service/RabbitMQ.service.ts?raw'
import kafkaServiceSource from '../services/kafka-service/kafka.service.ts?raw'
import bullmqIndexSource from '../services/BullMQ/index.ts?raw'
import bullmqTypesSource from '../services/BullMQ/types.ts?raw'
import bullmqJobSource from '../services/BullMQ/domain/job.ts?raw'
import bullmqQueueSource from '../services/BullMQ/application/queue.ts?raw'
import bullmqWorkerSource from '../services/BullMQ/application/worker.ts?raw'
import bullmqQueueEventsSource from '../services/BullMQ/application/queue-events.ts?raw'
import bullmqLocksSource from '../services/BullMQ/infrastructure/locks.ts?raw'
import bullmqRepositorySource from '../services/BullMQ/infrastructure/repository.ts?raw'
import bullmqEventsSource from '../services/BullMQ/infrastructure/events.ts?raw'

/** Virtual path of the synthetic ambient declaration file in the host. */
export const AMBIENT_FILE_NAME = '/src/sandbox-ambient.d.ts'

/**
 * The full transitive import closure of `sandbox-bindings.ts` as virtual
 * absolute paths (mirroring the repo layout under /src) mapped to their
 * inlined source text. Every relative import in every entry resolves to
 * another entry; sandboxAmbient.test.ts asserts that invariant so a future
 * file added to the services tree cannot silently break ambient typing.
 */
export function buildServiceTexts(): ReadonlyMap<string, string> {
  return new Map([
    ['/src/services/sandbox-bindings.ts', sandboxBindingsSource],
    ['/src/services/redis-service/redis.service.ts', redisServiceSource],
    ['/src/services/postgresql-service/postgresql.service.ts', postgresqlServiceSource],
    ['/src/services/rabbit-mq-service/RabbitMQ.service.ts', rabbitMqServiceSource],
    ['/src/services/kafka-service/kafka.service.ts', kafkaServiceSource],
    ['/src/services/BullMQ/index.ts', bullmqIndexSource],
    ['/src/services/BullMQ/types.ts', bullmqTypesSource],
    ['/src/services/BullMQ/domain/job.ts', bullmqJobSource],
    ['/src/services/BullMQ/application/queue.ts', bullmqQueueSource],
    ['/src/services/BullMQ/application/worker.ts', bullmqWorkerSource],
    ['/src/services/BullMQ/application/queue-events.ts', bullmqQueueEventsSource],
    ['/src/services/BullMQ/infrastructure/locks.ts', bullmqLocksSource],
    ['/src/services/BullMQ/infrastructure/repository.ts', bullmqRepositorySource],
    ['/src/services/BullMQ/infrastructure/events.ts', bullmqEventsSource],
  ])
}

/**
 * Build the ambient declaration text: one `declare const <handle>` per
 * service global, typed by indexing the aggregator's `SandboxServices`
 * mapped type. `moduleSpecifier` is relative to AMBIENT_FILE_NAME's virtual
 * directory. Degrades to empty text for an empty handle list.
 */
export function buildAmbientText(
  handleNames: readonly string[],
  moduleSpecifier: string
): string {
  return handleNames
    .map(
      (name) =>
        `declare const ${name}: import("${moduleSpecifier}").SandboxServices["${name}"];`
    )
    .join('\n')
}

const HANDLE_NAMES = Object.keys(SANDBOX_SERVICE_CONSTRUCTORS)

/** Ready-to-serve ambient text declaring all 5 service globals. */
export const AMBIENT_TEXT = buildAmbientText(
  HANDLE_NAMES,
  './services/sandbox-bindings'
)

/** Ready-to-serve virtual service files for the language-service host. */
export const SERVICE_TEXT_PATHS = buildServiceTexts()
