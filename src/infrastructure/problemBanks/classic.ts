import type { Problem } from '@domain/Problem'

export const CLASSIC_PROBLEMS: Problem[] = [
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
},
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
},
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
},
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
},
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
},
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
  desc:`<p>Implement a first in first out (FIFO) queue using only two stacks. The implemented queue must support all the functions of a normal queue: <code>push</code>, <code>pop</code>, <code>peek</code>, and <code>empty</code>.</p><ul><li><code>MyQueue()</code> initializes the queue object</li><li><code>void push(x)</code> pushes element x to the back of the queue</li><li><code>int pop()</code> removes and returns the element from the front</li><li><code>int peek()</code> returns the element at the front of the queue</li><li><code>boolean empty()</code> returns true if the queue is empty</li></ul><p class="note">Judge protocol: your class is instantiated with <code>new MyQueue()</code>, then each <code>[method, args]</code> call below is applied in order. <code>undefined</code> return values are normalised to <code>null</code> before comparison.</p><h4>Example</h4><div class="ex"><div><b>Calls:</b>["MyQueue","push","push","peek","pop","empty"]</div><div><b>Args:</b>[[],[1],[2],[],[],[]]</div><div><b>Output:</b>[null,null,null,1,1,false]</div></div><h4>Constraints</h4><ul><li>1 ≤ calls ≤ 100</li><li>-2<sup>31</sup> ≤ x ≤ 2<sup>31</sup> − 1</li><li>pop and peek are always called on a non-empty queue</li></ul>`
},
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
},
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
},
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
]
