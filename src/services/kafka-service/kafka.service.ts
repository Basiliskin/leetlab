export class Mutex {
  private sab: Int32Array;
  constructor(sharedBuffer: SharedArrayBuffer, offset = 0) {
    this.sab = new Int32Array(sharedBuffer, offset, 2);
    // sab[0] = 0 (unlocked), 1 (locked)
    // sab[1] = number of waiting agents (optional)
    Atomics.store(this.sab, 0, 0);
    Atomics.store(this.sab, 1, 0);
  }

  lock() {
    // Try to acquire the lock
    // Compare sab[0] with 0, if equal set to 1, return old value
    // Atomics.compareExchange(typedArray, index, expectedValue, replacementValue)
    while (Atomics.compareExchange(this.sab, 0, 0, 1) === 1) {
      // Lock is held by another thread – wait for notification
      Atomics.wait(this.sab, 0, 1);
      // After waking up, loop again and try to acquire
    }
  }

  unlock() {
    // Release the lock
    Atomics.store(this.sab, 0, 0);
    // Wake one waiting thread (if any)
    Atomics.notify(this.sab, 0, 1);
  }
}

export class AsyncLock {
  private _queue: Promise<void>;

  constructor() {
    this._queue = Promise.resolve();
  }

  acquire(): Promise<() => void> {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Chain the critical section behind the current queue
    const enter = this._queue.then(() => release);
    // Update the queue so the next caller waits for this one to finish
    this._queue = wait;
    return enter;
  }
}

// domain.ts
export type TopicName = string;
export type PartitionId = number;
export type ConsumerGroupId = string;
export type Offset = number;

export interface KafkaMessage<K = unknown, V = unknown> {
  key: K | null;
  value: V;
  timestamp: number;
}

export interface KafkaRecord<K = unknown, V = unknown> extends KafkaMessage<
  K,
  V
> {
  offset: Offset;
  partition: PartitionId;
  topic: TopicName;
}

export class PartitionLog<K = unknown, V = unknown> {
  private records: KafkaRecord<K, V>[] = [];
  private readonly lock = new AsyncLock();

  constructor(
    public readonly topic: TopicName,
    public readonly partitionId: PartitionId,
  ) {}

  async append(messages: KafkaMessage<K, V>[]): Promise<Offset[]> {
    const release = await this.lock.acquire();
    try {
      const offsets: Offset[] = [];
      for (const msg of messages) {
        const offset = this.records.length;
        this.records.push({
          ...msg,
          offset,
          partition: this.partitionId,
          topic: this.topic,
        });
        offsets.push(offset);
      }
      return offsets;
    } finally {
      release();
    }
  }

  async read(
    fromOffset: Offset,
    maxRecords: number,
  ): Promise<KafkaRecord<K, V>[]> {
    const release = await this.lock.acquire();
    try {
      return this.records.slice(fromOffset, fromOffset + maxRecords);
    } finally {
      release();
    }
  }

  get highWatermark(): Offset {
    return this.records.length;
  }
}

export class Topic<K = unknown, V = unknown> {
  private partitions: Map<PartitionId, PartitionLog<K, V>> = new Map();

  constructor(
    public readonly name: TopicName,
    private readonly partitionCount: number = 1,
  ) {
    for (let i = 0; i < partitionCount; i++) {
      this.partitions.set(i, new PartitionLog(name, i));
    }
  }

  getPartition(id: PartitionId): PartitionLog<K, V> {
    const partition = this.partitions.get(id);
    if (!partition)
      throw new Error(`Partition ${id} not found for topic ${this.name}`);
    return partition;
  }

  // Simple hash-based partitioner (djb2 variant)
  resolvePartition(key: K | null): PartitionId {
    if (key === null) return Math.floor(Math.random() * this.partitionCount);
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.partitionCount;
  }
}

export class Broker<K = unknown, V = unknown> {
  private topics: Map<TopicName, Topic<K, V>> = new Map();

  createTopic(name: TopicName, partitions: number = 1): Topic<K, V> {
    if (this.topics.has(name)) throw new Error(`Topic ${name} already exists`);
    const topic = new Topic<K, V>(name, partitions);
    this.topics.set(name, topic);
    return topic;
  }

  getTopic(name: TopicName): Topic<K, V> {
    const topic = this.topics.get(name);
    if (!topic) throw new Error(`Topic ${name} not found`);
    return topic;
  }

  async produce(
    topicName: TopicName,
    messages: KafkaMessage<K, V>[],
  ): Promise<void> {
    const topic = this.getTopic(topicName);

    // Group by partition to minimize lock acquisitions (DRY/Performance)
    const partitionMap = new Map<PartitionId, KafkaMessage<K, V>[]>();
    for (const msg of messages) {
      const pId = topic.resolvePartition(msg.key);
      if (!partitionMap.has(pId)) partitionMap.set(pId, []);
      partitionMap.get(pId)!.push(msg);
    }

    const promises = Array.from(partitionMap.entries()).map(
      async ([pId, msgs]) => {
        const partition = topic.getPartition(pId);
        await partition.append(msgs);
      },
    );

    await Promise.all(promises);
  }

