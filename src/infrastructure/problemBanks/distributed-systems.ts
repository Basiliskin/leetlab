import type { ProblemDraft } from "@domain/Problem";

export const DISTRIBUTED_SYSTEMS_PROBLEMS: ProblemDraft[] = [
  {
    slug: "lease-based-lock",
    num: 8057,
    title: "Distributed Lock — Lease-Based",
    difficulty: "Medium",
    tags: ["Distributed Systems", "Locking", "Lease"],
    fnName: "leaseLockLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, string, number]>} actions
 * @param {number} ttl
 * @return {string[]}
 */
function leaseLockLog(actions, ttl) {
  
}
`,
      ts: `function leaseLockLog(actions: Array<[string, string, number]>, ttl: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["acquire", "a", 0],
            ["acquire", "b", 1],
            ["renew", "a", 2],
            ["acquire", "b", 4],
            ["acquire", "b", 5],
            ["release", "b", 6],
          ],
          3,
        ],
        out: [
          "acquire:a:ok",
          "acquire:b:denied",
          "renew:a:ok",
          "acquire:b:denied",
          "acquire:b:ok",
          "release:b:ok",
        ],
      },
      {
        in: [
          [
            ["acquire", "a", 0],
            ["acquire", "b", 2],
          ],
          2,
        ],
        out: ["acquire:a:ok", "acquire:b:ok"],
      },
      {
        in: [
          [
            ["acquire", "a", 0],
            ["renew", "b", 1],
            ["release", "b", 1],
          ],
          5,
        ],
        out: ["acquire:a:ok", "renew:b:fail", "release:b:fail"],
      },
      {
        in: [
          [
            ["acquire", "a", 0],
            ["release", "a", 1],
            ["acquire", "b", 2],
          ],
          5,
        ],
        out: ["acquire:a:ok", "release:a:ok", "acquire:b:ok"],
      },
      {
        in: [
          [
            ["acquire", "a", 0],
            ["renew", "a", 2],
            ["acquire", "b", 2],
          ],
          2,
        ],
        out: ["acquire:a:ok", "renew:a:fail", "acquire:b:ok"],
      },
      {
        in: [[], 10],
        out: [],
      },
    ],
    hints: [
      "A lease lock has an owner and an expiration time. Acquiring succeeds when there is no owner or when the lease has expired.",
      "Before processing each action at time t, treat the lock as free if t is greater than or equal to the current expiration time. Renew and release only succeed for the current owner while the lease is still active.",
    ],
    desc: `<p>Simulate a distributed lock protected by a lease.</p><p>Each action is <code>[type, clientId, time]</code>. Supported actions:</p><ul><li><code>['acquire', clientId, time]</code> — try to take the lock</li><li><code>['renew', clientId, time]</code> — extend the lease</li><li><code>['release', clientId, time]</code> — give up the lock</li></ul><p>The lock starts unlocked. When a client successfully acquires the lock, the lease expires at <code>time + ttl</code>. A successful renew also resets expiration to <code>time + ttl</code>. If an action happens at a time greater than or equal to the expiration time, the lock is considered free before that action is processed.</p><p>Log format:</p><ul><li><code>acquire:client:ok</code> or <code>acquire:client:denied</code></li><li><code>renew:client:ok</code> or <code>renew:client:fail</code></li><li><code>release:client:ok</code> or <code>release:client:fail</code></li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = [['acquire','a',0],['acquire','b',1],['renew','a',2],['acquire','b',4],['acquire','b',5]], ttl = 3</div><div><b>Output:</b>['acquire:a:ok','acquire:b:denied','renew:a:ok','acquire:b:denied','acquire:b:ok']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>1 ≤ ttl ≤ 1000</li><li>Action times are nondecreasing</li><li>Client ids are strings</li></ul>`,
  },

  {
    slug: "exactly-once-outbox",
    num: 8058,
    title: "Exactly-Once Outbox",
    difficulty: "Medium",
    tags: ["Distributed Systems", "Outbox", "Exactly Once"],
    fnName: "exactlyOnceOutbox",
    mode: "fn",
    starter: {
      js: `/**
 * @param {string[]} writes
 * @param {string[]} deliveries
 * @return {{outbox: string[], processed: string[]}}
 */
function exactlyOnceOutbox(writes, deliveries) {
  
}
`,
      ts: `function exactlyOnceOutbox(writes: string[], deliveries: string[]): { outbox: string[]; processed: string[] } {
  
}
`,
    },
    tests: [
      {
        in: [
          ["a", "b", "a", "c", "b"],
          ["a", "x", "b", "a", "c", "c", "b"],
        ],
        out: {
          outbox: ["a", "b", "c"],
          processed: ["a", "b", "c"],
        },
      },
      {
        in: [[], ["a"]],
        out: {
          outbox: [],
          processed: [],
        },
      },
      {
        in: [["a"], []],
        out: {
          outbox: ["a"],
          processed: [],
        },
      },
      {
        in: [
          ["a", "a", "a"],
          ["a", "a"],
        ],
        out: {
          outbox: ["a"],
          processed: ["a"],
        },
      },
      {
        in: [
          ["b", "a", "b"],
          ["a", "b"],
        ],
        out: {
          outbox: ["b", "a"],
          processed: ["a", "b"],
        },
      },
      {
        in: [
          ["a", "b"],
          ["b", "c", "a", "b"],
        ],
        out: {
          outbox: ["a", "b"],
          processed: ["b", "a"],
        },
      },
    ],
    hints: [
      "The outbox side is a dedupe pass: keep the first occurrence of each event id and preserve first-seen order.",
      "The delivery side is an inbox dedupe pass: a delivery is processed only if the event exists in the outbox and has not already been processed.",
    ],
    desc: `<p>Simulate the combination of a transactional outbox and an idempotent consumer.</p><p><code>writes</code> represents event ids written to the outbox. Because transactions may be retried, the same event id can appear multiple times. The outbox stores each event id only once, preserving the order of first appearance.</p><p><code>deliveries</code> represents relay/consumer deliveries. Deliveries may also repeat. A delivery is processed only when:</p><ul><li>the event id exists in the outbox</li><li>that event id has not already been processed</li></ul><p>Return:</p><ul><li><code>outbox</code> — unique event ids in first-seen order</li><li><code>processed</code> — processed deliveries in the order they were successfully processed</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>writes = ['a','b','a','c','b'], deliveries = ['a','x','b','a','c','c','b']</div><div><b>Output:</b>{outbox:['a','b','c'],processed:['a','b','c']}</div><div class="exp">x is not in the outbox, and duplicate deliveries are ignored.</div></div><h4>Constraints</h4><ul><li>0 ≤ writes.length ≤ 1000</li><li>0 ≤ deliveries.length ≤ 1000</li><li>Event ids are strings</li></ul>`,
  },

  {
    slug: "saga-compensation",
    num: 8059,
    title: "Saga — Compensation Order",
    difficulty: "Medium",
    tags: ["Distributed Systems", "Saga", "Compensation"],
    fnName: "sagaLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {string[]} steps
 * @param {number} failureIndex
 * @return {string[]}
 */
function sagaLog(steps, failureIndex) {
  
}
`,
      ts: `function sagaLog(steps: string[], failureIndex: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [["reserve", "charge", "ship"], 1],
        out: ["do:reserve", "fail:charge", "undo:reserve"],
      },
      {
        in: [["reserve", "charge", "ship"], -1],
        out: ["do:reserve", "do:charge", "do:ship"],
      },
      {
        in: [["reserve", "charge", "ship"], 0],
        out: ["fail:reserve"],
      },
      {
        in: [["reserve", "charge", "ship"], 2],
        out: [
          "do:reserve",
          "do:charge",
          "fail:ship",
          "undo:charge",
          "undo:reserve",
        ],
      },
      {
        in: [[], -1],
        out: [],
      },
      {
        in: [["x"], -1],
        out: ["do:x"],
      },
    ],
    hints: [
      "A saga runs steps forward. When one step fails, the saga compensates the already-completed steps backward.",
      "The failed step itself is not undone in this model; only steps before it are compensated, in reverse order.",
    ],
    desc: `<p>Simulate a simple saga execution with compensation.</p><p><code>steps</code> is a list of step ids. <code>failureIndex</code> is the index of the step that fails, or <code>-1</code> if every step succeeds.</p><p>If there is no failure, log <code>do:step</code> for every step in order.</p><p>If step <code>i</code> fails:</p><ul><li>log <code>do:step</code> for every step before <code>i</code></li><li>log <code>fail:step</code> for step <code>i</code></li><li>log <code>undo:step</code> for every completed step before <code>i</code>, in reverse order</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>steps = ['reserve','charge','ship'], failureIndex = 1</div><div><b>Output:</b>['do:reserve','fail:charge','undo:reserve']</div></div><div class="ex"><div><b>Input:</b>steps = ['reserve','charge','ship'], failureIndex = -1</div><div><b>Output:</b>['do:reserve','do:charge','do:ship']</div></div><h4>Constraints</h4><ul><li>0 ≤ steps.length ≤ 1000</li><li>-1 ≤ failureIndex &lt; steps.length when steps is non-empty</li><li>If steps is empty, failureIndex is -1</li></ul>`,
  },

  {
    slug: "leader-election-heartbeat",
    num: 8060,
    title: "Leader Election — Heartbeat Timeout",
    difficulty: "Hard",
    tags: ["Distributed Systems", "Leader Election", "Heartbeat"],
    fnName: "leaderAfterHeartbeats",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number]>} heartbeats
 * @param {number} timeout
 * @return {string[]}
 */
