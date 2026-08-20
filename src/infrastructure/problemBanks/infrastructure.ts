import type { ProblemDraft } from "@domain/Problem";

export const INFRASTRUCTURE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "token-bucket-rate-limiter",
    num: 8051,
    title: "Rate Limiter — Token Bucket",
    difficulty: "Medium",
    tags: ["Rate Limiting", "Infrastructure", "Simulation"],
    fnName: "tokenBucketLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} requests
 * @param {number} capacity
 * @param {number} refillPerUnit
 * @return {string[]}
 */
function tokenBucketLog(requests, capacity, refillPerUnit) {
  
}
`,
      ts: `function tokenBucketLog(requests: number[], capacity: number, refillPerUnit: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [[0, 0, 1, 1, 2], 2, 1],
        out: ["allow", "allow", "allow", "deny", "allow"],
      },
      {
        in: [[0, 1, 2, 3], 1, 1],
        out: ["allow", "allow", "allow", "allow"],
      },
      {
        in: [[0, 0, 0], 2, 10],
        out: ["allow", "allow", "deny"],
      },
      {
        in: [[], 5, 1],
        out: [],
      },
      {
        in: [[5], 1, 0],
        out: ["allow"],
      },
      {
        in: [[0, 2], 1, 0],
        out: ["allow", "deny"],
      },
    ],
    hints: [
      "Keep two pieces of state: the current token count and the last time you refilled.",
      "Before processing all requests at a given timestamp, add elapsed * refillPerUnit tokens, capped at capacity. Then process each request at that timestamp one by one.",
    ],
    desc: `<p>Simulate a token-bucket rate limiter.</p><p>The bucket starts full at time <code>0</code> with <code>capacity</code> tokens. Each request consumes one token. Tokens are added continuously at <code>refillPerUnit</code> tokens per time unit, but the bucket can never hold more than <code>capacity</code> tokens.</p><p>Implement <code>tokenBucketLog(requests, capacity, refillPerUnit)</code>. Each value in <code>requests</code> is an arrival time. Requests are processed in input order and arrive in nondecreasing time order. Before processing requests at a new timestamp, refill the bucket for the elapsed time. If at least one token is available, output <code>allow</code> and consume one token; otherwise output <code>deny</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>requests = [0,0,1,1,2], capacity = 2, refillPerUnit = 1</div><div><b>Output:</b>['allow','allow','allow','deny','allow']</div></div><h4>Constraints</h4><ul><li>0 ≤ requests.length ≤ 1000</li><li>0 ≤ requests[i] ≤ 10000</li><li>requests is nondecreasing</li><li>1 ≤ capacity ≤ 1000</li><li>0 ≤ refillPerUnit ≤ 1000</li></ul>`,
  },

  {
    slug: "circuit-breaker",
    num: 8052,
    title: "Circuit Breaker — State Machine",
    difficulty: "Hard",
    tags: ["Circuit Breaker", "Resilience", "Infrastructure"],
    fnName: "circuitBreakerLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[number, number]>} calls
 * @param {number} failureThreshold
 * @param {number} cooldown
 * @return {string[]}
 */
function circuitBreakerLog(calls, failureThreshold, cooldown) {
  
}
`,
      ts: `function circuitBreakerLog(calls: Array<[number, number]>, failureThreshold: number, cooldown: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [2, 1],
            [4, 1],
          ],
          2,
          2,
        ],
        out: [
          "closed:failure",
          "closed:failure",
          "open:rejected",
          "open:rejected",
          "half-open:success",
        ],
      },
      {
        in: [
          [
            [0, 0],
            [0, 0],
            [1, 1],
          ],
          3,
          1,
        ],
        out: ["closed:failure", "closed:failure", "closed:success"],
      },
      {
        in: [
          [
            [0, 0],
            [1, 1],
            [2, 1],
            [3, 1],
          ],
          1,
          2,
        ],
        out: [
          "closed:failure",
          "open:rejected",
          "half-open:success",
          "closed:success",
        ],
      },
      {
        in: [
          [
            [0, 0],
            [2, 0],
            [4, 1],
          ],
          1,
          2,
        ],
        out: ["closed:failure", "half-open:failure", "half-open:success"],
      },
      {
        in: [[], 3, 5],
        out: [],
      },
      {
        in: [
          [
            [0, 0],
            [1, 1],
            [2, 0],
            [3, 0],
          ],
          2,
          5,
        ],
        out: [
          "closed:failure",
          "closed:success",
          "closed:failure",
          "closed:failure",
        ],
      },
    ],
    hints: [
      "Track three states: closed, open, and half-open. In closed state, failures accumulate; successes reset the failure count.",
      "When the breaker is open, reject calls until cooldown has elapsed. Then move to half-open and let the next call decide: success closes the breaker, failure opens it again.",
    ],
    desc: `<p>Simulate a circuit breaker.</p><p>Each call is given as <code>[time, success]</code>, where <code>success</code> is <code>1</code> for success and <code>0</code> for failure. The breaker starts <code>closed</code>.</p><p>Rules:</p><ul><li>In <code>closed</code> state, a success resets the failure count and logs <code>closed:success</code>.</li><li>In <code>closed</code> state, a failure logs <code>closed:failure</code>. If the failure count reaches <code>failureThreshold</code>, the breaker becomes <code>open</code>.</li><li>In <code>open</code> state, calls are rejected and log <code>open:rejected</code>.</li><li>Once <code>cooldown</code> time units have passed since the breaker opened, the next call transitions it to <code>half-open</code> before processing.</li><li>In <code>half-open</code> state, success logs <code>half-open:success</code> and closes the breaker; failure logs <code>half-open:failure</code> and opens it again.</li></ul><p>Return the log entries in call order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>calls = [[0,0],[1,0],[1,1],[2,1],[4,1]], failureThreshold = 2, cooldown = 2</div><div><b>Output:</b>['closed:failure','closed:failure','open:rejected','open:rejected','half-open:success']</div></div><h4>Constraints</h4><ul><li>0 ≤ calls.length ≤ 1000</li><li>0 ≤ time ≤ 10000</li><li>success is 0 or 1</li><li>1 ≤ failureThreshold ≤ 10</li><li>0 ≤ cooldown ≤ 1000</li></ul>`,
  },

  {
    slug: "retry-with-exponential-backoff",
    num: 8053,
    title: "Retry — Exponential Backoff",
    difficulty: "Medium",
    tags: ["Retry", "Backoff", "Resilience"],
    fnName: "retryBackoffSchedule",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} failuresNeeded
 * @param {number} maxAttempts
 * @param {number} baseDelay
 * @return {{status: string, attempts: number, log: Array<{attempt: number, time: number, result: string}>}}
 */
