// domain/job.ts
import { JobData, JobOptions, JobState } from "../types";

export class Job {
  readonly id: string;
  readonly name: string;
  readonly data: JobData;
  readonly opts: Required<Pick<JobOptions, "attempts" | "priority">> &
    JobOptions;
  state: JobState;
  progress: number;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  returnvalue?: unknown;
  failedReason?: string;
  stacktrace: string[] = [];

  constructor(name: string, data: JobData, opts: JobOptions = {}) {
    this.id =
      opts.jobId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    this.name = name;
    this.data = data;
    this.opts = {
      attempts: opts.attempts ?? 1,
      priority: opts.priority ?? 0,
      ...opts,
    };
    this.state = opts.delay ? "delayed" : "waiting";
    this.progress = 0;
    this.attemptsMade = 0;
    this.timestamp = Date.now();
  }

  updateProgress(value: number): void {
    this.progress = Math.max(0, Math.min(100, value));
  }
}
