/**
 * Sandbox service bindings: the single source of truth for the five
 * in-browser backend-emulation services (Redis, PostgreSQL, RabbitMQ, Kafka,
 * BullMQ) exposed to sandboxed solution code as global handles.
 *
 * SharedArrayBuffer-dependent exports are deliberately NOT re-exported:
 * Kafka's `Mutex`/`SharedMemoryOffsetStorage` and BullMQ's `MutexLock`
 * require SharedArrayBuffer/Atomics, which in turn require COOP/COEP headers
 * this app does not set. Their default AsyncLock-based paths need none of it.
 */

import { RedisEmulation } from "./redis-service/redis.service";
import {
  TransactionManager,
  AsyncLock as PostgresAsyncLock,
} from "./postgresql-service/postgresql.service";
import { Broker as RabbitMQBroker } from "./rabbit-mq-service/RabbitMQ.service";
import { Broker as KafkaBroker } from "./kafka-service/kafka.service";
import { Queue } from "./BullMQ";

// BullMQ's barrel, re-exported selectively. `MutexLock` is excluded by design
// (SAB-dependent); aliasing the other services' internal `AsyncLock` imports
// (e.g. PostgresAsyncLock above) prevents the four-way `AsyncLock` symbol
// collision across the services that independently export one.
export {
  Job,
  Queue,
  Worker,
  QueueEvents,
  AsyncLock,
  InMemoryJobRepository,
  TypedEventEmitter,
  type ILock,
  type IJobRepository,
  type JobState,
  type BackoffOptions,
  type JobOptions,
  type JobData,
  type QueueEventsMap,
} from "./BullMQ";

/** The 5 sandbox handle names mapped to their constructors. */
export const SANDBOX_SERVICE_CONSTRUCTORS = {
  redis: RedisEmulation,
  pg: TransactionManager,
  rabbitmq: RabbitMQBroker,
  kafka: KafkaBroker,
  queue: Queue,
} as const;

export type SandboxServiceName = keyof typeof SANDBOX_SERVICE_CONSTRUCTORS;

export type SandboxServices = {
  [Name in SandboxServiceName]: InstanceType<
    (typeof SANDBOX_SERVICE_CONSTRUCTORS)[Name]
  >;
};

/** Construct a fresh, isolated instance of each service for one sandbox run. */
export function createSandboxServices(): SandboxServices {
  return {
    redis: new RedisEmulation(),
    pg: new TransactionManager(new PostgresAsyncLock()),
    rabbitmq: new RabbitMQBroker(),
    kafka: new KafkaBroker(),
    queue: new Queue("sandbox"),
  };
}
