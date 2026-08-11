// infrastructure/events.ts

export class TypedEventEmitter<Events extends Record<string, any[]>> {
  private listeners: {
    [K in keyof Events]?: Array<(...args: Events[K]) => void>;
  } = {};

  on<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): () => void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): void {
    const arr = this.listeners[event];
    if (!arr) return;
    const idx = arr.indexOf(listener);
    if (idx !== -1) arr.splice(idx, 1);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    const arr = this.listeners[event];
    if (arr) arr.forEach((fn) => fn(...args));
  }
}
