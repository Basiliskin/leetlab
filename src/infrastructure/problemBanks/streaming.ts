import type { ProblemDraft } from '@domain/Problem'

export const STREAMING_PROBLEMS: ProblemDraft[] = [
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
},
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
]
