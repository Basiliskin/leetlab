import type { ProblemDraft } from "@domain/Problem";

export const JOB_QUEUE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "fifo-retry-job-queue",
    num: 8039,
    title: "Job Queue — FIFO Retry",
    difficulty: "Medium",
    tags: ["Job Queue", "Retry", "Queue"],
    fnName: "runRetryQueue",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @param {number} maxAttempts
 * @return {string[]}
 */
function runRetryQueue(jobs, maxAttempts) {
  
}
`,
      ts: `function runRetryQueue(jobs: Array<[string, number]>, maxAttempts: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 1],
            ["b", 0],
          ],
          2,
        ],
        out: ["a:fail", "b:ok", "a:ok"],
      },
      {
        in: [
          [
            ["a", 2],
            ["b", 0],
          ],
          2,
        ],
        out: ["a:fail", "b:ok", "a:dead"],
      },
      {
        in: [[["a", 0]], 3],
        out: ["a:ok"],
      },
      {
        in: [[["a", 3]], 2],
        out: ["a:fail", "a:dead"],
      },
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
          ],
          2,
        ],
        out: ["a:fail", "b:fail", "a:ok", "b:ok"],
      },
      {
        in: [[], 3],
        out: [],
      },
    ],
    hints: [
      "Failed jobs go to the back of the queue, not the front.",
      "A job that fails on its final allowed attempt is marked dead and removed.",
    ],
    desc: `<p>Simulate a FIFO job queue with retries.</p><p>Each job is <code>[id, failuresNeeded]</code>. A job succeeds once it has been attempted more times than <code>failuresNeeded</code>. If it fails and still has attempts remaining, it is moved to the back of the queue.</p><p>For each attempt, log:</p><ul><li><code>id:ok</code> when the job succeeds</li><li><code>id:fail</code> when the job fails but may retry</li><li><code>id:dead</code> when the job fails on its final allowed attempt</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>runRetryQueue([['a',1],['b',0]], 2)</div><div><b>Output:</b>['a:fail','b:ok','a:ok']</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>1 ≤ maxAttempts ≤ 10</li><li>0 ≤ failuresNeeded ≤ 10</li></ul>`,
  },

  {
    slug: "priority-job-order",
    num: 8040,
    title: "Job Queue — Priority Order",
    difficulty: "Easy",
    tags: ["Job Queue", "Priority Queue", "Sorting"],
    fnName: "priorityOrder",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @return {string[]}
 */
function priorityOrder(jobs) {
  
}
`,
      ts: `function priorityOrder(jobs: Array<[string, number]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 3],
            ["b", 1],
            ["c", 2],
          ],
        ],
        out: ["b", "c", "a"],
      },
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
          ],
        ],
        out: ["a", "b"],
      },
      {
        in: [[]],
        out: [],
      },
      {
        in: [[["x", 5]]],
        out: ["x"],
      },
      {
        in: [
          [
            ["low", 10],
            ["high", -5],
            ["mid", 0],
          ],
        ],
        out: ["high", "mid", "low"],
      },
      {
        in: [
          [
            ["a", 2],
            ["b", 1],
            ["c", 2],
          ],
        ],
        out: ["b", "a", "c"],
      },
    ],
    hints: [
      "Lower priority number means higher priority.",
      "The sort must be stable: equal priorities keep their original input order.",
    ],
    desc: `<p>You are given jobs as <code>[id, priority]</code>. Lower priority numbers run first.</p><p>Return the job ids in the order they should be processed. If two jobs have the same priority, preserve their original input order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>priorityOrder([['a',3],['b',1],['c',2]])</div><div><b>Output:</b>['b','c','a']</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>-10<sup>6</sup> ≤ priority ≤ 10<sup>6</sup></li></ul>`,
  },

  {
    slug: "job-queue-worker-schedule",
    num: 8041,
    title: "Job Queue — Worker Schedule",
    difficulty: "Hard",
    tags: ["Job Queue", "Scheduler", "Concurrency"],
    fnName: "scheduleJobs",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @param {number} workers
 * @return {Array<[string, number]>}
 */
function scheduleJobs(jobs, workers) {
  
}
`,
      ts: `function scheduleJobs(jobs: Array<[string, number]>, workers: number): Array<[string, number]> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 2],
            ["b", 1],
            ["c", 1],
          ],
          2,
        ],
        out: [
          ["b", 1],
          ["a", 2],
          ["c", 2],
        ],
      },
      {
        in: [
          [
            ["a", 2],
            ["b", 1],
          ],
          1,
        ],
        out: [
          ["a", 2],
          ["b", 3],
        ],
      },
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
            ["c", 1],
          ],
          3,
        ],
        out: [
          ["a", 1],
          ["b", 1],
          ["c", 1],
        ],
      },
      {
        in: [[], 2],
        out: [],
      },
      {
        in: [
          [
            ["a", 5],
            ["b", 1],
            ["c", 1],
            ["d", 1],
          ],
          3,
        ],
        out: [
          ["b", 1],
          ["c", 1],
          ["d", 2],
          ["a", 5],
        ],
      },
      {
        in: [
          [
            ["x", 3],
            ["y", 3],
            ["z", 3],
          ],
          2,
        ],
        out: [
          ["x", 3],
          ["y", 3],
          ["z", 6],
        ],
      },
    ],
    hints: [
      "Assign each incoming job to the worker that becomes free earliest.",
      "When completion times tie, prefer the job that started earlier; if starts also tie, preserve input order.",
    ],
    desc: `<p>Simulate a simple job queue with multiple workers.</p><p>Each job is <code>[id, duration]</code>. Jobs are submitted in input order. Each job is assigned to the worker that is available earliest. If multiple workers are available at the same time, choose the lowest-index worker.</p><p>Return <code>[id, finishTime]</code> pairs sorted by finish time. If finish times tie, sort by start time, then by original input order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>scheduleJobs([['a',2],['b',1],['c',1]], 2)</div><div><b>Output:</b>[['b',1],['a',2],['c',2]]</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>1 ≤ workers ≤ 100</li><li>1 ≤ duration ≤ 1000</li></ul>`,
  },

  {
    slug: "job-dependency-order",
    num: 8044,
    title: "Job Queue — Dependency Order",
    difficulty: "Hard",
    tags: ["Job Queue", "Graph", "Topological Sort"],
    fnName: "jobDependencyOrder",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, string[]]>} jobs
 * @return {string[]}
 */
