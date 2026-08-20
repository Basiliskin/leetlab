import type { ProblemDraft } from "@domain/Problem";

export const VALIDATION_TRANSFORMATION_PROBLEMS: ProblemDraft[] = [
  {
    slug: "json-schema-validator-lite",
    num: 8081,
    title: "JSON Schema Validator — Lite",
    difficulty: "Medium",
    tags: ["Validation", "JSON Schema", "Transformation"],
    fnName: "validateSchema",
    mode: "fn",
    starter: {
      js: `/**
 * @param {*} value
 * @param {Object} schema
 * @return {boolean}
 */
function validateSchema(value, schema) {
  
}
`,
      ts: `function validateSchema(value: unknown, schema: any): boolean {
  
}
`,
    },
    tests: [
      {
        in: [
          { name: "Alice", age: 30 },
          {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", minLength: 1 },
              age: { type: "number", minimum: 0 },
            },
          },
        ],
        out: true,
      },
      {
        in: [
          { age: 30 },
          {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", minLength: 1 },
              age: { type: "number", minimum: 0 },
            },
          },
        ],
        out: false,
      },
      {
        in: [
          { name: "" },
          {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", minLength: 1 },
              age: { type: "number", minimum: 0 },
            },
          },
        ],
        out: false,
      },
      {
        in: [
          { name: "Alice", age: -1 },
          {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", minLength: 1 },
              age: { type: "number", minimum: 0 },
            },
          },
        ],
        out: false,
      },
      {
        in: [
          [1, -2, 3],
          {
            type: "array",
            items: { type: "number", minimum: 0 },
          },
        ],
        out: false,
      },
      {
        in: [
          [],
          {
            type: "array",
            items: { type: "number", minimum: 0 },
          },
        ],
        out: true,
      },
    ],
    hints: [
      "Validate recursively: type checks first, then container-specific rules for objects and arrays, then scalar constraints.",
      "For objects, required keys must exist. Present properties are validated against their subschemas. Extra properties are allowed in this lite version.",
    ],
    desc: `<p>Implement a simplified JSON Schema validator.</p><p><code>schema</code> may contain:</p><ul><li><code>type</code> — one of <code>'string'</code>, <code>'number'</code>, <code>'boolean'</code>, <code>'null'</code>, <code>'array'</code>, or <code>'object'</code></li><li><code>required</code> — for objects, a list of keys that must exist</li><li><code>properties</code> — for objects, a map of key to subschema for present keys</li><li><code>items</code> — for arrays, a subschema applied to every element</li><li><code>minimum</code> / <code>maximum</code> — inclusive number constraints</li><li><code>minLength</code> / <code>maxLength</code> — string length constraints</li></ul><p>Return <code>true</code> when the value satisfies the schema, otherwise <code>false</code>. Extra object properties are allowed.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>value = {name:'Alice',age:30}, schema = {type:'object',required:['name'],properties:{name:{type:'string',minLength:1},age:{type:'number',minimum:0}}}</div><div><b>Output:</b>true</div></div><div class="ex"><div><b>Input:</b>value = [1,-2,3], schema = {type:'array',items:{type:'number',minimum:0}}</div><div><b>Output:</b>false</div></div><h4>Constraints</h4><ul><li>Inputs are JSON-compatible values</li><li>Schema depth ≤ 10</li><li>Object key counts ≤ 1000 in total</li></ul>`,
  },

  {
    slug: "form-validation-state",
    num: 8082,
    title: "Form Validation State",
    difficulty: "Easy",
    tags: ["Validation", "Forms", "State Management"],
    fnName: "formValidationState",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Object<string, *>} values
 * @param {Object<string, *>} rules
 * @return {{errors: Object<string, string[]>, valid: boolean}}
 */
