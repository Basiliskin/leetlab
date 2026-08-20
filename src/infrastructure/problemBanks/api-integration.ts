import type { ProblemDraft } from "@domain/Problem";

export const API_INTEGRATION_PROBLEMS: ProblemDraft[] = [
  {
    slug: "cursor-pagination-decode",
    num: 8069,
    title: "API Pagination — Cursor Decode",
    difficulty: "Medium",
    tags: ["API Design", "Pagination", "Cursor"],
    fnName: "cursorPaginationDecode",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Object<string, [number[], string | null]>} pages
 * @param {string | null} initialCursor
 * @return {{items: number[], error: string | null}}
 */
function cursorPaginationDecode(pages, initialCursor) {
  
}
`,
      ts: `function cursorPaginationDecode(pages: Record<string, [number[], string | null]>, initialCursor: string | null): { items: number[]; error: string | null } {
  
}
`,
    },
    tests: [
      {
        in: [
          {
            p1: [[1, 2], "page:p2"],
            p2: [[3], null],
          },
          "page:p1",
        ],
        out: {
          items: [1, 2, 3],
          error: null,
        },
      },
      {
        in: [{}, null],
        out: {
          items: [],
          error: null,
        },
      },
      {
        in: [{}, "page:x"],
        out: {
          items: [],
          error: "unknown-cursor",
        },
      },
      {
        in: [{}, "bad"],
        out: {
          items: [],
          error: "invalid-cursor",
        },
      },
      {
        in: [
          {
            p1: [[1], "page:p2"],
            p2: [[2], "page:p1"],
          },
          "page:p1",
        ],
        out: {
          items: [1, 2],
          error: "cycle",
        },
      },
      {
        in: [
          {
            p1: [[1], "bad"],
          },
          "page:p1",
        ],
        out: {
          items: [1],
          error: "invalid-cursor",
        },
      },
    ],
    hints: [
      "A cursor is only meaningful if the client can decode it and ask for the next page. Treat null as the end of the feed.",
      "Track cursors you have already seen. If the server sends you a cursor you already followed, stop with a cycle error instead of looping forever.",
    ],
    desc: `<p>Simulate a client following a cursor-paginated API.</p><p><code>pages</code> is a map from page id to <code>[items, nextCursor]</code>. Each cursor is a string of the form <code>page:pageId</code>, or <code>null</code> when there are no more pages.</p><p>Starting from <code>initialCursor</code>:</p><ul><li>decode the cursor to get the page id</li><li>collect that page's items</li><li>follow the next cursor</li><li>stop when the next cursor is <code>null</code></li></ul><p>Return <code>{ items, error }</code>. Use:</p><ul><li><code>'invalid-cursor'</code> when a cursor is not a string starting with <code>page:</code></li><li><code>'unknown-cursor'</code> when the decoded page id does not exist in <code>pages</code></li><li><code>'cycle'</code> when the same cursor appears twice</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>pages = {p1: [[1,2],'page:p2'], p2: [[3],null]}, initialCursor = 'page:p1'</div><div><b>Output:</b>{items:[1,2,3],error:null}</div></div><h4>Constraints</h4><ul><li>0 ≤ number of pages ≤ 1000</li><li>Items are numbers</li><li>nextCursor is either null or a string</li></ul>`,
  },

  {
    slug: "webhook-signature-verify",
    num: 8070,
    title: "Webhook — Signature Verification",
    difficulty: "Medium",
    tags: ["API Design", "Webhooks", "Security"],
    fnName: "verifyWebhookSignature",
    mode: "fn",
    starter: {
      js: `/**
 * @param {string} payload
 * @param {string} secret
 * @param {string} header
 * @param {number} currentTime
 * @param {number} maxAge
 * @return {{valid: boolean, reason: string}}
 */
function verifyWebhookSignature(payload, secret, header, currentTime, maxAge) {
  
}
`,
      ts: `function verifyWebhookSignature(payload: string, secret: string, header: string, currentTime: number, maxAge: number): { valid: boolean; reason: string } {
  
}
`,
    },
    tests: [
      {
        in: ["order.created", "k", "t=100,v=sig:k:100:order.created", 105, 10],
        out: {
          valid: true,
          reason: "ok",
        },
      },
      {
        in: ["order.created", "k", "t=90,v=sig:k:90:order.created", 105, 10],
        out: {
          valid: false,
          reason: "expired",
        },
      },
      {
        in: ["order.created", "k", "t=200,v=sig:k:200:order.created", 100, 10],
        out: {
          valid: false,
          reason: "expired",
        },
      },
      {
        in: ["order.created", "k", "t=100,v=sig:k:100:wrong", 100, 10],
        out: {
          valid: false,
          reason: "bad-signature",
        },
      },
      {
        in: ["order.created", "k", "t=100", 100, 10],
        out: {
          valid: false,
          reason: "malformed-header",
        },
      },
      {
        in: ["order.created", "k", "t=abc,v=sig:k:abc:order.created", 100, 10],
        out: {
          valid: false,
          reason: "malformed-header",
        },
      },
    ],
    hints: [
      "Parse the header first. It must have exactly two parts: t=<timestamp> and v=<signature>.",
      "Check freshness before checking the signature. For this simplified problem, the expected signature is sig:<secret>:<timestamp>:<payload>.",
    ],
    desc: `<p>Simulate webhook signature verification.</p><p>The webhook header has the form:</p><p><code>t=&lt;timestamp&gt;,v=&lt;signature&gt;</code></p><p>Verification rules:</p><ul><li>If the header cannot be parsed, return <code>{ valid: false, reason: 'malformed-header' }</code>.</li><li>If the absolute age of the timestamp is greater than <code>maxAge</code>, return <code>{ valid: false, reason: 'expired' }</code>.</li><li>Otherwise, compute the expected signature as <code>sig:&lt;secret&gt;:&lt;timestamp&gt;:&lt;payload&gt;</code>. If it does not match the provided signature, return <code>{ valid: false, reason: 'bad-signature' }</code>.</li><li>If all checks pass, return <code>{ valid: true, reason: 'ok' }</code>.</li></ul><p class="note">This problem uses a simplified signature format so it can be judged deterministically without crypto libraries.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>payload = 'order.created', secret = 'k', header = 't=100,v=sig:k:100:order.created', currentTime = 105, maxAge = 10</div><div><b>Output:</b>{valid:true,reason:'ok'}</div></div><h4>Constraints</h4><ul><li>payload and secret are strings</li><li>0 ≤ currentTime ≤ 10<sup>6</sup></li><li>0 ≤ maxAge ≤ 10<sup>6</sup></li></ul>`,
  },

  {
    slug: "idempotency-key-store",
    num: 8071,
    title: "Idempotency-Key Store",
    difficulty: "Medium",
    tags: ["API Design", "Idempotency", "Integration"],
    fnName: "idempotencyKeyStore",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, unknown, number]>} requests
 * @return {Array<{status: string, response?: number}>}
 */
