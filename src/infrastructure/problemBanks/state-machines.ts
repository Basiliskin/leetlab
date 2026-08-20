import type { ProblemDraft } from "@domain/Problem";

export const STATE_MACHINE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "order-state-machine",
    num: 8075,
    title: "Order State Machine",
    difficulty: "Easy",
    tags: ["State Machine", "Workflow", "E-commerce"],
    fnName: "orderStateMachine",
    mode: "fn",
    starter: {
      js: `/**
 * @param {string[]} actions
 * @return {string[]}
 */
function orderStateMachine(actions) {
  
}
`,
      ts: `function orderStateMachine(actions: string[]): string[] {
  
}
`,
    },
    tests: [
      {
        in: [["pay", "ship", "deliver"]],
        out: ["paid", "shipped", "delivered"],
      },
      {
        in: [["cancel"]],
        out: ["cancelled"],
      },
      {
        in: [["ship"]],
        out: ["pending"],
      },
      {
        in: [["pay", "cancel"]],
        out: ["paid", "cancelled"],
      },
      {
        in: [["pay", "ship", "cancel"]],
        out: ["paid", "shipped", "shipped"],
      },
      {
        in: [["deliver", "pay", "ship"]],
        out: ["pending", "paid", "shipped"],
      },
    ],
    hints: [
      "Model the order as a finite state machine. Start in pending and transition only when the current state allows the action.",
      "Invalid actions do not throw and do not change state; they simply leave the order in its current state.",
    ],
    desc: `<p>Simulate the lifecycle of a single order.</p><p>The order starts in state <code>pending</code>. Valid transitions are:</p><ul><li><code>pending</code> + <code>pay</code> → <code>paid</code></li><li><code>pending</code> + <code>cancel</code> → <code>cancelled</code></li><li><code>paid</code> + <code>ship</code> → <code>shipped</code></li><li><code>paid</code> + <code>cancel</code> → <code>cancelled</code></li><li><code>shipped</code> + <code>deliver</code> → <code>delivered</code></li></ul><p>The states <code>delivered</code> and <code>cancelled</code> are terminal. If an action is invalid for the current state, the state remains unchanged.</p><p>Return the order state after every action.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = ['pay','ship','deliver']</div><div><b>Output:</b>['paid','shipped','delivered']</div></div><div class="ex"><div><b>Input:</b>actions = ['ship']</div><div><b>Output:</b>['pending']</div><div class="exp">An unpaid order cannot ship.</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>action is a string</li></ul>`,
  },

  {
    slug: "approval-workflow-transitions",
    num: 8076,
    title: "Approval Workflow Transitions",
    difficulty: "Medium",
    tags: ["State Machine", "Workflow", "Approval"],
    fnName: "approvalWorkflow",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<any[]>} actions
 * @param {number} required
 * @return {string[]}
 */
function approvalWorkflow(actions, required) {
  
}
`,
      ts: `function approvalWorkflow(actions: Array<any[]>, required: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [[["submit"], ["approve", "a"], ["approve", "b"]], 2],
        out: ["pending", "pending", "approved"],
      },
      {
        in: [
          [["submit"], ["approve", "a"], ["approve", "a"], ["approve", "b"]],
          2,
        ],
        out: ["pending", "pending", "pending", "approved"],
      },
      {
        in: [[["submit"], ["approve", "a"], ["reject", "x"]], 2],
        out: ["pending", "pending", "rejected"],
      },
      {
        in: [[["submit"], ["reject", "x"], ["revise"], ["submit"]], 1],
        out: ["pending", "rejected", "draft", "pending"],
      },
      {
        in: [[["approve", "a"]], 1],
        out: ["draft"],
      },
      {
        in: [[["submit"], ["approve", "a"], ["approve", "b"]], 1],
        out: ["pending", "approved", "approved"],
      },
    ],
    hints: [
      "Track the workflow state and the set of distinct users who have approved while the document is pending.",
      "Duplicate approvals from the same user should not count twice. Once approved, later approvals do not change the state.",
    ],
    desc: `<p>Simulate a simple approval workflow.</p><p>The document starts in state <code>draft</code>. Supported actions are arrays:</p><ul><li><code>['submit']</code> — valid only in <code>draft</code>; moves to <code>pending</code> and clears approvals</li><li><code>['approve', userId]</code> — valid only in <code>pending</code>; records a distinct approval. If distinct approvals reach <code>required</code>, moves to <code>approved</code></li><li><code>['reject', userId]</code> — valid only in <code>pending</code>; moves to <code>rejected</code></li><li><code>['revise']</code> — valid only in <code>rejected</code>; moves back to <code>draft</code></li></ul><p>Invalid actions leave the state unchanged. Return the workflow state after every action.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = [['submit'],['approve','a'],['approve','b']], required = 2</div><div><b>Output:</b>['pending','pending','approved']</div></div><div class="ex"><div><b>Input:</b>actions = [['submit'],['approve','a'],['approve','a'],['approve','b']], required = 2</div><div><b>Output:</b>['pending','pending','pending','approved']</div><div class="exp">Duplicate approvals from user a do not count twice.</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>1 ≤ required ≤ 5</li><li>User ids are strings</li></ul>`,
  },

  {
    slug: "feature-flag-kill-switch",
    num: 8077,
    title: "Feature Flag — Kill Switch",
    difficulty: "Easy",
    tags: ["State Machine", "Feature Flags", "Operations"],
    fnName: "featureFlagKillSwitch",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<any[]>} actions
 * @return {boolean[]}
 */
