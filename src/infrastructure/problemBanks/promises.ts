import type { ProblemDraft } from "@domain/Problem";

export const PROMISE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "promise-settle-all",
    num: 8032,
    title: "Promise — Settle All",
    difficulty: "Medium",
    tags: ["Promise", "Combinators", "Error Handling"],
    fnName: "settleAll",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} nums
 * @return {Promise<Array<{status: string, value?: number, reason?: number}>>}
 */
function settleAll(nums) {
  
}
`,
      ts: `function settleAll(nums: number[]): Promise<Array<{ status: string; value?: number; reason?: number }>> {
  
}
`,
    },
    tests: [
      {
        in: [[1, -2, 3]],
        out: [
          { status: "fulfilled", value: 1 },
          { status: "rejected", reason: -2 },
          { status: "fulfilled", value: 3 },
        ],
      },
      { in: [[]], out: [] },
      {
        in: [[-1, -2]],
        out: [
          { status: "rejected", reason: -1 },
          { status: "rejected", reason: -2 },
        ],
      },
      {
        in: [[0]],
        out: [{ status: "fulfilled", value: 0 }],
      },
      {
        in: [[5, -5, 10]],
        out: [
          { status: "fulfilled", value: 5 },
          { status: "rejected", reason: -5 },
          { status: "fulfilled", value: 10 },
        ],
      },
      {
        in: [[-1, 0, 1]],
        out: [
          { status: "rejected", reason: -1 },
          { status: "fulfilled", value: 0 },
          { status: "fulfilled", value: 1 },
        ],
      },
    ],
    hints: [
      "A rejected promise should not reject the whole combinator. Every input must produce a result record.",
      "For each number, create a promise that resolves when the number is non-negative and rejects when it is negative. Then settle every promise independently and preserve input order.",
    ],
    desc: `<p>Implement <code>settleAll(nums)</code>. For each number, create an asynchronous step that resolves with the number when it is non-negative and rejects with the number when it is negative.</p><p>Return a promise that resolves to an array of result records in input order:</p><ul><li><code>{ status: 'fulfilled', value }</code> for successful steps</li><li><code>{ status: 'rejected', reason }</code> for failed steps</li></ul><p class="note">Judge protocol: your function's return value is awaited before comparison.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>settleAll([1, -2, 3])</div><div><b>Output:</b>[{status:'fulfilled',value:1},{status:'rejected',reason:-2},{status:'fulfilled',value:3}]</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>-10<sup>6</sup> ≤ nums[i] ≤ 10<sup>6</sup></li></ul>`,
  },

  {
    slug: "promise-first-success",
    num: 8033,
    title: "Promise — First Success",
    difficulty: "Medium",
    tags: ["Promise", "Combinators", "Race"],
    fnName: "firstSuccess",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} nums
 * @return {Promise<number | 'NONE'>}
 */
