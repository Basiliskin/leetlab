import type { ProblemDraft } from "@domain/Problem";

export const ADVANCED_EVENT_PROBLEMS: ProblemDraft[] = [
  {
    slug: "wildcard-event-subscriptions",
    num: 8049,
    title: "Event Bus — Wildcard Subscriptions",
    difficulty: "Hard",
    tags: ["Event Emitter", "PubSub", "Pattern Matching"],
    fnName: "simulateWildcardEmitter",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<Array<*>>} actions
 * @return {string[]}
 */
function simulateWildcardEmitter(actions) {
  
}
`,
      ts: `function simulateWildcardEmitter(actions: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["sub", "user.*"],
            ["emit", "user.created", 1],
            ["emit", "user.profile.updated", 2],
          ],
        ],
        out: ["user.*:user.created:1"],
      },
      {
        in: [
          [
            ["sub", "*"],
            ["emit", "a", 1],
            ["emit", "a.b", 2],
          ],
        ],
        out: ["*:a:1"],
      },
      {
        in: [
          [
            ["sub", "*.*"],
            ["emit", "a.b", 3],
            ["emit", "a", 4],
          ],
        ],
        out: ["*.*:a.b:3"],
      },
      {
        in: [
          [
            ["sub", "a"],
            ["sub", "a"],
            ["unsub", "a"],
            ["emit", "a", 1],
          ],
        ],
        out: ["a:a:1"],
      },
      {
        in: [[["emit", "a", 1]]],
        out: [],
      },
      {
        in: [
          [
            ["sub", "*"],
            ["sub", "a"],
            ["emit", "a", 5],
          ],
        ],
        out: ["*:a:5", "a:a:5"],
      },
    ],
    hints: [
      "Split patterns and topics by dots. They match only when they have the same number of segments.",
      'A segment "*" matches exactly one topic segment. Other segments must match exactly. Subscriptions fire in subscription order.',
    ],
    desc: `<p>Simulate a pub/sub event bus with wildcard subscriptions.</p><p>Supported actions:</p><ul><li><code>['sub', pattern]</code> — add one persistent subscription</li><li><code>['unsub', pattern]</code> — remove one subscription with that exact pattern, if any</li><li><code>['emit', topic, value]</code> — deliver the event to every matching subscription</li></ul><p>Patterns and topics are dot-separated strings. A pattern segment <code>*</code> matches exactly one topic segment. All other segments must match exactly, and the number of segments must be equal.</p><p>For every matching subscription, append <code>pattern:topic:value</code> to the output log, in subscription order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[['sub','user.*'],['emit','user.created',1],['emit','user.profile.updated',2]]</div><div><b>Output:</b>['user.*:user.created:1']</div><div class="exp">user.* matches a two-segment topic only.</div></div><div class="ex"><div><b>Input:</b>[['sub','*'],['emit','a',1],['emit','a.b',2]]</div><div><b>Output:</b>['*:a:1']</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Patterns and topics are non-empty dot-separated strings</li><li>Values are numbers or strings</li></ul>`,
  },
];
