// infrastructure/locks.ts
export interface ILock {
  /** Returns a release function. */
  acquire(): Promise<() => void>;
}

/**
 * Single-thread async lock. Perfect for the main browser thread.
 * Guarantees FIFO ordering of critical sections.
 */
export class AsyncLock implements ILock {
  private queue = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const enter = this.queue.then(() => release);
    this.queue = wait;
    return enter as Promise<() => void>;
  }
}

/**
 * Multi-thread lock via SharedArrayBuffer + Atomics.
 * Use this inside Web Workers. Requires cross-origin isolation
 * (COOP/COEP headers) to instantiate SharedArrayBuffer.
 */
export class MutexLock implements ILock {
  private sab: Int32Array;

  constructor(sharedBuffer: SharedArrayBuffer, offset = 0) {
    this.sab = new Int32Array(sharedBuffer, offset, 2);
    Atomics.store(this.sab, 0, 0);
    Atomics.store(this.sab, 1, 0);
  }

  async acquire(): Promise<() => void> {
    // Atomics.wait is synchronous; wrap in microtask for async interface.
    return new Promise((resolve) => {
      const tryAcquire = (): void => {
        if (Atomics.compareExchange(this.sab, 0, 0, 1) === 0) {
          resolve(() => {
            Atomics.store(this.sab, 0, 0);
            Atomics.notify(this.sab, 0, 1);
          });
        } else {
          Atomics.wait(this.sab, 0, 1);
          tryAcquire();
        }
      };
      tryAcquire();
    });
  }
}
