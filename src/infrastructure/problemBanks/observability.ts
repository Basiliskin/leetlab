import type { ProblemDraft } from "@domain/Problem";

export const OBSERVABILITY_PROBLEMS: ProblemDraft[] = [
  {
    slug: "request-trace-span-tree",
    num: 8063,
    title: "Request Trace — Span Tree Order",
    difficulty: "Medium",
    tags: ["Observability", "Tracing", "Tree"],
    fnName: "traceSpanOrder",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, string | null, number, number]>} spans
 * @return {string[]}
 */
function traceSpanOrder(spans) {
  
}
`,
      ts: `function traceSpanOrder(spans: Array<[string, string | null, number, number]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", null, 0, 10],
            ["b", "a", 1, 4],
            ["c", "a", 2, 3],
            ["d", "b", 2, 1],
          ],
        ],
        out: ["a", "b", "d", "c"],
      },
      {
        in: [
          [
            ["r", null, 0, 5],
            ["b", "r", 1, 1],
            ["a", "r", 1, 1],
          ],
        ],
        out: ["r", "a", "b"],
      },
      {
        in: [
          [
            ["x", null, 2, 1],
            ["y", null, 0, 1],
            ["z", "y", 1, 1],
          ],
        ],
        out: ["y", "z", "x"],
      },
      {
        in: [[]],
        out: [],
      },
      {
        in: [[["root", null, 0, 1]]],
        out: ["root"],
      },
      {
        in: [
          [
            ["p", null, 0, 10],
            ["c1", "p", 5, 1],
            ["c2", "p", 3, 1],
            ["c3", "p", 3, 1],
          ],
        ],
        out: ["p", "c2", "c3", "c1"],
      },
    ],
    hints: [
      "Build a parent-to-children map. Roots are spans whose parentId is null.",
      "Sort each group of siblings by start time ascending, breaking ties by span id ascending. Then return a depth-first preorder traversal of the span forest.",
    ],
    desc: `<p>You are given a flat list of trace spans. Each span is <code>[spanId, parentId, start, duration]</code>. A span with <code>parentId = null</code> is a root span.</p><p>Reconstruct the span tree and return the span ids in <strong>depth-first preorder</strong>. Sibling spans must be ordered by <code>start</code> ascending. If two siblings have the same start time, order them by <code>spanId</code> ascending. If there are multiple root spans, order the roots the same way.</p><p>The duration is part of the span data but is not needed for ordering in this problem.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>spans = [['a',null,0,10],['b','a',1,4],['c','a',2,3],['d','b',2,1]]</div><div><b>Output:</b>['a','b','d','c']</div><div class="exp">b starts before c, and d is inside b.</div></div><h4>Constraints</h4><ul><li>0 ≤ spans.length ≤ 1000</li><li>Span ids are unique strings</li><li>Parent ids refer to existing spans or are null</li><li>Start and duration are non-negative integers</li></ul>`,
  },

  {
    slug: "structured-log-level-filter",
    num: 8064,
    title: "Structured Logs — Level and Scope Filter",
    difficulty: "Easy",
    tags: ["Observability", "Logging", "Filtering"],
    fnName: "filterLogs",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, string, string]>} logs
 * @param {string} minLevel
 * @param {string} scopePrefix
 * @return {Array<[string, string, string]>}
 */
