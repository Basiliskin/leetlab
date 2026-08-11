import { Job } from "./domain/job";

// types.ts
export type JobState =
  "waiting" | "active" | "completed" | "failed" | "delayed";

export interface BackoffOptions {
  type: "fixed" | "exponential";
  delay: number;
}

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: number | BackoffOptions;
  jobId?: string;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export interface JobData {
  [key: string]: unknown;
}

export interface QueueEventsMap {
  waiting: [job: Job];
  active: [job: Job];
  completed: [job: Job, result: unknown];
  failed: [job: Job, err: Error];
  delayed: [job: Job];
  progress: [job: Job, progress: number];
  drained: [];
}
