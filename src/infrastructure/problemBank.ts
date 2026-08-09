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
];