function formValidationState(values, rules) {
  
}
`,
      ts: `function formValidationState(values: Record<string, unknown>, rules: Record<string, any>): { errors: Record<string, string[]>; valid: boolean } {
  
}
`,
    },
    tests: [
      {
        in: [
          { name: "", age: 5 },
          {
            name: { required: true, minLength: 2 },
            age: { min: 0, max: 10 },
          },
        ],
        out: {
          errors: { name: ["required", "minLength"] },
          valid: false,
        },
      },
      {
        in: [
          { name: "Ann", age: 11 },
          {
            name: { required: true, minLength: 2 },
            age: { min: 0, max: 10 },
          },
        ],
        out: {
          errors: { age: ["max"] },
          valid: false,
        },
      },
      {
        in: [
          { name: "Ann", age: 5 },
          {
            name: { required: true, minLength: 2 },
            age: { min: 0, max: 10 },
          },
        ],
        out: {
          errors: {},
          valid: true,
        },
      },
      {
        in: [{}, { email: { required: true } }],
        out: {
          errors: { email: ["required"] },
          valid: false,
        },
      },
      {
        in: [{ email: "a@b.co" }, { email: { maxLength: 5 } }],
        out: {
          errors: { email: ["maxLength"] },
          valid: false,
        },
      },
      {
        in: [{ name: "Ann", unknown: "x" }, { name: { required: true } }],
        out: {
          errors: {},
          valid: true,
        },
      },
    ],
    hints: [
      "Only fields listed in rules are validated. Extra values are ignored.",
      "required fails for undefined, null, or empty string. minLength/maxLength apply to string values; min/max apply to number values.",
    ],
    desc: `<p>Compute the validation state for a simple form.</p><p><code>values</code> is a map from field name to current value. <code>rules</code> is a map from field name to validation rules.</p><p>Supported rules:</p><ul><li><code>required</code> — value must not be <code>undefined</code>, <code>null</code>, or empty string</li><li><code>minLength</code> / <code>maxLength</code> — apply to string values</li><li><code>min</code> / <code>max</code> — apply to number values</li></ul><p>Return:</p><ul><li><code>errors</code> — map from field name to error codes. Include only fields with at least one error.</li><li><code>valid</code> — true when there are no errors</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>values = {name:'',age:5}, rules = {name:{required:true,minLength:2},age:{min:0,max:10}}</div><div><b>Output:</b>{errors:{name:['required','minLength']},valid:false}</div></div><h4>Constraints</h4><ul><li>0 ≤ number of rules ≤ 100</li><li>Values are JSON-compatible</li><li>Error codes are required, minLength, maxLength, min, max</li></ul>`,
  },

  {
    slug: "normalizr-style-entity-normalize",
    num: 8083,
    title: "Normalizr-Style Entity Normalize",
    difficulty: "Medium",
    tags: ["Transformation", "Normalization", "Entities"],
    fnName: "normalizeEntityTree",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Object} root
 * @return {{entities: Object<string, Object>, result: string}}
 */
function normalizeEntityTree(root) {
  
}
`,
      ts: `function normalizeEntityTree(root: any): { entities: Record<string, any>; result: string } {
  
}
`,
    },
    tests: [
      {
        in: [
          {
            id: "a",
            name: "A",
            children: [{ id: "b" }, { id: "c", children: [{ id: "d" }] }],
          },
        ],
        out: {
          entities: {
            a: { id: "a", name: "A", children: ["b", "c"] },
            b: { id: "b", children: [] },
            c: { id: "c", children: ["d"] },
            d: { id: "d", children: [] },
          },
          result: "a",
        },
      },
      {
        in: [{ id: "x", val: 1 }],
        out: {
          entities: {
            x: { id: "x", val: 1, children: [] },
          },
          result: "x",
        },
      },
      {
        in: [{ id: "r", children: [] }],
        out: {
          entities: {
            r: { id: "r", children: [] },
          },
          result: "r",
        },
      },
      {
        in: [
          {
            id: "u",
            user: { name: "A" },
            children: [{ id: "v", age: 3 }],
          },
        ],
        out: {
          entities: {
            u: { id: "u", user: { name: "A" }, children: ["v"] },
            v: { id: "v", age: 3, children: [] },
          },
          result: "u",
        },
      },
      {
        in: [{ id: "solo" }],
        out: {
          entities: {
            solo: { id: "solo", children: [] },
          },
          result: "solo",
        },
      },
      {
        in: [
          {
            id: "1",
            children: [
              {
                id: "2",
                children: [{ id: "3" }],
              },
            ],
          },
        ],
        out: {
          entities: {
            "1": { id: "1", children: ["2"] },
            "2": { id: "2", children: ["3"] },
            "3": { id: "3", children: [] },
          },
          result: "1",
        },
      },
    ],
    hints: [
      "Normalize by walking the tree depth-first. Every node with an id becomes one entry in the entities map.",
      "The normalized entity keeps all non-child properties, and its children field becomes an array of child ids.",
    ],
    desc: `<p>Normalize a nested entity tree into a flat entity map, similar to Normalizr.</p><p>Every node has a unique <code>id</code> and may have a <code>children</code> array of nested nodes.</p><p>Return:</p><ul><li><code>entities</code> — a map from id to normalized entity. The normalized entity keeps all original properties except <code>children</code>, and always includes <code>children</code> as an array of child ids.</li><li><code>result</code> — the root id.</li></ul><p>Non-child nested values, such as a <code>user</code> object without its own relationship definition, are copied as-is and are not normalized.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>{id:'a',name:'A',children:[{id:'b'},{id:'c',children:[{id:'d'}]}]}</div><div><b>Output:</b>{entities:{a:{id:'a',name:'A',children:['b','c']},b:{id:'b',children:[]},c:{id:'c',children:['d']},d:{id:'d',children:[]}},result:'a'}</div></div><h4>Constraints</h4><ul><li>0 ≤ tree nodes ≤ 1000</li><li>All ids are unique strings</li><li>Tree depth ≤ 50</li></ul>`,
  },

  {
    slug: "patch-apply-diff",
    num: 8084,
    title: "Patch Apply Diff",
    difficulty: "Medium",
    tags: ["Transformation", "Diffing", "Patch"],
    fnName: "applyPatch",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Object} prev
 * @param {Array<Array<*>>} patch
 * @return {Object}
 */
