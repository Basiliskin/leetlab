import { Connection, ExchangeType } from "./RabbitMQ.service";

export async function run() {
  // 1. Connect
  const connection = new Connection();
  const channel = await connection.createChannel();

  // 2. Setup Topology
  await channel.assertExchange("logs", ExchangeType.Fanout);

  // Create an exclusive, auto-named queue for this specific "worker"
  const { queue } = await channel.assertQueue("", { exclusive: true });

  // Bind queue to the exchange
  await channel.bindQueue(queue, "logs", "");

  // 3. Consume Messages
  await channel.consume(
    queue,
    (msg) => {
      console.log(` [x] Received ${msg.content}`);

      // Simulate processing delay
      setTimeout(() => {
        channel.ack(msg.id);
        console.log(` [x] Acknowledged ${msg.id}`);
      }, 500);
    },
    { noAck: false },
  );

  // 4. Publish Messages
  console.log("Publishing messages...");
  await channel.publish("logs", "", "Hello World 1");
  await channel.publish("logs", "", "Hello World 2");
}
