import type { ProblemDraft } from "@domain/Problem";

export const EVENT_PROBLEMS: ProblemDraft[] = [
  {
    slug: "event-emitter-log",
    num: 8038,
    title: "Event Emitter — Listener Log",
    difficulty: "Medium",
    tags: ["Event Emitter", "Observer", "Events"],
    fnName: "simulateEmitter",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<Array<*>>} actions
 * @return {string[]}
 */
function simulateEmitter(actions) {
  
}
`,
      ts: `function simulateEmitter(actions: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["on", "a"],
            ["once", "a"],
            ["emit", "a", 1],
            ["emit", "a", 2],
          ],
        ],
        out: ["a:1", "a:1", "a:2"],
      },
      {
        in: [
          [
            ["on", "a"],
            ["on", "a"],
            ["off", "a"],
            ["emit", "a", 1],
          ],
        ],
        out: ["a:1"],
      },
      {
        in: [
          [
            ["once", "a"],
            ["emit", "a", 1],
            ["emit", "a", 2],
          ],
        ],
        out: ["a:1"],
      },
      {
        in: [[["emit", "a", 1]]],
        out: [],
      },
      {
        in: [
          [
            ["on", "a"],
            ["on", "b"],
            ["emit", "b", 2],
            ["emit", "a", 3],
          ],
        ],
        out: ["b:2", "a:3"],
      },
      {
        in: [
          [
            ["once", "a"],
            ["off", "a"],
            ["emit", "a", 1],
          ],
        ],
        out: ["a:1"],
      },
    ],
    hints: [
      "Track persistent listeners and once listeners separately.",
      "off removes one persistent listener only. once listeners are removed only after they fire.",
    ],
    desc: `<p>Simulate a simple event emitter using commands.</p><p>Supported actions:</p><ul><li><code>['on', event]</code> — add one persistent listener</li><li><code>['once', event]</code> — add one one-time listener</li><li><code>['off', event]</code> — remove one persistent listener, if any</li><li><code>['emit', event, value]</code> — invoke all active listeners for that event</li></ul><p>Each invoked listener appends <code>event:value</code> to the output log. Once listeners are removed after the first emit. <code>off</code> never removes once listeners.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['on','a'],['once','a'],['emit','a',1],['emit','a',2]]</div><div><b>Output:</b>['a:1','a:1','a:2']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Event names are strings</li><li>Payloads are numbers or strings</li></ul>`,
  },

  {
    slug: "event-bus-aggregate",
    num: 8043,
    title: "Event Bus — Aggregate State",
    difficulty: "Easy",
    tags: ["Event Emitter", "Event Bus", "State Management"],
    fnName: "eventBusAggregate",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<Array<*>>} actions
 * @return {string[]}
 */
function eventBusAggregate(actions) {
  
}
`,
      ts: `function eventBusAggregate(actions: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["emit", "a", 5],
            ["emit", "a", 2],
            ["log", "a"],
          ],
        ],
        out: ["a:7"],
      },
      {
        in: [
          [
            ["emit", "a", 1],
            ["emit", "b", 2],
            ["log", "b"],
            ["log", "a"],
          ],
        ],
        out: ["b:2", "a:1"],
      },
      {
        in: [
          [
            ["emit", "a", 5],
            ["reset", "a"],
            ["log", "a"],
          ],
        ],
        out: ["a:0"],
      },
      {
        in: [[["log", "x"]]],
        out: ["x:0"],
      },
      {
        in: [
          [
            ["emit", "x", -2],
            ["emit", "x", 5],
            ["log", "x"],
          ],
        ],
        out: ["x:3"],
      },
      {
        in: [[]],
        out: [],
      },
    ],
    hints: [
      "Keep a map from topic to its current numeric sum.",
      "Unknown topics start at 0. reset puts the topic back to 0.",
    ],
    desc: `<p>Simulate a simple event bus that aggregates numeric payloads by topic.</p><p>Supported actions:</p><ul><li><code>['emit', topic, value]</code> — add <code>value</code> to the current sum for <code>topic</code></li><li><code>['reset', topic]</code> — reset the sum for <code>topic</code> to 0</li><li><code>['log', topic]</code> — append <code>topic:sum</code> to the output</li></ul><p>Topics that have not received any events yet have sum 0.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['emit','a',5],['emit','a',2],['log','a']]</div><div><b>Output:</b>['a:7']</div></div><div class="ex"><div><b>Input:</b>[['log','x']]</div><div><b>Output:</b>['x:0']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Topic names are strings</li><li>Values are integers</li></ul>`,
  },
];