function applyPatch(prev, patch) {
  
}
`,
      ts: `function applyPatch(prev: Record<string, unknown>, patch: Array<any[]>): Record<string, unknown> {
  
}
`,
    },
    tests: [
      {
        in: [{ a: 1 }, [["set", ["b"], 2]]],
        out: { a: 1, b: 2 },
      },
      {
        in: [{ a: 1 }, [["remove", ["a"]]]],
        out: {},
      },
      {
        in: [{ a: { x: 1 } }, [["set", ["a", "x"], 2]]],
        out: { a: { x: 2 } },
      },
      {
        in: [{}, [["set", ["a", "b"], 3]]],
        out: { a: { b: 3 } },
      },
      {
        in: [{}, [["remove", ["x"]]]],
        out: {},
      },
      {
        in: [{ a: [1, 2, 3] }, [["set", ["a", "1"], 9]]],
        out: { a: [1, 9, 3] },
      },
    ],
    hints: [
      "A patch is a list of operations. set assigns a value at a path, remove deletes a key at a path.",
      "When setting a deep path, create missing intermediate plain objects. Removing a missing path is a no-op.",
    ],
    desc: `<p>Apply a patch to a plain JSON object.</p><p>Each patch operation is one of:</p><ul><li><code>['set', path, value]</code> — set <code>value</code> at <code>path</code></li><li><code>['remove', path]</code> — remove the key at <code>path</code></li></ul><p><code>path</code> is an array of string keys. When setting a deep path, missing intermediate objects should be created. Removing a path that does not exist does nothing.</p><p>Return the new object. Operations are applied in order.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>prev = {a:1}, patch = [['set',['b'],2]]</div><div><b>Output:</b>{a:1,b:2}</div></div><div class="ex"><div><b>Input:</b>prev = {}, patch = [['set',['a','b'],3]]</div><div><b>Output:</b>{a:{b:3}}</div></div><h4>Constraints</h4><ul><li>0 ≤ patch.length ≤ 1000</li><li>Path length ≤ 10</li><li>Values are JSON-compatible</li></ul>`,
  },

  {
    slug: "csv-to-json-parser",
    num: 8085,
    title: "CSV To JSON Parser",
    difficulty: "Medium",
    tags: ["Transformation", "Parsing", "CSV"],
    fnName: "csvToJson",
    mode: "fn",
    starter: {
      js: `/**
 * @param {string} csv
 * @return {Array<Object<string, string>>}
 */
