// application/worker.ts
import { Job } from "../domain/job";
import { QueueEventsMap } from "../types";
import { ILock, AsyncLock } from "../infrastructure/locks";
import {
  IJobRepository,
  InMemoryJobRepository,
} from "../infrastructure/repository";
import { TypedEventEmitter } from "../infrastructure/events";

export type Processor = (job: Job) => Promise<unknown>;

export interface WorkerOptions {
  concurrency?: number;
  repository?: IJobRepository;
  lock?: ILock;
  eventBus?: TypedEventEmitter<QueueEventsMap>;
  autorun?: boolean;
}

export class Worker {
  readonly name: string;
  private processor?: Processor;
  private concurrency: number;
  private repository: IJobRepository;
  private lock: ILock;
  private eventBus: TypedEventEmitter<QueueEventsMap>;
  private running = false;
  private paused = false;
  private processingCount = 0;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    name: string,
    processorOrOpts?: Processor | WorkerOptions,
    maybeOpts?: WorkerOptions,
  ) {
    this.name = name;

    let opts: WorkerOptions = {};
    if (typeof processorOrOpts === "function") {
      this.processor = processorOrOpts;
      opts = maybeOpts ?? {};
    } else {
      opts = processorOrOpts ?? {};
    }

    this.concurrency = opts.concurrency ?? 1;
    this.repository = opts.repository ?? new InMemoryJobRepository();
    this.lock = opts.lock ?? new AsyncLock();
    this.eventBus = opts.eventBus ?? new TypedEventEmitter<QueueEventsMap>();

    if (opts.autorun !== false && this.processor) {
      this.run();
    }
  }

  get events(): TypedEventEmitter<QueueEventsMap> {
    return this.eventBus;
  }

  process(processor: Processor): void {
    this.processor = processor;
    if (!this.running) this.run();
  }

  run(): void {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  close(): void {
    this.running = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  private async poll(): Promise<void> {
    while (this.running) {
      if (
        this.paused ||
        !this.processor ||
        this.processingCount >= this.concurrency
      ) {
        await sleep(100);
        continue;
      }

      const release = await this.lock.acquire();
      let jobs: Job[] = [];
      try {
        const slots = this.concurrency - this.processingCount;
        jobs = await this.repository.findWaiting(slots);
        for (const job of jobs) {
          job.state = "active";
          job.processedOn = Date.now();
          await this.repository.save(job);
          this.processingCount++;
          this.runJob(job).catch(console.error);
        }
      } finally {
        release();
      }

      if (jobs.length === 0) {
        this.eventBus.emit("drained");
        await sleep(500);
      }
    }
  }

  private async runJob(job: Job): Promise<void> {
    try {
      this.eventBus.emit("active", job);
      const result = await this.processor!(job);
      job.returnvalue = result;
      job.finishedOn = Date.now();
      job.state = "completed";
      await this.repository.save(job);
      this.eventBus.emit("completed", job, result);

      if (job.opts.removeOnComplete) {
        await this.repository.remove(job.id);
      }
    } catch (err) {
      await this.handleFailure(job, err as Error);
    } finally {
      this.processingCount--;
    }
  }

  private async handleFailure(job: Job, err: Error): Promise<void> {
    job.attemptsMade++;
    const maxAttempts = job.opts.attempts;

    if (job.attemptsMade >= maxAttempts) {
      job.state = "failed";
      job.finishedOn = Date.now();
      job.failedReason = err.message;
      job.stacktrace = err.stack ? [err.stack] : [];
      await this.repository.save(job);
      this.eventBus.emit("failed", job, err);

      if (job.opts.removeOnFail) {
        await this.repository.remove(job.id);
      }
      return;
    }

    // Retry with backoff
    let delay = 0;
    const bo = job.opts.backoff;
    if (typeof bo === "number") {
      delay = bo;
    } else if (bo?.type === "exponential") {
      delay = bo.delay * Math.pow(2, job.attemptsMade - 1);
    } else if (bo?.type === "fixed") {
      delay = bo.delay;
    }

    if (delay > 0) {
      job.state = "delayed";
      job.timestamp = Date.now();
      job.opts.delay = delay;
    } else {
      job.state = "waiting";
    }

    await this.repository.save(job);
    this.eventBus.emit("waiting", job);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