function filterLogs(logs, minLevel, scopePrefix) {
  
}
`,
      ts: `function filterLogs(logs: Array<[string, string, string]>, minLevel: string, scopePrefix: string): Array<[string, string, string]> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["debug", "db", "connect"],
            ["info", "db.query", "run"],
            ["warn", "api", "slow"],
            ["error", "api.auth", "fail"],
          ],
          "info",
          "api",
        ],
        out: [
          ["warn", "api", "slow"],
          ["error", "api.auth", "fail"],
        ],
      },
      {
        in: [
          [
            ["debug", "db", "x"],
            ["info", "db", "y"],
            ["warn", "db.query", "z"],
            ["error", "api", "e"],
          ],
          "warn",
          "db",
        ],
        out: [["warn", "db.query", "z"]],
      },
      {
        in: [
          [
            ["info", "a", "1"],
            ["error", "b", "2"],
          ],
          "error",
          "",
        ],
        out: [["error", "b", "2"]],
      },
      {
        in: [[], "debug", ""],
        out: [],
      },
      {
        in: [
          [
            ["debug", "x", "1"],
            ["info", "y", "2"],
          ],
          "debug",
          "",
        ],
        out: [
          ["debug", "x", "1"],
          ["info", "y", "2"],
        ],
      },
      {
        in: [
          [
            ["info", "api", "a"],
            ["info", "apix", "b"],
            ["info", "api.v2", "c"],
          ],
          "debug",
          "api",
        ],
        out: [
          ["info", "api", "a"],
          ["info", "api.v2", "c"],
        ],
      },
    ],
    hints: [
      "Map levels to ranks: debug < info < warn < error. Keep entries whose rank is at least the minimum rank.",
      'A scope matches the prefix when it is exactly the prefix, or when it starts with prefix + ".". An empty prefix matches every scope.',
    ],
    desc: `<p>Filter structured log entries by level and scope.</p><p>Each log entry is <code>[level, scope, message]</code>. Levels are ordered:</p><ul><li><code>debug</code></li><li><code>info</code></li><li><code>warn</code></li><li><code>error</code></li></ul><p>Keep a log entry when both are true:</p><ul><li>its level is at least <code>minLevel</code></li><li>its scope matches <code>scopePrefix</code></li></ul><p>A scope matches <code>scopePrefix</code> if it is exactly equal to the prefix, or if it begins with <code>prefix + '.'</code>. If <code>scopePrefix</code> is an empty string, every scope matches.</p><p>Return the matching log entries in their original order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>logs = [['debug','db','connect'],['info','db.query','run'],['warn','api','slow'],['error','api.auth','fail']], minLevel = 'info', scopePrefix = 'api'</div><div><b>Output:</b>[['warn','api','slow'],['error','api.auth','fail']]</div></div><h4>Constraints</h4><ul><li>0 ≤ logs.length ≤ 1000</li><li>level is one of debug, info, warn, error</li><li>scope and message are strings</li></ul>`,
  },

  {
    slug: "metric-window-percentile",
    num: 8065,
    title: "Metrics — Rolling Window Percentile",
    difficulty: "Medium",
    tags: ["Observability", "Metrics", "Sliding Window", "Percentile"],
    fnName: "metricWindowPercentile",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} values
 * @param {number} k
 * @param {number} p
 * @return {number[]}
 */
