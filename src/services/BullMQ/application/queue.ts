// application/queue.ts
import { Job } from "../domain/job";
import { JobData, JobOptions, QueueEventsMap } from "../types";
import { ILock, AsyncLock } from "../infrastructure/locks";
import {
  IJobRepository,
  InMemoryJobRepository,
} from "../infrastructure/repository";
import { TypedEventEmitter } from "../infrastructure/events";

export interface QueueOptions {
  repository?: IJobRepository;
  lock?: ILock;
  eventBus?: TypedEventEmitter<QueueEventsMap>;
}

export class Queue {
  readonly name: string;
  private repository: IJobRepository;
  private lock: ILock;
  private eventBus: TypedEventEmitter<QueueEventsMap>;
  private running = true;
  private promoterTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(name: string, opts: QueueOptions = {}) {
    this.name = name;
    this.repository = opts.repository ?? new InMemoryJobRepository();
    this.lock = opts.lock ?? new AsyncLock();
    this.eventBus = opts.eventBus ?? new TypedEventEmitter<QueueEventsMap>();
    this.scheduleDelayedPromoter();
  }

  get events(): TypedEventEmitter<QueueEventsMap> {
    return this.eventBus;
  }

  async add(name: string, data: JobData, opts: JobOptions = {}): Promise<Job> {
    const job = new Job(name, data, opts);
    await this.repository.save(job);

    if (job.state === "delayed") {
      this.eventBus.emit("delayed", job);
    } else {
      this.eventBus.emit("waiting", job);
    }
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.repository.findById(id);
  }

  async getWaitingCount(): Promise<number> {
    return this.repository.countByState("waiting");
  }

  async getCompletedCount(): Promise<number> {
    return this.repository.countByState("completed");
  }

  async getFailedCount(): Promise<number> {
    return this.repository.countByState("failed");
  }

  async clean(graceMs: number, status: "completed" | "failed"): Promise<Job[]> {
    const release = await this.lock.acquire();
    try {
      const jobs = await this.repository.findByState(status);
      const now = Date.now();
      const toRemove = jobs.filter(
        (j) => j.finishedOn && now - j.finishedOn > graceMs,
      );
      for (const j of toRemove) await this.repository.remove(j.id);
      return toRemove;
    } finally {
      release();
    }
  }

  close(): void {
    this.running = false;
    if (this.promoterTimer) clearTimeout(this.promoterTimer);
  }

  private scheduleDelayedPromoter(): void {
    const tick = async () => {
      if (!this.running) return;
      const release = await this.lock.acquire();
      try {
        const jobs = await this.repository.findDelayed(Date.now());
        for (const job of jobs) {
          job.state = "waiting";
          await this.repository.save(job);
          this.eventBus.emit("waiting", job);
        }
      } finally {
        release();
      }
      this.promoterTimer = setTimeout(tick, 1000);
    };
    this.promoterTimer = setTimeout(tick, 1000);
  }
}
