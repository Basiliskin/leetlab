// ==========================================
// 1. Value Objects & Primitives
// ==========================================

export class TransactionId {
  constructor(public readonly value: number) {
    if (value < 0) throw new Error("TransactionId must be positive");
  }
}

export interface Schema {
  tableName: string;
  columns: Record<string, string>; // simplified schema type
}

// ==========================================
// 2. Entities
// ==========================================

export interface TupleData {
  [key: string]: any;
}

export class Tuple {
  constructor(
    public readonly id: string,
    public readonly data: TupleData,
    public readonly xmin: TransactionId, // Creator Transaction ID
    public xmax: TransactionId | null = null, // Deleter/Updater Transaction ID
  ) {}
}

// ==========================================
// 3. Domain Services
// ==========================================

export enum TransactionStatus {
  ACTIVE,
  COMMITTED,
  ABORTED,
}

export class Snapshot {
  constructor(
    public readonly txId: number,
    public readonly lowXid: number, // Oldest active TX when snapshot was taken
    public readonly highXid: number, // Next TX ID to be assigned
    public readonly activeXids: Set<number>,
  ) {}
}

export interface ITransactionState {
  getStatus(txId: number): TransactionStatus;
}

export class MVCCVisibilityService {
  /**
   * Determines if a tuple is visible to a specific transaction based on Postgres MVCC rules.
   * This prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads.
   */
  isVisible(
    tuple: Tuple,
    currentTxId: number,
    snapshot: Snapshot,
    state: ITransactionState,
  ): boolean {
    const xmin = tuple.xmin.value;

    // --- 1. Check xmin (Creation Rules) ---
    if (xmin === currentTxId) {
      // Created by current transaction. Visible unless we deleted it ourselves.
      if (tuple.xmax && tuple.xmax.value === currentTxId) return false;
      return true;
    }
    if (xmin >= snapshot.highXid) return false; // Created AFTER snapshot started
    if (xmin >= snapshot.lowXid && snapshot.activeXids.has(xmin)) return false; // Created by concurrent active TX
    if (state.getStatus(xmin) === TransactionStatus.ABORTED) return false; // Creator aborted

    // --- 2. Check xmax (Deletion/Update Rules) ---
    if (!tuple.xmax) return true; // Never deleted

    const xmax = tuple.xmax.value;
    if (xmax === currentTxId) return false; // Deleted by current transaction
    if (xmax >= snapshot.highXid) return true; // Deleted AFTER snapshot started (still visible to us)
    if (xmax >= snapshot.lowXid && snapshot.activeXids.has(xmax)) return true; // Deleted by concurrent active TX (still visible to us)
    if (state.getStatus(xmax) === TransactionStatus.ABORTED) return true; // Deleter aborted (still visible to us)

    return false; // Deleted by a committed transaction before/during our snapshot
  }
}

// ==========================================
// 4. Interfaces (SOLID - Dependency Inversion)
// ==========================================

export interface ILock {
  acquire(): Promise<() => void>;
}

export interface IStorage {
  getTuples(tableName: string): Tuple[];
  insertTuple(tableName: string, tuple: Tuple): void;
  updateTuple(tableName: string, tuple: Tuple): void;
}

// ==========================================
// 5. Infrastructure (Locking & Storage)
// ==========================================

// Main Thread Async Lock (Promise-based)
export class AsyncLock implements ILock {
  private _queue: Promise<unknown> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void = () => {};
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });

    const enter = this._queue.then(() => release);
    this._queue = wait;
    return enter;
  }
}

/* 
// Web Worker Alternative (SharedArrayBuffer Atomics)
export class AtomicsMutex implements ILock {
  private sab: Int32Array;
  constructor(sharedBuffer: SharedArrayBuffer, offset = 0) {
    this.sab = new Int32Array(sharedBuffer, offset, 1);
    Atomics.store(this.sab, 0, 0);
  }
  async acquire(): Promise<() => void> {
    while (Atomics.compareExchange(this.sab, 0, 0, 1) === 1) Atomics.wait(this.sab, 0, 1);
    return () => {
      Atomics.store(this.sab, 0, 0);
      Atomics.notify(this.sab, 0, 1);
    };
  }
}
*/