function metricWindowPercentile(values, k, p) {
  
}
`,
      ts: `function metricWindowPercentile(values: number[], k: number, p: number): number[] {
  
}
`,
    },
    tests: [
      {
        in: [[1, 2, 3, 4, 5], 3, 50],
        out: [2, 3, 4],
      },
      {
        in: [[10], 1, 50],
        out: [10],
      },
      {
        in: [[5, 1, 4, 2], 2, 100],
        out: [5, 4, 4],
      },
      {
        in: [[3, 1, 2], 2, 0],
        out: [1, 1],
      },
      {
        in: [[1, 2], 3, 50],
        out: [],
      },
      {
        in: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10, 95],
        out: [10],
      },
    ],
    hints: [
      "Emit one value for each full window of size k. If values is shorter than k, return an empty array.",
      "For each window, sort the k values and use the nearest-rank rule: rank = ceil(p / 100 * k), clamped to at least 1. The answer is the sorted value at index rank - 1.",
    ],
    desc: `<p>Compute a rolling percentile over a metric stream.</p><p>Given <code>values</code>, window size <code>k</code>, and percentile <code>p</code>, return one percentile value for each full window of <code>k</code> consecutive values.</p><p>Use the <strong>nearest-rank percentile</strong> rule:</p><ul><li>sort the window ascending</li><li>compute <code>rank = ceil(p / 100 * k)</code></li><li>if rank is less than 1, use 1</li><li>take the value at index <code>rank - 1</code></li></ul><p>So <code>p = 0</code> gives the window minimum and <code>p = 100</code> gives the window maximum.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>values = [1,2,3,4,5], k = 3, p = 50</div><div><b>Output:</b>[2,3,4]</div><div class="exp">Windows: [1,2,3] → 2, [2,3,4] → 3, [3,4,5] → 4.</div></div><h4>Constraints</h4><ul><li>0 ≤ values.length ≤ 1000</li><li>1 ≤ k ≤ 1000</li><li>0 ≤ p ≤ 100</li><li>values are integers</li></ul>`,
  },

  {
    slug: "health-check-debounce",
    num: 8066,
    title: "Health Check — Debounced State",
    difficulty: "Medium",
    tags: ["Observability", "Health Check", "Debounce"],
    fnName: "healthCheckLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} checks
 * @param {number} threshold
 * @return {string[]}
 */
function healthCheckLog(checks, threshold) {
  
}
`,
      ts: `function healthCheckLog(checks: number[], threshold: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [[0, 0, 1, 1, 0], 2],
        out: ["healthy", "unhealthy", "unhealthy", "healthy", "healthy"],
      },
      {
        in: [[0, 1, 0], 1],
        out: ["unhealthy", "healthy", "unhealthy"],
      },
      {
        in: [[1, 1, 1], 3],
        out: ["healthy", "healthy", "healthy"],
      },
      {
        in: [[], 2],
        out: [],
      },
      {
        in: [[0, 1, 0, 0], 2],
        out: ["healthy", "healthy", "healthy", "unhealthy"],
      },
      {
        in: [[1, 0], 1],
        out: ["healthy", "unhealthy"],
      },
    ],
    hints: [
      "Start in the healthy state. Track consecutive successes and consecutive failures separately.",
      "A state change happens only after threshold consecutive checks in the opposite direction. Any opposite check resets the streak.",
    ],
    desc: `<p>Simulate a debounced health-check state machine.</p><p><code>checks</code> is a sequence of health-check results: <code>1</code> means success and <code>0</code> means failure. The service starts <code>healthy</code>.</p><p>To prevent flapping, the state changes only after <code>threshold</code> consecutive results:</p><ul><li>while healthy, <code>threshold</code> consecutive failures make it unhealthy</li><li>while unhealthy, <code>threshold</code> consecutive successes make it healthy</li></ul><p>After each check, return the current state.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>checks = [0,0,1,1,0], threshold = 2</div><div><b>Output:</b>['healthy','unhealthy','unhealthy','healthy','healthy']</div><div class="exp">Two failures flip the state to unhealthy. Two successes later flip it back.</div></div><h4>Constraints</h4><ul><li>0 ≤ checks.length ≤ 1000</li><li>checks[i] is 0 or 1</li><li>1 ≤ threshold ≤ 10</li></ul>`,
  },

  {
    slug: "retry-budget",
    num: 8067,
    title: "Retry Budget",
    difficulty: "Medium",
    tags: ["Observability", "Retry", "Resilience", "Production Debugging"],
    fnName: "retryBudgetLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @param {number} maxAttempts
 * @param {number} retryBudget
 * @return {{log: string[], retriesUsed: number}}
 */
function retryBudgetLog(jobs, maxAttempts, retryBudget) {
  
}
`,
      ts: `function retryBudgetLog(jobs: Array<[string, number]>, maxAttempts: number, retryBudget: number): { log: string[]; retriesUsed: number } {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
          ],
          2,
          1,
        ],
        out: {
          log: ["a:fail", "a:ok", "b:fail", "b:exhausted"],
          retriesUsed: 1,
        },
      },
      {
        in: [[["a", 1]], 2, 0],
        out: {
          log: ["a:fail", "a:exhausted"],
          retriesUsed: 0,
        },
      },
      {
        in: [[["a", 0]], 3, 5],
        out: {
          log: ["a:ok"],
          retriesUsed: 0,
        },
      },
      {
        in: [[["a", 2]], 3, 2],
        out: {
          log: ["a:fail", "a:fail", "a:ok"],
          retriesUsed: 2,
        },
      },
      {
        in: [[["a", 2]], 3, 1],
        out: {
          log: ["a:fail", "a:fail", "a:exhausted"],
          retriesUsed: 1,
        },
      },
      {
        in: [[], 3, 3],
        out: {
          log: [],
          retriesUsed: 0,
        },
      },
    ],
    hints: [
      "The first attempt for each job is free. Only retry attempts consume the shared retry budget.",
      "A job is exhausted when it fails and cannot receive another retry because either maxAttempts is reached or the retry budget is empty.",
    ],
    desc: `<p>Simulate a global retry budget.</p><p>Each job is <code>[id, failuresNeeded]</code>. A job succeeds once it has been attempted more times than <code>failuresNeeded</code>. Jobs are processed one at a time in input order.</p><p>Rules:</p><ul><li>The first attempt does not consume retry budget.</li><li>Each retry attempt consumes one unit of <code>retryBudget</code>.</li><li>A job may have at most <code>maxAttempts</code> total attempts.</li><li>If a job fails and cannot retry, log <code>id:exhausted</code>.</li></ul><p>Return:</p><ul><li><code>log</code> — containing <code>id:fail</code>, <code>id:ok</code>, and <code>id:exhausted</code> entries</li><li><code>retriesUsed</code> — total retry budget consumed</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>jobs = [['a',1],['b',1]], maxAttempts = 2, retryBudget = 1</div><div><b>Output:</b>{log:['a:fail','a:ok','b:fail','b:exhausted'],retriesUsed:1}</div><div class="exp">a uses the only retry. b fails and cannot retry.</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>1 ≤ maxAttempts ≤ 10</li><li>0 ≤ retryBudget ≤ 1000</li><li>0 ≤ failuresNeeded ≤ 10</li></ul>`,
  },

  {
    slug: "circuit-breaker-metrics",
    num: 8068,
    title: "Circuit Breaker — Rolling Metrics",
    difficulty: "Medium",
    tags: ["Observability", "Circuit Breaker", "Metrics", "Sliding Window"],
    fnName: "circuitBreakerMetrics",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[number, string]>} events
 * @param {number} windowSize
 * @return {Array<{success: number, failure: number, rejected: number}>}
 */
function circuitBreakerMetrics(events, windowSize) {
  
}
`,
      ts: `function circuitBreakerMetrics(events: Array<[number, string]>, windowSize: number): Array<{ success: number; failure: number; rejected: number }> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            [0, "success"],
            [1, "failure"],
            [2, "rejected"],
            [3, "success"],
          ],
          2,
        ],
        out: [
          { success: 1, failure: 0, rejected: 0 },
          { success: 1, failure: 1, rejected: 0 },
          { success: 0, failure: 1, rejected: 1 },
          { success: 1, failure: 0, rejected: 1 },
        ],
      },
      {
        in: [
          [
            [0, "success"],
            [0, "failure"],
            [1, "rejected"],
          ],
          1,
        ],
        out: [
          { success: 1, failure: 0, rejected: 0 },
          { success: 1, failure: 1, rejected: 0 },
          { success: 0, failure: 0, rejected: 1 },
        ],
      },
      {
        in: [[], 5],
        out: [],
      },
      {
        in: [
          [
            [0, "success"],
            [1, "success"],
            [2, "failure"],
          ],
          5,
        ],
        out: [
          { success: 1, failure: 0, rejected: 0 },
          { success: 2, failure: 0, rejected: 0 },
          { success: 2, failure: 1, rejected: 0 },
        ],
      },
      {
        in: [
          [
            [0, "success"],
            [10, "failure"],
          ],
          5,
        ],
        out: [
          { success: 1, failure: 0, rejected: 0 },
          { success: 0, failure: 1, rejected: 0 },
        ],
      },
      {
        in: [
          [
            [5, "rejected"],
            [6, "rejected"],
          ],
          10,
        ],
        out: [
          { success: 0, failure: 0, rejected: 1 },
          { success: 0, failure: 0, rejected: 2 },
        ],
      },
    ],
    hints: [
      "After each event, count only events in the time window [t - windowSize + 1, t], where t is the current event time.",
      "Events are given in nondecreasing time order. You can slide a left pointer forward as the window lower bound increases.",
    ],
    desc: `<p>Compute rolling circuit-breaker metrics.</p><p>Each event is <code>[time, outcome]</code>, where outcome is one of:</p><ul><li><code>'success'</code></li><li><code>'failure'</code></li><li><code>'rejected'</code></li></ul><p>After each event, compute the counts of each outcome within the rolling time window:</p><p><code>[currentTime - windowSize + 1, currentTime]</code></p><p>Return one record per event:</p><ul><li><code>success</code> — successes in the window</li><li><code>failure</code> — failures in the window</li><li><code>rejected</code> — rejected calls in the window</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>events = [[0,'success'],[1,'failure'],[2,'rejected'],[3,'success']], windowSize = 2</div><div><b>Output:</b>[{success:1,failure:0,rejected:0},{success:1,failure:1,rejected:0},{success:0,failure:1,rejected:1},{success:1,failure:0,rejected:1}]</div></div><h4>Constraints</h4><ul><li>0 ≤ events.length ≤ 1000</li><li>0 ≤ time ≤ 10000</li><li>1 ≤ windowSize ≤ 1000</li><li>Events are sorted by time</li><li>outcome is success, failure, or rejected</li></ul>`,
  },
];