function idempotencyKeyStore(requests) {
  
}
`,
      ts: `function idempotencyKeyStore(requests: Array<[string, unknown, number]>): Array<{ status: string; response?: number }> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["k1", { amount: 10 }, 201],
            ["k1", { amount: 10 }, 201],
            ["k1", { amount: 20 }, 201],
          ],
        ],
        out: [
          { status: "created", response: 201 },
          { status: "replayed", response: 201 },
          { status: "conflict" },
        ],
      },
      {
        in: [
          [
            ["a", 1, 200],
            ["b", 2, 201],
          ],
        ],
        out: [
          { status: "created", response: 200 },
          { status: "created", response: 201 },
        ],
      },
      {
        in: [
          [
            ["k", 1, 200],
            ["k", 1, 500],
          ],
        ],
        out: [
          { status: "created", response: 200 },
          { status: "replayed", response: 200 },
        ],
      },
      {
        in: [
          [
            ["k", "A", 201],
            ["k", "B", 201],
            ["k", "A", 201],
          ],
        ],
        out: [
          { status: "created", response: 201 },
          { status: "conflict" },
          { status: "replayed", response: 201 },
        ],
      },
      {
        in: [[]],
        out: [],
      },
      {
        in: [
          [
            ["k", 1, 200],
            ["k", "1", 200],
          ],
        ],
        out: [{ status: "created", response: 200 }, { status: "conflict" }],
      },
    ],
    hints: [
      "The first request with a new idempotency key creates the stored response. Later requests with the same key and same body replay that stored response.",
      "If the same idempotency key is reused with a different request body, that is a conflict. Do not overwrite the stored response.",
    ],
    desc: `<p>Simulate an API idempotency-key store.</p><p>Each request is <code>[idempotencyKey, requestBody, responseCode]</code>.</p><p>Rules:</p><ul><li>If the key is new, store the request body and response code, then return <code>{ status: 'created', response }</code>.</li><li>If the key already exists and the request body is equal to the stored request body, return <code>{ status: 'replayed', response }</code> using the stored response code.</li><li>If the key already exists but the request body differs, return <code>{ status: 'conflict' }</code> and leave the stored response unchanged.</li></ul><p>Request bodies should be compared by their JSON representation.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['k1',{amount:10},201],['k1',{amount:10},201],['k1',{amount:20},201]]</div><div><b>Output:</b>[{status:'created',response:201},{status:'replayed',response:201},{status:'conflict'}]</div></div><h4>Constraints</h4><ul><li>0 ≤ requests.length ≤ 1000</li><li>Keys are strings</li><li>Request bodies are JSON-compatible values</li><li>Response codes are numbers</li></ul>`,
  },

  {
    slug: "optimistic-concurrency-version-check",
    num: 8072,
    title: "Optimistic Concurrency — Version Check",
    difficulty: "Medium",
    tags: ["API Design", "Concurrency", "Versioning"],
    fnName: "applyVersionedUpdates",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number, unknown]>} updates
 * @return {{results: string[], final: Array<[string, unknown, number]>}}
 */