function featureFlagKillSwitch(actions) {
  
}
`,
      ts: `function featureFlagKillSwitch(actions: Array<any[]>): boolean[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["set", "a", 1],
            ["check", "a"],
            ["kill", 1],
            ["check", "a"],
            ["kill", 0],
            ["check", "a"],
          ],
        ],
        out: [true, false, true],
      },
      {
        in: [[["check", "x"]]],
        out: [false],
      },
      {
        in: [
          [
            ["kill", 1],
            ["set", "a", 1],
            ["check", "a"],
            ["kill", 0],
            ["check", "a"],
          ],
        ],
        out: [false, true],
      },
      {
        in: [
          [
            ["set", "a", 1],
            ["set", "b", 0],
            ["check", "a"],
            ["check", "b"],
          ],
        ],
        out: [true, false],
      },
      {
        in: [
          [
            ["kill", 0],
            ["check", "a"],
          ],
        ],
        out: [false],
      },
      {
        in: [[["set", "a", 1]]],
        out: [],
      },
    ],
    hints: [
      "Store individual flag values separately from the global kill switch.",
      "When the kill switch is on, every check returns false, even if the individual flag is enabled.",
    ],
    desc: `<p>Simulate a feature-flag system with a global kill switch.</p><p>Supported actions are arrays:</p><ul><li><code>['set', flagName, 1 | 0]</code> — enable or disable an individual flag</li><li><code>['kill', 1 | 0]</code> — turn the global kill switch on or off</li><li><code>['check', flagName]</code> — ask whether a feature is effectively enabled</li></ul><p>All flags start disabled, and the kill switch starts off. When the kill switch is on, every feature check returns <code>false</code>, regardless of individual flag state.</p><p>Return the results of all <code>check</code> actions in order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = [['set','a',1],['check','a'],['kill',1],['check','a'],['kill',0],['check','a']]</div><div><b>Output:</b>[true,false,true]</div><div class="exp">The kill switch overrides flag a while it is on.</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Flag names are strings</li><li>Flag and kill values are 0 or 1</li></ul>`,
  },

  {
    slug: "tenant-quota-state",
    num: 8078,
    title: "Tenant Quota State",
    difficulty: "Medium",
    tags: ["State Machine", "Multi-tenant", "Quota"],
    fnName: "tenantQuotaLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<any[]>} actions
 * @return {string[]}
 */
function tenantQuotaLog(actions) {
  
}
`,
      ts: `function tenantQuotaLog(actions: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["set", "a", 10],
            ["use", "a", 4],
            ["check", "a"],
            ["use", "a", 7],
            ["release", "a", 5],
            ["check", "a"],
          ],
        ],
        out: [
          "set:a:10",
          "use:a:ok",
          "check:a:6",
          "use:a:denied",
          "release:a:ok",
          "check:a:10",
        ],
      },
      {
        in: [[["use", "x", 1]]],
        out: ["use:x:denied"],
      },
      {
        in: [[["check", "x"]]],
        out: ["check:x:0"],
      },
      {
        in: [[["release", "x", 5]]],
        out: ["release:x:ok"],
      },
      {
        in: [
          [
            ["set", "a", 10],
            ["use", "a", 8],
            ["set", "a", 5],
            ["check", "a"],
            ["use", "a", 1],
            ["release", "a", 4],
            ["check", "a"],
          ],
        ],
        out: [
          "set:a:10",
          "use:a:ok",
          "set:a:5",
          "check:a:0",
          "use:a:denied",
          "release:a:ok",
          "check:a:1",
        ],
      },
      {
        in: [
          [
            ["set", "t", 3],
            ["use", "t", 3],
            ["use", "t", 0],
            ["check", "t"],
          ],
        ],
        out: ["set:t:3", "use:t:ok", "use:t:ok", "check:t:0"],
      },
    ],
    hints: [
      "For each tenant, track both the quota limit and the currently used amount.",
      "A use request succeeds only when used + amount <= limit. Releasing reduces used, but never below zero.",
    ],
    desc: `<p>Simulate quota enforcement for multiple tenants.</p><p>Supported actions are arrays:</p><ul><li><code>['set', tenant, limit]</code> — set the tenant's quota limit</li><li><code>['use', tenant, amount]</code> — try to consume quota</li><li><code>['release', tenant, amount]</code> — release previously consumed quota</li><li><code>['check', tenant]</code> — report remaining quota</li></ul><p>Unknown tenants start with limit <code>0</code> and used <code>0</code>.</p><p>Rules:</p><ul><li><code>use</code> succeeds and logs <code>use:tenant:ok</code> only when <code>used + amount &lt;= limit</code>. Otherwise log <code>use:tenant:denied</code> and do not change usage.</li><li><code>release</code> reduces usage to a minimum of <code>0</code> and logs <code>release:tenant:ok</code>.</li><li><code>check</code> logs <code>check:tenant:remaining</code>, where remaining is <code>max(0, limit - used)</code>.</li></ul><p>Return one log string for every action.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = [['set','a',10],['use','a',4],['check','a'],['use','a',7],['release','a',5],['check','a']]</div><div><b>Output:</b>['set:a:10','use:a:ok','check:a:6','use:a:denied','release:a:ok','check:a:10']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Tenant ids are strings</li><li>0 ≤ limit, amount ≤ 10<sup>6</sup></li></ul>`,
  },

  {
    slug: "session-expiry-state",
    num: 8079,
    title: "Session Expiry State",
    difficulty: "Medium",
    tags: ["State Machine", "Session", "Authentication"],
    fnName: "sessionExpiryLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, string, number]>} actions
 * @param {number} ttl
 * @return {string[]}
 */
function sessionExpiryLog(actions, ttl) {
  
}
`,
      ts: `function sessionExpiryLog(actions: Array<[string, string, number]>, ttl: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["create", "s1", 0],
            ["access", "s1", 5],
            ["check", "s1", 14],
            ["access", "s1", 15],
            ["access", "s1", 16],
          ],
          10,
        ],
        out: [
          "create:s1:ok",
          "access:s1:ok",
          "check:s1:active",
          "access:s1:denied",
          "access:s1:denied",
        ],
      },
      {
        in: [
          [
            ["create", "s", 0],
            ["check", "s", 10],
          ],
          10,
        ],
        out: ["create:s:ok", "check:s:expired"],
      },
      {
        in: [
          [
            ["access", "x", 0],
            ["check", "x", 0],
          ],
          10,
        ],
        out: ["access:x:denied", "check:x:expired"],
      },
      {
        in: [
          [
            ["create", "a", 0],
            ["create", "a", 100],
            ["check", "a", 105],
          ],
          10,
        ],
        out: ["create:a:ok", "create:a:ok", "check:a:active"],
      },
      {
        in: [
          [
            ["create", "s", 0],
            ["access", "s", 9],
            ["access", "s", 18],
            ["check", "s", 27],
            ["check", "s", 28],
          ],
          10,
        ],
        out: [
          "create:s:ok",
          "access:s:ok",
          "access:s:ok",
          "check:s:active",
          "check:s:expired",
        ],
      },
      {
        in: [[], 10],
        out: [],
      },
    ],
    hints: [
      "A session created at time t expires at t + ttl. A session is active only while currentTime < expiresAt.",
      "Valid access is sliding: it refreshes the expiration to accessTime + ttl. Check never refreshes the session.",
    ],
    desc: `<p>Simulate session expiry with a sliding TTL.</p><p>Each action is <code>[type, sessionId, time]</code>. Supported actions:</p><ul><li><code>['create', id, time]</code> — create or replace a session expiring at <code>time + ttl</code>, log <code>create:id:ok</code></li><li><code>['access', id, time]</code> — if the session exists and <code>time &lt; expiresAt</code>, log <code>access:id:ok</code> and refresh expiry to <code>time + ttl</code>; otherwise log <code>access:id:denied</code></li><li><code>['check', id, time]</code> — if the session exists and <code>time &lt; expiresAt</code>, log <code>check:id:active</code>; otherwise log <code>check:id:expired</code>. Checking does not refresh the session.</li></ul><p>At exactly <code>expiresAt</code>, the session is already expired.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = [['create','s1',0],['access','s1',5],['check','s1',14],['access','s1',15]], ttl = 10</div><div><b>Output:</b>['create:s1:ok','access:s1:ok','check:s1:active','access:s1:denied']</div><div class="exp">The access at time 5 refreshes expiry to 15. At time 15 the session is already expired.</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>0 ≤ ttl ≤ 1000</li><li>Action times are nondecreasing</li><li>Session ids are strings</li></ul>`,
  },

  {
    slug: "subscription-lifecycle",
    num: 8080,
    title: "Subscription Lifecycle",
    difficulty: "Medium",
    tags: ["State Machine", "Subscription", "Billing"],
    fnName: "subscriptionLifecycle",
    mode: "fn",
    starter: {
      js: `/**
 * @param {string[]} actions
 * @return {string[]}
 */
function subscriptionLifecycle(actions) {
  
}
`,
      ts: `function subscriptionLifecycle(actions: string[]): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            "start_trial",
            "subscribe",
            "payment_failed",
            "payment_succeeded",
            "cancel",
            "subscribe",
          ],
        ],
        out: ["trialing", "active", "past_due", "active", "canceled", "active"],
      },
      {
        in: [["start_trial", "expire"]],
        out: ["trialing", "expired"],
      },
      {
        in: [["subscribe", "cancel", "expire"]],
        out: ["active", "canceled", "expired"],
      },
      {
        in: [["subscribe", "cancel", "expire", "start_trial"]],
        out: ["active", "canceled", "expired", "trialing"],
      },
      {
        in: [
          [
            "payment_succeeded",
            "expire",
            "start_trial",
            "payment_failed",
            "subscribe",
          ],
        ],
        out: ["inactive", "inactive", "trialing", "past_due", "past_due"],
      },
      {
        in: [["subscribe", "subscribe"]],
        out: ["active", "active"],
      },
    ],
    hints: [
      "Define a transition table before coding. Invalid events leave the subscription in its current state.",
      "Payment failure only affects active or trialing subscriptions. Past-due subscriptions become active only through payment_succeeded.",
    ],
    desc: `<p>Simulate a subscription lifecycle state machine.</p><p>The subscription starts in state <code>inactive</code>. Possible states are:</p><ul><li><code>inactive</code></li><li><code>trialing</code></li><li><code>active</code></li><li><code>past_due</code></li><li><code>canceled</code></li><li><code>expired</code></li></ul><p>Valid transitions:</p><ul><li><code>start_trial</code>: from <code>inactive</code>, <code>canceled</code>, or <code>expired</code> → <code>trialing</code></li><li><code>subscribe</code>: from <code>inactive</code>, <code>trialing</code>, <code>canceled</code>, or <code>expired</code> → <code>active</code>. If already <code>active</code>, remains <code>active</code>. Invalid from <code>past_due</code>.</li><li><code>payment_failed</code>: from <code>active</code> or <code>trialing</code> → <code>past_due</code></li><li><code>payment_succeeded</code>: from <code>past_due</code> → <code>active</code></li><li><code>cancel</code>: from <code>trialing</code>, <code>active</code>, or <code>past_due</code> → <code>canceled</code></li><li><code>expire</code>: from <code>trialing</code>, <code>active</code>, <code>past_due</code>, or <code>canceled</code> → <code>expired</code></li></ul><p>Invalid actions leave the state unchanged. Return the subscription state after every action.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = ['start_trial','subscribe','payment_failed','payment_succeeded','cancel','subscribe']</div><div><b>Output:</b>['trialing','active','past_due','active','canceled','active']</div></div><div class="ex"><div><b>Input:</b>actions = ['subscribe','cancel','expire']</div><div><b>Output:</b>['active','canceled','expired']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Actions are strings from the supported list</li></ul>`,
  },
];
