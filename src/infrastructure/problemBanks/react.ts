import type { ProblemDraft } from '@domain/Problem'

export const REACT_PROBLEMS: ProblemDraft[] = [
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
]
