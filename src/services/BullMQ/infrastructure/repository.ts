// infrastructure/repository.ts
import { Job } from "../domain/job";
import { JobState } from "../types";

export interface IJobRepository {
  save(job: Job): Promise<void>;
  findById(id: string): Promise<Job | undefined>;
  remove(id: string): Promise<void>;
  findWaiting(limit: number): Promise<Job[]>;
  findDelayed(beforeTimestamp: number): Promise<Job[]>;
  findByState(state: JobState): Promise<Job[]>;
  countByState(state: JobState): Promise<number>;
}

/** In-memory repository. Data is lost on page refresh (KISS default). */
export class InMemoryJobRepository implements IJobRepository {
  private jobs = new Map<string, Job>();

  async save(job: Job): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async findById(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async remove(id: string): Promise<void> {
    this.jobs.delete(id);
  }

  async findWaiting(limit: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter((j) => j.state === "waiting")
      .sort((a, b) => b.opts.priority - a.opts.priority)
      .slice(0, limit);
  }

  async findDelayed(beforeTimestamp: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (j) =>
        j.state === "delayed" &&
        j.timestamp + (j.opts.delay ?? 0) <= beforeTimestamp,
    );
  }

  async findByState(state: JobState): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((j) => j.state === state);
  }

  async countByState(state: JobState): Promise<number> {
    return (await this.findByState(state)).length;
  }
}