function applyVersionedUpdates(updates) {
  
}
`,
      ts: `function applyVersionedUpdates(updates: Array<[string, number, unknown]>): { results: string[]; final: Array<[string, unknown, number]> } {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 0, 1],
            ["a", 1, 2],
            ["a", 1, 3],
          ],
        ],
        out: {
          results: ["a:updated", "a:updated", "a:conflict"],
          final: [["a", 2, 2]],
        },
      },
      {
        in: [[["a", 1, 1]]],
        out: {
          results: ["a:conflict"],
          final: [],
        },
      },
      {
        in: [
          [
            ["b", 0, "x"],
            ["a", 0, "y"],
          ],
        ],
        out: {
          results: ["b:updated", "a:updated"],
          final: [
            ["a", "y", 1],
            ["b", "x", 1],
          ],
        },
      },
      {
        in: [[]],
        out: {
          results: [],
          final: [],
        },
      },
      {
        in: [
          [
            ["a", 0, 1],
            ["a", 0, 2],
            ["a", 1, 3],
          ],
        ],
        out: {
          results: ["a:updated", "a:conflict", "a:updated"],
          final: [["a", 3, 2]],
        },
      },
      {
        in: [
          [
            ["x", 0, 1],
            ["y", 0, 2],
            ["x", 0, 3],
            ["y", 1, 4],
          ],
        ],
        out: {
          results: ["x:updated", "y:updated", "x:conflict", "y:updated"],
          final: [
            ["x", 1, 1],
            ["y", 4, 2],
          ],
        },
      },
    ],
    hints: [
      "A missing record behaves like version 0. A successful update replaces the value and increments the version.",
      "If the supplied baseVersion does not match the current version, the update conflicts and must not change the record.",
    ],
    desc: `<p>Simulate optimistic concurrency control using record versions.</p><p>Each update is <code>[id, baseVersion, value]</code>. A record that does not exist yet has version <code>0</code>.</p><p>An update succeeds only when <code>baseVersion</code> matches the record's current version. On success, set the record's value and increment its version by one. On failure, leave the record unchanged and record a conflict.</p><p>Return:</p><ul><li><code>results</code> — <code>id:updated</code> or <code>id:conflict</code> for each update</li><li><code>final</code> — final records as <code>[id, value, version]</code>, sorted by id</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>updates = [['a',0,1],['a',1,2],['a',1,3]]</div><div><b>Output:</b>{results:['a:updated','a:updated','a:conflict'],final:[['a',2,2]]}</div><div class="exp">The third update expects version 1, but the record is already at version 2.</div></div><h4>Constraints</h4><ul><li>0 ≤ updates.length ≤ 1000</li><li>0 ≤ baseVersion ≤ 1000</li><li>Ids are strings</li><li>Values are JSON-compatible values</li></ul>`,
  },

  {
    slug: "rate-limit-headers",
    num: 8073,
    title: "Rate Limit — Response Headers",
    difficulty: "Medium",
    tags: ["API Design", "Rate Limiting", "Headers"],
    fnName: "rateLimitHeaders",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} requests
 * @param {number} limit
 * @param {number} windowSize
 * @return {Array<{limit: number, remaining: number, reset: number, retryAfter: number | null}>}
 */