function jobDependencyOrder(jobs) {
  
}
`,
      ts: `function jobDependencyOrder(jobs: Array<[string, string[]]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["build", []],
            ["test", ["build"]],
            ["lint", []],
            ["deploy", ["test", "lint"]],
          ],
        ],
        out: ["build", "lint", "test", "deploy"],
      },
      {
        in: [
          [
            ["a", ["b"]],
            ["b", []],
          ],
        ],
        out: ["b", "a"],
      },
      {
        in: [
          [
            ["a", ["b"]],
            ["b", ["a"]],
          ],
        ],
        out: [],
      },
      {
        in: [[]],
        out: [],
      },
      {
        in: [[["x", []]]],
        out: ["x"],
      },
      {
        in: [
          [
            ["b", []],
            ["a", []],
          ],
        ],
        out: ["a", "b"],
      },
    ],
    hints: [
      "This is a topological sort problem: a job can run only after all of its dependencies have run.",
      "When multiple jobs are available, choose the alphabetically smallest id. If a cycle exists, return an empty array.",
    ],
    desc: `<p>You are given jobs as <code>[id, dependencies]</code>. A job may run only after every job listed in its dependencies has already run.</p><p>Return a valid execution order. When multiple jobs are available at the same time, choose the alphabetically smallest job id next. If no valid order exists because of a dependency cycle, return an empty array.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['build',[]],['test',['build']],['lint',[]],['deploy',['test','lint']]]</div><div><b>Output:</b>['build','lint','test','deploy']</div></div><div class="ex"><div><b>Input:</b>[['a',['b']],['b',['a']]]</div><div><b>Output:</b>[]</div><div class="exp">The dependency cycle makes scheduling impossible.</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>All job ids are unique strings</li><li>All dependencies refer to existing job ids</li></ul>`,
  },
];
