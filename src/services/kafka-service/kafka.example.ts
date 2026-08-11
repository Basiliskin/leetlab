import { Broker, Consumer, InMemoryOffsetStorage } from "./kafka.service";

export async function main() {
  const broker = new Broker<string, string>();
  const offsetStorage = new InMemoryOffsetStorage();

  // 1. Setup Topic
  broker.createTopic("user-events", 3);

  // 2. Consumer Setup
  const consumer = new Consumer(broker, offsetStorage, {
    groupId: "analytics-group",
    topic: "user-events",
    autoCommit: true,
  });

  await consumer.assign([0, 1, 2]);

  // Start polling in background
  consumer.start(async (record) => {
    console.log(
      `Consumed: ${record.key} -> ${record.value} (Partition: ${record.partition}, Offset: ${record.offset})`,
    );
  });

  // 3. Produce messages
  await broker.produce("user-events", [
    { key: "user-1", value: "login", timestamp: Date.now() },
    { key: "user-2", value: "purchase", timestamp: Date.now() },
    { key: "user-1", value: "logout", timestamp: Date.now() },
  ]);

  // Let it run for a bit then stop
  setTimeout(() => consumer.stop(), 2000);
}
