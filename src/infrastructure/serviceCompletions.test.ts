import { describe, expect, it } from "vitest";
import { CompletionContext } from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { Queue } from "../services/BullMQ";
import { Broker as KafkaBroker } from "../services/kafka-service/kafka.service";
import { TransactionManager } from "../services/postgresql-service/postgresql.service";
import { Broker as RabbitMQBroker } from "../services/rabbit-mq-service/RabbitMQ.service";
import { RedisEmulation } from "../services/redis-service/redis.service";
import {
  buildSandboxCompletionData,
  sandboxServiceCompletions,
  SANDBOX_HANDLE_OPTIONS,
  SANDBOX_MEMBER_OPTIONS,
  SERVICE_INTERNAL_METHODS,
} from "./serviceCompletions";

// Mirror of the enumeration traceService (the worker's tracer) uses: own
// prototype methods, constructor excluded, descriptor value must be a
// function. The completion surface must equal this set minus `_`-prefixed
// names and the deliberate internal-method denylist.
function tracedMethods(ctor: unknown): string[] {
  const proto = (ctor as { prototype: Record<string, unknown> }).prototype;
  return Object.getOwnPropertyNames(proto).filter((key) => {
    if (key === "constructor") return false;
    const desc = Object.getOwnPropertyDescriptor(proto, key);
    return !!desc && typeof desc.value === "function";
  });
}

const HANDLES = {
  redis: RedisEmulation,
  pg: TransactionManager,
  rabbitmq: RabbitMQBroker,
  kafka: KafkaBroker,
  queue: Queue,
} as Record<string, { name: string }>;

describe("sandbox service autocomplete data", () => {
  it("offers exactly the five aggregator handles as variable completions", () => {
    expect(SANDBOX_HANDLE_OPTIONS.map((o) => o.label).sort()).toEqual([
      "kafka",
      "pg",
      "queue",
      "rabbitmq",
      "redis",
    ]);
    for (const option of SANDBOX_HANDLE_OPTIONS) {
      expect(option.type).toBe("variable");
      expect(option.detail).toBe(HANDLES[option.label].name);
    }
  });

  it("surfaces the real public members of each service", () => {
    const labels = (handle: string) =>
      SANDBOX_MEMBER_OPTIONS[handle].map((o) => o.label);

    for (const m of ["set", "get", "lpush", "zadd", "multi", "subscribe", "publish", "close", "sendCommand"]) {
      expect(labels("redis")).toContain(m);
    }
    for (const m of ["begin", "commit", "abort", "getStatus"]) {
      expect(labels("pg")).toContain(m);
    }
    for (const m of ["assertQueue", "assertExchange", "bindQueue", "publish"]) {
      expect(labels("rabbitmq")).toContain(m);
    }
    for (const m of ["produce", "createTopic", "fetch", "getTopic"]) {
      expect(labels("kafka")).toContain(m);
    }
    for (const m of ["add", "getJob", "close", "getWaitingCount"]) {
      expect(labels("queue")).toContain(m);
    }
  });

  it("hides implementation-detail methods, constructors, and `_`-internals", () => {
    const labels = (handle: string) =>
      SANDBOX_MEMBER_OPTIONS[handle].map((o) => o.label);

    for (const m of ["saveToStorage", "serialize", "restore", "getOrCreateHash", "sizeOfValue", "bumpVersion"]) {
      expect(labels("redis")).not.toContain(m);
    }
    expect(labels("rabbitmq")).not.toContain("tryDeliver");
    expect(labels("queue")).not.toContain("scheduleDelayedPromoter");
    for (const list of Object.values(SANDBOX_MEMBER_OPTIONS)) {
      expect(list.some((o) => o.label.startsWith("_"))).toBe(false);
      expect(list.some((o) => o.label === "constructor")).toBe(false);
    }
  });

  it("never drifts from the worker-traced surface (denylist is a pure subset)", () => {
    for (const [handle, ctor] of Object.entries(HANDLES)) {
      const traced = tracedMethods(ctor);
      const surfaced = SANDBOX_MEMBER_OPTIONS[handle].map((o) => o.label);
      const expected = traced
        .filter((k) => !k.startsWith("_"))
        .filter((k) => !SERVICE_INTERNAL_METHODS[handle].includes(k))
        .sort();
      expect(surfaced).toEqual(expected);
    }
  });

  it("carries live parameter lists on every member completion", () => {
    for (const [handle, list] of Object.entries(SANDBOX_MEMBER_OPTIONS)) {
      for (const option of list) {
        expect(
          option.detail!.startsWith("("),
          `${handle}.${option.label} detail starts with "("`,
        ).toBe(true);
        expect(option.detail!.endsWith(")"), `${handle}.${option.label} detail ends with ")"`).toBe(true);
      }
    }
    const set = SANDBOX_MEMBER_OPTIONS.redis.find((o) => o.label === "set");
    expect(set?.detail).toContain("key");
  });

  it("builds from a custom constructor map for reuse", () => {
    const custom = buildSandboxCompletionData({ redis: RedisEmulation });
    expect(custom.handles.map((h) => h.label)).toEqual(["redis"]);
    expect(custom.members.redis.map((o) => o.label)).toContain("get");
  });
});

describe("sandboxServiceCompletions source (real CompletionContext)", () => {
  async function completionAt(doc: string, pos: number) {
    const state = EditorState.create({
      doc,
      extensions: [
        javascript(),
        javascriptLanguage.data.of({ autocomplete: sandboxServiceCompletions }),
      ],
    });
    return sandboxServiceCompletions(new CompletionContext(state, pos, false));
  }

  it("offers the matching handle on a bare identifier", async () => {
    const result = await completionAt("const r", 7);
    expect(result?.from).toBe(6);
    expect(result?.options.map((o) => o.label)).toContain("redis");
  });

  it("offers the public members after `handle.`", async () => {
    const result = await completionAt("redis.", 6);
    expect(result?.from).toBe(6);
    expect(result?.options.map((o) => o.label)).toContain("set");
    expect(result?.options.map((o) => o.label)).toContain("zadd");
  });

  it("replaces only the partial member when `handle.part` is typed", async () => {
    const result = await completionAt("redis.ge", 8);
    expect(result?.from).toBe(6);
    expect(result?.options.map((o) => o.label)).toContain("get");
  });

  it("completes members for all five handles", async () => {
    for (const [doc, pos] of [
      ["pg.", 3],
      ["rabbitmq.", 9],
      ["kafka.", 6],
      ["queue.", 6],
    ] as const) {
      const result = await completionAt(doc, pos);
      expect(result?.options.length, doc).toBeGreaterThan(0);
    }
  });

  it("stays silent inside comments and strings", async () => {
    expect(await completionAt("// redis.", 9)).toBeNull();
    expect(await completionAt('const s = "redis."', 18)).toBeNull();
  });

  it("leaves non-service member expressions to the scope source", async () => {
    expect(await completionAt("foo.bar.", 8)).toBeNull();
  });
});