// In-Memory Storage (KISS / YAGNI)
export class InMemoryStorage implements IStorage {
  private tables: Map<string, Tuple[]> = new Map();

  getTuples(tableName: string): Tuple[] {
    return this.tables.get(tableName) || [];
  }

  insertTuple(tableName: string, tuple: Tuple): void {
    if (!this.tables.has(tableName)) this.tables.set(tableName, []);
    this.tables.get(tableName)!.push(tuple);
  }

  updateTuple(tableName: string, tuple: Tuple): void {
    const tuples = this.tables.get(tableName);
    if (!tuples) return;
    const index = tuples.findIndex(
      (t) => t.id === tuple.id && t.xmin.value === tuple.xmin.value,
    );
    if (index !== -1) tuples[index] = tuple;
  }
}

// ==========================================
// 6. Aggregates (Table & Transaction)
// ==========================================

export class Table {
  constructor(
    public readonly name: string,
    public readonly schema: Schema,
    private storage: IStorage,
  ) {}

  insert(txId: TransactionId, data: TupleData): string {
    const id = crypto.randomUUID();
    const tuple = new Tuple(id, data, txId);
    this.storage.insertTuple(this.name, tuple);
    return id;
  }

  markDeleted(id: string, txId: TransactionId): void {
    const tuples = this.storage.getTuples(this.name);
    // NOTE: In strict Postgres, Tuples are immutable. Updates create new tuples.
    // For KISS, we mutate xmax in-place to emulate the deletion state.
    const tuple = tuples.find((t) => t.id === id && !t.xmax);
    if (!tuple) throw new Error("Tuple not found or already deleted");

    tuple.xmax = txId;
    this.storage.updateTuple(this.name, tuple);
  }
}

export class Transaction {
  constructor(
    public readonly txId: number,
    public readonly snapshot: Snapshot,
    private state: ITransactionState,
    private visibilityService: MVCCVisibilityService,
  ) {}

  isVisible(tuple: Tuple): boolean {
    return this.visibilityService.isVisible(
      tuple,
      this.txId,
      this.snapshot,
      this.state,
    );
  }
}

// ==========================================
// 7. Application Services (Transaction Manager)
// ==========================================

export class TransactionManager {
  private currentTxId = 1;
  private txStates: Map<number, TransactionStatus> = new Map();
  private activeXids = new Set<number>();

  private commitLock: ILock;
  private visibilityService = new MVCCVisibilityService();

  constructor(lock: ILock) {
    this.commitLock = lock;
  }

  begin(): Transaction {
    const txId = this.currentTxId++;
    this.txStates.set(txId, TransactionStatus.ACTIVE);
    this.activeXids.add(txId);

    // Calculate lowXid safely
    let lowXid = txId;
    for (const id of this.activeXids) {
      if (id < lowXid) lowXid = id;
    }

    const snapshot = new Snapshot(
      txId,
      lowXid,
      this.currentTxId,
      new Set(this.activeXids),
    );
    return new Transaction(txId, snapshot, this, this.visibilityService);
  }

  async commit(txId: number): Promise<void> {
    // Lock ensures atomic state transition and ID generation safety
    const release = await this.commitLock.acquire();
    try {
      this.txStates.set(txId, TransactionStatus.COMMITTED);
      this.activeXids.delete(txId);
    } finally {
      release();
    }
  }

  abort(txId: number): void {
    this.txStates.set(txId, TransactionStatus.ABORTED);
    this.activeXids.delete(txId);
  }

  getStatus(txId: number): TransactionStatus {
    return this.txStates.get(txId) || TransactionStatus.ABORTED;
  }
}
