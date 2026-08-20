import type { ProblemDraft } from "@domain/Problem";

export const CACHE_STORAGE_PROBLEMS: ProblemDraft[] = [
  {
    slug: "lru-cache-lite",
    num: 8087,
    title: "LRU Cache — Lite",
    difficulty: "Medium",
    tags: ["Cache", "Storage", "LRU"],
    fnName: "lruCacheLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} capacity
 * @param {Array<any[]>} operations
 * @return {Array<number | string | null>}
 */
function lruCacheLog(capacity, operations) {
  
}
`,
      ts: `function lruCacheLog(capacity: number, operations: Array<any[]>): Array<number | string | null> {
  
}
`,
    },
    tests: [
      {
        in: [
          2,
          [
            ["put", "a", 1],
            ["put", "b", 2],
            ["get", "a"],
            ["put", "c", 3],
            ["get", "b"],
            ["get", "c"],
          ],
        ],
        out: [null, null, 1, "b", null, 3],
      },
      {
        in: [
          2,
          [
            ["put", "a", 1],
            ["put", "b", 2],
            ["put", "a", 3],
            ["put", "c", 4],
          ],
        ],
        out: [null, null, null, "b"],
      },
      {
        in: [
          1,
          [
            ["put", "a", 1],
            ["get", "a"],
            ["put", "b", 2],
            ["get", "a"],
            ["get", "b"],
          ],
        ],
        out: [null, 1, "a", null, 2],
      },
      {
        in: [2, []],
        out: [],
      },
      {
        in: [
          2,
          [
            ["put", "a", 1],
            ["put", "b", 2],
            ["get", "x"],
            ["put", "c", 3],
          ],
        ],
        out: [null, null, null, "a"],
      },
      {
        in: [
          2,
          [
            ["put", "a", 1],
            ["put", "b", 2],
            ["put", "a", 9],
            ["put", "b", 8],
            ["put", "c", 7],
          ],
        ],
        out: [null, null, null, null, "a"],
      },
    ],
    hints: [
      "Track both key-to-value storage and recency order. Gets and puts both make a key most recently used.",
      "When putting a new key into a full cache, evict the least recently used key. Updating an existing key never evicts.",
    ],
    desc: `<p>Simulate a small LRU cache.</p><p>Operations are:</p><ul><li><code>['put', key, value]</code> — insert or update a key</li><li><code>['get', key]</code> — read a key</li></ul><p>For each operation, return one result:</p><ul><li><code>get</code> hit returns the stored value</li><li><code>get</code> miss returns <code>null</code></li><li><code>put</code> returns the evicted key if inserting a new key forced an eviction, otherwise <code>null</code></li></ul><p>Rules:</p><ul><li>Every successful get or put makes that key the most recently used.</li><li>When a new key is inserted and the cache is full, the least recently used key is removed.</li><li>Updating an existing key does not evict anything.</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>capacity = 2, operations = [['put','a',1],['put','b',2],['get','a'],['put','c',3],['get','b'],['get','c']]</div><div><b>Output:</b>[null,null,1,'b',null,3]</div><div class="exp">get a makes a most recent, so b is evicted when c is inserted.</div></div><h4>Constraints</h4><ul><li>1 ≤ capacity ≤ 1000</li><li>0 ≤ operations.length ≤ 1000</li><li>Keys are strings</li><li>Values are numbers</li></ul>`,
  },

  {
    slug: "ttl-cache-expiry",
    num: 8088,
    title: "TTL Cache — Expiry",
    difficulty: "Medium",
    tags: ["Cache", "Storage", "TTL"],
    fnName: "ttlCacheLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} ttl
 * @param {Array<any[]>} operations
 * @return {Array<number | null>}
 */
function ttlCacheLog(ttl, operations) {
  
}
`,
      ts: `function ttlCacheLog(ttl: number, operations: Array<any[]>): Array<number | null> {
  
}
`,
    },
    tests: [
      {
        in: [
          10,
          [
            ["set", "a", 1, 0],
            ["get", "a", 5],
            ["get", "a", 10],
            ["set", "a", 2, 10],
            ["get", "a", 19],
            ["get", "a", 20],
          ],
        ],
        out: [null, 1, null, null, 2, null],
      },
      {
        in: [
          5,
          [
            ["set", "a", 1, 0],
            ["get", "a", 4],
            ["set", "a", 2, 4],
            ["get", "a", 8],
            ["get", "a", 9],
          ],
        ],
        out: [null, 1, null, 2, null],
      },
      {
        in: [
          5,
          [
            ["set", "a", 1, 0],
            ["set", "b", 2, 3],
            ["get", "a", 5],
            ["get", "b", 7],
          ],
        ],
        out: [null, null, null, 2],
      },
      {
        in: [10, [["get", "missing", 0]]],
        out: [null],
      },
      {
        in: [10, []],
        out: [],
      },
      {
        in: [
          3,
          [
            ["set", "x", 7, 100],
            ["get", "x", 102],
            ["get", "x", 103],
          ],
        ],
        out: [null, 7, null],
      },
    ],
    hints: [
      "Store the expiration time with each cached value: expiresAt = setTime + ttl.",
      "A value is expired when currentTime >= expiresAt. Getting a value does not refresh its TTL; setting it does.",
    ],
    desc: `<p>Simulate a cache where entries expire after a fixed time-to-live.</p><p>Operations are:</p><ul><li><code>['set', key, value, time]</code> — store a value, expiring at <code>time + ttl</code></li><li><code>['get', key, time]</code> — read a value at a logical time</li></ul><p>For each operation, return one result:</p><ul><li><code>set</code> returns <code>null</code></li><li><code>get</code> returns the stored value if the entry exists and is not expired, otherwise <code>null</code></li></ul><p>An entry is considered expired exactly when <code>time &gt;= expiresAt</code>. Getting an entry does not extend its TTL. Setting an entry replaces its value and refreshes its expiration.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>ttl = 10, operations = [['set','a',1,0],['get','a',5],['get','a',10]]</div><div><b>Output:</b>[null,1,null]</div><div class="exp">At time 10 the entry is already expired.</div></div><h4>Constraints</h4><ul><li>1 ≤ ttl ≤ 1000</li><li>0 ≤ operations.length ≤ 1000</li><li>Times are non-negative integers</li><li>Keys are strings, values are numbers</li></ul>`,
  },

  {
    slug: "cache-stale-while-revalidate",
    num: 8089,
    title: "Cache — Stale While Revalidate",
    difficulty: "Hard",
    tags: ["Cache", "Storage", "Stale While Revalidate"],
    fnName: "swrCacheLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} maxAge
 * @param {number} staleAge
 * @param {Array<any[]>} operations
 * @return {Array<string | null>}
 */
function swrCacheLog(maxAge, staleAge, operations) {
  
}
`,
      ts: `function swrCacheLog(maxAge: number, staleAge: number, operations: Array<any[]>): Array<string | null> {
  
}
`,
    },
    tests: [
      {
        in: [
          10,
          5,
          [
            ["set", "a", 1, 0],
            ["get", "a", 5],
            ["get", "a", 10],
            ["get", "a", 11],
            ["get", "a", 15],
            ["get", "a", 16],
            ["set", "a", 2, 16],
            ["get", "a", 20],
          ],
        ],
        out: [
          null,
          "hit:1",
          "hit:1",
          "stale:1",
          "stale:1",
          "miss",
          null,
          "hit:2",
        ],
      },
      {
        in: [
          5,
          0,
          [
            ["set", "a", 1, 0],
            ["get", "a", 5],
            ["get", "a", 6],
          ],
        ],
        out: [null, "hit:1", "miss"],
      },
      {
        in: [10, 10, [["get", "missing", 0]]],
        out: ["miss"],
      },
      {
        in: [
          5,
          5,
          [
            ["set", "a", 1, 0],
            ["get", "a", 6],
            ["set", "a", 2, 6],
            ["get", "a", 11],
          ],
        ],
        out: [null, "stale:1", null, "hit:2"],
      },
      {
        in: [
          5,
          0,
          [
            ["set", "a", 1, 0],
            ["set", "b", 2, 3],
            ["get", "a", 6],
            ["get", "b", 6],
          ],
        ],
        out: [null, null, "miss", "hit:2"],
      },
      {
        in: [5, 5, []],
        out: [],
      },
    ],
    hints: [
      "For each cached entry, compute age = currentTime - createdAt. Fresh, stale, and expired are three age bands.",
      "Fresh means age <= maxAge. Stale-but-usable means maxAge < age <= maxAge + staleAge. Beyond that, treat the entry as a miss.",
    ],
    desc: `<p>Simulate a cache using the <strong>stale-while-revalidate</strong> strategy.</p><p>Each cached entry has a creation time. For a get at time <code>t</code>:</p><ul><li>if <code>t - createdAt &lt;= maxAge</code>, return <code>hit:value</code></li><li>if <code>t - createdAt &lt;= maxAge + staleAge</code>, return <code>stale:value</code></li><li>otherwise, or if the key does not exist, return <code>miss</code></li></ul><p>Operations are:</p><ul><li><code>['set', key, value, time]</code> — store or replace an entry and reset its creation time</li><li><code>['get', key, time]</code> — read the entry using the stale-while-revalidate rules</li></ul><p>Return <code>null</code> for each set operation and the get result string for each get operation.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>maxAge = 10, staleAge = 5, operations = [['set','a',1,0],['get','a',11],['get','a',15],['get','a',16]]</div><div><b>Output:</b>[null,'stale:1','stale:1','miss']</div><div class="exp">Age 11 and 15 are inside the stale window; age 16 is too old.</div></div><h4>Constraints</h4><ul><li>0 ≤ maxAge ≤ 1000</li><li>0 ≤ staleAge ≤ 1000</li><li>0 ≤ operations.length ≤ 1000</li><li>Keys are strings, values are numbers</li></ul>`,
  },

  {
    slug: "write-through-vs-write-behind",
    num: 8090,
    title: "Write-Through vs Write-Behind",
    difficulty: "Medium",
    tags: ["Cache", "Storage", "Write Strategies"],
    fnName: "writeThroughVsWriteBehind",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<any[]>} operations
 * @return {{through: Array<[string, number]>, behind: Array<[string, number]>}}
 */
function writeThroughVsWriteBehind(operations) {
  
}
`,
      ts: `function writeThroughVsWriteBehind(operations: Array<any[]>): { through: Array<[string, number]>; behind: Array<[string, number]> } {
  
}
`,
    },
    tests: [
      {
        in: [
          [["write", "a", 1], ["write", "b", 2], ["flush"], ["write", "a", 3]],
        ],
        out: {
          through: [
            ["a", 3],
            ["b", 2],
          ],
          behind: [
            ["a", 2],
            ["b", 2],
          ],
        },
      },
      {
        in: [[["write", "a", 1], ["write", "a", 2], ["flush"]]],
        out: {
          through: [["a", 2]],
          behind: [["a", 2]],
        },
      },
      {
        in: [[["write", "a", 1], ["flush"], ["flush"]]],
        out: {
          through: [["a", 1]],
          behind: [["a", 1]],
        },
      },
      {
        in: [[["flush"]]],
        out: {
          through: [],
          behind: [],
        },
      },
      {
        in: [[["write", "a", 1]]],
        out: {
          through: [["a", 1]],
          behind: [],
        },
      },
      {
        in: [
          [["write", "a", 1], ["write", "b", 1], ["write", "a", 2], ["flush"]],
        ],
        out: {
          through: [
            ["a", 2],
            ["b", 1],
          ],
          behind: [
            ["a", 2],
            ["b", 1],
          ],
        },
      },
    ],
    hints: [
      "Write-through updates the backing store immediately on every write. Write-behind only updates a pending dirty set until flush.",
      "For write-behind, repeated writes to the same key before a flush collapse to the latest value. Unflushed writes never reach the store.",
    ],
    desc: `<p>Compare two cache write strategies over the same operation log.</p><p>Operations are:</p><ul><li><code>['write', key, value]</code> — write a value</li><li><code>['flush']</code> — flush pending write-behind data to the backing store</li></ul><p>Rules:</p><ul><li><strong>write-through</strong>: every write updates the backing store immediately.</li><li><strong>write-behind</strong>: writes are kept in a pending dirty map. On flush, all pending keys are applied to the backing store, overwriting existing values. Writes that have not been flushed never reach the store.</li></ul><p>Return the final backing-store state for both strategies as sorted <code>[key, value]</code> arrays:</p><ul><li><code>through</code> — final store for write-through</li><li><code>behind</code> — final store for write-behind</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>operations = [['write','a',1],['write','b',2],['flush'],['write','a',3]]</div><div><b>Output:</b>{through:[['a',3],['b',2]],behind:[['a',2],['b',2]]}</div><div class="exp">The final write to a is immediate for write-through, but remains unflushed for write-behind.</div></div><h4>Constraints</h4><ul><li>0 ≤ operations.length ≤ 1000</li><li>Keys are strings</li><li>Values are numbers</li></ul>`,
  },

  {
    slug: "storage-quota-eviction",
    num: 8091,
    title: "Storage Quota — Eviction",
    difficulty: "Hard",
    tags: ["Storage", "Quota", "Eviction"],
    fnName: "storageQuotaLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {number} capacity
 * @param {Array<any[]>} operations
 * @return {string[]}
 */
function storageQuotaLog(capacity, operations) {
  
}
`,
      ts: `function storageQuotaLog(capacity: number, operations: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          10,
          [
            ["save", "a", 6],
            ["save", "b", 3],
            ["touch", "a"],
            ["save", "c", 3],
          ],
        ],
        out: ["save:a:ok", "save:b:ok", "touch:a:ok", "evict:b", "save:c:ok"],
      },
      {
        in: [
          10,
          [
            ["save", "a", 6],
            ["save", "b", 3],
            ["save", "a", 10],
          ],
        ],
        out: ["save:a:ok", "save:b:ok", "evict:b", "save:a:ok"],
      },
      {
        in: [
          5,
          [
            ["save", "big", 6],
            ["save", "a", 1],
          ],
        ],
        out: ["save:big:denied", "save:a:ok"],
      },
      {
        in: [
          5,
          [
            ["touch", "x"],
            ["delete", "x"],
          ],
        ],
        out: ["touch:x:miss", "delete:x:miss"],
      },
      {
        in: [
          5,
          [
            ["save", "a", 3],
            ["save", "b", 3],
          ],
        ],
        out: ["save:a:ok", "evict:a", "save:b:ok"],
      },
      {
        in: [
          5,
          [
            ["save", "a", 2],
            ["save", "b", 2],
            ["touch", "a"],
            ["save", "c", 2],
          ],
        ],
        out: ["save:a:ok", "save:b:ok", "touch:a:ok", "evict:b", "save:c:ok"],
      },
    ],
    hints: [
      "Track total used space and an LRU order of stored keys. Saving, updating, and touching a key makes it most recently used.",
      "When saving would exceed capacity, evict least recently used entries until the new item fits. If the item itself is larger than capacity, deny it without changing state.",
    ],
    desc: `<p>Simulate a quota-limited storage system with LRU eviction.</p><p>Operations are:</p><ul><li><code>['save', key, size]</code> — create or update an entry</li><li><code>['touch', key]</code> — mark an existing entry as recently used</li><li><code>['delete', key]</code> — remove an entry</li></ul><p>Rules for <code>save</code>:</p><ul><li>If <code>size &gt; capacity</code>, log <code>save:key:denied</code> and change nothing.</li><li>If the key already exists, remove its old size first and treat the save as a fresh most-recent write.</li><li>While <code>currentTotal + size &gt; capacity</code>, evict the least recently used key and log <code>evict:evictedKey</code>.</li><li>Then store the new entry and log <code>save:key:ok</code>.</li></ul><p>Other logs:</p><ul><li><code>touch:key:ok</code> or <code>touch:key:miss</code></li><li><code>delete:key:ok</code> or <code>delete:key:miss</code></li></ul><p>The returned log may be longer than the operation list because evictions are logged too.</p><h4>Examples</h4><div class="ex"><div><b>Input:</b>capacity = 10, operations = [['save','a',6],['save','b',3],['touch','a'],['save','c',3]]</div><div><b>Output:</b>['save:a:ok','save:b:ok','touch:a:ok','evict:b','save:c:ok']</div><div class="exp">touch a makes b the least recently used entry, so b is evicted.</div></div><h4>Constraints</h4><ul><li>1 ≤ capacity ≤ 1000</li><li>0 ≤ operations.length ≤ 1000</li><li>1 ≤ size ≤ 1000</li><li>Keys are strings</li></ul>`,
  },

  {
    slug: "entity-version-cache-invalidation",
    num: 8092,
    title: "Entity Version Cache Invalidation",
    difficulty: "Medium",
    tags: ["Cache", "Invalidation", "Versioning"],
    fnName: "entityVersionCacheLog",
    mode: "fn",
    starter: {
      js: `/**
 * @param {Array<any[]>} actions
 * @return {string[]}
 */
function entityVersionCacheLog(actions) {
  
}
`,
      ts: `function entityVersionCacheLog(actions: Array<any[]>): string[] {
  
}
`,
    },
    tests: [
      {
        in: [
          [
            ["update", "a", 1],
            ["cache", "a"],
            ["read", "a"],
            ["update", "a", 2],
            ["read", "a"],
            ["cache", "a"],
            ["read", "a"],
          ],
        ],
        out: [
          "update:a:1",
          "cache:a:1",
          "hit:a:1",
          "update:a:2",
          "stale:a",
          "cache:a:2",
          "hit:a:2",
        ],
      },
      {
        in: [[["read", "a"]]],
        out: ["miss:a"],
      },
      {
        in: [[["cache", "a"]]],
        out: ["cache:a:miss"],
      },
      {
        in: [
          [
            ["update", "a", 1],
            ["update", "b", 10],
            ["cache", "a"],
            ["cache", "b"],
            ["update", "b", 11],
            ["read", "a"],
            ["read", "b"],
          ],
        ],
        out: [
          "update:a:1",
          "update:b:1",
          "cache:a:1",
          "cache:b:1",
          "update:b:2",
          "hit:a:1",
          "stale:b",
        ],
      },
      {
        in: [
          [
            ["update", "a", 1],
            ["cache", "a"],
            ["update", "a", 2],
            ["read", "a"],
            ["read", "a"],
          ],
        ],
        out: ["update:a:1", "cache:a:1", "update:a:2", "stale:a", "miss:a"],
      },
      {
        in: [[]],
        out: [],
      },
    ],
    hints: [
      "Each server-side update bumps the entity version. Cached copies store the version they were created from.",
      "A read is a hit only when the cached version matches the current server version. Otherwise the cached entry is stale and should be removed.",
    ],
    desc: `<p>Simulate cache invalidation using entity versions.</p><p>Actions are:</p><ul><li><code>['update', key, value]</code> — update the server-side entity and increment its version. Log <code>update:key:version</code>.</li><li><code>['cache', key]</code> — store the current server entity in the client cache. If the entity does not exist, log <code>cache:key:miss</code>; otherwise log <code>cache:key:version</code>.</li><li><code>['read', key]</code> — read from the client cache.</li></ul><p>Read rules:</p><ul><li>If there is no cached entry, log <code>miss:key</code>.</li><li>If the cached version equals the current server version, log <code>hit:key:value</code>.</li><li>If the cached version is outdated, remove the cached entry and log <code>stale:key</code>.</li></ul><h4>Examples</h4><div class="ex"><div><b>Input:</b>actions = [['update','a',1],['cache','a'],['read','a'],['update','a',2],['read','a']]</div><div><b>Output:</b>['update:a:1','cache:a:1','hit:a:1','update:a:2','stale:a']</div><div class="exp">The second update makes the cached copy stale.</div></div><h4>Constraints</h4><ul><li>0 ≤ actions.length ≤ 1000</li><li>Keys are strings</li><li>Values are numbers</li><li>Versions start at 1 and increment by 1 per update</li></ul>`,
  },
];
