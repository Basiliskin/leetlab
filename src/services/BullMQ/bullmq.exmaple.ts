import {
  Queue,
  Worker,
  QueueEvents,
  AsyncLock,
  TypedEventEmitter,
} from "./index";

// Optional: share an event bus so QueueEvents, Queue and Worker all see the same events
const eventBus = new TypedEventEmitter();

const emailQueue = new Queue("send-email", { eventBus });
const emailEvents = new QueueEvents("send-email"); // if you need API parity
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

// Cleanup old completed jobs after 1 hour
setInterval(() => {
  emailQueue.clean(60_000, "completed");
}, 60_000);
