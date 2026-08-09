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
}
];
