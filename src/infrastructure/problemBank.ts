import type { Problem } from '@domain/Problem'

export const PROBLEM_BANK: Problem[] = [
{
  slug:'two-sum', num:1, title:'Two Sum', difficulty:'Easy', tags:['Array','Hash Table'],
  fnName:'twoSum', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  \n}\n",
    ts:"function twoSum(nums: number[], target: number): number[] {\n  \n}\n"
  },
  tests:[
    {in:[[2,7,11,15],9], out:[0,1]}, {in:[[3,2,4],6], out:[1,2]}, {in:[[3,3],6], out:[0,1]},
    {in:[[1,5,3,9,2],7], out:[1,4]}, {in:[[-3,4,3,90],0], out:[0,2]}
  ],
  hints:[
    "A brute-force O(n²) double loop passes here — but what value do you actually need at each step?",
    "For each x you need target − x. Walk the array once, keeping a Map of value → index for everything seen so far."
  ],
  desc:`<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>the indices of the two numbers</em> that add up to <code>target</code>.</p><p>Each input has <strong>exactly one solution</strong>, you may not use the same element twice, and the indices must be returned in <strong>ascending order</strong>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [2,7,11,15], target = 9</div><div><b>Output:</b>[0,1]</div><div class="exp">Because nums[0] + nums[1] == 9, we return [0, 1].</div></div><div class="ex"><div><b>Input:</b>nums = [3,2,4], target = 6</div><div><b>Output:</b>[1,2]</div></div><div class="ex"><div><b>Input:</b>nums = [3,3], target = 6</div><div><b>Output:</b>[0,1]</div></div><h4>Constraints</h4><ul><li>2 ≤ nums.length ≤ 10<sup>4</sup></li><li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li><li>-10<sup>9</sup> ≤ target ≤ 10<sup>9</sup></li><li>Only one valid answer exists</li></ul>`
},
{
  slug:'longest-substring', num:3, title:'Longest Substring Without Repeating Characters', difficulty:'Medium', tags:['Hash Table','String','Sliding Window'],
  fnName:'lengthOfLongestSubstring', mode:'fn',
  starter:{
    js:"/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  \n}\n",
    ts:"function lengthOfLongestSubstring(s: string): number {\n  \n}\n"
  },
  tests:[
    {in:["abcabcbb"], out:3}, {in:["bbbbb"], out:1}, {in:["pwwkew"], out:3},
    {in:[""], out:0}, {in:["dvdf"], out:3}, {in:["abba"], out:2}
  ],
  hints:[
    "Grow a window [left, right] while all characters inside it are unique.",
    "When a duplicate appears, jump left past the previous occurrence — a Map of char → last index lets you skip in O(1)."
  ],
  desc:`<p>Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.</p><p>A substring is a contiguous <strong>non-empty</strong> sequence of characters within the string.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>s = "abcabcbb"</div><div><b>Output:</b>3</div><div class="exp">The answer is "abc", with a length of 3.</div></div><div class="ex"><div><b>Input:</b>s = "bbbbb"</div><div><b>Output:</b>1</div><div class="exp">The answer is "b".</div></div><div class="ex"><div><b>Input:</b>s = "pwwkew"</div><div><b>Output:</b>3</div><div class="exp">The answer is "wke" — "pwke" is a subsequence, not a substring.</div></div><h4>Constraints</h4><ul><li>0 ≤ s.length ≤ 5 × 10<sup>4</sup></li><li>s consists of English letters, digits, symbols and spaces</li></ul>`
},
{
  slug:'valid-parentheses', num:20, title:'Valid Parentheses', difficulty:'Easy', tags:['String','Stack'],
  fnName:'isValid', mode:'fn',
  starter:{
    js:"/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  \n}\n",
    ts:"function isValid(s: string): boolean {\n  \n}\n"
  },
  tests:[
    {in:["()"], out:true}, {in:["()[]{}"], out:true}, {in:["(]"], out:false},
    {in:["([)]"], out:false}, {in:["{[]}"], out:true}, {in:["]"], out:false}
  ],
  hints:[
    "Think about the most recent unmatched opening bracket — which data structure tracks “latest first”?",
    "Push openers; on a closer, pop and compare the pair. Valid ⇔ the stack is empty at the end."
  ],
  desc:`<p>Given a string <code>s</code> containing just the characters <code>(</code>, <code>)</code>, <code>{</code>, <code>}</code>, <code>[</code> and <code>]</code>, determine if the input string is valid.</p><p>An input string is valid if open brackets are closed by the <strong>same type</strong> of brackets and in the <strong>correct order</strong>, and every close bracket has a corresponding open bracket of the same type.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>s = "()[]{}"</div><div><b>Output:</b>true</div></div><div class="ex"><div><b>Input:</b>s = "(]"</div><div><b>Output:</b>false</div></div><div class="ex"><div><b>Input:</b>s = "([)]"</div><div><b>Output:</b>false</div></div><h4>Constraints</h4><ul><li>1 ≤ s.length ≤ 10<sup>4</sup></li><li>s consists of parentheses only: <code>()[]{}</code></li></ul>`
},
{
  slug:'trapping-rain-water', num:42, title:'Trapping Rain Water', difficulty:'Hard', tags:['Array','Two Pointers','Dynamic Programming','Monotonic Stack'],
  fnName:'trap', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n  \n}\n",
    ts:"function trap(height: number[]): number {\n  \n}\n"
  },
  tests:[
    {in:[[0,1,0,2,1,0,1,3,2,1,2,1]], out:6}, {in:[[4,2,0,3,2,5]], out:9},
    {in:[[2,0,2]], out:2}, {in:[[1]], out:0}, {in:[[3,0,1,3,0,5]], out:8}
  ],
  hints:[
    "The water above bar i equals min(maxLeft, maxRight) − height[i].",
    "Precompute prefix maxima from both sides for an O(n) time / O(n) space solution — or squeeze inward with two pointers for O(1) space."
  ],
  desc:`<p>Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is <code>1</code>, compute <em>how much water it can trap</em> after raining.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>height = [0,1,0,2,1,0,1,3,2,1,2,1]</div><div><b>Output:</b>6</div><div class="exp">Six units of rain water are trapped between the bars.</div></div><div class="ex"><div><b>Input:</b>height = [4,2,0,3,2,5]</div><div><b>Output:</b>9</div></div><h4>Constraints</h4><ul><li>n == height.length</li><li>0 ≤ n ≤ 2 × 10<sup>4</sup></li><li>0 ≤ height[i] ≤ 10<sup>5</sup></li></ul>`
},
{
  slug:'merge-intervals', num:56, title:'Merge Intervals', difficulty:'Medium', tags:['Array','Sorting'],
  fnName:'merge', mode:'fn',
  starter:{
    js:"/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  \n}\n",
    ts:"function merge(intervals: number[][]): number[][] {\n  \n}\n"
  },
  tests:[
    {in:[[[1,3],[2,6],[8,10],[15,18]]], out:[[1,6],[8,10],[15,18]]},
    {in:[[[1,4],[4,5]]], out:[[1,5]]}, {in:[[[1,4],[0,4]]], out:[[0,4]]},
    {in:[[[1,4],[2,3]]], out:[[1,4]]}, {in:[[[1,4],[0,0]]], out:[[0,0],[1,4]]}
  ],
  hints:[
    "Sort intervals by start — after that, overlaps can only happen between neighbours.",
    "Keep the last merged interval; if next.start ≤ current.end, extend with max(end₁, end₂), otherwise push a new one."
  ],
  desc:`<p>Given an array of <code>intervals</code> where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>intervals = [[1,3],[2,6],[8,10],[15,18]]</div><div><b>Output:</b>[[1,6],[8,10],[15,18]]</div><div class="exp">[1,3] and [2,6] overlap → merged into [1,6].</div></div><div class="ex"><div><b>Input:</b>intervals = [[1,4],[4,5]]</div><div><b>Output:</b>[[1,5]]</div><div class="exp">Intervals touching at an endpoint count as overlapping.</div></div><h4>Constraints</h4><ul><li>1 ≤ intervals.length ≤ 10<sup>4</sup></li><li>intervals[i].length == 2</li><li>0 ≤ start<sub>i</sub> ≤ end<sub>i</sub> ≤ 10<sup>4</sup></li></ul>`
},
{
  slug:'min-stack', num:155, title:'Min Stack', difficulty:'Medium', tags:['Stack','Design'],
  fnName:'MinStack', mode:'class',
  starter:{
    js:"class MinStack {\n  constructor() {\n    \n  }\n\n  /** @param {number} val */\n  push(val) {\n    \n  }\n\n  /** @return {void} */\n  pop() {\n    \n  }\n\n  /** @return {number} */\n  top() {\n    \n  }\n\n  /** @return {number} */\n  getMin() {\n    \n  }\n}\n",
    ts:"class MinStack {\n  constructor() {\n    \n  }\n\n  push(val: number): void {\n    \n  }\n\n  pop(): void {\n    \n  }\n\n  top(): number {\n    return 0;\n  }\n\n  getMin(): number {\n    return 0;\n  }\n}\n"
  },
  tests:[
    {calls:[["MinStack",[]],["push",[-2]],["push",[0]],["push",[-3]],["getMin",[]],["pop",[]],["top",[]],["getMin",[]]], out:[null,null,null,null,-3,null,0,-2]},
    {calls:[["MinStack",[]],["push",[10]],["push",[5]],["top",[]],["getMin",[]],["pop",[]],["getMin",[]]], out:[null,null,null,5,5,null,10]},
    {calls:[["MinStack",[]],["push",[2]],["getMin",[]],["push",[0]],["getMin",[]],["pop",[]],["getMin",[]]], out:[null,null,2,null,0,null,2]}
  ],
  hints:[
    "A plain stack can't answer getMin in O(1) after pops — the minimum might have just been removed.",
    "Store pairs [value, minSoFar] on the stack; the current minimum is always minSoFar of the top pair."
  ],
  desc:`<p>Design a stack that supports <code>push</code>, <code>pop</code>, <code>top</code>, and retrieving the minimum element in <strong>constant time O(1)</strong>.</p><ul><li><code>MinStack()</code> initializes the stack object</li><li><code>void push(val)</code> pushes the element onto the stack</li><li><code>void pop()</code> removes the element on the top</li><li><code>int top()</code> gets the top element</li><li><code>int getMin()</code> retrieves the minimum element</li></ul><p class="note">Judge protocol: your class is instantiated with <code>new MinStack()</code>, then each <code>[method, args]</code> call below is applied in order. <code>undefined</code> return values are normalised to <code>null</code> before comparison.</p><h4>Example</h4><div class="ex"><div><b>Calls:</b>["MinStack","push","push","push","getMin","pop","top","getMin"]</div><div><b>Args:</b>[[],[-2],[0],[-3],[],[],[],[]]</div><div><b>Output:</b>[null,null,null,null,-3,null,0,-2]</div></div><h4>Constraints</h4><ul><li>-2<sup>31</sup> ≤ val ≤ 2<sup>31</sup> − 1</li><li>pop, top and getMin are always called on non-empty stacks</li><li>At most 2 × 10<sup>4</sup> calls in total</li></ul>`
},
{
  slug:'delayed-echo', num:8001, title:'Delayed Echo', difficulty:'Easy', tags:['Promise','Asynchronous'],
  fnName:'echoAfter', mode:'fn',
  starter:{
    js:"/**\n * @param {*} value\n * @param {number} ms\n * @return {Promise<*>}\n */\nfunction echoAfter(value, ms) {\n  \n}\n",
    ts:"function echoAfter(value: unknown, ms: number): Promise<unknown> {\n  \n}\n"
  },
  tests:[
    {in:["hello", 20], out:"hello"}, {in:[42, 10], out:42}, {in:[null, 25], out:null},
    {in:[{tag:"obj"}, 15], out:{tag:"obj"}}, {in:[[1,2,3], 5], out:[1,2,3]}, {in:["", 8], out:""}
  ],
  hints:[
    "A Promise's executor function runs immediately — the asynchrony comes from the callback you hand to setTimeout.",
    "Wrap setTimeout in a Promise: call resolve(value) inside the timer callback. An async function that awaits that promise and returns value also works."
  ],
  desc:`<p>Given a <code>value</code> and a delay <code>ms</code> in milliseconds, return a <strong>Promise</strong> that resolves to <code>value</code> after waiting <em>at least</em> <code>ms</code> milliseconds.</p><p class="note">Judge protocol: your function's return value is awaited before comparison — return a Promise (or make the function <code>async</code>) and it is resolved before grading.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>echoAfter("hello", 20)</div><div><b>Output:</b>"hello"</div><div class="exp">The promise resolves to "hello" roughly 20ms later.</div></div><div class="ex"><div><b>Input:</b>echoAfter(42, 10)</div><div><b>Output:</b>42</div></div><div class="ex"><div><b>Input:</b>echoAfter(null, 25)</div><div><b>Output:</b>null</div></div><h4>Constraints</h4><ul><li>0 ≤ ms ≤ 1000</li><li>value may be any JSON-serializable value</li></ul>`
},
{
  slug:'double-in-parallel', num:8002, title:'Double In Parallel', difficulty:'Easy', tags:['Promise','Array'],
  fnName:'doubleInParallel', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @return {Promise<number[]>}\n */\nfunction doubleInParallel(nums) {\n  \n}\n",
    ts:"function doubleInParallel(nums: number[]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3]], out:[2,4,6]}, {in:[[]], out:[]}, {in:[[0,-1,5]], out:[0,-2,10]},
    {in:[[7]], out:[14]}, {in:[[1,1,1,1,1]], out:[2,2,2,2,2]}, {in:[[10,20,30,40]], out:[20,40,60,80]}
  ],
  hints:[
    "Spreading work across many promises is easy — collecting the results is the trap.",
    "Map each number to a Promise of its double, then pass the array to Promise.all(...): it preserves input order and resolves only after every step has settled."
  ],
  desc:`<p>Given an array of integers <code>nums</code>, return a <strong>Promise</strong> that resolves to a new array in which every element is <strong>doubled</strong>.</p><p>Each element must be doubled inside its own asynchronous step: start every step at once (they run concurrently) and await all of them together before resolving. Handing back the array of steps directly would return unresolved Promises, not numbers.</p><p class="note">Judge protocol: your function's return value is awaited before comparison.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>doubleInParallel([1,2,3])</div><div><b>Output:</b>[2,4,6]</div></div><div class="ex"><div><b>Input:</b>doubleInParallel([])</div><div><b>Output:</b>[]</div></div><div class="ex"><div><b>Input:</b>doubleInParallel([0,-1,5])</div><div><b>Output:</b>[0,-2,10]</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 10<sup>4</sup></li><li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li></ul>`
},
{
  slug:'sequential-sum', num:8003, title:'Sequential Sum', difficulty:'Medium', tags:['Promise','Reduce'],
  fnName:'sequentialSum', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @param {number} initial\n * @return {Promise<number>}\n */\nfunction sequentialSum(nums, initial) {\n  \n}\n",
    ts:"function sequentialSum(nums: number[], initial: number): Promise<number> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3,4], 0], out:10}, {in:[[], 5], out:5}, {in:[[-1,1,-1,1], 0], out:0},
    {in:[[100], 1], out:101}, {in:[[1,2,3,4,5,6,7,8,9,10], 0], out:55}, {in:[[2,4,6], -12], out:0}
  ],
  hints:[
    "The next addition cannot start until the previous one has resolved — that is a promise chain, not a fan-out.",
    "Seed a chain with Promise.resolve(initial), then reduce: chain = chain.then(acc => asyncStep(acc, n)). Each link waits for the previous one."
  ],
  desc:`<p>Given an array of integers <code>nums</code> and an initial value <code>initial</code>, return a <strong>Promise</strong> that resolves to the running total after adding the elements <strong>one at a time, in order</strong>.</p><p>Each addition must go through an asynchronous step, and a step may only start after the previous one has resolved. The asynchronous step itself is your choice — e.g. <code>Promise.resolve(acc + n)</code> — but the ordering constraint is the point of the exercise.</p><p class="note">Judge protocol: your function's return value is awaited before comparison.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>sequentialSum([1,2,3,4], 0)</div><div><b>Output:</b>10</div><div class="exp">0 → 1 → 3 → 6 → 10, one awaited step per element.</div></div><div class="ex"><div><b>Input:</b>sequentialSum([], 5)</div><div><b>Output:</b>5</div></div><div class="ex"><div><b>Input:</b>sequentialSum([-1,1,-1,1], 0)</div><div><b>Output:</b>0</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 10<sup>3</sup></li><li>-10<sup>6</sup> ≤ nums[i] ≤ 10<sup>6</sup></li><li>-10<sup>6</sup> ≤ initial ≤ 10<sup>6</sup></li></ul>`
},
{
  slug:'resilient-double', num:8004, title:'Resilient Double', difficulty:'Medium', tags:['Promise','Error Handling'],
  fnName:'resilientDouble', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @return {Promise<number[]>}\n */\nfunction resilientDouble(nums) {\n  \n}\n",
    ts:"function resilientDouble(nums: number[]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3]], out:[2,4,6]}, {in:[[-1,2,-3]], out:[null,4,null]}, {in:[[]], out:[]},
    {in:[[0]], out:[0]}, {in:[[5,-5,10,-10]], out:[10,null,20,null]}, {in:[[-1,-2,-3,-4]], out:[null,null,null,null]}
  ],
  hints:[
    "A rejection anywhere in an awaited chain fails the whole call — unless you catch it before it propagates.",
    "Attach .catch(() => null) to each element's own step (each must turn its failure into null) and combine the surviving promises with Promise.all."
  ],
  desc:`<p>Given an array of integers <code>nums</code>, return a <strong>Promise</strong> that resolves to a new array where every element is doubled — except that the asynchronous doubling step <strong>throws for negative numbers</strong>, and those positions must resolve to <code>null</code> instead.</p><p>Each element is processed by its own asynchronous step that can fail; your chain must catch each failure and keep going. The doubling step is your choice — e.g. a step that throws when its input is negative — but the recovery behaviour is the point of the exercise.</p><p class="note">Judge protocol: your function's return value is awaited before comparison. A rejection that escapes your function fails the case.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>resilientDouble([1,2,3])</div><div><b>Output:</b>[2,4,6]</div></div><div class="ex"><div><b>Input:</b>resilientDouble([-1,2,-3])</div><div><b>Output:</b>[null,4,null]</div></div><div class="ex"><div><b>Input:</b>resilientDouble([])</div><div><b>Output:</b>[]</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 10<sup>4</sup></li><li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li></ul>`
}
,
{
  slug:'range-array', num:8005, title:'Range Array', difficulty:'Easy', tags:['Generator','Array'],
  fnName:'rangeArray', mode:'fn',
  starter:{
    js:"/**\n * @param {number} start\n * @param {number} end\n * @return {number[]}\n */\nfunction rangeArray(start, end) {\n  \n}\n",
    ts:"function rangeArray(start: number, end: number): number[] {\n  \n}\n"
  },
  tests:[
    {in:[0,5], out:[0,1,2,3,4]}, {in:[3,3], out:[]}, {in:[-2,2], out:[-2,-1,0,1]},
    {in:[5,10], out:[5,6,7,8,9]}, {in:[0,1], out:[0]}, {in:[5,2], out:[]}
  ],
  hints:[
    "A generator is a function that can pause: write function* and hand values out one at a time with yield.",
    "Drain the generator into a plain array with the spread operator [...gen] or a for...of loop pushing each yielded value."
  ],
  desc:`<p>Given <code>start</code> and <code>end</code>, return an array of every integer from <code>start</code> (inclusive) to <code>end</code> (exclusive).</p><p>Produce the sequence with a <strong>generator function</strong> (<code>function*</code> / <code>yield</code>), then drain it into the returned array.</p><p class="note">Judge protocol: your function's return value is compared directly, so return a plain array — drain the generator inside the function. A raw generator object cannot be compared.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>rangeArray(0, 5)</div><div><b>Output:</b>[0,1,2,3,4]</div></div><div class="ex"><div><b>Input:</b>rangeArray(3, 3)</div><div><b>Output:</b>[]</div><div class="exp">start equals end, so nothing is produced.</div></div><div class="ex"><div><b>Input:</b>rangeArray(-2, 2)</div><div><b>Output:</b>[-2,-1,0,1]</div></div><h4>Constraints</h4><ul><li>-10<sup>3</sup> ≤ start ≤ end ≤ 10<sup>3</sup></li></ul>`
},
{
  slug:'fibonacci-sequence', num:8006, title:'Fibonacci Sequence', difficulty:'Easy', tags:['Generator','Math'],
  fnName:'fibonacci', mode:'fn',
  starter:{
    js:"/**\n * @param {number} n\n * @return {number[]}\n */\nfunction fibonacci(n) {\n  \n}\n",
    ts:"function fibonacci(n: number): number[] {\n  \n}\n"
  },
  tests:[
    {in:[5], out:[0,1,1,2,3]}, {in:[1], out:[0]}, {in:[0], out:[]},
    {in:[2], out:[0,1]}, {in:[10], out:[0,1,1,2,3,5,8,13,21,34]}, {in:[8], out:[0,1,1,2,3,5,8,13]}
  ],
  hints:[
    "A stateful generator can remember variables between yields — the sequence doesn't need an array inside the generator.",
    "Keep (a, b) as locals, yield a, then advance both with destructuring: [a, b] = [b, a + b]. Collect exactly n terms from the generator."
  ],
  desc:`<p>Given <code>n</code>, return an array of the first <code>n</code> Fibonacci numbers, where <code>F(0) = 0</code> and <code>F(1) = 1</code>, so the sequence starts <code>[0, 1, 1, 2, 3, 5, ...]</code>.</p><p>Implement the sequence as a <strong>stateful generator</strong> that yields one term per step, then collect exactly <code>n</code> terms from it.</p><p class="note">Judge protocol: your function's return value is compared directly, so return a plain array — drain the generator inside the function. A raw generator object cannot be compared.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>fibonacci(5)</div><div><b>Output:</b>[0,1,1,2,3]</div></div><div class="ex"><div><b>Input:</b>fibonacci(1)</div><div><b>Output:</b>[0]</div></div><div class="ex"><div><b>Input:</b>fibonacci(0)</div><div><b>Output:</b>[]</div></div><h4>Constraints</h4><ul><li>0 ≤ n ≤ 30</li><li>The answer fits in a 32-bit integer</li></ul>`
},
{
  slug:'nested-flatten', num:8007, title:'Nested Flatten', difficulty:'Medium', tags:['Generator','Recursion'],
  fnName:'flatten', mode:'fn',
  starter:{
    js:"/**\n * @param {Array<*>} nested\n * @return {Array}\n */\nfunction flatten(nested) {\n  \n}\n",
    ts:"function flatten(nested: unknown[]): unknown[] {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,[3,[4]]]], out:[1,2,3,4]}, {in:[[1,[2,[3,[4,[5]]]]]], out:[1,2,3,4,5]}, {in:[[[[]]]], out:[]},
    {in:[[0,[-1,[2],[]],3]], out:[0,-1,2,3]}, {in:[[]], out:[]}, {in:[[1,[2,3],4]], out:[1,2,3,4]}
  ],
  hints:[
    "When a generator meets a nested array, it should hand control to a sub-generator — that is exactly what yield* does.",
    "function* flat(arr): for each item, yield* flat(item) when it is an array, otherwise yield it. Recursion happens through delegation."
  ],
  desc:`<p>Given an arbitrarily <strong>nested array</strong> of integers, return a single flat array containing every integer in <strong>depth-first order</strong>.</p><p>Write a <strong>recursive generator</strong> that delegates to itself with <code>yield*</code> when it meets a nested array, and yields plain values directly.</p><p class="note">Judge protocol: your function's return value is compared directly, so return a plain array — drain the generator inside the function. A raw generator object cannot be compared.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>flatten([1,2,[3,[4]]])</div><div><b>Output:</b>[1,2,3,4]</div></div><div class="ex"><div><b>Input:</b>flatten([1,[2,[3,[4,[5]]]]])</div><div><b>Output:</b>[1,2,3,4,5]</div><div class="exp">Depth-first: left to right, descending fully before ascending.</div></div><div class="ex"><div><b>Input:</b>flatten([[[]]])</div><div><b>Output:</b>[]</div></div><h4>Constraints</h4><ul><li>0 ≤ total elements ≤ 10<sup>3</sup></li><li>Each element is an integer or a nested array</li><li>Maximum nesting depth ≤ 100</li></ul>`
},
{
  slug:'running-total', num:8008, title:'Running Total', difficulty:'Medium', tags:['Generator','Design'],
  fnName:'runningTotal', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} values\n * @param {number} initial\n * @return {number[]}\n */\nfunction runningTotal(values, initial) {\n  \n}\n",
    ts:"function runningTotal(values: number[], initial: number): number[] {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3], 0], out:[1,3,6]}, {in:[[], 10], out:[]}, {in:[[5], 100], out:[105]},
    {in:[[-1,1,-1], 0], out:[-1,0,-1]}, {in:[[1,1,1,1], 1], out:[2,3,4,5]}, {in:[[10,-5], 3], out:[13,8]}
  ],
  hints:[
    "generator.next(value) sends a value back into the generator: the yield expression evaluates to whatever was passed in.",
    "Keep the running total inside the generator. Start it with one bare next() call, then pump inputs with next(v), collecting .value each time."
  ],
  desc:`<p>Given an array of integers <code>values</code> and a starting value <code>initial</code>, return an array where the i-th element is the running total: <code>initial + values[0] + ... + values[i]</code>.</p><p>The exercise is to compute each step by <strong>sending a value into a generator</strong>: hold the running total inside the generator and drive it with <code>gen.next(v)</code>, collecting whatever it yields.</p><p class="note">Judge protocol: your function's return value is compared directly, so return a plain array — drain the generator inside the function. A raw generator object cannot be compared.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>runningTotal([1,2,3], 0)</div><div><b>Output:</b>[1,3,6]</div><div class="exp">1 → 1+2 → 1+2+3.</div></div><div class="ex"><div><b>Input:</b>runningTotal([], 10)</div><div><b>Output:</b>[]</div></div><div class="ex"><div><b>Input:</b>runningTotal([5], 100)</div><div><b>Output:</b>[105]</div></div><h4>Constraints</h4><ul><li>0 ≤ values.length ≤ 10<sup>3</sup></li><li>-10<sup>3</sup> ≤ values[i] ≤ 10<sup>3</sup></li><li>-10<sup>3</sup> ≤ initial ≤ 10<sup>3</sup></li></ul>`
}
,
{
  slug:'props-changed', num:8009, title:'Props Changed', difficulty:'Easy', tags:['React','Memoization'],
  fnName:'propsChanged', mode:'fn',
  starter:{
    js:"/**\n * @param {Object} prev\n * @param {Object} next\n * @return {boolean}\n */\nfunction propsChanged(prev, next) {\n  \n}\n",
    ts:"function propsChanged(prev: Record<string, unknown>, next: Record<string, unknown>): boolean {\n  \n}\n"
  },
  tests:[
    {in:[{}, {}], out:false}, {in:[{a:1}, {a:1}], out:false}, {in:[{a:1}, {a:2}], out:true},
    {in:[{a:1}, {b:1}], out:true}, {in:[{a:1}, {a:1,b:2}], out:true}, {in:[{a:[1]}, {a:[1]}], out:true}
  ],
  hints:[
    "React.memo skips re-rendering when props are equal — but its default comparator checks each top-level value with Object.is, never deep.",
    "Two props objects are equal iff they have the same key set and every value passes Object.is. Nested objects and arrays compare by reference: two distinct objects are never equal."
  ],
  desc:`<p>In React, <code>React.memo</code> re-renders a component only when its props change. Implement <code>propsChanged(prev, next)</code>: return <code>true</code> when the two props objects differ by <strong>shallow equality</strong>, and <code>false</code> when they are equal.</p><p>Shallow equality means: the same set of top-level keys, and each value equal by <code>Object.is</code>. Nested objects and arrays are compared <strong>by reference</strong> — two distinct objects are never equal, exactly like React.memo's default comparator.</p><p class="note">Judge protocol: inputs are plain JSON objects; your function's return value is compared directly.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>propsChanged({a: 1}, {a: 1})</div><div><b>Output:</b>false</div></div><div class="ex"><div><b>Input:</b>propsChanged({a: 1}, {a: 2})</div><div><b>Output:</b>true</div></div><div class="ex"><div><b>Input:</b>propsChanged({a: 1}, {a: 1, b: 2})</div><div><b>Output:</b>true</div><div class="exp">Adding a key changes the key set.</div></div><h4>Constraints</h4><ul><li>prev and next are plain objects with JSON values</li><li>Keys are strings</li></ul>`
},
{
  slug:'reducer-trace', num:8010, title:'Reducer Trace', difficulty:'Easy', tags:['React','State Management'],
  fnName:'reducerTrace', mode:'fn',
  starter:{
    js:"/**\n * @param {number} initial\n * @param {Array<Array>} actions\n * @return {number[]}\n */\nfunction reducerTrace(initial, actions) {\n  \n}\n",
    ts:"function reducerTrace(initial: number, actions: Array<Array<string | number>>): number[] {\n  \n}\n"
  },
  tests:[
    {in:[0, [["increment"],["increment"],["decrement"]]], out:[1,2,1]}, {in:[10, [["add",5]]], out:[15]}, {in:[2, [["double"],["double"]]], out:[4,8]},
    {in:[-5, []], out:[]}, {in:[3, [["unknown"]]], out:[3]}, {in:[0, [["add",-2],["increment"],["double"]]], out:[-2,-1,-2]}
  ],
  hints:[
    "A reducer is a pure function: state = reducer(state, action). Each action type is one branch of a switch.",
    "Trace the state forward: start at initial, apply every action in order, and record the state after each one. Unknown action types leave the state untouched."
  ],
  desc:`<p>Model <code>useReducer</code> as a pure function: given an initial count and a list of actions, apply each action in order and return the <strong>state after every action</strong> (an array the same length as <code>actions</code>).</p><p>Supported actions:</p><ul><li><code>["increment"]</code> — add 1</li><li><code>["decrement"]</code> — subtract 1</li><li><code>["add", n]</code> — add n</li><li><code>["double"]</code> — multiply by 2</li></ul><p>Any other action type leaves the state unchanged.</p><p class="note">Judge protocol: your function's return value is compared directly.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>reducerTrace(0, [["increment"],["increment"],["decrement"]])</div><div><b>Output:</b>[1,2,1]</div></div><div class="ex"><div><b>Input:</b>reducerTrace(10, [["add",5]])</div><div><b>Output:</b>[15]</div></div><div class="ex"><div><b>Input:</b>reducerTrace(2, [["double"],["double"]])</div><div><b>Output:</b>[4,8]</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 10<sup>3</sup></li><li>-10<sup>3</sup> ≤ initial ≤ 10<sup>3</sup></li><li>-10<sup>3</sup> ≤ n ≤ 10<sup>3</sup></li></ul>`
},
{
  slug:'props-diff', num:8011, title:'Props Diff', difficulty:'Medium', tags:['React','Diffing'],
  fnName:'diffProps', mode:'fn',
  starter:{
    js:"/**\n * @param {Object} prev\n * @param {Object} next\n * @return {Array<Array>}\n */\nfunction diffProps(prev, next) {\n  \n}\n",
    ts:"function diffProps(prev: Record<string, unknown>, next: Record<string, unknown>): Array<Array<unknown>> {\n  \n}\n"
  },
  tests:[
    {in:[{}, {}], out:[]}, {in:[{a:1}, {a:1}], out:[]},
    {in:[{a:1,b:2}, {a:1,b:3,c:4}], out:[["set",["b"],3],["set",["c"],4]]},
    {in:[{a:1,b:2}, {a:1}], out:[["remove",["b"]]]},
    {in:[{a:{x:1}}, {a:{x:2}}], out:[["set",["a","x"],2]]},
    {in:[{a:[1,2,3]}, {a:[1,9]}], out:[["set",["a","1"],9],["remove",["a","2"]]]},
    {in:[{a:1}, {a:{x:1}}], out:[["set",["a"],{x:1}]]}
  ],
  hints:[
    "Reconciliation is a tree walk: for every key, decide set / remove / recurse based on what exists on each side.",
    "Recurse when both values are objects of the same kind (array vs array, object vs object); emit ['set', path, value] for added or changed values, ['remove', path] for deleted keys, and sort the result by path."
  ],
  desc:`<p>Implement a <strong>simplified reconciliation diff</strong> — the data-level version of what ReactDOM computes when it compares element trees. Given <code>prev</code> and <code>next</code> (plain JSON objects), return the list of patch operations that transform <code>prev</code> into <code>next</code>.</p><ul><li><code>["set", path, value]</code> — set the value at <code>path</code> (an array of keys) — emitted for added keys and changed values</li><li><code>["remove", path]</code> — delete the key at <code>path</code></li></ul><p>When both sides hold objects of the same kind (both arrays or both plain objects) the diff recurses into them; when the types differ, the whole value is set. Paths use JSON keys, so array indices are strings like <code>"1"</code>. Operations must be sorted by their path, compared as JSON strings (<code>["a"]</code> before <code>["b"]</code>).</p><p class="note">Judge protocol: your function's return value is compared directly. Root objects are never null.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>diffProps({a: 1}, {a: 1})</div><div><b>Output:</b>[]</div></div><div class="ex"><div><b>Input:</b>diffProps({a: 1, b: 2}, {a: 1, b: 3, c: 4})</div><div><b>Output:</b>[["set",["b"],3],["set",["c"],4]]</div></div><div class="ex"><div><b>Input:</b>diffProps({a: {x: 1}}, {a: {x: 2}})</div><div><b>Output:</b>[["set",["a","x"],2]]</div></div><h4>Constraints</h4><ul><li>prev and next are plain objects (never null)</li><li>Values are JSON primitives, arrays, or plain objects</li><li>Maximum nesting depth ≤ 10</li></ul>`
},
{
  slug:'unmount-order', num:8012, title:'Unmount Order', difficulty:'Medium', tags:['React','Lifecycle'],
  fnName:'unmountOrder', mode:'fn',
  starter:{
    js:"/**\n * @param {Object} tree\n * @param {string[]} removedIds\n * @return {string[]}\n */\nfunction unmountOrder(tree, removedIds) {\n  \n}\n",
    ts:"function unmountOrder(tree: { id: string; children?: any[] }, removedIds: string[]): string[] {\n  \n}\n"
  },
  tests:[
    {in:[{id:'root', children:[{id:'a', children:[{id:'b'}]}, {id:'c'}]}, ["root"]], out:["b","a","c","root"]},
    {in:[{id:'root', children:[{id:'a'}, {id:'b', children:[{id:'c'}]}]}, ["b"]], out:["c","b"]},
    {in:[{id:'root', children:[{id:'a'}, {id:'b', children:[{id:'c'}]}]}, ["a","c"]], out:["a","c"]},
    {in:[{id:'root', children:[{id:'a'}]}, []], out:[]},
    {in:[{id:'x'}, ["x"]], out:["x"]},
    {in:[{id:'r', children:[{id:'s', children:[{id:'t'}]}]}, ["t"]], out:["t"]}
  ],
  hints:[
    "React unmounts depth-first: every child's cleanup runs before its parent's, so the order reads leaves upward.",
    "Walk the tree post-order (children first). A node is included when it or any ancestor was removed — removing a parent takes its whole subtree."
  ],
  desc:`<p>When a React component unmounts, React runs its effect cleanups — and it always unmounts <strong>children before parents</strong>, so cleanup calls happen depth-first, from the leaves upward.</p><p>Given a component tree (<code>{id, children?}</code>) and a list of removed ids, return the ids of <strong>every</strong> unmounting component in cleanup order. Removing a parent removes its entire subtree, a component's cleanup runs only after its (removing) descendants' cleanups, and siblings appear in tree order.</p><p class="note">Judge protocol: your function's return value is compared directly.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>unmountOrder({id: "root", children: [{id: "a", children: [{id: "b"}]}, {id: "c"}]}, ["root"])</div><div><b>Output:</b>["b","a","c","root"]</div><div class="exp">b is a's child and goes first, then a, then sibling c, then the root itself.</div></div><div class="ex"><div><b>Input:</b>unmountOrder({id: "root", children: [{id: "a"}, {id: "b"}]}, ["a"])</div><div><b>Output:</b>["a"]</div></div><div class="ex"><div><b>Input:</b>unmountOrder({id: "root"}, [])</div><div><b>Output:</b>[]</div></div><h4>Constraints</h4><ul><li>The tree has at most 10<sup>3</sup> nodes</li><li>All ids are unique strings</li><li>removedIds is a list of existing ids</li></ul>`
}
,
{
  slug:'binary-search', num:704, title:'Binary Search', difficulty:'Easy', tags:['Array','Binary Search'],
  fnName:'search', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  \n}\n",
    ts:"function search(nums: number[], target: number): number {\n  \n}\n"
  },
  tests:[
    {in:[[-1,0,3,5,9,12], 9], out:4}, {in:[[-1,0,3,5,9,12], 2], out:-1},
    {in:[[5], 5], out:0}, {in:[[5], 3], out:-1},
    {in:[[1,2,3,4,5], 1], out:0}, {in:[[1,2,3,4,5,6], 6], out:5}
  ],
  hints:[
    "Halve the search range each step: compare the middle element with the target, then discard the half that cannot contain it.",
    "Keep inclusive bounds lo and hi; while lo <= hi, set mid = lo + ((hi - lo) >> 1) and move one bound past mid based on the comparison. Do not forget the lo == hi case."
  ],
  desc:`<p>Given an array of integers <code>nums</code> sorted in <strong>ascending order</strong> and an integer <code>target</code>, return the <em>index</em> of <code>target</code>, or <code>-1</code> if it is not present.</p><p>You must write an algorithm with <code>O(log n)</code> runtime complexity.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [-1,0,3,5,9,12], target = 9</div><div><b>Output:</b>4</div><div class="exp">9 exists at index 4.</div></div><div class="ex"><div><b>Input:</b>nums = [-1,0,3,5,9,12], target = 2</div><div><b>Output:</b>-1</div><div class="exp">2 does not appear in the array.</div></div><div class="ex"><div><b>Input:</b>nums = [5], target = 5</div><div><b>Output:</b>0</div></div><h4>Constraints</h4><ul><li>1 ≤ nums.length ≤ 10<sup>4</sup></li><li>-10<sup>4</sup> &lt; nums[i], target &lt; 10<sup>4</sup></li><li>All values of nums are unique</li></ul>`
}
,
{
  slug:'reverse-linked-list', num:206, title:'Reverse Linked List', difficulty:'Easy', tags:['Linked List','Recursion'],
  fnName:'reverseList', mode:'fn',
  starter:{
    js:"/**\n * @param {{val: number, next: any}|null} head\n * @return {{val: number, next: any}|null}\n */\nfunction reverseList(head) {\n  \n}\n",
    ts:"interface ListNode {\n  val: number\n  next: ListNode | null\n}\n\nfunction reverseList(head: ListNode | null): ListNode | null {\n  return null\n}\n"
  },
  tests:[
    {in:[{val:1,next:{val:2,next:{val:3,next:{val:4,next:{val:5,next:null}}}}}], out:{val:5,next:{val:4,next:{val:3,next:{val:2,next:{val:1,next:null}}}}}},
    {in:[{val:1,next:{val:2,next:null}}], out:{val:2,next:{val:1,next:null}}},
    {in:[null], out:null},
    {in:[{val:1,next:null}], out:{val:1,next:null}},
    {in:[{val:1,next:{val:2,next:{val:3,next:null}}}], out:{val:3,next:{val:2,next:{val:1,next:null}}}},
    {in:[{val:1,next:{val:2,next:{val:3,next:{val:4,next:null}}}}], out:{val:4,next:{val:3,next:{val:2,next:{val:1,next:null}}}}}
  ],
  hints:[
    "Walk the list once, flipping each arrow to point backward. Keep a prev pointer (starts null) and a next pointer so you do not lose the rest of the list.",
    "While head is not null: save head.next, point head.next at prev, advance prev to head and head to the saved node. When head runs out, prev is the new head."
  ],
  desc:`<p>Given the <code>head</code> of a singly linked list, reverse the list and return the new head.</p><p class="note">Judge protocol: nodes are plain objects of the shape <code>{val, next}</code>, where <code>next</code> is the following node or <code>null</code>, and an empty list is <code>null</code>. Comparison is structural, so mutating the input list in place and returning its new head is fine.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>head = [1,2,3,4,5]</div><div><b>Output:</b>[5,4,3,2,1]</div></div><div class="ex"><div><b>Input:</b>head = [1,2]</div><div><b>Output:</b>[2,1]</div></div><div class="ex"><div><b>Input:</b>head = []</div><div><b>Output:</b>[]</div></div><h4>Constraints</h4><ul><li>The number of nodes in the list is in the range [0, 5000]</li><li>-5000 ≤ val ≤ 5000</li></ul>`
}
,
{
  slug:'merge-two-sorted-lists', num:21, title:'Merge Two Sorted Lists', difficulty:'Easy', tags:['Linked List','Recursion'],
  fnName:'mergeTwoLists', mode:'fn',
  starter:{
    js:"/**\n * @param {{val: number, next: any}|null} list1\n * @param {{val: number, next: any}|null} list2\n * @return {{val: number, next: any}|null}\n */\nfunction mergeTwoLists(list1, list2) {\n  \n}\n",
    ts:"interface ListNode {\n  val: number\n  next: ListNode | null\n}\n\nfunction mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n  return null\n}\n"
  },
  tests:[
    {in:[{val:1,next:{val:2,next:{val:4,next:null}}},{val:1,next:{val:3,next:{val:4,next:null}}}], out:{val:1,next:{val:1,next:{val:2,next:{val:3,next:{val:4,next:{val:4,next:null}}}}}}},
    {in:[null,null], out:null},
    {in:[null,{val:0,next:null}], out:{val:0,next:null}},
    {in:[{val:1,next:null},{val:2,next:null}], out:{val:1,next:{val:2,next:null}}},
    {in:[{val:1,next:{val:3,next:{val:5,next:null}}},{val:2,next:{val:4,next:null}}], out:{val:1,next:{val:2,next:{val:3,next:{val:4,next:{val:5,next:null}}}}}},
    {in:[{val:2,next:null},{val:1,next:{val:3,next:null}}], out:{val:1,next:{val:2,next:{val:3,next:null}}}}
  ],
  hints:[
    "The smallest node of the merged list is always one of the two heads. Whichever you take, the rest of the merge is the same problem on the remaining nodes.",
    "Compare list1.val and list2.val, take the smaller one, point it at the merge of the two tails, and return it. A null list merges to the other list as-is."
  ],
  desc:`<p>You are given the heads of two sorted linked lists <code>list1</code> and <code>list2</code>. Merge the two lists into one <strong>sorted</strong> list by splicing together the nodes, and return the head of the merged list.</p><p class="note">Judge protocol: nodes are plain objects <code>{val, next}</code>, where <code>next</code> is the following node or <code>null</code>, and an empty list is <code>null</code>. Comparison is structural.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>list1 = [1,2,4], list2 = [1,3,4]</div><div><b>Output:</b>[1,1,2,3,4,4]</div></div><div class="ex"><div><b>Input:</b>list1 = [], list2 = []</div><div><b>Output:</b>[]</div></div><div class="ex"><div><b>Input:</b>list1 = [], list2 = [0]</div><div><b>Output:</b>[0]</div></div><h4>Constraints</h4><ul><li>The number of nodes in both lists is in the range [0, 50]</li><li>-100 ≤ val ≤ 100</li><li>Both lists are sorted in non-decreasing order</li></ul>`
}
,
{
  slug:'max-depth-binary-tree', num:104, title:'Maximum Depth of Binary Tree', difficulty:'Easy', tags:['Tree','DFS','BFS'],
  fnName:'maxDepth', mode:'fn',
  starter:{
    js:"/**\n * @param {{val: number, left: any, right: any}|null} root\n * @return {number}\n */\nfunction maxDepth(root) {\n  \n}\n",
    ts:"interface TreeNode {\n  val: number\n  left: TreeNode | null\n  right: TreeNode | null\n}\n\nfunction maxDepth(root: TreeNode | null): number {\n  return 0\n}\n"
  },
  tests:[
    {in:[{val:3,left:{val:9,left:null,right:null},right:{val:20,left:{val:15,left:null,right:null},right:{val:7,left:null,right:null}}}], out:3},
    {in:[{val:1,left:null,right:{val:2,left:null,right:null}}], out:2},
    {in:[null], out:0},
    {in:[{val:1,left:null,right:null}], out:1},
    {in:[{val:1,left:{val:2,left:null,right:null},right:{val:3,left:null,right:null}}], out:2},
    {in:[{val:1,left:{val:2,left:{val:3,left:null,right:null},right:null},right:null}], out:3}
  ],
  hints:[
    "The depth of a tree is 1 plus the depth of its taller subtree, and an empty tree has depth 0. That is a one-line recursion.",
    "maxDepth(root) = 0 when root is null, otherwise 1 + Math.max(maxDepth(root.left), maxDepth(root.right))."
  ],
  desc:`<p>Given the <code>root</code> of a binary tree, return its <strong>maximum depth</strong>.</p><p>A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.</p><p class="note">Judge protocol: nodes are plain objects of the shape <code>{val, left, right}</code>, where each child is a node or <code>null</code>, and an empty tree is <code>null</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>root = [3,9,20,null,null,15,7]</div><div><b>Output:</b>3</div></div><div class="ex"><div><b>Input:</b>root = [1,null,2]</div><div><b>Output:</b>2</div></div><div class="ex"><div><b>Input:</b>root = []</div><div><b>Output:</b>0</div></div><h4>Constraints</h4><ul><li>The number of nodes in the tree is in the range [0, 10<sup>4</sup>]</li><li>-100 ≤ val ≤ 100</li></ul>`
}
,
{
  slug:'invert-binary-tree', num:226, title:'Invert Binary Tree', difficulty:'Easy', tags:['Tree','Recursion'],
  fnName:'invertTree', mode:'fn',
  starter:{
    js:"/**\n * @param {{val: number, left: any, right: any}|null} root\n * @return {{val: number, left: any, right: any}|null}\n */\nfunction invertTree(root) {\n  \n}\n",
    ts:"interface TreeNode {\n  val: number\n  left: TreeNode | null\n  right: TreeNode | null\n}\n\nfunction invertTree(root: TreeNode | null): TreeNode | null {\n  return null\n}\n"
  },
  tests:[
    {in:[{val:4,left:{val:2,left:{val:1,left:null,right:null},right:{val:3,left:null,right:null}},right:{val:7,left:{val:6,left:null,right:null},right:{val:9,left:null,right:null}}}], out:{val:4,left:{val:7,left:{val:9,left:null,right:null},right:{val:6,left:null,right:null}},right:{val:2,left:{val:3,left:null,right:null},right:{val:1,left:null,right:null}}}},
    {in:[{val:2,left:{val:1,left:null,right:null},right:{val:3,left:null,right:null}}], out:{val:2,left:{val:3,left:null,right:null},right:{val:1,left:null,right:null}}},
    {in:[null], out:null},
    {in:[{val:1,left:{val:2,left:null,right:null},right:null}], out:{val:1,left:null,right:{val:2,left:null,right:null}}},
    {in:[{val:1,left:null,right:null}], out:{val:1,left:null,right:null}},
    {in:[{val:1,left:null,right:{val:2,left:null,right:null}}], out:{val:1,left:{val:2,left:null,right:null},right:null}}
  ],
  hints:[
    "Swapping is symmetric: mirror every node and the whole tree mirrors. Either visit order works as long as each node gets its children swapped.",
    "At each node, swap root.left with root.right, then recurse into both children. A null node is the base case: nothing to swap, return it."
  ],
  desc:`<p>Given the <code>root</code> of a binary tree, <strong>invert</strong> the tree and return its root, so that every node's left and right children are swapped.</p><p class="note">Judge protocol: nodes are plain objects of the shape <code>{val, left, right}</code>, where each child is a node or <code>null</code>. Comparison is structural, so an in-place swap works: keep all three keys on every node.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>root = [4,2,7,1,3,6,9]</div><div><b>Output:</b>[4,7,2,9,6,3,1]</div></div><div class="ex"><div><b>Input:</b>root = [2,1,3]</div><div><b>Output:</b>[2,3,1]</div></div><div class="ex"><div><b>Input:</b>root = []</div><div><b>Output:</b>[]</div></div><h4>Constraints</h4><ul><li>The number of nodes in the tree is in the range [0, 100]</li><li>-100 ≤ val ≤ 100</li></ul>`
}
,
{
  slug:'climbing-stairs', num:70, title:'Climbing Stairs', difficulty:'Easy', tags:['Math','Dynamic Programming'],
  fnName:'climbStairs', mode:'fn',
  starter:{
    js:"/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  \n}\n",
    ts:"function climbStairs(n: number): number {\n  \n}\n"
  },
  tests:[
    {in:[2], out:2}, {in:[3], out:3}, {in:[1], out:1},
    {in:[4], out:5}, {in:[5], out:8}, {in:[10], out:89}
  ],
  hints:[
    "To reach step n you must have come from step n-1 or step n-2, so ways(n) = ways(n-1) + ways(n-2), with ways(1) = 1 and ways(2) = 2.",
    "This is the Fibonacci sequence in disguise. Iterate upward keeping only the last two values; no array needed."
  ],
  desc:`<p>You are climbing a staircase. It takes <code>n</code> steps to reach the top.</p><p>Each time you can either climb <code>1</code> or <code>2</code> steps. In how many <strong>distinct ways</strong> can you climb to the top?</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>n = 2</div><div><b>Output:</b>2</div><div class="exp">1 + 1 and 2.</div></div><div class="ex"><div><b>Input:</b>n = 3</div><div><b>Output:</b>3</div><div class="exp">1+1+1, 1+2 and 2+1.</div></div><div class="ex"><div><b>Input:</b>n = 4</div><div><b>Output:</b>5</div></div><h4>Constraints</h4><ul><li>1 ≤ n ≤ 45</li></ul>`
}
,
{
  slug:'single-number', num:136, title:'Single Number', difficulty:'Easy', tags:['Array','Bit Manipulation'],
  fnName:'singleNumber', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction singleNumber(nums) {\n  \n}\n",
    ts:"function singleNumber(nums: number[]): number {\n  \n}\n"
  },
  tests:[
    {in:[[2,2,1]], out:1}, {in:[[4,1,2,1,2]], out:4}, {in:[[1]], out:1},
    {in:[[3,3,5]], out:5}, {in:[[7,7,9,9,2]], out:2}, {in:[[0,0,6]], out:6}
  ],
  hints:[
    "Pair up duplicates with XOR: a ^ a is 0 and 0 ^ a is a. Since XOR is commutative and associative, XORing the whole array leaves only the number that appears once.",
    "No map, no sort: one pass with a single accumulator. Every paired value cancels itself out regardless of order."
  ],
  desc:`<p>Given a non-empty array of integers <code>nums</code>, every element appears <strong>exactly twice</strong> except for one, which appears exactly once. Find that single one.</p><p>You must implement a solution with a linear runtime complexity and use only constant extra space.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [2,2,1]</div><div><b>Output:</b>1</div></div><div class="ex"><div><b>Input:</b>nums = [4,1,2,1,2]</div><div><b>Output:</b>4</div></div><div class="ex"><div><b>Input:</b>nums = [1]</div><div><b>Output:</b>1</div></div><h4>Constraints</h4><ul><li>1 ≤ nums.length ≤ 3 × 10<sup>4</sup></li><li>-3 × 10<sup>4</sup> ≤ nums[i] ≤ 3 × 10<sup>4</sup></li><li>Every element appears twice except one which appears once</li></ul>`
}
,
{
  slug:'valid-anagram', num:242, title:'Valid Anagram', difficulty:'Easy', tags:['Hash Table','String','Sorting'],
  fnName:'isAnagram', mode:'fn',
  starter:{
    js:"/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nfunction isAnagram(s, t) {\n  \n}\n",
    ts:"function isAnagram(s: string, t: string): boolean {\n  \n}\n"
  },
  tests:[
    {in:["anagram","nagaram"], out:true}, {in:["rat","car"], out:false},
    {in:["",""], out:true}, {in:["a","a"], out:true}, {in:["a","b"], out:false},
    {in:["ab","a"], out:false}, {in:["listen","silent"], out:true}
  ],
  hints:[
    "An anagram is the same character multiset in a different order: compare the sorted versions of both strings, or count the occurrences of each character.",
    "With counts, first check that the lengths match, then decrement per character of t. All counts must return to zero."
  ],
  desc:`<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an <strong>anagram</strong> of <code>s</code>, and <code>false</code> otherwise.</p><p>An anagram is a word formed by rearranging the letters of another: the two strings must contain exactly the same characters with the same counts.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>s = "anagram", t = "nagaram"</div><div><b>Output:</b>true</div></div><div class="ex"><div><b>Input:</b>s = "rat", t = "car"</div><div><b>Output:</b>false</div></div><div class="ex"><div><b>Input:</b>s = "", t = ""</div><div><b>Output:</b>true</div></div><h4>Constraints</h4><ul><li>0 ≤ s.length, t.length ≤ 5 × 10<sup>4</sup></li><li>s and t consist of lowercase English letters</li></ul>`
}
,
{
  slug:'palindrome-number', num:9, title:'Palindrome Number', difficulty:'Easy', tags:['Math'],
  fnName:'isPalindrome', mode:'fn',
  starter:{
    js:"/**\n * @param {number} x\n * @return {boolean}\n */\nfunction isPalindrome(x) {\n  \n}\n",
    ts:"function isPalindrome(x: number): boolean {\n  \n}\n"
  },
  tests:[
    {in:[121], out:true}, {in:[-121], out:false}, {in:[10], out:false},
    {in:[0], out:true}, {in:[1], out:true}, {in:[12321], out:true}
  ],
  hints:[
    "A negative number can never be a palindrome: the minus sign would have to appear at the end too. The string form makes this trivial.",
    "Or reverse the digits numerically: repeatedly take x % 10, append it with rev = rev * 10 + digit, then x = Math.floor(x / 10). Compare rev with the original."
  ],
  desc:`<p>Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a <strong>palindrome</strong>, and <code>false</code> otherwise.</p><p>A palindrome reads the same forwards and backwards. Convert it to a string for simplicity, or reverse its digits numerically.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>x = 121</div><div><b>Output:</b>true</div><div class="exp">121 reads as 121 from left to right and from right to left.</div></div><div class="ex"><div><b>Input:</b>x = -121</div><div><b>Output:</b>false</div><div class="exp">From left to right it reads -121, from right to left 121-: not a palindrome.</div></div><div class="ex"><div><b>Input:</b>x = 10</div><div><b>Output:</b>false</div><div class="exp">It reads 01 from right to left.</div></div><h4>Constraints</h4><ul><li>-2<sup>31</sup> ≤ x ≤ 2<sup>31</sup> − 1</li></ul>`
}
,
{
  slug:'number-of-islands', num:200, title:'Number of Islands', difficulty:'Medium', tags:['Matrix','DFS','BFS'],
  fnName:'numIslands', mode:'fn',
  starter:{
    js:"/**\n * @param {string[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n  \n}\n",
    ts:"function numIslands(grid: string[][]): number {\n  return 0\n}\n"
  },
  tests:[
    {in:[[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]], out:1},
    {in:[[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], out:3},
    {in:[[["0"]]], out:0},
    {in:[[["1"]]], out:1},
    {in:[[["1","0","1"],["0","1","0"],["1","0","1"]]], out:5},
    {in:[[["1","0","1","0"],["0","1","0","1"]]], out:4}
  ],
  hints:[
    "Every time you meet a land cell you have not visited, you found a new island: count it and sink its whole connected region so it is never counted again.",
    "Flood-fill: from a land cell, visit and mark every neighbour (up, down, left, right) recursively or with a stack/queue. Sinking means flipping the cell from '1' to '0' in place."
  ],
  desc:`<p>Given an <code>m x n</code> 2D binary grid <code>grid</code> which represents a map of <code>"1"</code>s (land) and <code>"0"</code>s (water), return the number of <strong>islands</strong>.</p><p>An island is surrounded by water and is formed by connecting adjacent lands <strong>horizontally or vertically</strong> (not diagonally).</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]</div><div><b>Output:</b>1</div></div><div class="ex"><div><b>Input:</b>grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]</div><div><b>Output:</b>3</div></div><div class="ex"><div><b>Input:</b>grid = [["0"]]</div><div><b>Output:</b>0</div></div><h4>Constraints</h4><ul><li>m == grid.length</li><li>n == grid[i].length</li><li>1 ≤ m, n ≤ 300</li><li>grid[i][j] is <code>"0"</code> or <code>"1"</code></li></ul>`
}
,
{
  slug:'coin-change', num:322, title:'Coin Change', difficulty:'Medium', tags:['Dynamic Programming','BFS'],
  fnName:'coinChange', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n  \n}\n",
    ts:"function coinChange(coins: number[], amount: number): number {\n  return 0\n}\n"
  },
  tests:[
    {in:[[1,2,5], 11], out:3}, {in:[[2], 3], out:-1}, {in:[[1], 0], out:0},
    {in:[[1,5,10,25], 30], out:2}, {in:[[1,2,5], 6], out:2}, {in:[[3], 4], out:-1},
    {in:[[1,2,5], 100], out:20}
  ],
  hints:[
    "Think recursively: the fewest coins for amount a is 1 plus the fewest for a - c over every coin c. Subproblems repeat, so memoize on the amount.",
    "Build a table dp[0..amount] with dp[0] = 0 and unreachable amounts left at Infinity. dp[a] = 1 + Math.min(dp[a - c]) over coins c <= a. Return -1 if dp[amount] is still Infinity."
  ],
  desc:`<p>You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code> representing a total amount of money.</p><p>Return the <em>fewest number of coins</em> that you need to make up that amount. If that amount cannot be made up by any combination of the coins, return <code>-1</code>.</p><p>You may assume that you have an infinite number of each kind of coin.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>coins = [1,2,5], amount = 11</div><div><b>Output:</b>3</div><div class="exp">11 = 5 + 5 + 1.</div></div><div class="ex"><div><b>Input:</b>coins = [2], amount = 3</div><div><b>Output:</b>-1</div><div class="exp">No combination of 2s makes 3.</div></div><div class="ex"><div><b>Input:</b>coins = [1], amount = 0</div><div><b>Output:</b>0</div><div class="exp">Zero coins are needed to make zero amount.</div></div><h4>Constraints</h4><ul><li>1 ≤ coins.length ≤ 12</li><li>1 ≤ coins[i] ≤ 2<sup>31</sup> − 1</li><li>0 ≤ amount ≤ 10<sup>4</sup></li></ul>`
}
,
{
  slug:'queue-using-stacks', num:232, title:'Implement Queue using Stacks', difficulty:'Easy', tags:['Queue','Stack','Design'],
  fnName:'MyQueue', mode:'class',
  starter:{
    js:"class MyQueue {\n  constructor() {\n    \n  }\n\n  /** @param {number} x\n   * @return {void} */\n  push(x) {\n    \n  }\n\n  /** @return {number} */\n  pop() {\n    return 0;\n  }\n\n  /** @return {number} */\n  peek() {\n    return 0;\n  }\n\n  /** @return {boolean} */\n  empty() {\n    return false;\n  }\n}\n",
    ts:"class MyQueue {\n  constructor() {\n    \n  }\n\n  push(x: number): void {\n    \n  }\n\n  pop(): number {\n    return 0;\n  }\n\n  peek(): number {\n    return 0;\n  }\n\n  empty(): boolean {\n    return false;\n  }\n}\n"
  },
  tests:[
    {calls:[["MyQueue",[]],["push",[1]],["push",[2]],["peek",[]],["pop",[]],["empty",[]]], out:[null,null,null,1,1,false]},
    {calls:[["MyQueue",[]],["push",[1]],["push",[2]],["push",[3]],["pop",[]],["peek",[]],["pop",[]],["empty",[]]], out:[null,null,null,null,1,2,2,false]},
    {calls:[["MyQueue",[]],["empty",[]],["push",[5]],["pop",[]],["empty",[]]], out:[null,true,null,5,true]},
    {calls:[["MyQueue",[]],["push",[1]],["pop",[]],["push",[2]],["pop",[]]], out:[null,null,1,null,2]},
    {calls:[["MyQueue",[]],["push",[10]],["peek",[]],["peek",[]],["pop",[]]], out:[null,null,10,10,10]},
    {calls:[["MyQueue",[]],["push",[1]],["push",[2]],["pop",[]],["push",[3]],["pop",[]],["pop",[]]], out:[null,null,null,1,null,2,3]}
  ],
  hints:[
    "A stack reverses order; two stacks reverse it twice, restoring FIFO. Push into one stack and pop or peek only from the other.",
    "When the output stack is empty, pour every element from the input stack into it (each element moves at most once, so this is amortized O(1)). The oldest element then sits on top."
  ],
  desc:`<p>Implement a first in first out (FIFO) queue using only two stacks. The implemented queue must support all the functions of a normal queue: <code>push</code>, <code>pop</code>, <code>peek</code>, and <code>empty</code>.</p><ul><li><code>MyQueue()</code> initializes the queue object</li><li><code>void push(x)</code> pushes element x to the back of the queue</li><li><code>int pop()</code> removes and returns the element from the front</li><li><code>int peek()</code> returns the element at the front</li><li><code>boolean empty()</code> returns true if the queue is empty</li></ul><p class="note">Judge protocol: your class is instantiated with <code>new MyQueue()</code>, then each <code>[method, args]</code> call below is applied in order. <code>undefined</code> return values are normalised to <code>null</code> before comparison.</p><h4>Example</h4><div class="ex"><div><b>Calls:</b>["MyQueue","push","push","peek","pop","empty"]</div><div><b>Args:</b>[[],[1],[2],[],[],[]]</div><div><b>Output:</b>[null,null,null,1,1,false]</div></div><h4>Constraints</h4><ul><li>1 ≤ calls ≤ 100</li><li>-2<sup>31</sup> ≤ x ≤ 2<sup>31</sup> − 1</li><li>pop and peek are always called on a non-empty queue</li></ul>`
}
,
{
  slug:'k-way-merge-async', num:8013, title:'K-Way Merge (Async Generators)', difficulty:'Hard', tags:['Async Generator','Merge Sort','Streaming'],
  fnName:'mergeKSortedAsync', mode:'fn',
  starter:{
    js:"/**\n * @param {number[][]} streams\n * @return {Promise<number[]>}\n */\nasync function mergeKSortedAsync(streams) {\n  \n}\n",
    ts:"async function mergeKSortedAsync(streams: number[][]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[[1,4,7],[2,3,8],[0,5,6]]], out:[0,1,2,3,4,5,6,7,8]},
    {in:[[[1,2,3]]], out:[1,2,3]},
    {in:[[[],[1,2],[]]], out:[1,2]},
    {in:[[[5,10],[1,2],[3,7,9]]], out:[1,2,3,5,7,9,10]},
    {in:[[[],[],[]]], out:[]},
    {in:[[[-3,0,4],[-5,-1,2],[1,3]]], out:[-5,-3,-1,0,1,2,3,4]}
  ],
  hints:[
    "Each inner array is already sorted — that mirrors a MongoDB cursor with .sort() applied, or one shard of a partitioned log. Never concatenate everything and re-sort; that reads every source fully upfront and pays an extra O(log n) factor you don't need.",
    "Wrap each array as an async generator that yields one item at a time. Keep only the current head of each stream in memory, repeatedly advance whichever head is smallest and yield it — that's the classic K-way merge, O(n·k) time and O(k) memory instead of O(n)."
  ],
  desc:`<p>You are given <code>streams</code>, an array of <code>k</code> number arrays. Each individual array is already sorted in <strong>ascending order</strong> — think of them as <code>k</code> separate, presorted database cursors or shard partitions.</p><p>Merge all <code>k</code> streams into a single ascending array containing every element, using a <strong>K-way merge built from async generators</strong>: at each step you should only need to look at the current head of each stream, never the whole stream at once.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array once merging is complete.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>streams = [[1,4,7],[2,3,8],[0,5,6]]</div><div><b>Output:</b>[0,1,2,3,4,5,6,7,8]</div></div><div class="ex"><div><b>Input:</b>streams = [[],[1,2],[]]</div><div><b>Output:</b>[1,2]</div><div class="exp">Empty streams simply contribute nothing.</div></div><h4>Constraints</h4><ul><li>1 ≤ streams.length ≤ 20</li><li>0 ≤ total elements across all streams ≤ 2000</li><li>Each individual stream is sorted ascending</li></ul>`
},
{
  slug:'infinite-stream-take', num:8014, title:'Unbounded Async Stream — Take N', difficulty:'Medium', tags:['Async Generator','Streaming'],
  fnName:'firstNDivisibleBy', mode:'fn',
  starter:{
    js:"/**\n * @param {number} k\n * @param {number} n\n * @return {Promise<number[]>}\n */\nasync function firstNDivisibleBy(k, n) {\n  \n}\n",
    ts:"async function firstNDivisibleBy(k: number, n: number): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[3,4], out:[3,6,9,12]}, {in:[5,3], out:[5,10,15]}, {in:[1,5], out:[1,2,3,4,5]},
    {in:[7,0], out:[]}, {in:[2,6], out:[2,4,6,8,10,12]}, {in:[10,2], out:[10,20]}
  ],
  hints:[
    "Picture the source as an infinite feed — a live sensor, or a MongoDB change stream — that never ends. You cannot drain it into an array first; a loop with no exit condition would grow memory forever and never return.",
    "Write an infinite async generator (a while(true) loop that yields and awaits a tick) and consume it with a for-await loop that breaks the moment you have collected n matches. Breaking out of a for-await loop calls the generator's return(), so the source stops cleanly instead of running forever in the background."
  ],
  desc:`<p>Implement <code>firstNDivisibleBy(k, n)</code>: starting from <code>1</code> and counting upward <strong>forever</strong>, collect the first <code>n</code> positive integers divisible by <code>k</code>, in increasing order.</p><p>Model the counter itself as an <strong>infinite async generator</strong> — it must not know in advance how many values will be requested — and stop consuming it as soon as you have enough matches.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array of exactly <code>n</code> numbers (or fewer only when <code>n</code> is <code>0</code>).</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>k = 3, n = 4</div><div><b>Output:</b>[3,6,9,12]</div></div><div class="ex"><div><b>Input:</b>k = 7, n = 0</div><div><b>Output:</b>[]</div><div class="exp">Zero matches requested — the infinite source must never even start being pulled from... or if it does, it must stop immediately.</div></div><h4>Constraints</h4><ul><li>1 ≤ k ≤ 1000</li><li>0 ≤ n ≤ 50</li></ul>`
},
{
  slug:'backpressure-budgeted-take', num:8015, title:'Backpressure — Budgeted Take', difficulty:'Medium', tags:['Async Generator','Backpressure','Streaming'],
  fnName:'budgetedTakeAsync', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @param {number} budget\n * @return {Promise<number[]>}\n */\nasync function budgetedTakeAsync(nums, budget) {\n  \n}\n",
    ts:"async function budgetedTakeAsync(nums: number[], budget: number): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3,4],5], out:[1,2]}, {in:[[5,5,5],20], out:[5,5,5]}, {in:[[10],5], out:[]},
    {in:[[1,1,1,1,1],3], out:[1,1,1]}, {in:[[],10], out:[]}, {in:[[2,2,2],4], out:[2,2]}
  ],
  hints:[
    "Model nums as a fast producer (a Kafka topic, say) feeding a slow consumer (an external API with a rate limit). If you map over the whole array up front, you've already committed to work you can't afford — capacity has to be checked between items, not after eagerly collecting everything.",
    "Consume nums one at a time with an async generator, awaiting a simulated 'send' before deciding whether to continue. Track the running sum and stop pulling from the source — not just stop appending to the result — the instant the next item would push the sum over budget."
  ],
  desc:`<p>You are streaming <code>nums</code> one item at a time into a slow downstream sink. Given a <code>budget</code>, keep accepting items — in order — for as long as the <strong>running sum</strong> of accepted items stays <code>≤ budget</code>. The moment the next item would push the running sum over budget, stop pulling from the source entirely and return only what was accepted so far.</p><p>This is a <strong>backpressure</strong> exercise: the point is that the source is never asked for more than it needs to produce, not merely that the result is filtered afterward.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array of the accepted prefix.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,2,3,4], budget = 5</div><div><b>Output:</b>[1,2]</div><div class="exp">Running sums: 1, 3, then 6 — 6 exceeds 5, so 3 (and everything after it) is never accepted.</div></div><div class="ex"><div><b>Input:</b>nums = [10], budget = 5</div><div><b>Output:</b>[]</div><div class="exp">Even the first item alone exceeds the budget.</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>0 ≤ nums[i] ≤ 10<sup>4</sup></li><li>0 ≤ budget ≤ 10<sup>6</sup></li></ul>`
},
{
  slug:'materialize-for-random-access', num:8016, title:'When Not To Stream — Random Access', difficulty:'Medium', tags:['Async Iterable','Array'],
  fnName:'valuesAtIndices', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} stream\n * @param {number[]} indices\n * @return {Promise<number[]>}\n */\nasync function valuesAtIndices(stream, indices) {\n  \n}\n",
    ts:"async function valuesAtIndices(stream: number[], indices: number[]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[10,20,30,40],[0,3,1]], out:[10,40,20]}, {in:[[5],[0,0,0]], out:[5,5,5]},
    {in:[[1,2,3,4,5],[4,3,2,1,0]], out:[5,4,3,2,1]}, {in:[[],[]], out:[]},
    {in:[[7,8,9],[1]], out:[8]}, {in:[[100,200],[0,1,0,1]], out:[100,200,100,200]}
  ],
  hints:[
    "Treat stream as if it only arrives through an async generator — you can call .next() on it, but there is no stream[i]. If your solution re-consumes the source from scratch for every requested index, that's O(n·m) work and, in a real system, would mean re-running an expensive query once per lookup.",
    "This is exactly when NOT to stay lazy: since you need repeated, out-of-order access to arbitrary positions, drain the async source into a plain array exactly once with a single for-await loop, then index into that array as many times as indices requires."
  ],
  desc:`<p><code>stream</code> represents values that only arrive one at a time, asynchronously (imagine paging through a paginated API). You are given a list of <code>indices</code> to read from it, in a specific (possibly repeated, possibly out-of-order) order.</p><p>Return the values at those positions, in the order <code>indices</code> lists them — but consume the underlying source only <strong>once</strong>, no matter how many indices are requested or how they're ordered.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array the same length as <code>indices</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>stream = [10,20,30,40], indices = [0,3,1]</div><div><b>Output:</b>[10,40,20]</div></div><div class="ex"><div><b>Input:</b>stream = [5], indices = [0,0,0]</div><div><b>Output:</b>[5,5,5]</div><div class="exp">Index 0 is read three times — the source itself is only consumed once.</div></div><h4>Constraints</h4><ul><li>0 ≤ stream.length ≤ 1000</li><li>0 ≤ indices.length ≤ 1000</li><li>0 ≤ indices[i] < stream.length</li></ul>`
},
{
  slug:'stream-median', num:8017, title:'When Not To Stream — Median', difficulty:'Medium', tags:['Async Iterable','Sorting'],
  fnName:'streamMedian', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} values\n * @return {Promise<number>}\n */\nasync function streamMedian(values) {\n  \n}\n",
    ts:"async function streamMedian(values: number[]): Promise<number> {\n  \n}\n"
  },
  tests:[
    {in:[[3,1,2]], out:2}, {in:[[1,2,3,4]], out:2.5}, {in:[[5]], out:5},
    {in:[[7,7,7,7]], out:7}, {in:[[10,1,3,2,9,8]], out:5.5}, {in:[[2,8]], out:5}
  ],
  hints:[
    "To find the median you need to know exactly which value sits in the middle, and you can't know that from seeing one value at a time — you need the full picture. Streaming pays off when each item can be handled independently or with small O(1) state (a sum, a min, a count); median doesn't fit that shape.",
    "Consume values as if from an async source with a single for-await loop, but this time collect every value into an array — there's no way around holding all n numbers for an exact median. Sort the buffered array, then average the two middle elements (or return the single middle element for odd length)."
  ],
  desc:`<p>Given <code>values</code> arriving one at a time from an async source, compute their <strong>median</strong>: for an odd count, the middle value once sorted; for an even count, the average of the two middle values once sorted.</p><p>Unlike the K-way merge or budgeted-take exercises, this is a case where the whole source genuinely must be buffered before an answer is possible — there is no O(1)-memory streaming shortcut for an exact median.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain number.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>values = [3,1,2]</div><div><b>Output:</b>2</div></div><div class="ex"><div><b>Input:</b>values = [1,2,3,4]</div><div><b>Output:</b>2.5</div><div class="exp">Sorted: [1,2,3,4] — middle two are 2 and 3, average 2.5.</div></div><h4>Constraints</h4><ul><li>1 ≤ values.length ≤ 1000</li><li>-10<sup>4</sup> ≤ values[i] ≤ 10<sup>4</sup></li></ul>`
}
,
{
  slug:'classnames-utility', num:8018, title:'Design System Utility — classNames', difficulty:'Easy', tags:['Design System','String'],
  fnName:'classNames', mode:'fn',
  starter:{
    js:"/**\n * @param {...*} args\n * @return {string}\n */\nfunction classNames(...args) {\n  \n}\n",
    ts:"function classNames(...args: unknown[]): string {\n  \n}\n"
  },
  tests:[
    {in:['btn', {primary:true, disabled:false}, ['large', null]], out:'btn primary large'},
    {in:[], out:''},
    {in:['a','a','b'], out:'a a b'},
    {in:[0, false, null, undefined, ''], out:''},
    {in:[['foo', 0, 'bar'], {baz:true}], out:'foo bar baz'},
    {in:['foo', ['bar', {baz:false, qux:true}]], out:'foo bar qux'}
  ],
  hints:[
    "This is the utility every design system reaches for first (clsx / classnames on npm) — components accept a mix of static strings, conditional objects, and arrays of the same, and it all needs to collapse into one class string.",
    "Walk the arguments recursively: a falsy value contributes nothing, a string is taken as-is, an array is walked item by item, and a plain object contributes each key whose value is truthy. Join everything that survives with single spaces, preserving argument order — don't deduplicate."
  ],
  desc:`<p>Implement <code>classNames(...args)</code>, the class-name-merging utility that underlies most component libraries (in the spirit of <code>clsx</code>/<code>classnames</code>).</p><p>Each argument can be:</p><ul><li>a <strong>string</strong> — included as-is</li><li>a <strong>falsy value</strong> (<code>0</code>, <code>false</code>, <code>null</code>, <code>undefined</code>, <code>''</code>) — ignored</li><li>an <strong>array</strong> — walked recursively using the same rules</li><li>a <strong>plain object</strong> — each key is included only if its value is truthy</li></ul><p>Return every surviving class name, in the order encountered, joined by a single space. Do not deduplicate.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>classNames('btn', {primary:true, disabled:false}, ['large', null])</div><div><b>Output:</b>"btn primary large"</div></div><div class="ex"><div><b>Input:</b>classNames(0, false, null, undefined, '')</div><div><b>Output:</b>""</div></div><h4>Constraints</h4><ul><li>0 ≤ args.length ≤ 100</li><li>Nesting depth of arrays/objects ≤ 10</li></ul>`
},
{
  slug:'design-token-resolver', num:8019, title:'Design Token Resolver', difficulty:'Medium', tags:['Design System','Recursion','Object'],
  fnName:'resolveTokens', mode:'fn',
  starter:{
    js:"/**\n * @param {object} tokens\n * @return {object}\n */\nfunction resolveTokens(tokens) {\n  \n}\n",
    ts:"function resolveTokens(tokens: Record<string, unknown>): Record<string, unknown> {\n  \n}\n"
  },
  tests:[
    {in:[{color:{primary:'#0d6efd', link:'$color.primary', bg:{page:'#fff'}}, spacing:{sm:'4px'}}],
     out:{'color.primary':'#0d6efd','color.link':'#0d6efd','color.bg.page':'#fff','spacing.sm':'4px'}},
    {in:[{a:{b:'$c.d'}, c:{d:'#000'}}], out:{'a.b':'#000','c.d':'#000'}},
    {in:[{x:'1px'}], out:{'x':'1px'}},
    {in:[{a:'$b', b:'$c', c:'red'}], out:{'a':'red','b':'red','c':'red'}}
  ],
  hints:[
    "This is how Style Dictionary and similar token pipelines work: a designer writes color.link as an alias of color.primary ('$color.primary') instead of repeating the hex value, so the two always stay in sync.",
    "First flatten the nested token tree into dot-path keys (e.g. color.bg.page). Then resolve each leaf: if a value is a string starting with '$', look up the path after the '$' in the flattened map and resolve that value too — aliases can chain through other aliases, so resolve recursively until you hit a real value."
  ],
  desc:`<p>Design tokens are usually authored as a nested object, where a leaf value can either be a literal (like <code>'#0d6efd'</code>) or an <strong>alias</strong> referencing another token by dot-path, written as <code>'$some.other.path'</code>.</p><p>Implement <code>resolveTokens(tokens)</code>: flatten the nested tree into a single-level object keyed by dot-path, and replace every alias with the literal value it ultimately points to — following chains of aliases as needed.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>{ color: { primary: '#0d6efd', link: '$color.primary' } }</div><div><b>Output:</b>{ 'color.primary': '#0d6efd', 'color.link': '#0d6efd' }</div></div><div class="ex"><div><b>Input:</b>{ a: '$b', b: '$c', c: 'red' }</div><div><b>Output:</b>{ a: 'red', b: 'red', c: 'red' }</div><div class="exp">a → b → c: aliases can chain more than one level deep.</div></div><h4>Constraints</h4><ul><li>1 ≤ total leaf tokens ≤ 200</li><li>Nesting depth ≤ 10</li><li>No alias cycles</li></ul>`
},
{
  slug:'responsive-value-resolver', num:8020, title:'Responsive Value Resolver', difficulty:'Medium', tags:['Design System','Object'],
  fnName:'resolveResponsiveValue', mode:'fn',
  starter:{
    js:"/**\n * @param {object} breakpoints\n * @param {object} values\n * @param {number} width\n * @return {*}\n */\nfunction resolveResponsiveValue(breakpoints, values, width) {\n  \n}\n",
    ts:"function resolveResponsiveValue(breakpoints: Record<string, number>, values: Record<string, string>, width: number): string {\n  \n}\n"
  },
  tests:[
    {in:[{sm:0, md:768, lg:1024}, {base:'1col', md:'2col', lg:'3col'}, 800], out:'2col'},
    {in:[{sm:0, md:768, lg:1024}, {base:'1col', md:'2col', lg:'3col'}, 1200], out:'3col'},
    {in:[{sm:0, md:768, lg:1024}, {base:'1col', md:'2col', lg:'3col'}, 100], out:'1col'},
    {in:[{sm:0, md:768, lg:1024}, {base:'1col', md:'2col', lg:'3col'}, 768], out:'2col'},
    {in:[{sm:0, md:768, lg:1024}, {base:'x', sm:'y'}, 2000], out:'y'},
    {in:[{sm:0, md:768, lg:1024}, {base:'1col', md:'2col', lg:'3col'}, 1023], out:'2col'}
  ],
  hints:[
    "This is the mobile-first cascade used by systems like Chakra UI or styled-system: a value set at a breakpoint applies at that width and every wider width, until a larger breakpoint overrides it.",
    "Sort breakpoint names by their min-width. Find every breakpoint whose min-width is ≤ the given width, then walk from the widest applicable breakpoint down to the narrowest, returning the first one that actually has a value defined in values. If none of them do, fall back to values.base."
  ],
  desc:`<p>Design systems commonly let a prop be set per-breakpoint, mobile-first: a value defined at a breakpoint applies from that width upward until overridden by a wider breakpoint that defines its own value.</p><p>Implement <code>resolveResponsiveValue(breakpoints, values, width)</code>:</p><ul><li><code>breakpoints</code> maps a breakpoint name to its minimum width, e.g. <code>{ sm: 0, md: 768, lg: 1024 }</code></li><li><code>values</code> maps some of those same breakpoint names (plus optionally <code>'base'</code>) to a value</li><li>return the value that applies at <code>width</code>, following the mobile-first cascade — if no breakpoint at or below <code>width</code> defines a value, return <code>values.base</code></li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>breakpoints = {sm:0, md:768, lg:1024}, values = {base:'1col', md:'2col', lg:'3col'}, width = 800</div><div><b>Output:</b>"2col"</div><div class="exp">800 ≥ 768 (md) but &lt; 1024 (lg), and md defines a value.</div></div><div class="ex"><div><b>Input:</b>breakpoints = {sm:0, md:768, lg:1024}, values = {base:'x', sm:'y'}, width = 2000</div><div><b>Output:</b>"y"</div><div class="exp">md and lg are both applicable at width 2000 but neither defines a value, so it falls back to sm.</div></div><h4>Constraints</h4><ul><li>1 ≤ breakpoints keys ≤ 10</li><li>breakpoints always includes an entry with min-width 0</li><li>0 ≤ width ≤ 10<sup>5</sup></li></ul>`
},
{
  slug:'variant-class-resolver', num:8021, title:'Variant Class Resolver (cva-style)', difficulty:'Hard', tags:['Design System','Object'],
  fnName:'resolveVariantClasses', mode:'fn',
  starter:{
    js:"/**\n * @param {object} config\n * @param {object} props\n * @return {string}\n */\nfunction resolveVariantClasses(config, props) {\n  \n}\n",
    ts:"interface VariantConfig {\n  base: string\n  variants: Record<string, Record<string, string>>\n  defaultVariants?: Record<string, string>\n}\nfunction resolveVariantClasses(config: VariantConfig, props: Record<string, string>): string {\n  \n}\n"
  },
  tests:[
    {in:[{base:'btn', variants:{size:{sm:'btn-sm',md:'btn-md',lg:'btn-lg'}, tone:{primary:'btn-primary',secondary:'btn-secondary'}}, defaultVariants:{size:'md',tone:'primary'}}, {}],
     out:'btn btn-md btn-primary'},
    {in:[{base:'btn', variants:{size:{sm:'btn-sm',md:'btn-md',lg:'btn-lg'}, tone:{primary:'btn-primary',secondary:'btn-secondary'}}, defaultVariants:{size:'md',tone:'primary'}}, {size:'lg'}],
     out:'btn btn-lg btn-primary'},
    {in:[{base:'btn', variants:{size:{sm:'btn-sm',md:'btn-md',lg:'btn-lg'}, tone:{primary:'btn-primary',secondary:'btn-secondary'}}, defaultVariants:{size:'md',tone:'primary'}}, {tone:'secondary'}],
     out:'btn btn-md btn-secondary'},
    {in:[{base:'btn', variants:{size:{sm:'btn-sm',md:'btn-md',lg:'btn-lg'}, tone:{primary:'btn-primary',secondary:'btn-secondary'}}, defaultVariants:{size:'md',tone:'primary'}}, {size:'sm', tone:'secondary'}],
     out:'btn btn-sm btn-secondary'},
    {in:[{base:'btn', variants:{size:{sm:'btn-sm',md:'btn-md',lg:'btn-lg'}, tone:{primary:'btn-primary',secondary:'btn-secondary'}}, defaultVariants:{size:'md',tone:'primary'}}, {size:'xl'}],
     out:'btn btn-md btn-primary'},
    {in:[{base:'btn', variants:{size:{sm:'btn-sm',md:'btn-md',lg:'btn-lg'}, tone:{primary:'btn-primary',secondary:'btn-secondary'}}, defaultVariants:{size:'md',tone:'primary'}}, {size:'sm', tone:'purple'}],
     out:'btn btn-sm btn-primary'}
  ],
  hints:[
    "This is the shape of class-variance-authority (cva): a base class, a map of variant groups (each with named options), and default values used whenever a caller doesn't specify — or specifies something invalid.",
    "Walk config.variants in the order its keys were defined. For each variant group, take props[key] if it names a real option in that group; otherwise fall back to defaultVariants[key]. Push the resolved class (if any), then join base plus every resolved variant class with spaces — an unrecognized value should behave exactly like an unspecified one."
  ],
  desc:`<p>Design systems built on utility CSS commonly generate class names from a small variant config (the pattern behind libraries like <code>class-variance-authority</code>). Implement <code>resolveVariantClasses(config, props)</code> where:</p><ul><li><code>config.base</code> is always included</li><li><code>config.variants</code> maps a variant name (e.g. <code>size</code>) to an object of option → class name (e.g. <code>{ sm: 'btn-sm', md: 'btn-md' }</code>)</li><li><code>config.defaultVariants</code> gives the option to use for a variant when <code>props</code> doesn't specify one <strong>or specifies an option that doesn't exist</strong> in that variant group</li></ul><p>Return <code>base</code> followed by the resolved class for each variant group — in the order the groups appear in <code>config.variants</code> — joined by single spaces.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>config as above, props = {}</div><div><b>Output:</b>"btn btn-md btn-primary"</div><div class="exp">No props given, so every variant falls back to its default.</div></div><div class="ex"><div><b>Input:</b>config as above, props = {size:'xl'}</div><div><b>Output:</b>"btn btn-md btn-primary"</div><div class="exp">'xl' isn't a real size option, so size falls back to its default just like an unspecified prop would.</div></div><h4>Constraints</h4><ul><li>1 ≤ variant groups ≤ 5</li><li>1 ≤ options per group ≤ 6</li><li>Every variant group has a default in defaultVariants</li></ul>`
},
{
  slug:'wcag-contrast-check', num:8022, title:'WCAG Contrast Check', difficulty:'Medium', tags:['Design System','Accessibility','Math'],
  fnName:'meetsContrastAA', mode:'fn',
  starter:{
    js:"/**\n * @param {string} fgHex\n * @param {string} bgHex\n * @param {'normal'|'large'} size\n * @return {boolean}\n */\nfunction meetsContrastAA(fgHex, bgHex, size) {\n  \n}\n",
    ts:"function meetsContrastAA(fgHex: string, bgHex: string, size: 'normal' | 'large'): boolean {\n  \n}\n"
  },
  tests:[
    {in:['#000000','#FFFFFF','normal'], out:true},
    {in:['#FFFFFF','#FFFFFF','normal'], out:false},
    {in:['#6c757d','#FFFFFF','normal'], out:true},
    {in:['#828282','#FFFFFF','normal'], out:false},
    {in:['#828282','#FFFFFF','large'], out:true},
    {in:['#999999','#FFFFFF','large'], out:false}
  ],
  hints:[
    "Any accessible design system needs to gate its color tokens against WCAG 2.x contrast minimums (4.5:1 for normal text, 3:1 for large text) before a pairing ships — this is the check behind that gate.",
    "Convert each hex color to relative luminance (per the WCAG formula: gamma-correct each of R/G/B to [0,1], then weight them 0.2126/0.7152/0.0722 and sum). The contrast ratio is (lighter + 0.05) / (darker + 0.05) using the two luminances. Compare that ratio against 4.5 for 'normal' or 3 for 'large'."
  ],
  desc:`<p>Implement <code>meetsContrastAA(fgHex, bgHex, size)</code>, computing the <strong>WCAG contrast ratio</strong> between a foreground and background color and checking it against the WCAG 2.x <strong>AA</strong> minimums: <strong>4.5:1</strong> for <code>'normal'</code> text, <strong>3:1</strong> for <code>'large'</code> text (18pt+, or 14pt+ bold).</p><p>Relative luminance for a channel value <code>c</code> in <code>[0,255]</code>: let <code>v = c / 255</code>; if <code>v ≤ 0.03928</code> use <code>v / 12.92</code>, otherwise use <code>((v + 0.055) / 1.055) ^ 2.4</code>. Luminance <code>L = 0.2126·R + 0.7152·G + 0.0722·B</code> using the transformed channels. Contrast ratio = <code>(L_lighter + 0.05) / (L_darker + 0.05)</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>fgHex = '#000000', bgHex = '#FFFFFF', size = 'normal'</div><div><b>Output:</b>true</div><div class="exp">Ratio is 21:1, the maximum possible.</div></div><div class="ex"><div><b>Input:</b>fgHex = '#828282', bgHex = '#FFFFFF', size = 'normal'</div><div><b>Output:</b>false</div><div class="exp">Ratio is ≈ 3.84:1 — enough for large text but not normal text.</div></div><h4>Constraints</h4><ul><li>Hex colors are 6-digit, given with a leading '#', case-insensitive</li></ul>`
},
{
  slug:'focus-order-resolver', num:8023, title:'Focus Order Resolver', difficulty:'Medium', tags:['Design System','Accessibility','Sorting'],
  fnName:'resolveFocusOrder', mode:'fn',
  starter:{
    js:"/**\n * @param {{id:string, tabIndex?:number}[]} elements\n * @return {string[]}\n */\nfunction resolveFocusOrder(elements) {\n  \n}\n",
    ts:"interface FocusableEl {\n  id: string\n  tabIndex?: number\n}\nfunction resolveFocusOrder(elements: FocusableEl[]): string[] {\n  \n}\n"
  },
  tests:[
    {in:[[{id:'a'},{id:'b',tabIndex:2},{id:'c',tabIndex:1},{id:'d'}]], out:['c','b','a','d']},
    {in:[[{id:'a',tabIndex:-1},{id:'b'},{id:'c',tabIndex:3}]], out:['c','b']},
    {in:[[{id:'x'},{id:'y'},{id:'z'}]], out:['x','y','z']},
    {in:[[{id:'a',tabIndex:5},{id:'b',tabIndex:5},{id:'c',tabIndex:1}]], out:['c','a','b']},
    {in:[[]], out:[]},
    {in:[[{id:'m',tabIndex:0},{id:'n',tabIndex:2},{id:'o',tabIndex:-3},{id:'p',tabIndex:2}]], out:['n','p','m']}
  ],
  hints:[
    "This is the actual browser Tab-key algorithm, and a custom focus-trap (in a Modal or Menu) has to reimplement it correctly: elements with a positive tabIndex are visited first, in ascending order of that index; a negative tabIndex removes an element from the sequence entirely.",
    "Split elements into three groups: negative tabIndex (excluded), positive tabIndex (sort by tabIndex ascending, breaking ties by original array position), and tabIndex 0 or missing (kept in original array order, treated as equal to each other). The result is the positive group followed by the zero/default group."
  ],
  desc:`<p>Implement <code>resolveFocusOrder(elements)</code>, reproducing the order in which the <strong>Tab</strong> key would visit a set of focusable elements — the algorithm any custom focus-trap or roving-tabindex widget has to get right.</p><ul><li>An element with <strong>tabIndex &lt; 0</strong> is not keyboard-focusable — exclude it.</li><li>Elements with <strong>tabIndex &gt; 0</strong> come first, visited in ascending order of their tabIndex; ties keep their original relative order.</li><li>Elements with <strong>tabIndex === 0</strong> or no <code>tabIndex</code> at all come after all of those, in their original relative order.</li></ul><p>Return the <code>id</code>s in the resulting focus order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>[{id:'a'},{id:'b',tabIndex:2},{id:'c',tabIndex:1},{id:'d'}]</div><div><b>Output:</b>["c","b","a","d"]</div><div class="exp">c (1) then b (2) come first; a and d (no tabIndex) follow in original order.</div></div><div class="ex"><div><b>Input:</b>[{id:'a',tabIndex:-1},{id:'b'},{id:'c',tabIndex:3}]</div><div><b>Output:</b>["c","b"]</div><div class="exp">a is excluded entirely.</div></div><h4>Constraints</h4><ul><li>0 ≤ elements.length ≤ 1000</li><li>-10 ≤ tabIndex ≤ 10<sup>4</sup> when present</li><li>All ids are unique</li></ul>`
}
,
{
  slug:'readable-stream-pull-drain', num:8024, title:'Web Streams — Pull-Based Readable', difficulty:'Easy', tags:['Web Streams','Streaming'],
  fnName:'buildAndDrain', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} chunks\n * @return {Promise<number[]>}\n */\nasync function buildAndDrain(chunks) {\n  \n}\n",
    ts:"async function buildAndDrain(chunks: number[]): Promise<number[]> {\n  \n}\n",
  },
  tests:[
    {in:[[1,2,3]], out:[1,2,3]}, {in:[[]], out:[]}, {in:[[5]], out:[5]},
    {in:[[-1,0,7]], out:[-1,0,7]}, {in:[[9,8,7,6]], out:[9,8,7,6]}, {in:[[0,0]], out:[0,0]}
  ],
  hints:[
    "The Web Streams API (ReadableStream / WritableStream / TransformStream) is available as a global in this sandbox, just like in a browser tab or a Node/Deno runtime — you don't need to import or mock anything.",
    "Build the source with `new ReadableStream({ pull(controller) { ... } })` instead of `start`: the platform calls your pull() again each time it wants more data, which is the actual backpressure-aware production model (contrast with start(), which just dumps everything into the internal queue upfront). Track an index, enqueue one chunk per pull call, and call controller.close() once you're out of chunks. Then get a reader with stream.getReader() and loop `const {done, value} = await reader.read()` until done is true."
  ],
  desc:`<p>Implement <code>buildAndDrain(chunks)</code>: build a <code>ReadableStream</code> whose source hands out the numbers in <code>chunks</code> one at a time — using a <strong><code>pull</code></strong> callback, not <code>start</code> — then drain the stream back into a plain array using a reader, and return it.</p><p>The point of the exercise is the reading protocol itself: a pull-based source only produces the next value when the stream actually asks for it, which is how real backpressure-respecting sources (file reads, network sockets, DB cursors) are modeled with the Streams API.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>chunks = [1,2,3]</div><div><b>Output:</b>[1,2,3]</div></div><div class="ex"><div><b>Input:</b>chunks = []</div><div><b>Output:</b>[]</div><div class="exp">An empty source should close immediately without ever enqueuing.</div></div><h4>Constraints</h4><ul><li>0 ≤ chunks.length ≤ 1000</li></ul>`
},
{
  slug:'transform-stream-pipeline', num:8025, title:'Web Streams — Transform Pipeline', difficulty:'Medium', tags:['Web Streams','Streaming'],
  fnName:'doubleFilterPositive', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @return {Promise<number[]>}\n */\nasync function doubleFilterPositive(nums) {\n  \n}\n",
    ts:"async function doubleFilterPositive(nums: number[]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,-2,3,0,4]], out:[2,6,8]}, {in:[[]], out:[]}, {in:[[-1,-2,-3]], out:[]},
    {in:[[5]], out:[10]}, {in:[[0,0,0]], out:[]}, {in:[[3,-3,3]], out:[6,6]}
  ],
  hints:[
    "A TransformStream is the streaming equivalent of .map()/.filter() chained together, except it processes one chunk at a time and never needs the whole array in memory: `controller.enqueue(x)` inside transform() emits zero, one, or many outputs per input chunk, so filtering is just calling enqueue conditionally.",
    "Build a source ReadableStream from nums, create `new TransformStream({ transform(chunk, controller) { ... } })` that enqueues chunk*2 only when chunk > 0, and connect them with `source.pipeThrough(transform)`. The result is itself a ReadableStream — for await...of works directly on it (it's async-iterable) to collect the final array."
  ],
  desc:`<p>Implement <code>doubleFilterPositive(nums)</code> using a <strong><code>TransformStream</code></strong>: stream the numbers in <code>nums</code> through a transform stage that doubles each value but drops any value that isn't strictly positive, and collect what comes out the other end into an array.</p><p>Wire it up with <code>readableSource.pipeThrough(transformStage)</code> — one of the main reasons to reach for the Streams API instead of a hand-rolled async generator pipeline is that <code>pipeThrough</code>/<code>pipeTo</code> get backpressure between stages for free, with no extra code from you.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,-2,3,0,4]</div><div><b>Output:</b>[2,6,8]</div><div class="exp">-2 and 0 are dropped (not &gt; 0); 1→2, 3→6, 4→8.</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>-10<sup>4</sup> ≤ nums[i] ≤ 10<sup>4</sup></li></ul>`
},
{
  slug:'tee-stream-fork', num:8026, title:'Web Streams — Forking With tee()', difficulty:'Medium', tags:['Web Streams','Streaming'],
  fnName:'teeSumAndCount', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @return {Promise<[number, number]>}\n */\nasync function teeSumAndCount(nums) {\n  \n}\n",
    ts:"async function teeSumAndCount(nums: number[]): Promise<[number, number]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,-2,3,4,-5]], out:[1,3]}, {in:[[]], out:[0,0]}, {in:[[1,1,1]], out:[3,3]},
    {in:[[-1,-1]], out:[-2,0]}, {in:[[10]], out:[10,1]}, {in:[[2,-2,2,-2]], out:[0,2]}
  ],
  hints:[
    "A ReadableStream can only be read by one consumer — once a chunk is delivered to a reader, it's gone. .tee() solves the 'two consumers need the same data' problem by returning two independent ReadableStream branches that each replay the full source.",
    "Call `const [a, b] = source.tee()`, then read both branches concurrently — with `Promise.all`, not one after the other. If you fully drain branch a before even starting branch b, the runtime has to buffer everything b hasn't read yet internally, which defeats the point of streaming; reading them concurrently is what keeps memory bounded."
  ],
  desc:`<p>Implement <code>teeSumAndCount(nums)</code>: build a single <code>ReadableStream</code> over <code>nums</code>, then use <strong><code>.tee()</code></strong> to fork it into two independent branches so it can be consumed twice without re-reading the original source:</p><ul><li>one branch computes the <strong>sum</strong> of every value</li><li>the other branch counts how many values are <strong>strictly positive</strong></li></ul><p>Return <code>[sum, positiveCount]</code>. Consume both branches concurrently, not sequentially.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,-2,3,4,-5]</div><div><b>Output:</b>[1,3]</div><div class="exp">Sum = 1-2+3+4-5 = 1. Positive count = 3 (1, 3, 4).</div></div><div class="ex"><div><b>Input:</b>nums = []</div><div><b>Output:</b>[0,0]</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>-10<sup>4</sup> ≤ nums[i] ≤ 10<sup>4</sup></li></ul>`
},
{
  slug:'writable-stream-error-propagation', num:8027, title:'Web Streams — pipeTo() Error Propagation', difficulty:'Hard', tags:['Web Streams','Streaming','Error Handling'],
  fnName:'squareUntilError', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} nums\n * @return {Promise<number[]>}\n */\nasync function squareUntilError(nums) {\n  \n}\n",
    ts:"async function squareUntilError(nums: number[]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3]], out:[1,4,9]}, {in:[[1,-2,3]], out:[1]}, {in:[[]], out:[]},
    {in:[[-5,1]], out:[]}, {in:[[4,9,-1,16]], out:[16,81]}, {in:[[2,2,2]], out:[4,4,4]}
  ],
  hints:[
    "A WritableStream sink can reject a chunk by calling `controller.error(err)` inside write() — that immediately errors the whole stream. `readable.pipeTo(writable)` returns a Promise that rejects when that happens, and — critically — it stops pulling any further chunks from the source. A crashed downstream should not keep receiving data.",
    "Build the source, then `new WritableStream({ write(chunk, controller) { ... } })`: for a negative chunk call controller.error(...) and return without recording anything; otherwise push chunk*chunk into a results array declared outside the sink. `await` the pipeTo call inside a try/catch (the rejection is expected once a negative number appears) and return whatever the sink had already collected before the error."
  ],
  desc:`<p>Implement <code>squareUntilError(nums)</code>: pipe a <code>ReadableStream</code> over <code>nums</code> into a <code>WritableStream</code> sink via <code>readable.pipeTo(writable)</code>. The sink squares every non-negative value it receives and collects it — but the moment it receives a <strong>negative</strong> value, it must error the stream instead of processing it, and no value after that point should ever reach the sink.</p><p>Return everything the sink collected before the stream errored (or the full squared array if no negative value ever appears).</p><p class="note">Judge protocol: <code>pipeTo()</code> rejects when the sink errors — that rejection is expected, not a bug; catch it and return the partial results.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>nums = [1,-2,3]</div><div><b>Output:</b>[1]</div><div class="exp">1 is squared and collected; -2 triggers the error before it's recorded; 3 is never even delivered to the sink.</div></div><div class="ex"><div><b>Input:</b>nums = [-5,1]</div><div><b>Output:</b>[]</div><div class="exp">The very first value is negative, so nothing is ever collected.</div></div><h4>Constraints</h4><ul><li>0 ≤ nums.length ≤ 1000</li><li>-10<sup>4</sup> ≤ nums[i] ≤ 10<sup>4</sup></li></ul>`
},
{
  slug:'rolling-window-mean', num:8028, title:'Sliding-Window Rolling Mean', difficulty:'Easy', tags:['Async Generator','Streaming','Sliding Window'],
  fnName:'rollingMean', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} stream\n * @param {number} k\n * @return {Promise<number[]>}\n */\nasync function rollingMean(stream, k) {\n  \n}\n",
    ts:"async function rollingMean(stream: number[], k: number): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3,4,5],3], out:[2,3,4]},
    {in:[[10],1], out:[10]},
    {in:[[5,5,5,5],2], out:[5,5,5]},
    {in:[[1],5], out:[]},
    {in:[[-1,-2,-3,-4],2], out:[-1.5,-2.5,-3.5]},
    {in:[[0,0,0],3], out:[0]}
  ],
  hints:[
    "The naive solution re-slices the last k items on every step — that's O(k) per item, O(n·k) overall, and re-allocates an array per output. Streaming a rolling window is supposed to keep working memory bounded, so do the math a different way.",
    "Keep two pieces of state across iterations: the running sum and a queue of the most recent k items. On each new item: if the queue is already k long, subtract its front from the sum and shift it out before adding the new one. Once the queue holds k items, yield sum / k — never before (a partial average is a different problem)."
  ],
  desc:`<p>Implement <code>rollingMean(stream, k)</code>: consume the numbers in <code>stream</code> as if from an async source, and emit the <strong>rolling mean of the last <code>k</code> items</strong> — one output per item, but only <em>after</em> the window has had a chance to fill. The output length is therefore <code>stream.length − k + 1</code> (or <code>0</code> if the stream is shorter than <code>k</code>).</p><p>The point of the exercise is the working-set discipline: a naive <code>stream.slice(i-k+1, i+1).reduce(...)</code> re-allocates and re-sums on every step. The streaming version keeps a fixed-size queue plus a running sum — <strong>O(1) state and O(1) work per item</strong>, regardless of <code>k</code>.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array of means (with the natural <code>Number</code> divisions producing <code>2.5</code>-style floats where appropriate).</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>stream = [1,2,3,4,5], k = 3</div><div><b>Output:</b>[2,3,4]</div><div class="exp">Windows of size 3: [1,2,3]=2, [2,3,4]=3, [3,4,5]=4.</div></div><div class="ex"><div><b>Input:</b>stream = [1], k = 5</div><div><b>Output:</b>[]</div><div class="exp">Stream shorter than the window — nothing has been seen enough times to form a mean yet.</div></div><h4>Constraints</h4><ul><li>0 ≤ stream.length ≤ 10<sup>4</sup></li><li>1 ≤ k ≤ 1000</li><li>Values fit in a regular JS number</li></ul>`
},
{
  slug:'stream-distinct', num:8029, title:'Stream Distinct — First-Occurrence Dedup', difficulty:'Easy', tags:['Async Generator','Streaming','Set'],
  fnName:'distinct', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} stream\n * @return {Promise<number[]>}\n */\nasync function distinct(stream) {\n  \n}\n",
    ts:"async function distinct(stream: number[]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,2,3,1,4,3]], out:[1,2,3,4]},
    {in:[[]], out:[]},
    {in:[[5,5,5]], out:[5]},
    {in:[[1,2,3]], out:[1,2,3]},
    {in:[[1,2,1,2,1,2]], out:[1,2]},
    {in:[[-1,-2,-1,-2]], out:[-1,-2]}
  ],
  hints:[
    "The output is 'first occurrence of each value, in input order' — same answer as the streaming version of `Array.from(new Set(stream))`, but framed as an async pipeline so the discipline is explicit.",
    "Walk the stream with a for-await loop and keep a `Set` of values you've already yielded. On each item: if it's NOT in the set, add it AND push/yield it; if it is, skip. The Set is exactly the right shape — both membership check and insertion-order iteration are O(1), so the whole pass is O(n) and the working set is at most the size of the output."
  ],
  desc:`<p>Implement <code>distinct(stream)</code>: consume the numbers in <code>stream</code> and yield each one the <strong>first time</strong> it appears, skipping every subsequent repeat. The order of the output is the order of first encounters in the input — not sorted order.</p><p>This is the canonical streaming dedupe — the version of <code>[...new Set(stream)]</code> that stays explicit about its one-pass, O(1)-membership-check discipline. The Set itself never grows larger than the output.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array of the distinct values in encounter order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>stream = [1,2,2,3,1,4,3]</div><div><b>Output:</b>[1,2,3,4]</div><div class="exp">1, 2 are new; the second 2 is skipped; 3 is new; the second 1 is skipped; 4 is new; the second 3 is skipped.</div></div><div class="ex"><div><b>Input:</b>stream = [1,2,1,2,1,2]</div><div><b>Output:</b>[1,2]</div><div class="exp">Only the first two values ever survive; everything after is a repeat.</div></div><h4>Constraints</h4><ul><li>0 ≤ stream.length ≤ 10<sup>4</sup></li></ul>`
},
{
  slug:'pagination-flatten', num:8030, title:'Pagination Flatten — Empty-Page Terminator', difficulty:'Medium', tags:['Async Generator','Streaming','Pagination'],
  fnName:'flattenPagination', mode:'fn',
  starter:{
    js:"/**\n * @param {number[][]} pages\n * @return {Promise<number[]>}\n */\nasync function flattenPagination(pages) {\n  \n}\n",
    ts:"async function flattenPagination(pages: number[][]): Promise<number[]> {\n  \n}\n"
  },
  tests:[
    {in:[[[1,2],[3,4],[]]], out:[1,2,3,4]},
    {in:[[[1,2,3]]], out:[1,2,3]},
    {in:[[[]]], out:[]},
    {in:[[[1],[2],[],[3,4]]], out:[1,2]},
    {in:[[[1,2],[3]]], out:[1,2,3]},
    {in:[[[1,2,3],[],[4]]], out:[1,2,3]}
  ],
  hints:[
    "A paginated API has no `Content-Length` and no `Last-Page` header — the only end-of-feed signal is the server returning an empty page. That's why the discipline 'stop on the first empty page, even if your local buffer still has more pages to read' is a real streaming pattern, not a contrived one.",
    "Iterate `pages` in order with a simple for-of loop. For each page: if it's empty, `break` out of the loop immediately (do not append it to the result, and do not keep reading past it); otherwise push every item of that page into the result in order. End-of-array is also an end-of-feed — the natural loop termination handles it."
  ],
  desc:`<p>Implement <code>flattenPagination(pages)</code>: treat <code>pages</code> as the sequence of responses a paginated API hands back over time, and return every item from every non-empty page as a single flat array.</p><p>The <strong>end-of-feed signal</strong> is an empty page (<code>[]</code>) — the moment you see one, stop reading. This is the exact discipline used when paging through a REST cursor: the server stops responding with data, so you stop asking. A trailing empty page (or end of array) both mean "nothing more to do".</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array of all items from non-terminator pages, in order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>pages = [[1,2],[3,4],[]]</div><div><b>Output:</b>[1,2,3,4]</div><div class="exp">[1,2] and [3,4] are real; the trailing [] is the terminator and contributes nothing.</div></div><div class="ex"><div><b>Input:</b>pages = [[1],[2],[],[3,4]]</div><div><b>Output:</b>[1,2]</div><div class="exp">[3,4] is sitting right there in the buffer — but the empty page at index 2 already terminated the feed, so it's intentionally never read.</div></div><h4>Constraints</h4><ul><li>0 ≤ pages.length ≤ 1000</li><li>Each page is itself a number array (possibly empty)</li><li>Total items across all pages ≤ 10<sup>4</sup></li></ul>`
},
{
  slug:'stream-chunk-by-threshold', num:8031, title:'Stream Chunk Until Sum Threshold', difficulty:'Medium', tags:['Async Generator','Streaming','Accumulator'],
  fnName:'chunkBySum', mode:'fn',
  starter:{
    js:"/**\n * @param {number[]} stream\n * @param {number} threshold\n * @return {Promise<number[][]>}\n */\nasync function chunkBySum(stream, threshold) {\n  \n}\n",
    ts:"async function chunkBySum(stream: number[], threshold: number): Promise<number[][]> {\n  \n}\n"
  },
  tests:[
    {in:[[1,2,3,4,5],5], out:[[1,2,3],[4,5]]},
    {in:[[1,1,1,1],3], out:[[1,1,1],[1]]},
    {in:[[5],3], out:[[5]]},
    {in:[[1,2],10], out:[[1,2]]},
    {in:[[],5], out:[]},
    {in:[[10,1,1],5], out:[[10],[1,1]]}
  ],
  hints:[
    "This is the inverse of the backpressure pattern (problem 8015). There, a slow downstream gated how much the fast upstream could push; here a slow downstream (think: a database bulk insert, or a network flush) needs batches large enough that per-batch overhead amortizes — so the upstream accumulates until the batch is 'big enough'.",
    "Keep two pieces of state: the current chunk array and its running sum. On each item: push it into the chunk and add it to the sum. If sum is now ≥ threshold, append the chunk to the output and reset both. When the stream ends, if the accumulator has anything in it, flush it as a final (partial) chunk — don't append an empty chunk for a no-op end-of-stream flush."
  ],
  desc:`<p>Implement <code>chunkBySum(stream, threshold)</code>: consume the numbers in <code>stream</code> and group them into contiguous chunks, where each chunk is the smallest contiguous run whose sum is <code>≥ threshold</code>. A final partial chunk — items left over when the stream ends without crossing the threshold — is also emitted as its own chunk.</p><p>This is the streaming pattern behind batched DB writes, log shippers that flush on size, and any pipeline where per-batch overhead dominates: you buffer until the batch is worth the round trip, then flush and start a new one.</p><p class="note">Judge protocol: your <code>async function</code>'s resolved value is compared directly, so <code>return</code> a plain array of plain arrays (chunks). An empty input must produce <code>[]</code>, never <code>[[]]</code>.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>stream = [1,2,3,4,5], threshold = 5</div><div><b>Output:</b>[[1,2,3],[4,5]]</div><div class="exp">1+2+3=6 ≥ 5, so the first chunk flushes. Then 4+5=9 ≥ 5, so the second flushes. Nothing left over.</div></div><div class="ex"><div><b>Input:</b>stream = [1,1,1,1], threshold = 3</div><div><b>Output:</b>[[1,1,1],[1]]</div><div class="exp">1+1+1=3 ≥ 3 — first chunk flushes. Then a single 1 (sum 1) is left when the stream ends; partial chunks are flushed as-is.</div></div><h4>Constraints</h4><ul><li>0 ≤ stream.length ≤ 1000</li><li>1 ≤ threshold ≤ 10<sup>6</sup></li><li>All items non-negative</li></ul>`
}
];
