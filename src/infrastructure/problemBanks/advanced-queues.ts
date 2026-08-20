import type { ProblemDraft } from "@domain/Problem";

export const ADVANCED_QUEUE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "rate-limited-job-queue",
    num: 8047,
    title: "Job Queue — Rate-Limited Starts",
    difficulty: "Medium",
    tags: ["Job Queue", "Rate Limiting", "Scheduling"],
    fnName: "rateLimitedQueue",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @param {number} cooldown
 * @return {Array<{id: string, start: number, finish: number}>}
 */
function rateLimitedQueue(jobs, cooldown) {
  
}
`,
      ts: `function rateLimitedQueue(jobs: Array<[string, number]>, cooldown: number): Array<{ id: string; start: number; finish: number }> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
            ["c", 1],
          ],
          2,
        ],
        out: [
          { id: "a", start: 0, finish: 1 },
          { id: "b", start: 2, finish: 3 },
          { id: "c", start: 4, finish: 5 },
        ],
      },
      {
        in: [
          [
            ["a", 5],
            ["b", 1],
          ],
          2,
        ],
        out: [
          { id: "a", start: 0, finish: 5 },
          { id: "b", start: 5, finish: 6 },
        ],
      },
      {
        in: [
          [
            ["a", 2],
            ["b", 1],
          ],
          0,
        ],
        out: [
          { id: "a", start: 0, finish: 2 },
          { id: "b", start: 2, finish: 3 },
        ],
      },
      {
        in: [[], 3],
        out: [],
      },
      {
        in: [[["x", 4]], 10],
        out: [{ id: "x", start: 0, finish: 4 }],
      },
      {
        in: [
          [
            ["a", 0],
            ["b", 0],
          ],
          2,
        ],
        out: [
          { id: "a", start: 0, finish: 0 },
          { id: "b", start: 2, finish: 2 },
        ],
      },
    ],
    hints: [
      "A job can start only after the previous job has finished and the cooldown since the previous start has elapsed.",
      "Track the previous start and previous finish; the next start is the maximum of those two constraints.",
    ],
    desc: `<p>Simulate a single-worker job queue with a rate limit on job starts.</p><p>Each job is <code>[id, duration]</code>. Jobs run one at a time in input order. The next job may start only when both are true:</p><ul><li>the previous job has finished</li><li>at least <code>cooldown</code> time units have passed since the previous job started</li></ul><p>Return records in processing order: <code>{ id, start, finish }</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>jobs = [['a',1],['b',1],['c',1]], cooldown = 2</div><div><b>Output:</b>[{id:'a',start:0,finish:1},{id:'b',start:2,finish:3},{id:'c',start:4,finish:5}]</div></div><div class="ex"><div><b>Input:</b>jobs = [['a',5],['b',1]], cooldown = 2</div><div><b>Output:</b>[{id:'a',start:0,finish:5},{id:'b',start:5,finish:6}]</div><div class="exp">Here the previous job finishing is the limiting factor, not the cooldown.</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>0 ≤ cooldown ≤ 1000</li><li>0 ≤ duration ≤ 1000</li></ul>`,
  },

  {
    slug: "dead-letter-queue",
    num: 8048,
    title: "Job Queue — Dead Letter Queue",
    difficulty: "Medium",
    tags: ["Job Queue", "Retry", "Dead Letter Queue"],
    fnName: "runDeadLetterQueue",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @param {number} maxAttempts
 * @return {{log: string[], deadLetter: string[]}}
 */
function runDeadLetterQueue(jobs, maxAttempts) {
  
}
`,
      ts: `function runDeadLetterQueue(jobs: Array<[string, number]>, maxAttempts: number): { log: string[]; deadLetter: string[] } {
  
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
        out: {
          log: ["a:fail", "b:ok", "a:ok"],
          deadLetter: [],
        },
      },
      {
        in: [
          [
            ["a", 2],
            ["b", 0],
          ],
          2,
        ],
        out: {
          log: ["a:fail", "b:ok", "a:dlq"],
          deadLetter: ["a"],
        },
      },
      {
        in: [[["a", 3]], 2],
        out: {
          log: ["a:fail", "a:dlq"],
          deadLetter: ["a"],
        },
      },
      {
        in: [[["a", 0]], 1],
        out: {
          log: ["a:ok"],
          deadLetter: [],
        },
      },
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
          ],
          2,
        ],
        out: {
          log: ["a:fail", "b:fail", "a:ok", "b:ok"],
          deadLetter: [],
        },
      },
      {
        in: [[], 3],
        out: {
          log: [],
          deadLetter: [],
        },
      },
    ],
    hints: [
      "A job that fails but still has attempts remaining goes back to the end of the queue.",
      "A job that fails on its final allowed attempt is not retried again; it is moved to the dead-letter queue.",
    ],
    desc: `<p>Simulate a FIFO job queue with retries and a dead-letter queue.</p><p>Each job is <code>[id, failuresNeeded]</code>. A job succeeds once it has been attempted more times than <code>failuresNeeded</code>. If a job fails but still has attempts left, it goes to the back of the queue.</p><p>If a job fails on its final allowed attempt, log <code>id:dlq</code> and append its id to <code>deadLetter</code>.</p><p>Return:</p><ul><li><code>log</code> — containing <code>id:fail</code>, <code>id:ok</code>, or <code>id:dlq</code> entries</li><li><code>deadLetter</code> — ids of jobs moved to the dead-letter queue, in the order they failed permanently</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>jobs = [['a',2],['b',0]], maxAttempts = 2</div><div><b>Output:</b>{log:['a:fail','b:ok','a:dlq'],deadLetter:['a']}</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>1 ≤ maxAttempts ≤ 10</li><li>0 ≤ failuresNeeded ≤ 10</li></ul>`,
  },

  {
    slug: "competing-consumers",
    num: 8050,
    title: "Async Queue — Competing Consumers",
    difficulty: "Hard",
    tags: ["Async Queue", "Concurrency", "Consumers", "Scheduling"],
    fnName: "competingConsumers",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} items
 * @param {number} consumers
 * @return {Array<{item: string, consumer: number, finish: number}>}
 */
