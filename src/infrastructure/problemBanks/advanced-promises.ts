import type { ProblemDraft } from "@domain/Problem";

export const ADVANCED_PROMISE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "promise-pool-settled",
    num: 8045,
    title: "Promise Pool — Settled With Completion Times",
    difficulty: "Hard",
    tags: ["Promise", "Concurrency", "Pool", "Scheduling"],
    fnName: "promisePoolSettled",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number, number]>} tasks
 * @param {number} limit
 * @return {Promise<Array<{id: string, status: string, time: number}>>}
 */
async function promisePoolSettled(tasks, limit) {
  
}
`,
      ts: `async function promisePoolSettled(tasks: Array<[string, number, number]>, limit: number): Promise<Array<{ id: string; status: string; time: number }>> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 2, 1],
            ["b", 1, 0],
            ["c", 1, 1],
          ],
          2,
        ],
        out: [
          { id: "b", status: "rejected", time: 1 },
          { id: "a", status: "fulfilled", time: 2 },
          { id: "c", status: "fulfilled", time: 2 },
        ],
      },
      {
        in: [
          [
            ["a", 2, 1],
            ["b", 1, 1],
          ],
          1,
        ],
        out: [
          { id: "a", status: "fulfilled", time: 2 },
          { id: "b", status: "fulfilled", time: 3 },
        ],
      },
      {
        in: [[], 2],
        out: [],
      },
      {
        in: [
          [
            ["a", 1, 1],
            ["b", 1, 0],
            ["c", 1, 1],
          ],
          3,
        ],
        out: [
          { id: "a", status: "fulfilled", time: 1 },
          { id: "b", status: "rejected", time: 1 },
          { id: "c", status: "fulfilled", time: 1 },
        ],
      },
      {
        in: [
          [
            ["a", 5, 1],
            ["b", 1, 0],
            ["c", 1, 1],
            ["d", 1, 1],
          ],
          2,
        ],
        out: [
          { id: "b", status: "rejected", time: 1 },
          { id: "c", status: "fulfilled", time: 2 },
          { id: "d", status: "fulfilled", time: 3 },
          { id: "a", status: "fulfilled", time: 5 },
        ],
      },
      {
        in: [
          [
            ["x", 1, 0],
            ["y", 2, 1],
          ],
          1,
        ],
        out: [
          { id: "x", status: "rejected", time: 1 },
          { id: "y", status: "fulfilled", time: 3 },
        ],
      },
    ],
    hints: [
      "Treat each task as a promise that occupies one concurrency slot until it finishes.",
      "Start tasks in input order whenever a slot is free. Sort final records by finish time, preserving input order for ties.",
    ],
    desc: `<p>Simulate a promise pool with limited concurrency.</p><p>Each task is given as <code>[id, duration, success]</code>. A task starts in input order as soon as a concurrency slot is available. It finishes after <code>duration</code> logical time units. If <code>success</code> is <code>1</code>, it settles as fulfilled; if <code>0</code>, it settles as rejected.</p><p>Implement <code>promisePoolSettled(tasks, limit)</code> and return settlement records sorted by finish time. If two tasks finish at the same time, preserve their original input order.</p><p class="note">Judge protocol: your function's return value is awaited before comparison. This problem uses logical time, not real timers.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>tasks = [['a',2,1],['b',1,0],['c',1,1]], limit = 2</div><div><b>Output:</b>[{id:'b',status:'rejected',time:1},{id:'a',status:'fulfilled',time:2},{id:'c',status:'fulfilled',time:2}]</div></div><h4>Constraints</h4><ul><li>0 ≤ tasks.length ≤ 1000</li><li>1 ≤ limit ≤ 100</li><li>1 ≤ duration ≤ 1000</li><li>success is 0 or 1</li></ul>`,
  },

  {
    slug: "cancellable-progress",
    num: 8046,
    title: "Cancellable Task — Progress Log",
    difficulty: "Medium",
    tags: ["Promise", "Cancellation", "Async Control"],
    fnName: "cancellableProgress",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} total
 * @param {number} cancelAt
 * @return {Promise<{status: string, log: string[]}>}
 */
async function cancellableProgress(total, cancelAt) {
  
}
`,
      ts: `async function cancellableProgress(total: number, cancelAt: number): Promise<{ status: string; log: string[] }> {
  
}
`,
    },
    tests: [
      {
        in: [5, 3],
        out: {
          status: "cancelled",
          log: ["tick:1", "tick:2", "tick:3"],
        },
      },
      {
        in: [3, 5],
        out: {
          status: "completed",
          log: ["tick:1", "tick:2", "tick:3"],
        },
      },
      {
        in: [0, 0],
        out: {
          status: "completed",
          log: [],
        },
      },
      {
        in: [1, 0],
        out: {
          status: "cancelled",
          log: [],
        },
      },
      {
        in: [2, 1],
        out: {
          status: "cancelled",
          log: ["tick:1"],
        },
      },
      {
        in: [4, 4],
        out: {
          status: "completed",
          log: ["tick:1", "tick:2", "tick:3", "tick:4"],
        },
      },
    ],
    hints: [
      "Cancellation should stop future work, but it should not erase progress that already happened.",
      "If cancellation happens before any tick, the log is empty and the status is cancelled.",
    ],
    desc: `<p>Simulate a cancellable asynchronous task that emits progress ticks.</p><p>The task would normally emit <code>tick:1</code>, <code>tick:2</code>, ..., <code>tick:total</code>, one per logical time unit. A cancellation is requested at time <code>cancelAt</code>.</p><p>If <code>cancelAt</code> is greater than or equal to <code>total</code>, the task completes and returns <code>{ status: 'completed', log }</code>. Otherwise, it stops after the tick at <code>cancelAt</code> and returns <code>{ status: 'cancelled', log }</code>.</p><p class="note">Judge protocol: your function's return value is awaited before comparison. This problem uses logical time, not real timers.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>cancellableProgress(5, 3)</div><div><b>Output:</b>{status:'cancelled',log:['tick:1','tick:2','tick:3']}</div></div><div class="ex"><div><b>Input:</b>cancellableProgress(3, 5)</div><div><b>Output:</b>{status:'completed',log:['tick:1','tick:2','tick:3']}</div></div><h4>Constraints</h4><ul><li>0 ≤ total ≤ 1000</li><li>0 ≤ cancelAt ≤ 1000</li></ul>`,
  },
];