function rateLimitHeaders(requests, limit, windowSize) {
  
}
`,
      ts: `function rateLimitHeaders(requests: number[], limit: number, windowSize: number): Array<{ limit: number; remaining: number; reset: number; retryAfter: number | null }> {
  
}
`,
    },
    tests: [
      {
        in: [[0, 0, 5, 10, 11], 2, 10],
        out: [
          { limit: 2, remaining: 1, reset: 10, retryAfter: null },
          { limit: 2, remaining: 0, reset: 10, retryAfter: null },
          { limit: 2, remaining: 0, reset: 10, retryAfter: 5 },
          { limit: 2, remaining: 1, reset: 20, retryAfter: null },
          { limit: 2, remaining: 0, reset: 20, retryAfter: null },
        ],
      },
      {
        in: [[0, 0, 1], 1, 1],
        out: [
          { limit: 1, remaining: 0, reset: 1, retryAfter: null },
          { limit: 1, remaining: 0, reset: 1, retryAfter: 1 },
          { limit: 1, remaining: 0, reset: 2, retryAfter: null },
        ],
      },
      {
        in: [[], 5, 10],
        out: [],
      },
      {
        in: [[5], 3, 5],
        out: [{ limit: 3, remaining: 2, reset: 10, retryAfter: null }],
      },
      {
        in: [[0, 10], 1, 10],
        out: [
          { limit: 1, remaining: 0, reset: 10, retryAfter: null },
          { limit: 1, remaining: 0, reset: 20, retryAfter: null },
        ],
      },
      {
        in: [[7, 7], 1, 10],
        out: [
          { limit: 1, remaining: 0, reset: 10, retryAfter: null },
          { limit: 1, remaining: 0, reset: 10, retryAfter: 3 },
        ],
      },
    ],
    hints: [
      "Use a fixed window: for a request at time t, the window starts at floor(t / windowSize) * windowSize and resets at windowStart + windowSize.",
      "If the request is allowed, remaining is limit minus the number of requests used in that window. If denied, remaining is 0 and retryAfter is reset - currentTime.",
    ],
    desc: `<p>Simulate API rate-limit response headers using a fixed window.</p><p><code>requests</code> is a list of request arrival times. The API allows <code>limit</code> requests per fixed window of length <code>windowSize</code>.</p><p>For a request at time <code>t</code>:</p><ul><li>window start = <code>floor(t / windowSize) * windowSize</code></li><li>reset time = <code>windowStart + windowSize</code></li></ul><p>If the request is within the limit, it is allowed. Otherwise it is denied.</p><p>Return one header record per request:</p><ul><li><code>limit</code> — the configured limit</li><li><code>remaining</code> — remaining allowed requests after this one</li><li><code>reset</code> — when the current window resets</li><li><code>retryAfter</code> — <code>null</code> if allowed, otherwise <code>reset - t</code></li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>requests = [0,0,5,10,11], limit = 2, windowSize = 10</div><div><b>Output:</b>[{limit:2,remaining:1,reset:10,retryAfter:null},{limit:2,remaining:0,reset:10,retryAfter:null},{limit:2,remaining:0,reset:10,retryAfter:5},{limit:2,remaining:1,reset:20,retryAfter:null},{limit:2,remaining:0,reset:20,retryAfter:null}]</div></div><h4>Constraints</h4><ul><li>0 ≤ requests.length ≤ 1000</li><li>0 ≤ requests[i] ≤ 10000</li><li>1 ≤ limit ≤ 1000</li><li>1 ≤ windowSize ≤ 1000</li><li>Requests are sorted by time</li></ul>`,
  },

  {
    slug: "api-retry-after-respect",
    num: 8074,
    title: "API Client — Respect Retry-After",
    difficulty: "Easy",
    tags: ["API Design", "Retry", "Retry-After"],
    fnName: "retryAfterSchedule",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} retryAfterValues
 * @return {{attempts: number, times: number[], completedAt: number}}
 */
function retryAfterSchedule(retryAfterValues) {
  
}
`,
      ts: `function retryAfterSchedule(retryAfterValues: number[]): { attempts: number; times: number[]; completedAt: number } {
  
}
`,
    },
    tests: [
      {
        in: [[]],
        out: {
          attempts: 1,
          times: [0],
          completedAt: 0,
        },
      },
      {
        in: [[5]],
        out: {
          attempts: 2,
          times: [0, 5],
          completedAt: 5,
        },
      },
      {
        in: [[2, 3]],
        out: {
          attempts: 3,
          times: [0, 2, 5],
          completedAt: 5,
        },
      },
      {
        in: [[0, 0]],
        out: {
          attempts: 3,
          times: [0, 0, 0],
          completedAt: 0,
        },
      },
      {
        in: [[10, 1, 1]],
        out: {
          attempts: 4,
          times: [0, 10, 11, 12],
          completedAt: 12,
        },
      },
      {
        in: [[100]],
        out: {
          attempts: 2,
          times: [0, 100],
          completedAt: 100,
        },
      },
    ],
    hints: [
      "The client starts at time 0. Each 429 response gives a Retry-After delay; the next attempt happens exactly that many time units later.",
      "The length of retryAfterValues is the number of rejected attempts. After the last rejection, one final successful attempt occurs.",
    ],
    desc: `<p>Simulate an API client that respects <code>Retry-After</code> headers.</p><p><code>retryAfterValues</code> lists the <code>Retry-After</code> delay returned by each rejected attempt. The client starts at time <code>0</code>. When it receives a rejection with delay <code>d</code>, it waits exactly <code>d</code> time units before trying again. After all listed rejections, the next attempt succeeds.</p><p>Return:</p><ul><li><code>attempts</code> — total number of attempts made</li><li><code>times</code> — the time of each attempt</li><li><code>completedAt</code> — the time of the final successful attempt</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>retryAfterValues = [2,3]</div><div><b>Output:</b>{attempts:3,times:[0,2,5],completedAt:5}</div><div class="exp">Attempt at 0 is rejected with Retry-After 2, attempt at 2 is rejected with Retry-After 3, attempt at 5 succeeds.</div></div><h4>Constraints</h4><ul><li>0 ≤ retryAfterValues.length ≤ 1000</li><li>0 ≤ retryAfterValues[i] ≤ 1000</li></ul>`,
  },
];