function retryBackoffSchedule(failuresNeeded, maxAttempts, baseDelay) {
  
}
`,
      ts: `function retryBackoffSchedule(failuresNeeded: number, maxAttempts: number, baseDelay: number): { status: string; attempts: number; log: Array<{ attempt: number; time: number; result: string }> } {
  
}
`,
    },
    tests: [
      {
        in: [0, 3, 1],
        out: {
          status: "success",
          attempts: 1,
          log: [{ attempt: 1, time: 0, result: "ok" }],
        },
      },
      {
        in: [2, 5, 1],
        out: {
          status: "success",
          attempts: 3,
          log: [
            { attempt: 1, time: 0, result: "fail" },
            { attempt: 2, time: 1, result: "fail" },
            { attempt: 3, time: 3, result: "ok" },
          ],
        },
      },
      {
        in: [5, 3, 2],
        out: {
          status: "failed",
          attempts: 3,
          log: [
            { attempt: 1, time: 0, result: "fail" },
            { attempt: 2, time: 2, result: "fail" },
            { attempt: 3, time: 6, result: "fail" },
          ],
        },
      },
      {
        in: [1, 1, 5],
        out: {
          status: "failed",
          attempts: 1,
          log: [{ attempt: 1, time: 0, result: "fail" }],
        },
      },
      {
        in: [3, 4, 0],
        out: {
          status: "success",
          attempts: 4,
          log: [
            { attempt: 1, time: 0, result: "fail" },
            { attempt: 2, time: 0, result: "fail" },
            { attempt: 3, time: 0, result: "fail" },
            { attempt: 4, time: 0, result: "ok" },
          ],
        },
      },
      {
        in: [1, 2, 3],
        out: {
          status: "success",
          attempts: 2,
          log: [
            { attempt: 1, time: 0, result: "fail" },
            { attempt: 2, time: 3, result: "ok" },
          ],
        },
      },
    ],
    hints: [
      "Attempt 1 happens at time 0. If attempt i fails, the next attempt waits baseDelay * 2^(i-1).",
      "The simulated operation fails exactly failuresNeeded times, then succeeds on the following attempt unless maxAttempts is reached first.",
    ],
    desc: `<p>Simulate retry with exponential backoff.</p><p>The operation fails <code>failuresNeeded</code> times and then succeeds. Attempt <code>1</code> starts at time <code>0</code>. If attempt <code>i</code> fails, wait <code>baseDelay * 2^(i-1)</code> time units before attempt <code>i+1</code>.</p><p>Stop as soon as the operation succeeds or when <code>maxAttempts</code> attempts have been made.</p><p>Return:</p><ul><li><code>status</code> — <code>success</code> or <code>failed</code></li><li><code>attempts</code> — number of attempts made</li><li><code>log</code> — records with <code>attempt</code>, <code>time</code>, and <code>result</code> (<code>ok</code> or <code>fail</code>)</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>failuresNeeded = 2, maxAttempts = 5, baseDelay = 1</div><div><b>Output:</b>{status:'success',attempts:3,log:[{attempt:1,time:0,result:'fail'},{attempt:2,time:1,result:'fail'},{attempt:3,time:3,result:'ok'}]}</div></div><h4>Constraints</h4><ul><li>0 ≤ failuresNeeded ≤ 20</li><li>1 ≤ maxAttempts ≤ 10</li><li>0 ≤ baseDelay ≤ 100</li></ul>`,
  },

  {
    slug: "idempotent-job-processing",
    num: 8054,
    title: "Idempotent Job Processing",
    difficulty: "Easy",
    tags: ["Idempotency", "Job Processing", "Infrastructure"],
    fnName: "idempotentJobLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} jobs
 * @return {string[]}
 */
function idempotentJobLog(jobs) {
  
}
`,
      ts: `function idempotentJobLog(jobs: Array<[string, number]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 1],
            ["a", 1],
            ["b", 0],
            ["b", 1],
            ["b", 1],
          ],
        ],
        out: ["a:processed", "a:cached", "b:failed", "b:processed", "b:cached"],
      },
      {
        in: [[]],
        out: [],
      },
      {
        in: [
          [
            ["x", 0],
            ["x", 0],
          ],
        ],
        out: ["x:failed", "x:failed"],
      },
      {
        in: [
          [
            ["x", 1],
            ["x", 0],
          ],
        ],
        out: ["x:processed", "x:cached"],
      },
      {
        in: [
          [
            ["a", 0],
            ["a", 1],
            ["a", 0],
          ],
        ],
        out: ["a:failed", "a:processed", "a:cached"],
      },
      {
        in: [
          [
            ["a", 1],
            ["b", 1],
            ["a", 1],
          ],
        ],
        out: ["a:processed", "b:processed", "a:cached"],
      },
    ],
    hints: [
      "Once a job has been processed successfully, later submissions of the same job id must return the cached result instead of processing again.",
      "Failed attempts do not mark the job as completed, so the same job id may be retried later.",
    ],
    desc: `<p>Simulate idempotent job processing.</p><p>Each event is <code>[jobId, success]</code>, where <code>success</code> is <code>1</code> if this processing attempt would succeed and <code>0</code> if it would fail.</p><p>Rules:</p><ul><li>If the job id has already been processed successfully, log <code>jobId:cached</code> and do not process it again.</li><li>Otherwise, attempt to process it. If it succeeds, log <code>jobId:processed</code> and remember that this job id is completed.</li><li>If it fails, log <code>jobId:failed</code> and do not mark it completed.</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['a',1],['a',1],['b',0],['b',1],['b',1]]</div><div><b>Output:</b>['a:processed','a:cached','b:failed','b:processed','b:cached']</div></div><h4>Constraints</h4><ul><li>0 ≤ jobs.length ≤ 1000</li><li>jobId is a string</li><li>success is 0 or 1</li></ul>`,
  },

  {
    slug: "async-mutex",
    num: 8055,
    title: "Async Mutex — Critical Section Scheduling",
    difficulty: "Medium",
    tags: ["Mutex", "Concurrency", "Infrastructure"],
    fnName: "mutexSchedule",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number, number]>} requests
 * @return {Array<{id: string, start: number, finish: number}>}
 */
function mutexSchedule(requests) {
  
}
`,
      ts: `function mutexSchedule(requests: Array<[string, number, number]>): Array<{ id: string; start: number; finish: number }> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 0, 2],
            ["b", 1, 1],
            ["c", 2, 1],
          ],
        ],
        out: [
          { id: "a", start: 0, finish: 2 },
          { id: "b", start: 2, finish: 3 },
          { id: "c", start: 3, finish: 4 },
        ],
      },
      {
        in: [
          [
            ["a", 0, 1],
            ["b", 5, 1],
          ],
        ],
        out: [
          { id: "a", start: 0, finish: 1 },
          { id: "b", start: 5, finish: 6 },
        ],
      },
      {
        in: [
          [
            ["a", 0, 1],
            ["b", 0, 1],
            ["c", 0, 1],
          ],
        ],
        out: [
          { id: "a", start: 0, finish: 1 },
          { id: "b", start: 1, finish: 2 },
          { id: "c", start: 2, finish: 3 },
        ],
      },
      {
        in: [[]],
        out: [],
      },
      {
        in: [
          [
            ["late", 5, 1],
            ["early", 0, 2],
          ],
        ],
        out: [
          { id: "early", start: 0, finish: 2 },
          { id: "late", start: 5, finish: 6 },
        ],
      },
      {
        in: [
          [
            ["a", 1, 2],
            ["b", 0, 5],
            ["c", 1, 1],
          ],
        ],
        out: [
          { id: "b", start: 0, finish: 5 },
          { id: "a", start: 5, finish: 7 },
          { id: "c", start: 7, finish: 8 },
        ],
      },
    ],
    hints: [
      "A mutex allows only one critical section to run at a time. Sort requests by arrival time; if arrival times tie, preserve original input order.",
      "For each request in that order, start it at max(arrival, mutexAvailableTime), then update mutexAvailableTime to the finish time.",
    ],
    desc: `<p>Simulate an asynchronous mutex protecting a critical section.</p><p>Each request is <code>[id, arrival, duration]</code>. Requests may be given out of order. Sort them by arrival time; if two requests arrive at the same time, preserve their original input order.</p><p>The mutex is initially free. A request starts when both are true:</p><ul><li>its arrival time has been reached</li><li>the mutex is free</li></ul><p>Return records in the order the mutex is acquired: <code>{ id, start, finish }</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['a',0,2],['b',1,1],['c',2,1]]</div><div><b>Output:</b>[{id:'a',start:0,finish:2},{id:'b',start:2,finish:3},{id:'c',start:3,finish:4}]</div></div><h4>Constraints</h4><ul><li>0 ≤ requests.length ≤ 1000</li><li>0 ≤ arrival ≤ 10000</li><li>0 ≤ duration ≤ 1000</li><li>Ids are strings</li></ul>`,
  },

  {
    slug: "shared-queue-with-ack-nack",
    num: 8056,
    title: "Shared Queue — Ack/Nack",
    difficulty: "Medium",
    tags: ["Queue", "Messaging", "Ack/Nack", "Infrastructure"],
    fnName: "sharedAckNackLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<Array<*>>} actions
 * @return {string[]}
 */
function sharedAckNackLog(actions) {
  
}
`,
      ts: `function sharedAckNackLog(actions: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["enqueue", "a"],
            ["enqueue", "b"],
            ["deliver"],
            ["deliver"],
            ["ack", "a"],
            ["nack", "b"],
            ["deliver"],
            ["ack", "b"],
          ],
        ],
        out: [
          "enqueue:a",
          "enqueue:b",
          "deliver:a",
          "deliver:b",
          "ack:a",
          "nack:b",
          "deliver:b",
          "ack:b",
        ],
      },
      {
        in: [[["deliver"]]],
        out: ["deliver:empty"],
      },
      {
        in: [[["ack", "a"]]],
        out: ["ack:noop"],
      },
      {
        in: [[["nack", "a"]]],
        out: ["nack:noop"],
      },
      {
        in: [
          [
            ["enqueue", "x"],
            ["deliver"],
            ["nack", "x"],
            ["deliver"],
            ["ack", "x"],
          ],
        ],
        out: ["enqueue:x", "deliver:x", "nack:x", "deliver:x", "ack:x"],
      },
      {
        in: [
          [
            ["enqueue", "a"],
            ["enqueue", "b"],
            ["deliver"],
            ["deliver"],
            ["nack", "a"],
            ["deliver"],
            ["ack", "b"],
            ["deliver"],
          ],
        ],
        out: [
          "enqueue:a",
          "enqueue:b",
          "deliver:a",
          "deliver:b",
          "nack:a",
          "deliver:a",
          "ack:b",
          "deliver:empty",
        ],
      },
    ],
    hints: [
      "Keep two collections: a ready queue and an in-flight set. deliver moves the front ready message to in-flight.",
      "ack removes an in-flight message permanently. nack removes it from in-flight and puts it at the back of the ready queue.",
    ],
    desc: `<p>Simulate a shared message queue with <code>ack</code> and <code>nack</code> semantics.</p><p>Supported actions:</p><ul><li><code>['enqueue', id]</code> — add a message to the ready queue and log <code>enqueue:id</code></li><li><code>['deliver']</code> — if the ready queue is empty, log <code>deliver:empty</code>; otherwise remove the front message from the ready queue, move it to in-flight, and log <code>deliver:id</code></li><li><code>['ack', id]</code> — if <code>id</code> is in-flight, remove it permanently and log <code>ack:id</code>; otherwise log <code>ack:noop</code></li><li><code>['nack', id]</code> — if <code>id</code> is in-flight, move it to the back of the ready queue and log <code>nack:id</code>; otherwise log <code>nack:noop</code></li></ul><p>Messages may be delivered multiple times if they are nacked.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['enqueue','a'],['enqueue','b'],['deliver'],['deliver'],['ack','a'],['nack','b'],['deliver'],['ack','b']]</div><div><b>Output:</b>['enqueue:a','enqueue:b','deliver:a','deliver:b','ack:a','nack:b','deliver:b','ack:b']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Message ids are strings</li><li>Tests will not enqueue the same active id twice before it is acked or nacked back into the queue</li></ul>`,
  },
];