  async fetch(
    topicName: TopicName,
    partitionId: PartitionId,
    offset: Offset,
    maxRecords: number,
  ): Promise<KafkaRecord<K, V>[]> {
    const topic = this.getTopic(topicName);
    const partition = topic.getPartition(partitionId);
    return partition.read(offset, maxRecords);
  }
}

export interface OffsetStorage {
  commit(
    groupId: ConsumerGroupId,
    topic: TopicName,
    partition: PartitionId,
    offset: Offset,
  ): Promise<void>;
  fetch(
    groupId: ConsumerGroupId,
    topic: TopicName,
    partition: PartitionId,
  ): Promise<Offset>;
}

export class InMemoryOffsetStorage implements OffsetStorage {
  private offsets = new Map<string, Offset>();
  private lock = new AsyncLock();

  private getKey(
    groupId: ConsumerGroupId,
    topic: TopicName,
    partition: PartitionId,
  ): string {
    return `${groupId}:${topic}:${partition}`;
  }

  async commit(
    groupId: ConsumerGroupId,
    topic: TopicName,
    partition: PartitionId,
    offset: Offset,
  ): Promise<void> {
    const release = await this.lock.acquire();
    try {
      this.offsets.set(this.getKey(groupId, topic, partition), offset);
    } finally {
      release();
    }
  }

  async fetch(
    groupId: ConsumerGroupId,
    topic: TopicName,
    partition: PartitionId,
  ): Promise<Offset> {
    const release = await this.lock.acquire();
    try {
      return this.offsets.get(this.getKey(groupId, topic, partition)) ?? 0;
    } finally {
      release();
    }
  }
}

export interface ConsumerConfig {
  groupId: ConsumerGroupId;
  topic: TopicName;
  autoCommit?: boolean;
}

export class Consumer<K = unknown, V = unknown> {
  private running = false;
  private assignedPartitions: PartitionId[] = [];

  constructor(
    private readonly broker: Broker<K, V>,
    private readonly offsetStorage: OffsetStorage,
    private readonly config: ConsumerConfig,
  ) {}

  // In a full implementation, a ConsumerGroupCoordinator would handle rebalancing.
  // For KISS/YAGNI, we do manual assignment.
  async assign(partitions: PartitionId[]): Promise<void> {
    this.assignedPartitions = partitions;
  }

  async start(
    handler: (record: KafkaRecord<K, V>) => Promise<void>,
  ): Promise<void> {
    this.running = true;

    while (this.running) {
      for (const partitionId of this.assignedPartitions) {
        if (!this.running) break;

        const offset = await this.offsetStorage.fetch(
          this.config.groupId,
          this.config.topic,
          partitionId,
        );

        const records = await this.broker.fetch(
          this.config.topic,
          partitionId,
          offset,
          10, // max.poll.records
        );

        for (const record of records) {
          await handler(record);

          if (this.config.autoCommit) {
            // Commit the NEXT offset to be read
            await this.offsetStorage.commit(
              this.config.groupId,
              this.config.topic,
              partitionId,
              record.offset + 1,
            );
          }
        }

        // Yield to event loop if no messages to prevent tight loop CPU burning
        if (records.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // poll.interval.ms
        }
      }
    }
  }

  stop(): void {
    this.running = false;
  }
}

export class SharedMemoryOffsetStorage implements OffsetStorage {
  // SAB layout: [MutexLock (4 bytes), OffsetValue (8 bytes/BigInt64)] per partition
  constructor(private sab: SharedArrayBuffer) {}

  async commit(
    groupId: string,
    topic: string,
    partition: number,
    offset: number,
  ): Promise<void> {
    // Offset into the SAB for this specific partition's data
    const offsetInBytes = partition * 16;

    // 1. Lock the specific partition slice in the SAB
    const mutex = new Mutex(this.sab, offsetInBytes);
    mutex.lock(); // Blocks the Worker thread safely until acquired

    try {
      // 2. Update the value in the shared buffer
      const view = new DataView(this.sab);
      view.setBigInt64(offsetInBytes + 8, BigInt(offset), true); // Little Endian
    } finally {
      // 3. Release and notify waiting workers/threads
      mutex.unlock();
    }
  }

  async fetch(
    groupId: string,
    topic: string,
    partition: number,
  ): Promise<number> {
    const offsetInBytes = partition * 16;
    const mutex = new Mutex(this.sab, offsetInBytes);
    mutex.lock();
    try {
      const view = new DataView(this.sab);
      return Number(view.getBigInt64(offsetInBytes + 8, true));
    } finally {
      mutex.unlock();
    }
  }
}
