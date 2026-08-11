/**
 * Browser-based Redis emulation v2.
 * + MULTI / EXEC / DISCARD / WATCH (optimistic locking)
 * + PUB / SUB across tabs via BroadcastChannel
 * + maxmemory with LRU / random eviction policies
 */

// ---------------------------------------------------------------------------
// Value model
// ---------------------------------------------------------------------------

type RedisType = "string" | "list" | "hash" | "set" | "zset";

interface StringValue { type: "string"; data: string }
interface ListValue   { type: "list";   data: string[] }
interface HashValue   { type: "hash";   data: Map<string, string> }
interface SetValue    { type: "set";    data: Set<string> }
interface ZSetValue   { type: "zset";   data: Map<string, number> }

type StoredValue = StringValue | ListValue | HashValue | SetValue | ZSetValue;

const WRONGTYPE = "WRONGTYPE Operation against a key holding the wrong kind of value";
const NOT_INT = "ERR value is not an integer or out of range";
const OOM = "OOM command not allowed because used memory > 'maxmemory'";

export type MaxMemoryPolicy =
  | "noeviction" | "allkeys-lru" | "volatile-lru"
  | "allkeys-random" | "volatile-random";

export interface RedisEmulationOptions {
  activeExpiry?: boolean;
  sweepIntervalMs?: number;
  /** Approximate memory cap in bytes. */
  maxmemory?: number;
  maxmemoryPolicy?: MaxMemoryPolicy;
  /** BroadcastChannel name — tabs using the same name share the pub/sub bus. */
  busName?: string;
}

export interface SetOptions { ex?: number; px?: number; nx?: boolean; xx?: boolean; keepttl?: boolean }
export interface ZRangeOptions { withScores?: boolean }

export interface RedisEvents {
  message: (channel: string, message: string) => void;
  pmessage: (pattern: string, channel: string, message: string) => void;
  subscribe: (channel: string, count: number) => void;
  unsubscribe: (channel: string, count: number) => void;
  psubscribe: (pattern: string, count: number) => void;
  punsubscribe: (pattern: string, count: number) => void;
}

type BusMessage =
  | { t: "publish"; id: string; channel: string; message: string }
  | { t: "sub"; id: string; channels: string[] }
  | { t: "psub"; id: string; patterns: string[] }
  | { t: "unsub"; id: string; channels: string[] }
  | { t: "punsub"; id: string; patterns: string[] }
  | { t: "bye"; id: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function globToRegExp(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\" && i + 1 < pattern.length) { re += escapeRegExp(pattern[i + 1]); i++; }
    else if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else if (c === "[") {
      let j = i + 1;
      let body = "";
      if (pattern[j] === "^") { body += "^"; j++; }
      if (pattern[j] === "]") { body += "\\]"; j++; }
      while (j < pattern.length && pattern[j] !== "]") {
        body += pattern[j] === "-" ? "-" : escapeRegExp(pattern[j]);
        j++;
      }
      if (j === pattern.length) re += escapeRegExp("[");
      else { re += `[${body}]`; i = j; }
    } else re += escapeRegExp(c);
  }
  return new RegExp(`^${re}$`, "s");
}

function redisSlice(len: number, start: number, stop: number): [number, number] | null {
  if (start < 0) start += len;
  if (stop < 0) stop += len;
  if (start < 0) start = 0;
  if (stop < 0) return null;
  if (stop >= len) stop = len - 1;
  if (start > stop || start >= len) return null;
  return [start, stop];
}

function parseScoreBound(b: string): { v: number; exclusive: boolean } {
  if (b === "-inf") return { v: -Infinity, exclusive: false };
  if (b === "+inf" || b === "inf") return { v: Infinity, exclusive: false };
  if (b.startsWith("(")) return { v: parseFloat(b.slice(1)), exclusive: true };
  return { v: parseFloat(b), exclusive: false };
}

interface KVStorage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

type SerializedValue =
  | { type: "string"; data: string }
  | { type: "list"; data: string[] }
  | { type: "hash"; data: [string, string][] }
  | { type: "set"; data: string[] }
  | { type: "zset"; data: [string, number][] };

// ---------------------------------------------------------------------------
// The emulator
// ---------------------------------------------------------------------------

export class RedisEmulation {
  private store = new Map<string, StoredValue>();
  private expires = new Map<string, number>();          // key -> deadline ms
  private versions = new Map<string, number>();         // WATCH support
  private watched: Map<string, number> | null = null;
  private lruClocks = new Map<string, number>();        // LRU eviction support
  private clock = 0;
  private sizes = new Map<string, number>();            // per-key byte estimate
  private usedMemoryBytes = 0;
  private cliMulti: MultiImpl | null = null;
  private commands = new Map<string, { minArgs: number; run: (a: string[]) => Promise<unknown> }>();

  // pub/sub state
  private bus: BroadcastChannel | null = null;
  private readonly instanceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  private subChannels = new Set<string>();
  private subPatterns: Array<{ pattern: string; re: RegExp }> = [];
  private peers = new Map<string, { channels: Set<string>; patterns: Array<{ pattern: string; re: RegExp }> }>();
  private handlers = new Map<keyof RedisEvents, Set<(...args: any[]) => void>>();
  private pageHideHandler: (() => void) | null = null;

  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private opts: Required<Pick<RedisEmulationOptions, "activeExpiry" | "sweepIntervalMs" | "maxmemoryPolicy" | "busName">> & { maxmemory?: number };

  constructor(options: RedisEmulationOptions = {}) {
    this.opts = {
      activeExpiry: options.activeExpiry ?? true,
      sweepIntervalMs: options.sweepIntervalMs ?? 250,
      maxmemory: options.maxmemory,
      maxmemoryPolicy: options.maxmemoryPolicy ?? "noeviction",
      busName: options.busName ?? "redis-emulation-bus",
    };
    if (this.opts.activeExpiry) {
      this.sweepTimer = setInterval(() => this.sweep(), this.opts.sweepIntervalMs);
    }
    this.defineCommands();
  }