function competingConsumers(items, consumers) {
  
}
`,
      ts: `function competingConsumers(items: Array<[string, number]>, consumers: number): Array<{ item: string; consumer: number; finish: number }> {
  
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
          { item: "b", consumer: 1, finish: 1 },
          { item: "a", consumer: 0, finish: 2 },
          { item: "c", consumer: 1, finish: 2 },
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
          { item: "a", consumer: 0, finish: 2 },
          { item: "b", consumer: 0, finish: 3 },
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
          { item: "a", consumer: 0, finish: 1 },
          { item: "b", consumer: 1, finish: 1 },
          { item: "c", consumer: 2, finish: 1 },
        ],
      },
      {
        in: [[], 4],
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
          { item: "b", consumer: 1, finish: 1 },
          { item: "c", consumer: 2, finish: 1 },
          { item: "d", consumer: 1, finish: 2 },
          { item: "a", consumer: 0, finish: 5 },
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
          { item: "x", consumer: 0, finish: 3 },
          { item: "y", consumer: 1, finish: 3 },
          { item: "z", consumer: 0, finish: 6 },
        ],
      },
    ],
    hints: [
      "Consumers pull from the same FIFO queue. The next item goes to the consumer that becomes idle earliest.",
      "If multiple consumers are idle at the same time, the lowest-index consumer takes the next item. Sort final output by finish time, then consumer id.",
    ],
    desc: `<p>Simulate multiple asynchronous consumers pulling from a shared FIFO queue.</p><p>Each item is <code>[id, duration]</code>. There are <code>consumers</code> consumers, indexed from <code>0</code>. Items are assigned in queue order to the consumer that becomes available earliest. If several consumers are available at the same time, the lowest-index consumer takes the next item.</p><p>Return completion records sorted by finish time. If finish times tie, sort by consumer id, then by original item order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>items = [['a',2],['b',1],['c',1]], consumers = 2</div><div><b>Output:</b>[{item:'b',consumer:1,finish:1},{item:'a',consumer:0,finish:2},{item:'c',consumer:1,finish:2}]</div></div><h4>Constraints</h4><ul><li>0 ≤ items.length ≤ 1000</li><li>1 ≤ consumers ≤ 100</li><li>1 ≤ duration ≤ 1000</li></ul>`,
  },
];
