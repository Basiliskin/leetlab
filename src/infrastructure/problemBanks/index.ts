import type { Category } from "@domain/Category";
import type { Problem, ProblemDraft } from "@domain/Problem";

import { CLASSIC_PROBLEMS } from "./classic";
import { ASYNC_PROBLEMS } from "./async";
import { GENERATOR_PROBLEMS } from "./generators";
import { REACT_PROBLEMS } from "./react";
import { STREAMING_PROBLEMS } from "./streaming";
import { DESIGN_SYSTEM_PROBLEMS } from "./designSystem";
import { BACKPRESSURE_PROBLEMS } from "./backpressure";
import { EVENT_PROBLEMS } from "./events";
import { JOB_QUEUE_PROBLEMS } from "./job-queue";
import { PROMISE_PROBLEMS } from "./promises";

import { ADVANCED_PROMISE_PROBLEMS } from "./advanced-promises";
import { ADVANCED_EVENT_PROBLEMS } from "./advanced-events";
import { ADVANCED_QUEUE_PROBLEMS } from "./advanced-queues";

export { CLASSIC_PROBLEMS };
export { ASYNC_PROBLEMS };
export { GENERATOR_PROBLEMS };
export { REACT_PROBLEMS };
export { STREAMING_PROBLEMS };
export { DESIGN_SYSTEM_PROBLEMS };
export { BACKPRESSURE_PROBLEMS };
export { EVENT_PROBLEMS };
export { JOB_QUEUE_PROBLEMS };
export { PROMISE_PROBLEMS };
export { ADVANCED_PROMISE_PROBLEMS };
export { ADVANCED_EVENT_PROBLEMS };
export { ADVANCED_QUEUE_PROBLEMS };

/**
 * One source of truth for the sub-bank → category mapping. Authors writing
 * individual problems never set `category` themselves; the aggregation in
 * PROBLEM_BANK stamps it here. To add a new category, extend
 * src/domain/Category.ts's CATEGORIES tuple and add the entry below.
 */
const SUB_BANKS: ReadonlyArray<readonly [Category, readonly ProblemDraft[]]> = [
  ["Classic", CLASSIC_PROBLEMS],
  ["Async", ASYNC_PROBLEMS],
  ["Generators", GENERATOR_PROBLEMS],
  ["React", REACT_PROBLEMS],
  ["Streaming", STREAMING_PROBLEMS],
  ["Design System", DESIGN_SYSTEM_PROBLEMS],
  ["Backpressure", BACKPRESSURE_PROBLEMS],
  ["Events", EVENT_PROBLEMS],
  ["Job Queue", JOB_QUEUE_PROBLEMS],
  ["Promises", PROMISE_PROBLEMS],
  ["Advanced Promises", ADVANCED_PROMISE_PROBLEMS],
  ["Advanced Events", ADVANCED_EVENT_PROBLEMS],
  ["Advanced Queues", ADVANCED_QUEUE_PROBLEMS],
];

const tag = (
  category: Category,
  problems: readonly ProblemDraft[],
): Problem[] => problems.map((p) => ({ ...p, category }));

export const PROBLEM_BANK: Problem[] = SUB_BANKS.flatMap(
  ([category, problems]) => tag(category, problems),
)
  .slice()
  .sort((a, b) => a.num - b.num);