function csvToJson(csv) {
  
}
`,
      ts: `function csvToJson(csv: string): Array<Record<string, string>> {
  
}
`,
    },
    tests: [
      {
        in: ["name,age\nAlice,30\nBob,25"],
        out: [
          { name: "Alice", age: "30" },
          { name: "Bob", age: "25" },
        ],
      },
      {
        in: [""],
        out: [],
      },
      {
        in: ["name,age"],
        out: [],
      },
      {
        in: ['name,desc\n"Smith, John","a ""great"" person"'],
        out: [{ name: "Smith, John", desc: 'a "great" person' }],
      },
      {
        in: ["a,b\n1"],
        out: [{ a: "1", b: "" }],
      },
      {
        in: ["a,b\r\n1,2"],
        out: [{ a: "1", b: "2" }],
      },
    ],
    hints: [
      "The first non-empty line is the header. Each later non-empty line becomes one object keyed by header names.",
      "Support quoted fields: commas inside double quotes are not separators, and two double quotes inside a quoted field represent one literal double quote.",
    ],
    desc: `<p>Parse a CSV string into an array of objects.</p><p>The first non-empty line contains headers. Each later non-empty line becomes one object mapping header name to string value.</p><p>Rules:</p><ul><li>All values remain strings.</li><li>Missing fields become empty strings.</li><li>Extra fields beyond the header count are ignored.</li><li>Fields may be wrapped in double quotes.</li><li>Inside a quoted field, commas are literal and <code>""</code> represents one <code>"</code>.</li><li>Line endings may be <code>\n</code> or <code>\r\n</code>.</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>'name,age\\nAlice,30\\nBob,25'</div><div><b>Output:</b>[{name:'Alice',age:'30'},{name:'Bob',age:'25'}]</div></div><div class="ex"><div><b>Input:</b>'a,b\\n1'</div><div><b>Output:</b>[{a:'1',b:''}]</div></div><h4>Constraints</h4><ul><li>0 ≤ csv.length ≤ 10<sup>5</sup></li><li>Headers are unique strings</li><li>No embedded newline characters inside quoted fields</li></ul>`,
  },

  {
    slug: "redact-sensitive-fields",
    num: 8086,
    title: "Redact Sensitive Fields",
    difficulty: "Medium",
    tags: ["Transformation", "Security", "Redaction"],
    fnName: "redactSensitiveFields",
    mode: "fn",
    starter: {
      js: `/**
 * @param {*} data
 * @param {string[]} patterns
 * @return {*}
 */
function redactSensitiveFields(data, patterns) {
  
}
`,
      ts: `function redactSensitiveFields(data: unknown, patterns: string[]): unknown {
  
}
`,
    },
    tests: [
      {
        in: [
          {
            user: { name: "Alice", password: "p" },
            token: "abc",
            roles: ["admin"],
          },
          ["password", "token"],
        ],
        out: {
          user: { name: "Alice", password: "[REDACTED]" },
          token: "[REDACTED]",
          roles: ["admin"],
        },
      },
      {
        in: [{ accounts: [{ ssn: "123", amount: 5 }] }, ["ssn"]],
        out: {
          accounts: [{ ssn: "[REDACTED]", amount: 5 }],
        },
      },
      {
        in: [{ API_KEY: "x", data: 1 }, ["key"]],
        out: {
          API_KEY: "[REDACTED]",
          data: 1,
        },
      },
      {
        in: [{ credentials: { user: "a", pass: "b" } }, ["credentials"]],
        out: {
          credentials: "[REDACTED]",
        },
      },
      {
        in: [{ password: "p" }, []],
        out: {
          password: "p",
        },
      },
      {
        in: [{ logs: [{ msg: "ok", auth_token: "t" }] }, ["token"]],
        out: {
          logs: [{ msg: "ok", auth_token: "[REDACTED]" }],
        },
      },
    ],
    hints: [
      "Walk the JSON value recursively. Object keys are checked; array items are processed when the array key itself is not sensitive.",
      "A key is sensitive when its lowercased name contains any lowercased pattern as a substring. Replace the entire value at a sensitive key with [REDACTED].",
    ],
    desc: `<p>Deep-redact sensitive fields from a JSON-compatible value.</p><p><code>patterns</code> is a list of sensitive key substrings. A key is considered sensitive when its lowercased name contains any lowercased pattern as a substring.</p><p>Rules:</p><ul><li>If an object key is sensitive, replace its entire value with <code>'[REDACTED]'</code>.</li><li>If the key is not sensitive, recurse into objects and arrays.</li><li>Arrays under non-sensitive keys are processed item by item.</li><li>If <code>patterns</code> is empty, nothing is redacted.</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>data = {user:{name:'Alice',password:'p'},token:'abc'}, patterns = ['password','token']</div><div><b>Output:</b>{user:{name:'Alice',password:'[REDACTED]'},token:'[REDACTED]'}</div></div><div class="ex"><div><b>Input:</b>data = {credentials:{user:'a'}}, patterns = ['credentials']</div><div><b>Output:</b>{credentials:'[REDACTED]'}</div></div><h4>Constraints</h4><ul><li>Inputs are JSON-compatible</li><li>0 ≤ patterns.length ≤ 100</li><li>Pattern strings are non-empty except when the array is empty</li></ul>`,
  },
];
