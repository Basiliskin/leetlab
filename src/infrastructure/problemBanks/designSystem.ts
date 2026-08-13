import type { ProblemDraft } from '@domain/Problem'

export const DESIGN_SYSTEM_PROBLEMS: ProblemDraft[] = [
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
]
