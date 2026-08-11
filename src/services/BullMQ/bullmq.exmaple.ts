import {
  Queue,
  Worker,
  TypedEventEmitter,
} from "./index";
import { QueueEventsMap } from "./types";

// Optional: share an event bus so QueueEvents, Queue and Worker all see the same events
const eventBus = new TypedEventEmitter<QueueEventsMap>();

const emailQueue = new Queue("send-email", { eventBus });
// Wire external listeners to the same bus if desired:
eventBus.on("completed", (job, result) => {
  console.log(`Job ${job.id} sent to ${job.data.to}`, result);
});

const worker = new Worker(
  "send-email",
  async (job) => {
    console.log(`Processing ${job.name} #${job.id}`);
    await job.updateProgress(50);
    await new Promise((r) => setTimeout(r, 500)); // simulate SMTP call
    await job.updateProgress(100);
    return { sentAt: Date.now() };
  },
  { concurrency: 3, eventBus },
);

// Add jobs
await emailQueue.add("send-email", {
  to: "alice@example.com",
  subject: "Hello",
});
await emailQueue.add(
  "send-email",
  { to: "bob@example.com", subject: "Hi" },
  { delay: 2000 },
);

// Retry logic example
await emailQueue.add(
  "risky-job",
  { id: 1 },
  {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
);

// Let the worker process the queued jobs, then shut everything down.
await new Promise((r) => setTimeout(r, 1000));
worker.close();
emailQueue.close();
