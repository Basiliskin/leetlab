import type { ProblemDraft } from '@domain/Problem'

export const GENERATOR_PROBLEMS: ProblemDraft[] = [
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
    {in:[[1,2,[3,[4]]]], out:[1,2,3,4]}, {in:[[1,[2,[3,[4,[5]]]]]], out:[1,2,3,4,5]}, {in:[[[]]], out:[]},
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
]