function firstSuccess(nums) {
  
}
`,
      ts: `function firstSuccess(nums: number[]): Promise<number | 'NONE'> {
  
}
`,
    },
    tests: [
      { in: [[-1, 2, 3]], out: 2 },
      { in: [[2, 3]], out: 2 },
      { in: [[-1, -2]], out: "NONE" },
      { in: [[]], out: "NONE" },
      { in: [[-1, 0, 1]], out: 0 },
      { in: [[-2, -1, 5]], out: 5 },
    ],
    hints: [
      "This is the Promise.any pattern: the first fulfilled promise wins, rejected promises are ignored.",
      "Only when every promise rejects should the result become NONE.",
    ],
    desc: `<p>Implement <code>firstSuccess(nums)</code>. For each number, create an asynchronous step that resolves with the number when it is non-negative and rejects with the number when it is negative.</p><p>Return the first fulfilled value. If every step rejects, return <code>'NONE'</code>.</p><p class="note">Judge protocol: your function's return value is awaited before comparison.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>firstSuccess([-1, 2, 3])</div><div><b>Output:</b>2</div></div><div class="ex"><div><b>Input:</b>firstSuccess([-1, -2])</div><div><b>Output:</b>'NONE'</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>-10<sup>6</sup> ≤ nums[i] ≤ 10<sup>6</sup></li></ul>`,
  },

  {
    slug: "promise-timeout-race",
    num: 8034,
    title: "Promise — Timeout Race",
    difficulty: "Medium",
    tags: ["Promise", "Race", "Timeout"],
    fnName: "raceTimeout",
    mode: "fn",
    starter: {
      js: `/**
 * @param {*} value
 * @param {number} delay
 * @param {number} timeout
 * @return {Promise<*>}
 */
function raceTimeout(value, delay, timeout) {
  
}
`,
      ts: `function raceTimeout(value: unknown, delay: number, timeout: number): Promise<unknown> {
  
}
`,
    },
    tests: [
      { in: ["hello", 5, 20], out: "hello" },
      { in: ["hello", 20, 5], out: "TIMEOUT" },
      { in: [42, 10, 30], out: 42 },
      { in: [42, 30, 10], out: "TIMEOUT" },
      { in: [null, 5, 20], out: null },
    ],
    hints: [
      "Use Promise.race between the value promise and a timeout promise.",
      "The timeout promise should resolve with TIMEOUT. For production quality, clear the timer after the value promise wins.",
    ],
    desc: `<p>Implement <code>raceTimeout(value, delay, timeout)</code>. Return a promise that resolves to <code>value</code> if the value promise settles before <code>timeout</code> milliseconds elapse.</p><p>If the timeout happens first, resolve with <code>'TIMEOUT'</code>.</p><p class="note">Judge protocol: your function's return value is awaited before comparison. Tests avoid exact delay/timeout ties.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>raceTimeout('hello', 5, 20)</div><div><b>Output:</b>'hello'</div></div><div class="ex"><div><b>Input:</b>raceTimeout('hello', 20, 5)</div><div><b>Output:</b>'TIMEOUT'</div></div><h4>Constraints</h4><ul><li>0 ≤ delay ≤ 50</li><li>0 ≤ timeout ≤ 50</li></ul>`,
  },

  {
    slug: "promise-retry-until-success",
    num: 8035,
    title: "Promise — Retry Until Success",
    difficulty: "Medium",
    tags: ["Promise", "Retry", "Resilience"],
    fnName: "retryUntilSuccess",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} failures
 * @param {number} maxAttempts
 * @return {Promise<{status: string, attempts: number}>}
 */
function retryUntilSuccess(failures, maxAttempts) {
  
}
`,
      ts: `function retryUntilSuccess(failures: number, maxAttempts: number): Promise<{ status: string; attempts: number }> {
  
}
`,
    },
    tests: [
      { in: [0, 3], out: { status: "success", attempts: 1 } },
      { in: [2, 3], out: { status: "success", attempts: 3 } },
      { in: [3, 3], out: { status: "failed", attempts: 3 } },
      { in: [5, 2], out: { status: "failed", attempts: 2 } },
      { in: [1, 1], out: { status: "failed", attempts: 1 } },
      { in: [0, 1], out: { status: "success", attempts: 1 } },
    ],
    hints: [
      "Keep an attempt counter. Each attempt is an asynchronous step that either resolves or rejects.",
      "Stop as soon as one attempt succeeds. If maxAttempts is exhausted, return the failed result.",
    ],
    desc: `<p>Simulate an unreliable asynchronous operation. The operation fails <code>failures</code> times and then succeeds.</p><p>Implement <code>retryUntilSuccess(failures, maxAttempts)</code>. Try the operation until it succeeds or until <code>maxAttempts</code> attempts have been used.</p><p>Return:</p><ul><li><code>{ status: 'success', attempts }</code> if it succeeds</li><li><code>{ status: 'failed', attempts }</code> if it never succeeds</li></ul><p class="note">Judge protocol: your function's return value is awaited before comparison.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>retryUntilSuccess(2, 3)</div><div><b>Output:</b>{status:'success',attempts:3}</div></div><div class="ex"><div><b>Input:</b>retryUntilSuccess(3, 3)</div><div><b>Output:</b>{status:'failed',attempts:3}</div></div><h4>Constraints</h4><ul><li>0 ≤ failures ≤ 20</li><li>1 ≤ maxAttempts ≤ 10</li></ul>`,
  },
];
