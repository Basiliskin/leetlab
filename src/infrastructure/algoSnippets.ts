/**
 * Algorithm snippet completions: the interview-pattern boilerplate people
 * retype on every problem (loops, two pointers, binary search, BFS/DFS,
 * memoization, DP tables, union-find, a min-heap…), offered as CodeMirror
 * snippets alongside the scope / service / TS completion sources.
 *
 * Templates use CodeMirror's snippet syntax: `${name}` is a tab-stop field,
 * `${}` the final cursor position, `\t` one indent unit. Bodies are
 * type-annotation-free so the same snippet is valid in JS and TS mode.
 *
 * Labels are short mnemonics (`fori`, `bsearch`, `bfs`) that do not collide
 * with lang-javascript's built-in `for` / `function` / `class` snippets.
 */

import {
  ifNotIn,
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from '@codemirror/autocomplete'

export interface SnippetDef {
  label: string
  detail: string
  /** CodeMirror snippet template (`${field}`, `${}`, `\t`). */
  template: string
  group: string
}

type Snip = Omit<SnippetDef, 'group'>
function snip(label: string, detail: string, template: string): Snip {
  return { label, detail, template }
}
function group(name: string, snips: Snip[]): SnippetDef[] {
  return snips.map((x) => ({ ...x, group: name }))
}

/** Raw definitions — also rendered by the Help dialog's snippet reference. */
export const ALGO_SNIPPET_DEFS: readonly SnippetDef[] = [
  ...group('Loops', [
    snip('fori', 'for i = 0 → n',
      'for (let ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}'),
    snip('forr', 'for i = n-1 → 0',
      'for (let ${i} = ${n} - 1; ${i} >= 0; ${i}--) {\n\t${}\n}'),
    snip('forij', 'nested i/j loops',
      'for (let i = 0; i < ${n}; i++) {\n\tfor (let j = i + 1; j < ${n}; j++) {\n\t\t${}\n\t}\n}'),
    snip('forgrid', 'iterate a 2D grid',
      'for (let r = 0; r < ${grid}.length; r++) {\n\tfor (let c = 0; c < ${grid}[0].length; c++) {\n\t\t${}\n\t}\n}'),
    snip('forentries', 'for…of over Map entries',
      'for (const [${key}, ${value}] of ${map}) {\n\t${}\n}'),
  ]),
  ...group('Array idioms', [
    snip('sortnum', 'numeric ascending sort', '${arr}.sort((a, b) => a - b)'),
    snip('sortdesc', 'numeric descending sort', '${arr}.sort((a, b) => b - a)'),
    snip('arr2d', 'm × n matrix filled with a value',
      'const ${dp} = Array.from({ length: ${m} }, () => new Array(${n}).fill(0))'),
    snip('prefix', 'prefix-sum array',
      'const ${prefix} = new Array(${nums}.length + 1).fill(0)\nfor (let i = 0; i < ${nums}.length; i++) ${prefix}[i + 1] = ${prefix}[i] + ${nums}[i]'),
    snip('freq', 'frequency map',
      'const ${count} = new Map()\nfor (const ${x} of ${items}) ${count}.set(${x}, (${count}.get(${x}) ?? 0) + 1)'),
    snip('dirs4', '4-direction grid deltas',
      'const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]'),
    snip('dirs8', '8-direction grid deltas',
      'const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]'),
    snip('adj', 'graph adjacency list from edges',
      'const ${graph} = Array.from({ length: ${n} }, () => [])\nfor (const [u, v] of ${edges}) {\n\t${graph}[u].push(v)\n\t${graph}[v].push(u)\n}'),
  ]),
  ...group('Patterns', [
    snip('twoptr', 'two pointers converging',
      'let ${l} = 0, ${r} = ${arr}.length - 1\nwhile (${l} < ${r}) {\n\t${}\n}'),
    snip('window', 'sliding window',
      'let left = 0\nfor (let right = 0; right < ${arr}.length; right++) {\n\t${}\n\twhile (${invalid}) {\n\t\tleft++\n\t}\n}'),
    snip('bsearch', 'binary search (lower bound)',
      'let lo = 0, hi = ${arr}.length\nwhile (lo < hi) {\n\tconst mid = (lo + hi) >> 1\n\tif (${arr}[mid] < ${target}) lo = mid + 1\n\telse hi = mid\n}\n${}'),
    snip('bfs', 'BFS over a graph/grid with a queue',
      'const queue = [${start}]\nconst seen = new Set([${start}])\nfor (let head = 0; head < queue.length; head++) {\n\tconst node = queue[head]\n\tfor (const next of ${neighbors}) {\n\t\tif (seen.has(next)) continue\n\t\tseen.add(next)\n\t\tqueue.push(next)\n\t}\n}'),
    snip('dfs', 'recursive DFS over a graph/tree',
      'const seen = new Set()\nconst dfs = (${node}) => {\n\tif (seen.has(${node})) return\n\tseen.add(${node})\n\t${}\n}'),
    snip('memo', 'memoized recursive helper',
      'const memo = new Map()\nconst ${solve} = (${i}) => {\n\tif (memo.has(${i})) return memo.get(${i})\n\tconst res = ${}\n\tmemo.set(${i}, res)\n\treturn res\n}'),
    snip('backtrack', 'backtracking skeleton',
      'const result = []\nconst path = []\nconst backtrack = (${start}) => {\n\tif (${done}) {\n\t\tresult.push([...path])\n\t\treturn\n\t}\n\tfor (let i = ${start}; i < ${n}; i++) {\n\t\tpath.push(${choice})\n\t\tbacktrack(i + 1)\n\t\tpath.pop()\n\t}\n}'),
    snip('stackmono', 'monotonic stack',
      'const stack = []\nfor (let i = 0; i < ${arr}.length; i++) {\n\twhile (stack.length && ${arr}[stack[stack.length - 1]] < ${arr}[i]) {\n\t\tconst j = stack.pop()\n\t\t${}\n\t}\n\tstack.push(i)\n}'),
  ]),
  ...group('Data structures', [
    snip('uf', 'union-find (path compression + rank)',
      'const parent = Array.from({ length: ${n} }, (_, i) => i)\nconst rank = new Array(${n}).fill(0)\nconst find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))\nconst union = (a, b) => {\n\tlet ra = find(a), rb = find(b)\n\tif (ra === rb) return false\n\tif (rank[ra] < rank[rb]) [ra, rb] = [rb, ra]\n\tparent[rb] = ra\n\tif (rank[ra] === rank[rb]) rank[ra]++\n\treturn true\n}'),
    snip('heap', 'binary heap class (min by default)',
      'class Heap {\n\tconstructor(cmp = (a, b) => a - b) {\n\t\tthis.a = []\n\t\tthis.cmp = cmp\n\t}\n\tget size() { return this.a.length }\n\tpeek() { return this.a[0] }\n\tpush(v) {\n\t\tconst a = this.a\n\t\ta.push(v)\n\t\tfor (let i = a.length - 1; i > 0;) {\n\t\t\tconst p = (i - 1) >> 1\n\t\t\tif (this.cmp(a[i], a[p]) >= 0) break\n\t\t\t[a[i], a[p]] = [a[p], a[i]]\n\t\t\ti = p\n\t\t}\n\t}\n\tpop() {\n\t\tconst a = this.a\n\t\tconst top = a[0]\n\t\tconst last = a.pop()\n\t\tif (a.length) {\n\t\t\ta[0] = last\n\t\t\tfor (let i = 0; ;) {\n\t\t\t\tconst l = 2 * i + 1, r = l + 1\n\t\t\t\tlet m = i\n\t\t\t\tif (l < a.length && this.cmp(a[l], a[m]) < 0) m = l\n\t\t\t\tif (r < a.length && this.cmp(a[r], a[m]) < 0) m = r\n\t\t\t\tif (m === i) break\n\t\t\t\t[a[i], a[m]] = [a[m], a[i]]\n\t\t\t\ti = m\n\t\t\t}\n\t\t}\n\t\treturn top\n\t}\n}'),
    snip('listnode', 'singly linked list node',
      'class ListNode {\n\tconstructor(val = 0, next = null) {\n\t\tthis.val = val\n\t\tthis.next = next\n\t}\n}'),
    snip('treenode', 'binary tree node',
      'class TreeNode {\n\tconstructor(val = 0, left = null, right = null) {\n\t\tthis.val = val\n\t\tthis.left = left\n\t\tthis.right = right\n\t}\n}'),
  ]),
  ...group('Debugging', [
    snip('clg', 'console.log', 'console.log(${})'),
    snip('clv', 'console.log a labelled value', 'console.log("${expr}:", ${expr})'),
    snip('cltable', 'console.table', 'console.table(${})'),
  ]),
]

export const ALGO_SNIPPETS: readonly Completion[] = ALGO_SNIPPET_DEFS.map((d) =>
  snippetCompletion(d.template, {
    label: d.label,
    detail: d.detail,
    // Unsectioned on purpose: a separate section renders below every
    // global-scope match, so `bsea` would bury `bsearch` under the fold.
    // Mixed in, the fuzzy matcher ranks the prefix match first.
    type: 'text',
  }),
)

/** Plain-text expansion of a template, as the editor shows it on insert. */
export function snippetPreview(template: string): string {
  return template
    .replace(/[#$]\{([^}]*)\}/g, '$1')
    .replace(/\t/g, '  ')
}

// Same no-complete contexts lang-javascript's localCompletionSource uses:
// never offer a snippet inside a string, regex, comment or a name being
// declared.
const DONT_COMPLETE = [
  'TemplateString', 'String', 'RegExp', 'LineComment', 'BlockComment',
  'VariableDefinition', 'TypeDefinition', 'Label', 'PropertyDefinition',
  'PropertyName', 'PrivatePropertyDefinition', 'PrivatePropertyName',
]

function snippetSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\w$]+/)
  if (!word && !context.explicit) return null
  const from = word ? word.from : context.pos
  // `obj.fori` is a member access, not a statement position.
  if (from > 0 && context.state.sliceDoc(from - 1, from) === '.') return null
  return { from, options: ALGO_SNIPPETS, validFor: /^[\w$]*$/ }
}

export const algoSnippetCompletions: CompletionSource = ifNotIn(DONT_COMPLETE, snippetSource)
