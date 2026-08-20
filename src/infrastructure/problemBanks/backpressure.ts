import type { ProblemDraft } from "@domain/Problem";

export const BACKPRESSURE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "bounded-produce-consume",
    num: 8036,
    title: "Backpressure — Bounded Produce/Consume",
    difficulty: "Medium",
    tags: ["Backpressure", "Queue", "Streaming"],
    fnName: "boundedProduceConsume",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} nums
 * @param {number} capacity
 * @return {string[]}
 */
function boundedProduceConsume(nums, capacity) {
  
}
`,
      ts: `function boundedProduceConsume(nums: number[], capacity: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [[1, 2, 3], 2],
        out: [
          "produce:1",
          "produce:2",
          "consume:1",
          "produce:3",
          "consume:2",
          "consume:3",
        ],
      },
      {
        in: [[1, 2], 1],
        out: ["produce:1", "consume:1", "produce:2", "consume:2"],
      },
      {
        in: [[1, 2], 5],
        out: ["produce:1", "produce:2", "consume:1", "consume:2"],
      },
      { in: [[], 3], out: [] },
      {
        in: [[7], 1],
        out: ["produce:7", "consume:7"],
      },
      {
        in: [[1, 2, 3], 1],
        out: [
          "produce:1",
          "consume:1",
          "produce:2",
          "consume:2",
          "produce:3",
          "consume:3",
        ],
      },
    ],
    hints: [
      "The buffer may never hold more than capacity unconsumed items.",
      "Produce until the buffer is full, then consume one item before producing the next one.",
    ],
    desc: `<p>Simulate a bounded asynchronous buffer.</p><p>Implement <code>boundedProduceConsume(nums, capacity)</code>. Produce items from <code>nums</code> into an internal buffer, but never allow the buffer to hold more than <code>capacity</code> unconsumed items. When the buffer is full, consume one item before producing the next one. After the source is exhausted, consume all remaining items.</p><p>Return a log of operations:</p><ul><li><code>produce:x</code> when x enters the buffer</li><li><code>consume:x</code> when x leaves the buffer</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>boundedProduceConsume([1,2,3], 2)</div><div><b>Output:</b>['produce:1','produce:2','consume:1','produce:3','consume:2','consume:3']</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>1 ≤ capacity ≤ 1000</li></ul>`,
  },

  {
    slug: "high-water-pause-resume",
    num: 8037,
    title: "Backpressure — High/Low Water Mark",
    difficulty: "Hard",
    tags: ["Backpressure", "Streaming", "Flow Control"],
    fnName: "highWaterLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} nums
 * @param {number} highWater
 * @param {number} lowWater
 * @return {string[]}
 */
function highWaterLog(nums, highWater, lowWater) {
  
}
`,
      ts: `function highWaterLog(nums: number[], highWater: number, lowWater: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [[1, 2, 3, 4], 3, 1],
        out: [
          "enqueue:1",
          "enqueue:2",
          "enqueue:3",
          "pause",
          "drain:1",
          "drain:2",
          "resume",
          "enqueue:4",
          "drain:3",
          "drain:4",
        ],
      },
      {
        in: [[1, 2, 3], 2, 0],
        out: [
          "enqueue:1",
          "enqueue:2",
          "pause",
          "drain:1",
          "drain:2",
          "resume",
          "enqueue:3",
          "drain:3",
        ],
      },
      {
        in: [[1], 3, 1],
        out: ["enqueue:1", "drain:1"],
      },
      { in: [[], 2, 1], out: [] },
      {
        in: [[1, 2], 2, 1],
        out: [
          "enqueue:1",
          "enqueue:2",
          "pause",
          "drain:1",
          "resume",
          "drain:2",
        ],
      },
    ],
    hints: [
      "High water means pause the producer. Low water means it is safe to resume.",
      "When paused, drain only until the buffer length is lowWater, not necessarily until it is empty.",
    ],
    desc: `<p>Simulate a stream with high-water and low-water marks.</p><p>Implement <code>highWaterLog(nums, highWater, lowWater)</code>. Enqueue items one by one. When the buffer length reaches <code>highWater</code>, log <code>pause</code>, then drain items until the buffer length is exactly <code>lowWater</code>, then log <code>resume</code> and continue enqueueing.</p><p>After all input has been enqueued, drain all remaining items.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>highWaterLog([1,2,3,4], 3, 1)</div><div><b>Output:</b>['enqueue:1','enqueue:2','enqueue:3','pause','drain:1','drain:2','resume','enqueue:4','drain:3','drain:4']</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>0 ≤ lowWater &lt; highWater ≤ 1000</li></ul>`,
  },

  {
    slug: "lossy-buffer-log",
    num: 8042,
    title: "Backpressure — Lossy Buffer",
    difficulty: "Medium",
    tags: ["Backpressure", "Queue", "Streaming"],
    fnName: "lossyBufferLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number[]} nums
 * @param {number} capacity
 * @return {string[]}
 */
function lossyBufferLog(nums, capacity) {
  
}
`,
      ts: `function lossyBufferLog(nums: number[], capacity: number): string[] {
  
}
`,
    },
    tests: [
      {
        in: [[1, 2, 3], 2],
        out: [
          "accept:1",
          "accept:2",
          "drop:1",
          "accept:3",
          "drain:2",
          "drain:3",
        ],
      },
      {
        in: [[1, 2], 1],
        out: ["accept:1", "drop:1", "accept:2", "drain:2"],
      },
      {
        in: [[1, 2], 3],
        out: ["accept:1", "accept:2", "drain:1", "drain:2"],
      },
      { in: [[], 2], out: [] },
      {
        in: [[7], 1],
        out: ["accept:7", "drain:7"],
      },
      {
        in: [[1, 2, 3, 4], 2],
        out: [
          "accept:1",
          "accept:2",
          "drop:1",
          "accept:3",
          "drop:2",
          "accept:4",
          "drain:3",
          "drain:4",
        ],
      },
    ],
    hints: [
      "A lossy buffer applies backpressure by dropping data instead of blocking the producer.",
      "When the buffer is full, remove the oldest item before accepting the new one.",
    ],
    desc: `<p>Simulate a lossy backpressure strategy.</p><p>Implement <code>lossyBufferLog(nums, capacity)</code>. Accept items into a buffer with maximum size <code>capacity</code>. If the buffer is already full when a new item arrives, drop the oldest buffered item, then accept the new item.</p><p>Return a log:</p><ul><li><code>accept:x</code> when x is buffered</li><li><code>drop:x</code> when x is dropped to make room</li><li><code>drain:x</code> when x is drained after all input has been processed</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>lossyBufferLog([1,2,3], 2)</div><div><b>Output:</b>['accept:1','accept:2','drop:1','accept:3','drain:2','drain:3']</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>1 ≤ capacity ≤ 1000</li></ul>`,
  },
];
