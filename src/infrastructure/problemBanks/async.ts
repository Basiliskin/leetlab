import type { Problem } from '@domain/Problem'

export const ASYNC_PROBLEMS: Problem[] = [
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
]
