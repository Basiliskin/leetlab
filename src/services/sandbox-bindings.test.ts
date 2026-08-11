import { describe, expect, it } from "vitest";
import { Queue } from "./BullMQ";
import { Broker as KafkaBroker } from "./kafka-service/kafka.service";
import { TransactionManager } from "./postgresql-service/postgresql.service";
import { Broker as RabbitMQBroker } from "./rabbit-mq-service/RabbitMQ.service";
import { RedisEmulation } from "./redis-service/redis.service";
import {
  createSandboxServices,
  SANDBOX_SERVICE_CONSTRUCTORS,
  type SandboxServiceName,
} from "./sandbox-bindings";

// SharedArrayBuffer/Atomics-dependent exports that must never leak through the
// aggregator: they require COOP/COEP headers the app does not set.
const SAB_DEPENDENT_EXPORTS = [
  "Mutex", // Kafka
  "SharedMemoryOffsetStorage", // Kafka
  "MutexLock", // BullMQ
] as const;

describe("sandbox service bindings", () => {
  it("maps exactly the five service handles", () => {
    expect(Object.keys(SANDBOX_SERVICE_CONSTRUCTORS).sort()).toEqual([
      "kafka",
      "pg",
      "queue",
      "rabbitmq",
      "redis",
    ]);
  });

  it("yields a fresh, isolated instance of each service per factory call", () => {
    const first = createSandboxServices();
    const second = createSandboxServices();
    try {
      expect(first.redis).toBeInstanceOf(RedisEmulation);
      expect(first.pg).toBeInstanceOf(TransactionManager);
      expect(first.rabbitmq).toBeInstanceOf(RabbitMQBroker);
      expect(first.kafka).toBeInstanceOf(KafkaBroker);
      expect(first.queue).toBeInstanceOf(Queue);

      for (const name of Object.keys(
        SANDBOX_SERVICE_CONSTRUCTORS,
      ) as SandboxServiceName[]) {
        expect(first[name]).not.toBe(second[name]);
      }
    } finally {
      first.redis.close();
      second.redis.close();
      first.queue.close();
      second.queue.close();
    }
  });

  it("does not export any SharedArrayBuffer-dependent symbol", async () => {
    const moduleExports = await import("./sandbox-bindings");
    for (const name of SAB_DEPENDENT_EXPORTS) {
      expect(name in moduleExports).toBe(false);
    }
  });

  it("re-exports BullMQ's barrel selectively", async () => {
    const moduleExports = await import("./sandbox-bindings");
    expect(moduleExports.Queue).toBe(Queue);
    expect(moduleExports.Worker).toBeDefined();
    expect(moduleExports.QueueEvents).toBeDefined();
    expect(moduleExports.Job).toBeDefined();
    expect(moduleExports.InMemoryJobRepository).toBeDefined();
  });
});