  close(): void {
    if (this.sweepTimer !== null) { clearInterval(this.sweepTimer); this.sweepTimer = null; }
    this.announceBye();
    this.bus?.close();
    this.bus = null;
    if (this.pageHideHandler && typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.pageHideHandler);
      this.pageHideHandler = null;
    }
  }

  /** Independent instance sharing the same pub/sub bus (data is NOT shared). */
  duplicate(): RedisEmulation { return new RedisEmulation(this.opts); }

  // -- internals --------------------------------------------------------------

  private deleteKey(key: string): void {
    this.store.delete(key);
    this.expires.delete(key);
    const s = this.sizes.get(key);
    if (s !== undefined) { this.usedMemoryBytes -= s; this.sizes.delete(key); }
    this.lruClocks.delete(key);
    this.bumpVersion(key);
  }

  private isExpired(key: string): boolean {
    const deadline = this.expires.get(key);
    if (deadline === undefined) return false;
    if (Date.now() >= deadline) { this.deleteKey(key); return true; }
    return false;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, deadline] of this.expires) {
      if (now >= deadline) this.deleteKey(key);
    }
  }

  private getTyped<T extends RedisType>(key: string, type: T): Extract<StoredValue, { type: T }> | null {
    this.assertCommandsAllowed();
    if (this.isExpired(key)) return null;
    const v = this.store.get(key);
    if (!v) return null;
    if (v.type !== type) throw new Error(WRONGTYPE);
    this.touchLru(key);
    return v as Extract<StoredValue, { type: T }>;
  }

  // WATCH bookkeeping
  private bumpVersion(key: string): void {
    this.versions.set(key, (this.versions.get(key) ?? 0) + 1);
  }

  // LRU bookkeeping
  private touchLru(key: string): void { this.lruClocks.set(key, ++this.clock); }

  // Memory bookkeeping (byte estimates)
  private sizeOfValue(v: StoredValue): number {
    switch (v.type) {
      case "string": return v.data.length * 2 + 16;
      case "list": return v.data.reduce((a, s) => a + s.length * 2 + 16, 64);
      case "hash": { let n = 64; for (const [f, val] of v.data) n += (f.length + val.length) * 2 + 32; return n; }
      case "set": { let n = 64; for (const m of v.data) n += m.length * 2 + 24; return n; }
      case "zset": { let n = 64; for (const [m] of v.data) n += m.length * 2 + 40; return n; }
    }
  }

  private accountSize(key: string): void {
    const v = this.store.get(key);
    const newSize = v ? key.length * 2 + this.sizeOfValue(v) : 0;
    this.usedMemoryBytes += newSize - (this.sizes.get(key) ?? 0);
    if (v) this.sizes.set(key, newSize); else this.sizes.delete(key);
  }

  private commit(key: string): void {
    this.bumpVersion(key);
    this.accountSize(key);
    this.touchLru(key);
  }

  /** Called before writes; evicts or throws OOM per maxmemory policy. */
  private guardMemory(): void {
    const max = this.opts.maxmemory;
    if (!max || this.usedMemoryBytes <= max) return;
    if (this.opts.maxmemoryPolicy === "noeviction") throw new Error(OOM);
    while (this.usedMemoryBytes > max) {
      const k = this.pickEvictionCandidate();
      if (!k) throw new Error(OOM);
      this.deleteKey(k);
    }
  }

  private pickEvictionCandidate(): string | null {
    const policy = this.opts.maxmemoryPolicy;
    const pool: string[] = [];
    for (const k of this.store.keys()) {
      if (this.isExpired(k)) continue;
      if ((policy === "volatile-lru" || policy === "volatile-random") && !this.expires.has(k)) continue;
      pool.push(k);
    }
    if (pool.length === 0) return null;
    if (policy === "allkeys-random" || policy === "volatile-random") {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    let oldest = pool[0];
    let oldestClock = this.lruClocks.get(oldest) ?? 0;
    for (const k of pool) {
      const c = this.lruClocks.get(k) ?? 0;
      if (c < oldestClock) { oldest = k; oldestClock = c; }
    }
    return oldest;
  }

  /** Approximate current memory usage in bytes. */
  memoryUsage(): number { return this.usedMemoryBytes; }

  async configSet(name: string, value: string): Promise<"OK"> {
    const n = name.toLowerCase();
    if (n === "maxmemory") { this.opts.maxmemory = Number(value); return "OK"; }
    if (n === "maxmemory-policy") {
      const valid: MaxMemoryPolicy[] = ["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random"];
      if (!valid.includes(value as MaxMemoryPolicy))
        throw new Error("ERR Invalid argument for CONFIG SET 'maxmemory-policy'");
      this.opts.maxmemoryPolicy = value as MaxMemoryPolicy;
      return "OK";
    }
    throw new Error(`ERR Unsupported CONFIG parameter: ${name}`);
  }

  // -- keyspace -----------------------------------------------------------------

  async exists(...keys: string[]): Promise<number> {
    this.assertCommandsAllowed();
    let n = 0;
    for (const k of keys) if (!this.isExpired(k) && this.store.has(k)) n++;
    return n;
  }

  async del(...keys: string[]): Promise<number> {
    this.assertCommandsAllowed();
    let n = 0;
    for (const k of keys) {
      if (!this.isExpired(k) && this.store.has(k)) { this.deleteKey(k); n++; }
    }
    return n;
  }

  async type(key: string): Promise<RedisType | "none"> {
    if (this.isExpired(key)) return "none";
    return this.store.get(key)?.type ?? "none";
  }

  async keys(pattern: string): Promise<string[]> {
    this.assertCommandsAllowed();
    const re = globToRegExp(pattern);
    const out: string[] = [];
    for (const k of this.store.keys()) {
      if (this.isExpired(k)) continue;
      if (re.test(k)) out.push(k);
    }
    return out.sort();
  }

  async rename(key: string, newKey: string): Promise<"OK"> {
    this.guardMemory();
    if (this.isExpired(key) || !this.store.has(key)) throw new Error("ERR no such key");
    const v = this.store.get(key)!;
    const deadline = this.expires.get(key);
    this.deleteKey(key);
    this.store.set(newKey, v);
    if (deadline !== undefined) this.expires.set(newKey, deadline);
    this.commit(newKey);
    return "OK";
  }

  async expire(key: string, seconds: number): Promise<0 | 1> { return this.pexpire(key, seconds * 1000); }

  async pexpire(key: string, ms: number): Promise<0 | 1> {
    if (this.isExpired(key) || !this.store.has(key)) return 0;
    if (ms <= 0) { this.deleteKey(key); return 1; }
    this.expires.set(key, Date.now() + ms);
    this.bumpVersion(key);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    if (this.isExpired(key) || !this.store.has(key)) return -2;
    const d = this.expires.get(key);
    return d === undefined ? -1 : Math.ceil((d - Date.now()) / 1000);
  }

  async pttl(key: string): Promise<number> {
    if (this.isExpired(key) || !this.store.has(key)) return -2;
    const d = this.expires.get(key);
    return d === undefined ? -1 : d - Date.now();
  }

  async persist(key: string): Promise<0 | 1> {
    if (!this.expires.delete(key)) return 0;
    this.bumpVersion(key);
    return 1;
  }

  async flushDb(): Promise<"OK"> {
    for (const k of [...this.store.keys()]) this.deleteKey(k);
    this.store.clear();
    this.expires.clear();
    return "OK";
  }

  async flushAll(): Promise<"OK"> { return this.flushDb(); }
  async dbSize(): Promise<number> { return this.store.size; }

  // -- strings ------------------------------------------------------------------

  async set(key: string, value: string, opts: SetOptions = {}): Promise<"OK" | null> {
    this.guardMemory();
    if (opts.nx && opts.xx) throw new Error("ERR syntax error");
    const exists = !this.isExpired(key) && this.store.has(key);
    if (opts.nx && exists) return null;
    if (opts.xx && !exists) return null;
    this.store.set(key, { type: "string", data: String(value) });
    if (opts.ex != null) this.expires.set(key, Date.now() + opts.ex * 1000);
    else if (opts.px != null) this.expires.set(key, Date.now() + opts.px);
    else if (!opts.keepttl) this.expires.delete(key);
    this.commit(key);
    return "OK";
  }

  async setnx(key: string, value: string): Promise<0 | 1> {
    return (await this.set(key, value, { nx: true })) === "OK" ? 1 : 0;
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    await this.set(key, value, { ex: seconds });
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    return this.getTyped(key, "string")?.data ?? null;
  }

  async mset(entries: Record<string, string> | [string, string][]): Promise<"OK"> {
    this.guardMemory();
    const list = Array.isArray(entries) ? entries : Object.entries(entries);
    for (const [k, v] of list) {
      this.store.set(k, { type: "string", data: String(v) });
      this.expires.delete(k);
      this.commit(k);
    }
    return "OK";
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    this.assertCommandsAllowed();
    return keys.map((k) => {
      if (this.isExpired(k)) return null;
      const v = this.store.get(k);
      return v && v.type === "string" ? v.data : null;
    });
  }

  async getSet(key: string, value: string): Promise<string | null> {
    const old = await this.get(key);
    await this.set(key, value);
    return old;
  }

  async strlen(key: string): Promise<number> { return this.getTyped(key, "string")?.data.length ?? 0; }

  async append(key: string, value: string): Promise<number> {
    this.guardMemory();
    let v = this.getTyped(key, "string");
    if (!v) { v = { type: "string", data: "" }; this.store.set(key, v); }
    v.data += value;
    this.commit(key);
    return v.data.length;
  }

  async getrange(key: string, start: number, end: number): Promise<string> {
    const v = this.getTyped(key, "string");
    if (!v) return "";
    const s = redisSlice(v.data.length, start, end);
    return s ? v.data.slice(s[0], s[1] + 1) : "";
  }

  private incrByFloatInternal(key: string, delta: number, isFloat: boolean): number {
    this.guardMemory();
    const cur = this.getTyped(key, "string");
    let current = 0;
    if (cur) {
      if (isFloat) {
        current = Number(cur.data);
        if (!Number.isFinite(current)) throw new Error("ERR value is not a valid float");
      } else {
        if (!/^-?\d+$/.test(cur.data)) throw new Error(NOT_INT);
        current = parseInt(cur.data, 10);
      }
    }
    const next = current + delta;
    if (!isFloat && !Number.isSafeInteger(next)) throw new Error(NOT_INT);
    this.store.set(key, { type: "string", data: String(next) });
    this.commit(key);
    return next;
  }

  async incr(key: string): Promise<number> { return this.incrByFloatInternal(key, 1, false); }
  async decr(key: string): Promise<number> { return this.incrByFloatInternal(key, -1, false); }
  async incrby(key: string, n: number): Promise<number> { return this.incrByFloatInternal(key, n, false); }
  async decrby(key: string, n: number): Promise<number> { return this.incrByFloatInternal(key, -n, false); }
  async incrbyfloat(key: string, n: number): Promise<number> { return this.incrByFloatInternal(key, n, true); }

  // -- lists ----------------------------------------------------------------------

  private getOrCreateList(key: string): ListValue {
    let v = this.getTyped(key, "list");
    if (!v) { v = { type: "list", data: [] }; this.store.set(key, v); }
    return v;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    this.guardMemory();
    const v = this.getOrCreateList(key);
    for (const val of values) v.data.unshift(val);
    this.commit(key);
    return v.data.length;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    this.guardMemory();
    const v = this.getOrCreateList(key);
    v.data.push(...values);
    this.commit(key);
    return v.data.length;
  }

  async lpop(key: string, count?: number): Promise<string | string[] | null> {
    const v = this.getTyped(key, "list");
    if (!v) return count === undefined ? null : [];
    const n = count === undefined ? 1 : Math.min(count, v.data.length);
    const out = v.data.splice(0, n);
    if (v.data.length === 0) this.deleteKey(key); else this.commit(key);
    return count === undefined ? out[0] ?? null : out;
  }

  async rpop(key: string, count?: number): Promise<string | string[] | null> {
    const v = this.getTyped(key, "list");
    if (!v) return count === undefined ? null : [];
    const n = count === undefined ? 1 : Math.min(count, v.data.length);
    const out = v.data.splice(v.data.length - n, n);
    if (v.data.length === 0) this.deleteKey(key); else this.commit(key);
    return count === undefined ? out[0] ?? null : out;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const v = this.getTyped(key, "list");
    if (!v) return [];
    const s = redisSlice(v.data.length, start, stop);
    return s ? v.data.slice(s[0], s[1] + 1) : [];
  }

  async llen(key: string): Promise<number> { return this.getTyped(key, "list")?.data.length ?? 0; }

  async lindex(key: string, index: number): Promise<string | null> {
    const v = this.getTyped(key, "list");
    if (!v) return null;
    const i = index < 0 ? v.data.length + index : index;
    return v.data[i] ?? null;
  }

  // -- hashes -----------------------------------------------------------------------

  private getOrCreateHash(key: string): HashValue {
    let v = this.getTyped(key, "hash");
    if (!v) { v = { type: "hash", data: new Map() }; this.store.set(key, v); }
    return v;
  }

  async hset(
    key: string,
    field: string | Record<string, string> | [string, string][],
    value?: string,
  ): Promise<number> {
    this.guardMemory();
    const h = this.getOrCreateHash(key);
    const entries: [string, string][] =
      typeof field === "string"
        ? [[field, value ?? ""]]
        : Array.isArray(field) ? field : Object.entries(field);
    let added = 0;
    for (const [f, val] of entries) {
      if (!h.data.has(f)) added++;
      h.data.set(f, String(val));
    }
    this.commit(key);
    return added;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.getTyped(key, "hash")?.data.get(field) ?? null;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const h = this.getTyped(key, "hash");
    if (!h) return 0;
    let n = 0;
    for (const f of fields) if (h.data.delete(f)) n++;
    if (h.data.size === 0) this.deleteKey(key); else this.commit(key);
    return n;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const h = this.getTyped(key, "hash");
    return h ? Object.fromEntries(h.data) : {};
  }

  async hkeys(key: string): Promise<string[]> { return [...(this.getTyped(key, "hash")?.data.keys() ?? [])]; }
  async hvals(key: string): Promise<string[]> { return [...(this.getTyped(key, "hash")?.data.values() ?? [])]; }
  async hlen(key: string): Promise<number> { return this.getTyped(key, "hash")?.data.size ?? 0; }

  async hexists(key: string, field: string): Promise<boolean> {
    return this.getTyped(key, "hash")?.data.has(field) ?? false;
  }

  async hincrby(key: string, field: string, delta: number): Promise<number> {
    this.guardMemory();
    const h = this.getOrCreateHash(key);
    const cur = h.data.get(field);
    if (cur !== undefined && !/^-?\d+$/.test(cur)) throw new Error(NOT_INT);
    const next = (cur === undefined ? 0 : parseInt(cur, 10)) + delta;
    h.data.set(field, String(next));
    this.commit(key);
    return next;
  }

  // -- sets ---------------------------------------------------------------------------

  private getOrCreateSet(key: string): SetValue {
    let v = this.getTyped(key, "set");
    if (!v) { v = { type: "set", data: new Set() }; this.store.set(key, v); }
    return v;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    this.guardMemory();
    const s = this.getOrCreateSet(key);
    let n = 0;
    for (const m of members) if (!s.data.has(m)) { s.data.add(m); n++; }
    this.commit(key);
    return n;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const s = this.getTyped(key, "set");
    if (!s) return 0;
    let n = 0;
    for (const m of members) if (s.data.delete(m)) n++;
    if (s.data.size === 0) this.deleteKey(key); else this.commit(key);
    return n;
  }

  async smembers(key: string): Promise<string[]> { return [...(this.getTyped(key, "set")?.data ?? [])]; }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.getTyped(key, "set")?.data.has(member) ?? false;
  }

  async scard(key: string): Promise<number> { return this.getTyped(key, "set")?.data.size ?? 0; }

  async sunion(...keys: string[]): Promise<string[]> {
    const out = new Set<string>();
    for (const k of keys) {
      const s = this.getTyped(k, "set");
      if (s) for (const m of s.data) out.add(m);
    }
    return [...out];
  }

  async sinter(...keys: string[]): Promise<string[]> {
    const sets = keys.map((k) => this.getTyped(k, "set")?.data ?? new Set<string>());
    if (sets.some((s) => s.size === 0)) return [];
    const [first, ...rest] = sets;
    return [...first].filter((m) => rest.every((s) => s.has(m)));
  }

  async sdiff(...keys: string[]): Promise<string[]> {
    const sets = keys.map((k) => this.getTyped(k, "set")?.data ?? new Set<string>());
    if (sets.length === 0) return [];
    const [first, ...rest] = sets;
    return [...first].filter((m) => rest.every((s) => !s.has(m)));
  }

  // -- sorted sets ----------------------------------------------------------------------

  private getOrCreateZSet(key: string): ZSetValue {
    let v = this.getTyped(key, "zset");
    if (!v) { v = { type: "zset", data: new Map() }; this.store.set(key, v); }
    return v;
  }

  private zEntries(z: ZSetValue): Array<[member: string, score: number]> {
    return [...z.data.entries()].sort(
      (a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
    );
  }

  async zadd(
    key: string,
    scoreOrEntries: number | ReadonlyArray<readonly [score: number, member: string]>,
    member?: string,
  ): Promise<number> {
    this.guardMemory();
    const pairs: Array<[number, string]> =
      typeof scoreOrEntries === "number"
        ? [[scoreOrEntries, member as string]]
        : scoreOrEntries.map(([s, m]) => [s, m] as [number, string]);
    const z = this.getOrCreateZSet(key);
    let added = 0;
    for (const [score, m] of pairs) {
      if (!Number.isFinite(score)) throw new Error("ERR score is not a valid float");
      if (!z.data.has(m)) added++;
      z.data.set(m, score);
    }
    this.commit(key);
    return added;
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const z = this.getTyped(key, "zset");
    if (!z) return 0;
    let n = 0;
    for (const m of members) if (z.data.delete(m)) n++;
    if (z.data.size === 0) this.deleteKey(key); else this.commit(key);
    return n;
  }

  async zscore(key: string, member: string): Promise<number | null> {
    return this.getTyped(key, "zset")?.data.get(member) ?? null;
  }

  async zincrby(key: string, increment: number, member: string): Promise<number> {
    this.guardMemory();
    const z = this.getOrCreateZSet(key);
    const next = (z.data.get(member) ?? 0) + increment;
    z.data.set(member, next);
    this.commit(key);
    return next;
  }

  async zcard(key: string): Promise<number> { return this.getTyped(key, "zset")?.data.size ?? 0; }

  async zrank(key: string, member: string): Promise<number | null> {
    const z = this.getTyped(key, "zset");
    if (!z || !z.data.has(member)) return null;
    return this.zEntries(z).findIndex(([m]) => m === member);
  }

  async zrange(key: string, start: number, stop: number, opts: ZRangeOptions = {}): Promise<unknown[]> {
    const z = this.getTyped(key, "zset");
    if (!z) return [];
    const entries = this.zEntries(z);
    const s = redisSlice(entries.length, start, stop);
    if (!s) return [];
    const slice = entries.slice(s[0], s[1] + 1);
    return opts.withScores ? slice : slice.map(([m]) => m);
  }

  async zrangebyscore(
    key: string, min: string | number, max: string | number,
    opts: ZRangeOptions = {},
  ): Promise<unknown[]> {
    const z = this.getTyped(key, "zset");
    if (!z) return [];
    const lo = parseScoreBound(String(min));
    const hi = parseScoreBound(String(max));
    const entries = this.zEntries(z).filter(([_, score]) =>
      (lo.exclusive ? score > lo.v : score >= lo.v) &&
      (hi.exclusive ? score < hi.v : score <= hi.v));
    return opts.withScores ? entries : entries.map(([m]) => m);
  }

  // -- transactions -----------------------------------------------------------------------

  async watch(...keys: string[]): Promise<"OK"> {
    if (!this.watched) this.watched = new Map();
    for (const k of keys) this.watched.set(k, this.versions.get(k) ?? 0);
    return "OK";
  }

  async unwatch(): Promise<"OK"> { this.watched = null; return "OK"; }

  /** Start a transaction. Chain commands, then `exec()`. */
  multi(): RedisMulti {
    const impl = new MultiImpl(this);
    const proxy: RedisMulti = new Proxy(impl as unknown as RedisMulti, {
      get(_target, prop, receiver) {
        if (typeof prop !== "string") return Reflect.get(impl, prop, receiver);
        if (prop === "then") return undefined; // keep the proxy non-thenable
        if (prop === "exec") return () => impl.exec();
        if (prop === "discard") return () => { impl.discard(); return "OK"; };
        if (prop === "sendCommand") {
          return (command: string, ...args: string[]) => { impl.enqueueCommand(command, args); return proxy; };
        }
        return (...args: unknown[]) => { impl.enqueue(prop, args); return proxy; };
      },
    });
    return proxy;
  }

  /** @internal */ _watchFailed(): boolean {
    if (!this.watched) return false;
    for (const [k, v] of this.watched) {
      if ((this.versions.get(k) ?? 0) !== v) return true;
    }
    return false;
  }

  /** @internal */ _clearWatch(): void { this.watched = null; }

  /** @internal */ _lookupCommand(name: string): { minArgs: number } | undefined {
    return this.commands.get(name.toUpperCase());
  }

  // -- pub/sub ------------------------------------------------------------------------------

  private subscriptionCount(): number { return this.subChannels.size + this.subPatterns.length; }

  private assertCommandsAllowed(): void {
    if (this.subChannels.size > 0 || this.subPatterns.length > 0) {
      throw new Error("ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / PING / QUIT may be used in this context");
    }
  }

  private ensureBus(): BroadcastChannel | null {
    if (typeof BroadcastChannel === "undefined") return null;
    if (!this.bus) {
      this.bus = new BroadcastChannel(this.opts.busName);
      this.bus.onmessage = (ev: MessageEvent) => this.onBusMessage(ev.data as BusMessage);
      if (typeof window !== "undefined") {
        this.pageHideHandler = () => this.announceBye();
        window.addEventListener("pagehide", this.pageHideHandler);
      }
    }
    return this.bus;
  }

  private announceBye(): void {
    try { this.bus?.postMessage({ t: "bye", id: this.instanceId } satisfies BusMessage); }
    catch { /* channel already closed */ }
  }

  private deliverLocal(channel: string, message: string): void {
    if (this.subChannels.has(channel)) this.emitEvent("message", channel, message);
    for (const { pattern, re } of this.subPatterns) {
      if (re.test(channel)) this.emitEvent("pmessage", pattern, channel, message);
    }
  }

  private countReceivers(channel: string): number {
    let n = 0;
    if (this.subChannels.has(channel)) n++;
    n += this.subPatterns.filter((p) => p.re.test(channel)).length;
    for (const peer of this.peers.values()) {
      if (peer.channels.has(channel) || peer.patterns.some((p) => p.re.test(channel))) n++;
    }
    return n;
  }

  private onBusMessage(msg: BusMessage): void {
    if (!msg || typeof msg !== "object" || msg.id === this.instanceId) return;
    switch (msg.t) {
      case "publish":
        this.deliverLocal(msg.channel, msg.message);
        break;
      case "sub":
      case "psub":
      case "unsub":
      case "punsub": {
        let peer = this.peers.get(msg.id);
        if (!peer) { peer = { channels: new Set(), patterns: [] }; this.peers.set(msg.id, peer); }
        if (msg.t === "sub") for (const c of msg.channels) peer.channels.add(c);
        if (msg.t === "psub") for (const p of msg.patterns) {
          if (!peer.patterns.some((x) => x.pattern === p)) peer.patterns.push({ pattern: p, re: globToRegExp(p) });
        }
        if (msg.t === "unsub") for (const c of msg.channels) peer.channels.delete(c);
        if (msg.t === "punsub") peer.patterns = peer.patterns.filter((x) => !msg.patterns.includes(x.pattern));
        break;
      }
      case "bye":
        this.peers.delete(msg.id);
        break;
    }
  }

  async subscribe(...channels: string[]): Promise<number> {
    const added: string[] = [];
    for (const c of channels) if (!this.subChannels.has(c)) { this.subChannels.add(c); added.push(c); }
    if (added.length) this.ensureBus()?.postMessage({ t: "sub", id: this.instanceId, channels: added });
    for (const c of added) this.emitEvent("subscribe", c, this.subscriptionCount());
    return this.subscriptionCount();
  }

  async unsubscribe(...channels: string[]): Promise<number> {
    const targets = channels.length ? channels : [...this.subChannels];
    const removed = targets.filter((c) => this.subChannels.delete(c));
    if (removed.length) {
      this.ensureBus()?.postMessage({ t: "unsub", id: this.instanceId, channels: removed });
      for (const c of removed) this.emitEvent("unsubscribe", c, this.subscriptionCount());
    }
    return this.subscriptionCount();
  }

  async psubscribe(...patterns: string[]): Promise<number> {
    const added: string[] = [];
    for (const p of patterns) {
      if (!this.subPatterns.some((x) => x.pattern === p)) {
        this.subPatterns.push({ pattern: p, re: globToRegExp(p) });
        added.push(p);
      }
    }
    if (added.length) this.ensureBus()?.postMessage({ t: "psub", id: this.instanceId, patterns: added });
    for (const p of added) this.emitEvent("psubscribe", p, this.subscriptionCount());
    return this.subscriptionCount();
  }

  async punsubscribe(...patterns: string[]): Promise<number> {
    const targets = patterns.length ? patterns : this.subPatterns.map((p) => p.pattern);
    const removed = targets.filter((p) => {
      const i = this.subPatterns.findIndex((x) => x.pattern === p);
      if (i === -1) return false;
      this.subPatterns.splice(i, 1);
      return true;
    });
    if (removed.length) {
      this.ensureBus()?.postMessage({ t: "punsub", id: this.instanceId, patterns: removed });
      for (const p of removed) this.emitEvent("punsubscribe", p, this.subscriptionCount());
    }
    return this.subscriptionCount();
  }

  async publish(channel: string, message: string): Promise<number> {
    this.assertCommandsAllowed();
    this.deliverLocal(channel, message);
    this.ensureBus()?.postMessage({ t: "publish", id: this.instanceId, channel, message });
    return this.countReceivers(channel);
  }

  on<K extends keyof RedisEvents>(event: K, fn: RedisEvents[K]): this {
    let set = this.handlers.get(event);
    if (!set) { set = new Set(); this.handlers.set(event, set); }
    set.add(fn as (...args: any[]) => void);
    return this;
  }

  off<K extends keyof RedisEvents>(event: K, fn: RedisEvents[K]): this {
    this.handlers.get(event)?.delete(fn as (...args: any[]) => void);
    return this;
  }

  private emitEvent<K extends keyof RedisEvents>(event: K, ...args: Parameters<RedisEvents[K]>): void {
    this.handlers.get(event)?.forEach((fn) => fn(...args));
  }

  // -- persistence --------------------------------------------------------------------------

  serialize(): string {
    const values: Record<string, SerializedValue> = {};
    for (const [k, v] of this.store) {
      switch (v.type) {
        case "string": values[k] = { type: "string", data: v.data }; break;
        case "list":   values[k] = { type: "list",   data: v.data }; break;
        case "hash":   values[k] = { type: "hash",   data: [...v.data.entries()] }; break;
        case "set":    values[k] = { type: "set",    data: [...v.data] }; break;
        case "zset":   values[k] = { type: "zset",   data: [...v.data.entries()] }; break;
      }
    }
    return JSON.stringify({ values, expires: Object.fromEntries(this.expires) });
  }

  restore(json: string): void {
    const parsed = JSON.parse(json) as {
      values: Record<string, SerializedValue>;
      expires: Record<string, number>;
    };
    this.store.clear();
    this.expires.clear();
    this.versions.clear();
    this.watched = null;
    this.sizes.clear();
    this.usedMemoryBytes = 0;
    const now = Date.now();
    for (const [k, deadline] of Object.entries(parsed.expires ?? {})) {
      if (deadline > now) this.expires.set(k, deadline);
    }
    for (const [k, v] of Object.entries(parsed.values ?? {})) {
      if (this.expires.has(k) && this.expires.get(k)! <= now) continue;
      switch (v.type) {
        case "string": this.store.set(k, { type: "string", data: v.data }); break;
        case "list":   this.store.set(k, { type: "list",   data: v.data }); break;
        case "hash":   this.store.set(k, { type: "hash",   data: new Map(v.data) }); break;
        case "set":    this.store.set(k, { type: "set",    data: new Set(v.data) }); break;
        case "zset":   this.store.set(k, { type: "zset",   data: new Map(v.data) }); break;
      }
    }
    for (const k of this.store.keys()) this.accountSize(k);
  }

  saveToStorage(storage: KVStorage, storageKey = "redis-emulation"): void {
    storage.setItem(storageKey, this.serialize());
  }

  loadFromStorage(storage: KVStorage, storageKey = "redis-emulation"): boolean {
    const raw = storage.getItem(storageKey);
    if (!raw) return false;
    this.restore(raw);
    return true;
  }

  // -- command dispatch -----------------------------------------------------------------------

  async ping(message?: string): Promise<string> { return message ?? "PONG"; }

  private defineCommands(): void {
    const def = (name: string, minArgs: number, run: (a: string[]) => Promise<unknown>) =>
      this.commands.set(name, { minArgs, run });

    def("PING", 0, (a) => this.ping(a[0]));
    def("ECHO", 1, (a) => Promise.resolve(a[0]));
    // keys
    def("DEL", 1, (a) => this.del(...a));
    def("EXISTS", 1, (a) => this.exists(...a));
    def("EXPIRE", 2, (a) => this.expire(a[0], Number(a[1])));
    def("PEXPIRE", 2, (a) => this.pexpire(a[0], Number(a[1])));
    def("TTL", 1, (a) => this.ttl(a[0]));
    def("PTTL", 1, (a) => this.pttl(a[0]));
    def("PERSIST", 1, (a) => this.persist(a[0]));
    def("TYPE", 1, (a) => this.type(a[0]));
    def("KEYS", 1, (a) => this.keys(a[0]));
    def("RENAME", 2, (a) => this.rename(a[0], a[1]));
    def("FLUSHDB", 0, () => this.flushDb());
    def("FLUSHALL", 0, () => this.flushDb());
    def("DBSIZE", 0, () => this.dbSize());
    def("CONFIG", 3, (a) => a[0].toUpperCase() === "SET"
      ? this.configSet(a[1], a[2])
      : Promise.reject(new Error("ERR Unknown CONFIG subcommand")));
    // strings
    def("SET", 2, (a) => {
      const opts: SetOptions = {};
      for (let i = 2; i < a.length; i++) {
        const f = a[i].toUpperCase();
        if (f === "EX") opts.ex = Number(a[++i]);
        else if (f === "PX") opts.px = Number(a[++i]);
        else if (f === "NX") opts.nx = true;
        else if (f === "XX") opts.xx = true;
        else if (f === "KEEPTTL") opts.keepttl = true;
        else return Promise.reject(new Error("ERR syntax error"));
      }
      return this.set(a[0], a[1], opts);
    });
    def("GET", 1, (a) => this.get(a[0]));
    def("GETSET", 2, (a) => this.getSet(a[0], a[1]));
    def("SETNX", 2, (a) => this.setnx(a[0], a[1]));
    def("SETEX", 3, (a) => this.setex(a[0], Number(a[1]), a[2]));
    def("MSET", 2, (a) => {
      const pairs: [string, string][] = [];
      for (let i = 0; i + 1 < a.length; i += 2) pairs.push([a[i], a[i + 1]]);
      return this.mset(pairs);
    });
    def("MGET", 1, (a) => this.mget(...a));
    def("INCR", 1, (a) => this.incr(a[0]));
    def("DECR", 1, (a) => this.decr(a[0]));
    def("INCRBY", 2, (a) => this.incrby(a[0], Number(a[1])));
    def("DECRBY", 2, (a) => this.decrby(a[0], Number(a[1])));
    def("INCRBYFLOAT", 2, (a) => this.incrbyfloat(a[0], Number(a[1])));
    def("APPEND", 2, (a) => this.append(a[0], a[1]));
    def("STRLEN", 1, (a) => this.strlen(a[0]));
    def("GETRANGE", 3, (a) => this.getrange(a[0], Number(a[1]), Number(a[2])));
    // lists
    def("LPUSH", 2, (a) => this.lpush(a[0], ...a.slice(1)));
    def("RPUSH", 2, (a) => this.rpush(a[0], ...a.slice(1)));
    def("LPOP", 1, (a) => this.lpop(a[0], a[1] !== undefined ? Number(a[1]) : undefined));
    def("RPOP", 1, (a) => this.rpop(a[0], a[1] !== undefined ? Number(a[1]) : undefined));
    def("LRANGE", 3, (a) => this.lrange(a[0], Number(a[1]), Number(a[2])));
    def("LLEN", 1, (a) => this.llen(a[0]));
    def("LINDEX", 2, (a) => this.lindex(a[0], Number(a[1])));
    // hashes
    def("HSET", 3, (a) => {
      const pairs: [string, string][] = [];
      for (let i = 1; i + 1 < a.length; i += 2) pairs.push([a[i], a[i + 1]]);
      return this.hset(a[0], pairs);
    });
    def("HGET", 2, (a) => this.hget(a[0], a[1]));
    def("HDEL", 2, (a) => this.hdel(a[0], ...a.slice(1)));
    def("HGETALL", 1, (a) => this.hgetall(a[0]));
    def("HKEYS", 1, (a) => this.hkeys(a[0]));
    def("HVALS", 1, (a) => this.hvals(a[0]));
    def("HLEN", 1, (a) => this.hlen(a[0]));
    def("HEXISTS", 2, (a) => this.hexists(a[0], a[1]).then((r) => (r ? 1 : 0)));
    def("HINCRBY", 3, (a) => this.hincrby(a[0], a[1], Number(a[2])));
    // sets
    def("SADD", 2, (a) => this.sadd(a[0], ...a.slice(1)));
    def("SREM", 2, (a) => this.srem(a[0], ...a.slice(1)));
    def("SMEMBERS", 1, (a) => this.smembers(a[0]));
    def("SISMEMBER", 2, (a) => this.sismember(a[0], a[1]).then((r) => (r ? 1 : 0)));
    def("SCARD", 1, (a) => this.scard(a[0]));
    def("SUNION", 1, (a) => this.sunion(...a));
    def("SINTER", 1, (a) => this.sinter(...a));
    def("SDIFF", 1, (a) => this.sdiff(...a));
    // sorted sets
    def("ZADD", 3, (a) => {
      const pairs: [number, string][] = [];
      for (let i = 1; i + 1 < a.length; i += 2) pairs.push([Number(a[i]), a[i + 1]]);
      return this.zadd(a[0], pairs);
    });
    def("ZREM", 2, (a) => this.zrem(a[0], ...a.slice(1)));
    def("ZSCORE", 2, (a) => this.zscore(a[0], a[1]));
    def("ZINCRBY", 3, (a) => this.zincrby(a[0], Number(a[1]), a[2]));
    def("ZCARD", 1, (a) => this.zcard(a[0]));
    def("ZRANK", 2, (a) => this.zrank(a[0], a[1]));
    def("ZRANGE", 3, (a) =>
      this.zrange(a[0], Number(a[1]), Number(a[2]), { withScores: a[3]?.toUpperCase() === "WITHSCORES" }));
    def("ZRANGEBYSCORE", 3, (a) =>
      this.zrangebyscore(a[0], a[1], a[2], { withScores: a[3]?.toUpperCase() === "WITHSCORES" }));
    // pub/sub
    def("SUBSCRIBE", 1, (a) => this.subscribe(...a));
    def("PSUBSCRIBE", 1, (a) => this.psubscribe(...a));
    def("UNSUBSCRIBE", 0, (a) => this.unsubscribe(...a));
    def("PUNSUBSCRIBE", 0, (a) => this.punsubscribe(...a));
    def("PUBLISH", 2, (a) => this.publish(a[0], a[1]));
    // transactions
    def("WATCH", 1, (a) => this.watch(...a));
    def("UNWATCH", 0, () => this.unwatch());
  }

  async sendCommand(command: string, ...args: string[]): Promise<unknown> {
    const cmd = command.toUpperCase();
    const SUB_CONTEXT_OK = new Set(["SUBSCRIBE", "PSUBSCRIBE", "UNSUBSCRIBE", "PUNSUBSCRIBE", "PING", "QUIT"]);
    if (!SUB_CONTEXT_OK.has(cmd)) this.assertCommandsAllowed();

    if (cmd === "MULTI") {
      if (this.cliMulti) throw new Error("ERR MULTI calls can not be nested");
      this.cliMulti = new MultiImpl(this);
      return "OK";
    }
    if (cmd === "EXEC") {
      if (!this.cliMulti) throw new Error("ERR EXEC without MULTI");
      const m = this.cliMulti;
      this.cliMulti = null;
      return m.exec();
    }
    if (cmd === "DISCARD") {
      if (!this.cliMulti) throw new Error("ERR DISCARD without MULTI");
      this.cliMulti.discard();
      this.cliMulti = null;
      return "OK";
    }
    if (this.cliMulti) {
      this.cliMulti.enqueueCommand(cmd, args);
      if (this.cliMulti.failedWith) throw new Error(this.cliMulti.failedWith);
      return "QUEUED";
    }
    const def = this.commands.get(cmd);
    if (!def) throw new Error(`ERR unknown command '${command}'`);
    if (args.length < def.minArgs) {
      throw new Error(`ERR wrong number of arguments for '${command.toLowerCase()}' command`);
    }
    return def.run(args);
  }
}