function leaderAfterHeartbeats(heartbeats, timeout) {
  
}
`,
      ts: `function leaderAfterHeartbeats(heartbeats: Array<[string, number]>, timeout: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["a", 0],
            ["a", 2],
            ["b", 4],
            ["b", 6],
            ["a", 7],
          ],
          3,
        ],
        out: ["a", "a", "a", "b", "b"],
      },
      {
        in: [
          [
            ["a", 0],
            ["b", 5],
            ["a", 10],
          ],
          3,
        ],
        out: ["a", "b", "a"],
      },
      {
        in: [
          [
            ["a", 0],
            ["b", 1],
            ["c", 2],
          ],
          10,
        ],
        out: ["a", "a", "a"],
      },
      {
        in: [[], 5],
        out: [],
      },
      {
        in: [
          [
            ["a", 0],
            ["b", 0],
            ["a", 0],
          ],
          0,
        ],
        out: ["a", "b", "a"],
      },
      {
        in: [
          [
            ["a", 0],
            ["a", 5],
          ],
          3,
        ],
        out: ["a", "a"],
      },
    ],
    hints: [
      "Track the current leader and the time of that leader's latest heartbeat. A leader lease is valid until lastHeartbeat + timeout.",
      "Before processing a heartbeat, expire the current leader if the current time is at or past the lease deadline. Then: no leader means the heartbeat sender becomes leader; the current leader refreshes; a different node is ignored while the lease is still valid.",
    ],
    desc: `<p>Simulate a simple heartbeat-based leader election.</p><p>Each heartbeat is <code>[nodeId, time]</code>. There is initially no leader. A leader remains valid until <code>lastHeartbeatTime + timeout</code>. If a heartbeat arrives at or after that deadline, the current leader expires before the heartbeat is processed.</p><p>Rules:</p><ul><li>If there is no leader, the heartbeat sender becomes leader.</li><li>If the heartbeat is from the current leader, its lease is refreshed.</li><li>If the heartbeat is from another node while the current lease is still valid, it is ignored.</li></ul><p>Return the current leader after processing each heartbeat.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>heartbeats = [['a',0],['a',2],['b',4],['b',6],['a',7]], timeout = 3</div><div><b>Output:</b>['a','a','a','b','b']</div><div class="exp">b's heartbeat at 4 is too early; b's heartbeat at 6 arrives after a's lease expired.</div></div><h4>Constraints</h4><ul><li>0 ≤ heartbeats.length ≤ 1000</li><li>0 ≤ timeout ≤ 1000</li><li>Heartbeat times are nondecreasing</li><li>Node ids are strings</li></ul>`,
  },

  {
    slug: "write-ahead-log-replay",
    num: 8061,
    title: "Write-Ahead Log — Replay",
    difficulty: "Hard",
    tags: ["Distributed Systems", "Write-Ahead Log", "Recovery"],
    fnName: "walReplay",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[number, string, string, number | null]>} entries
 * @param {number} checkpoint
 * @return {Array<[string, number]>}
 */
