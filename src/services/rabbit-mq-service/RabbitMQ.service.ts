// ==========================================
// 1. CONCURRENCY PRIMITIVES
// ==========================================

/**
 * Serializes asynchronous operations in the single-threaded browser environment.
 * Prevents race conditions when multiple async tasks attempt to mutate the Broker state.
 */
export class AsyncLock {
  private _queue: Promise<any>;

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

// ==========================================
// 2. VALUE OBJECTS & TYPES (Domain Layer)
// ==========================================

export enum ExchangeType {
  Direct = "direct",
  Topic = "topic",
  Fanout = "fanout",
  Headers = "headers",
}

export interface MessageProperties {
  correlationId?: string;
  replyTo?: string;
  contentType?: string;
  headers?: Record<string, any>;
  expiration?: number; // TTL in ms
}

export interface QueueOptions {
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
}

export interface ConsumeOptions {
  noAck?: boolean;
}

export class Message {
  public readonly id: string;
  constructor(
    public readonly content: Uint8Array | string | any,
    public readonly properties: MessageProperties = {},
    public readonly routingKey: string = "",
  ) {
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

// ==========================================
// 3. DOMAIN ENTITIES
// ==========================================

class Binding {
  constructor(
    public readonly queue: Queue,
    public readonly routingPattern: string,
  ) {}
}

export abstract class Exchange {
  protected bindings: Binding[] = [];

  constructor(
    public readonly name: string,
    public readonly type: ExchangeType,
    public readonly options: any = {},
  ) {}

  addBinding(binding: Binding) {
    this.bindings.push(binding);
  }
  removeBinding(queueName: string) {
    this.bindings = this.bindings.filter((b) => b.queue.name !== queueName);
  }

  abstract route(message: Message): Queue[];
}

export class DirectExchange extends Exchange {
  route(message: Message): Queue[] {
    return this.bindings
      .filter((b) => b.routingPattern === message.routingKey)
      .map((b) => b.queue);
  }
}

export class FanoutExchange extends Exchange {
  route(message: Message): Queue[] {
    // Fanout broadcasts to every bound queue; the message is part of the
    // abstract contract but ignored here.
    void message;
    return this.bindings.map((b) => b.queue);
  }
}

export class TopicExchange extends Exchange {
  route(message: Message): Queue[] {
    return this.bindings
      .filter((b) => matchTopic(b.routingPattern, message.routingKey))
      .map((b) => b.queue);
  }
}

export class HeadersExchange extends Exchange {
  route(message: Message): Queue[] {
    const msgHeaders = message.properties.headers || {};
    return this.bindings
      .filter((b) => {
        try {
          const bindHeaders =
            typeof b.routingPattern === "string"
              ? JSON.parse(b.routingPattern)
              : b.routingPattern;
          return Object.entries(bindHeaders).every(
            ([k, v]) => msgHeaders[k] === v,
          );
        } catch {
          return false;
        }
      })
      .map((b) => b.queue);
  }
}

/** KISS approach to RabbitMQ's Topic Exchange matching rules (* and #) */
function matchTopic(pattern: string, routingKey: string): boolean {
  const p = pattern.split(".");
  const r = routingKey.split(".");

  function match(pIdx: number, rIdx: number): boolean {
    if (pIdx === p.length) return rIdx === r.length;
    if (p[pIdx] === "*") {
      return rIdx < r.length && match(pIdx + 1, rIdx + 1);
    }
    if (p[pIdx] === "#") {
      if (pIdx === p.length - 1) return true; // Trailing # matches all remaining
      for (let i = rIdx; i <= r.length; i++) {
        if (match(pIdx + 1, i)) return true;
      }
      return false;
    }
    return rIdx < r.length && p[pIdx] === r[rIdx] && match(pIdx + 1, rIdx + 1);
  }
  return match(0, 0);
}

interface Consumer {
  tag: string;
  callback: (msg: Message) => void;
  noAck: boolean;
}

export class Queue {
  public readonly name: string;
  private messages: Message[] = [];
  private unacked: Map<string, Message> = new Map();
  private consumers: Map<string, Consumer> = new Map();
  private nextConsumerIdx = 0;
  private lock = new AsyncLock(); // Protects internal array mutations

  constructor(
    name: string,
    public readonly options: QueueOptions = {},
  ) {
    this.name = name;
  }

  async push(message: Message) {
    const release = await this.lock.acquire();
    try {
      this.messages.push(message);
    } finally {
      release();
    }
    this.tryDeliver();
  }

  addConsumer(consumer: Consumer) {
    this.consumers.set(consumer.tag, consumer);
    this.tryDeliver();
  }

  private tryDeliver() {
    if (this.messages.length === 0 || this.consumers.size === 0) return;

    while (this.messages.length > 0) {
      if (this.consumers.size === 0) break;

      const consumerKeys = Array.from(this.consumers.keys());
      const key = consumerKeys[this.nextConsumerIdx % consumerKeys.length];
      this.nextConsumerIdx++;

      const consumer = this.consumers.get(key);
      if (!consumer) continue;

      const msg = this.messages.shift()!;
      if (!consumer.noAck) {
        this.unacked.set(msg.id, msg);
      }

      try {
        consumer.callback(msg);
      } catch (e) {
        console.error("Consumer error:", e);
      }
    }
  }

  ack(messageId: string) {
    this.unacked.delete(messageId);
  }

  nack(messageId: string, requeue = false) {
    const msg = this.unacked.get(messageId);
    if (msg) {
      this.unacked.delete(messageId);
      if (requeue) {
        this.messages.unshift(msg);
        this.tryDeliver();
      }
    }
  }
}

// ==========================================
// 4. DOMAIN SERVICES & REPOSITORIES (BROKER)
// ==========================================

export interface IBroker {
  assertExchange(
    name: string,
    type: ExchangeType,
    options?: any,
  ): Promise<Exchange>;
  assertQueue(name: string, options?: QueueOptions): Promise<Queue>;
  bindQueue(
    queueName: string,
    exchangeName: string,
    routingKey?: string,
  ): Promise<void>;
  publish(
    exchangeName: string,
    routingKey: string,
    message: Message,
  ): Promise<void>;
  getQueue(name: string): Promise<Queue | undefined>;
  getExchange(name: string): Promise<Exchange | undefined>;
}

export class Broker implements IBroker {
  private exchanges = new Map<string, Exchange>();
  private queues = new Map<string, Queue>();
  private lock = new AsyncLock(); // Prevents race conditions during concurrent assertions

  async assertExchange(
    name: string,
    type: ExchangeType,
    options: any = {},
  ): Promise<Exchange> {
    const release = await this.lock.acquire();
    try {
      if (this.exchanges.has(name)) return this.exchanges.get(name)!;
      let exchange: Exchange;
      switch (type) {
        case ExchangeType.Direct:
          exchange = new DirectExchange(name, type, options);
          break;
        case ExchangeType.Fanout:
          exchange = new FanoutExchange(name, type, options);
          break;
        case ExchangeType.Topic:
          exchange = new TopicExchange(name, type, options);
          break;
        case ExchangeType.Headers:
          exchange = new HeadersExchange(name, type, options);
          break;
        default:
          throw new Error(`Unknown exchange type: ${type}`);
      }
      this.exchanges.set(name, exchange);
      return exchange;
    } finally {
      release();
    }
  }

  async assertQueue(name: string, options: QueueOptions = {}): Promise<Queue> {
    const release = await this.lock.acquire();
    try {
      if (this.queues.has(name)) return this.queues.get(name)!;
      const queue = new Queue(name, options);
      this.queues.set(name, queue);
      return queue;
    } finally {
      release();
    }
  }

  async bindQueue(
    queueName: string,
    exchangeName: string,
    routingKey: string = "",
  ) {
    const exchange = await this.getExchange(exchangeName);
    const queue = await this.getQueue(queueName);
    if (!exchange) throw new Error(`Exchange ${exchangeName} not found`);
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    exchange.addBinding(new Binding(queue, routingKey));
  }

  async publish(exchangeName: string, routingKey: string, message: Message) {
    const exchange = await this.getExchange(exchangeName);
    if (!exchange) throw new Error(`Exchange ${exchangeName} not found`);
    // Routing happens inside the exchange via message.routingKey; the
    // publish-level routingKey is part of the IBroker contract only.
    void routingKey;

    const targetQueues = exchange.route(message);
    for (const queue of targetQueues) {
      await queue.push(message);
    }
  }

  async getQueue(name: string): Promise<Queue | undefined> {
    return this.queues.get(name);
  }
  async getExchange(name: string): Promise<Exchange | undefined> {
    return this.exchanges.get(name);
  }
}

// ==========================================
// 5. APPLICATION SERVICES (CHANNEL & CONNECTION)
// ==========================================

export class Channel {
  private unacked: Map<string, Queue> = new Map(); // DIP: Maps message ID to Queue instance

  constructor(private broker: IBroker) {}

  async assertExchange(
    name: string,
    type: ExchangeType,
    options?: any,
  ): Promise<void> {
    await this.broker.assertExchange(name, type, options);
  }

  async assertQueue(
    name: string = "",
    options?: QueueOptions,
  ): Promise<{ queue: string }> {
    const finalName =
      name || `amq.gen-${Math.random().toString(36).substr(2, 9)}`;
    await this.broker.assertQueue(finalName, options);
    return { queue: finalName };
  }

  async bindQueue(
    queue: string,
    exchange: string,
    routingKey?: string,
  ): Promise<void> {
    await this.broker.bindQueue(queue, exchange, routingKey);
  }

  async publish(
    exchange: string,
    routingKey: string,
    content: Uint8Array | string | any,
    options?: MessageProperties,
  ): Promise<void> {
    const msg = new Message(content, options, routingKey);
    await this.broker.publish(exchange, routingKey, msg);
  }

  async consume(
    queueName: string,
    callback: (msg: Message) => void,
    options?: ConsumeOptions,
  ): Promise<{ consumerTag: string }> {
    const queue = await this.broker.getQueue(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const consumerTag = Math.random().toString(36).substr(2, 9);

    // Wrap callback to track unacked messages strictly at the Channel layer
    const wrappedCallback = (msg: Message) => {
      if (!options?.noAck) this.unacked.set(msg.id, queue);
      callback(msg);
    };

    queue.addConsumer({
      tag: consumerTag,
      callback: wrappedCallback,
      noAck: options?.noAck ?? false,
    });

    return { consumerTag };
  }

  async ack(messageId: string): Promise<void> {
    const queue = this.unacked.get(messageId);
    if (queue) {
      queue.ack(messageId);
      this.unacked.delete(messageId);
    }
  }

  async nack(messageId: string, requeue = false): Promise<void> {
    const queue = this.unacked.get(messageId);
    if (queue) {
      queue.nack(messageId, requeue);
      this.unacked.delete(messageId);
    }
  }
}

export class Connection {
  private broker: IBroker;

  constructor(broker?: IBroker) {
    this.broker = broker || new Broker();
  }

  async createChannel(): Promise<Channel> {
    return new Channel(this.broker);
  }
}