// ---------------------------------------------------------------------------
// MULTI implementation
// ---------------------------------------------------------------------------

class MultiImpl {
  /** @internal */ queue: Array<() => Promise<unknown>> = [];
  /** @internal */ failedWith: string | null = null;
  private executed = false;

  constructor(readonly client: RedisEmulation) {}

  enqueue(name: string, args: unknown[]): void {
    if (this.executed) {
      this.failedWith ??= "ERR MULTI calls can not be used immediately after EXEC";
      return;
    }
    if (this.failedWith) return;
    const client = this.client as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    this.queue.push(() => client[name](...args));
  }

  enqueueCommand(command: string, args: string[]): void {
    if (this.executed) {
      this.failedWith ??= "ERR MULTI calls can not be used immediately after EXEC";
      return;
    }
    if (this.failedWith) return;
    const def = this.client._lookupCommand(command);
    if (!def) { this.failedWith = `ERR unknown command '${command}'`; return; }
    if (args.length < def.minArgs) {
      this.failedWith = `ERR wrong number of arguments for '${command.toLowerCase()}' command`;
      return;
    }
    this.queue.push(() => this.client.sendCommand(command, ...args));
  }

  async exec(): Promise<unknown[] | null> {
    if (this.executed) throw new Error("ERR MULTI calls can not be used immediately after EXEC");
    this.executed = true;
    try {
      if (this.failedWith) {
        throw new Error("EXECABORT Transaction discarded because of previous errors.");
      }
      if (this.client._watchFailed()) return null; // WATCH detected a conflict
      const out: unknown[] = [];
      for (const run of this.queue) {
        try { out.push(await run()); }
        catch (e) { out.push(e instanceof Error ? e : new Error(String(e))); }
      }
      return out;
    } finally {
      this.queue = [];
      this.client._clearWatch();
    }
  }