function walReplay(entries, checkpoint) {
  
}
`,
      ts: `function walReplay(entries: Array<[number, string, string, number | null]>, checkpoint: number): Array<[string, number]> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            [1, "set", "a", 1],
            [2, "set", "b", 2],
            [3, "delete", "a", null],
            [2, "set", "b", 99],
          ],
          0,
        ],
        out: [["b", 2]],
      },
      {
        in: [
          [
            [1, "set", "a", 1],
            [2, "set", "b", 2],
            [3, "set", "c", 3],
            [3, "delete", "z", null],
          ],
          2,
        ],
        out: [["c", 3]],
      },
      {
        in: [
          [
            [2, "set", "a", 9],
            [2, "set", "a", 1],
            [1, "set", "b", 5],
          ],
          0,
        ],
        out: [
          ["a", 9],
          ["b", 5],
        ],
      },
      {
        in: [[[1, "delete", "x", null]], 0],
        out: [],
      },
      {
        in: [[], 5],
        out: [],
      },
      {
        in: [
          [
            [3, "set", "x", 3],
            [1, "set", "y", 1],
            [2, "delete", "y", null],
          ],
          0,
        ],
        out: [["x", 3]],
      },
    ],
    hints: [
      "Replay applies log entries by LSN order, not by input order. Entries at or below the checkpoint have already been applied and must be skipped.",
      "Each LSN is applied only once. If the same LSN appears multiple times, keep the first occurrence in input order. After applying all valid entries, return the final key-value pairs sorted by key.",
    ],
    desc: `<p>Simulate recovery by replaying a write-ahead log.</p><p>Each entry is <code>[lsn, op, key, value]</code>. Supported operations:</p><ul><li><code>'set'</code> — assign <code>value</code> to <code>key</code></li><li><code>'delete'</code> — remove <code>key</code>; the value is <code>null</code></li></ul><p>Replay rules:</p><ul><li>Ignore entries with <code>lsn &lt;= checkpoint</code>.</li><li>Apply entries with <code>lsn &gt; checkpoint</code> in ascending LSN order.</li><li>Each LSN is applied only once. If a duplicate LSN appears, use the first occurrence in input order.</li></ul><p>Return the final state as an array of <code>[key, value]</code> pairs sorted by key. Deleted keys are omitted.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>entries = [[1,'set','a',1],[2,'set','b',2],[3,'delete','a',null],[2,'set','b',99]], checkpoint = 0</div><div><b>Output:</b>[['b',2]]</div><div class="exp">Duplicate LSN 2 is ignored, then LSN 3 deletes a.</div></div><h4>Constraints</h4><ul><li>0 ≤ entries.length ≤ 1000</li><li>0 ≤ checkpoint ≤ 10<sup>6</sup></li><li>LSN values are positive integers</li><li>Keys are strings</li><li>Values are numbers for set operations</li></ul>`,
  },

  {
    slug: "eventual-consistency-merge",
    num: 8062,
    title: "Eventual Consistency — Last-Write-Wins Merge",
    difficulty: "Hard",
    tags: ["Distributed Systems", "Eventual Consistency", "CRDT"],
    fnName: "eventualConsistencyMerge",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<[string, number | null, number, string]>} writes
 * @return {Array<[string, number]>}
 */
function eventualConsistencyMerge(writes) {
  
}
`,
      ts: `function eventualConsistencyMerge(writes: Array<[string, number | null, number, string]>): Array<[string, number]> {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["x", 1, 1, "a"],
            ["x", 2, 2, "b"],
            ["x", 3, 1, "c"],
          ],
        ],
        out: [["x", 2]],
      },
      {
        in: [
          [
            ["k", 1, 5, "a"],
            ["k", 2, 5, "b"],
          ],
        ],
        out: [["k", 2]],
      },
      {
        in: [
          [
            ["a", 1, 1, "n"],
            ["a", null, 2, "n"],
          ],
        ],
        out: [],
      },
      {
        in: [
          [
            ["a", 1, 5, "a"],
            ["a", null, 5, "b"],
          ],
        ],
        out: [],
      },
      {
        in: [
          [
            ["b", 1, 1, "r1"],
            ["a", 2, 1, "r1"],
            ["b", null, 2, "r1"],
            ["a", 3, 0, "r2"],
          ],
        ],
        out: [["a", 2]],
      },
      {
        in: [[]],
        out: [],
      },
    ],
    hints: [
      "This is a last-write-wins merge: for each key, the write with the highest timestamp wins.",
      "If two writes have the same timestamp, use the lexicographically larger replica id as the winner. A winning null value is a delete/tombstone, so that key is omitted from the final output.",
    ],
    desc: `<p>Simulate an eventually consistent key-value merge using last-write-wins semantics.</p><p>Each write is <code>[key, value, timestamp, replicaId]</code>. A <code>value</code> of <code>null</code> represents a delete/tombstone.</p><p>For each key, choose the winning write:</p><ul><li>larger timestamp wins</li><li>if timestamps tie, lexicographically larger replicaId wins</li></ul><p>Return the final non-deleted state as an array of <code>[key, value]</code> pairs sorted by key. Keys whose winning write is <code>null</code> are omitted.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['x',1,1,'a'],['x',2,2,'b'],['x',3,1,'c']]</div><div><b>Output:</b>[['x',2]]</div><div class="exp">Timestamp 2 is the latest write for x.</div></div><div class="ex"><div><b>Input:</b>[['k',1,5,'a'],['k',2,5,'b']]</div><div><b>Output:</b>[['k',2]]</div><div class="exp">Timestamps tie, replica b beats replica a.</div></div><h4>Constraints</h4><ul><li>0 ≤ writes.length ≤ 1000</li><li>Keys and replica ids are strings</li><li>0 ≤ timestamp ≤ 10<sup>6</sup></li><li>Values are numbers or null</li></ul>`,
  },
];