  discard(): void {
    this.queue = [];
    this.failedWith = null;
    this.executed = true;
    this.client._clearWatch();
  }
}

// Derive the chainable MULTI type from the client's own async methods.
type AsyncMethodKeys<T> = {
  [K in keyof T]: T[K] extends (...a: any[]) => Promise<any> ? K : never;
}[keyof T];

type NonQueueable =
  | "subscribe" | "psubscribe" | "unsubscribe" | "punsubscribe"
  | "publish" | "watch" | "unwatch";

// `multi` itself is excluded from the key derivation: its return type is
// RedisMulti, so leaving it in would make this alias circularly reference
// itself through the mapped type's key constraint.
type QueueableCommandName = Exclude<
  AsyncMethodKeys<Omit<RedisEmulation, "multi">>,
  NonQueueable
>;

export type RedisMulti = {
  [K in QueueableCommandName]: (
    ...args: Parameters<RedisEmulation[K]>
  ) => RedisMulti;
} & {
  sendCommand(command: string, ...args: string[]): RedisMulti;
  exec(): Promise<unknown[] | null>;
  discard(): "OK";
};

// ---------------------------------------------------------------------------
// CLI helpers (for a REPL UI)
// ---------------------------------------------------------------------------

export function parseCommandLine(input: string): string[] {
  const args: string[] = [];
  let cur = "";
  let quote: string | null = null;
  let escaped = false;
  for (const ch of input) {
    if (escaped) { cur += ch; escaped = false; continue; }
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === "\\") escaped = true;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (/\s/.test(ch)) { if (cur) { args.push(cur); cur = ""; } continue; }
    cur += ch;
  }
  if (cur) args.push(cur);
  return args;
}

export function formatReply(reply: unknown): string {
  if (reply === null || reply === undefined) return "(nil)";
  if (reply instanceof Error) return `(error) ${reply.message}`;
  if (typeof reply === "number") return `(integer) ${reply}`;
  if (typeof reply === "boolean") return `(integer) ${reply ? 1 : 0}`;
  if (Array.isArray(reply)) {
    return reply.length
      ? reply.map((r, i) => `${i + 1}) ${formatReply(r)}`).join("\n")
      : "(empty array)";
  }
  if (typeof reply === "object") return JSON.stringify(reply);
  return String(reply);
}