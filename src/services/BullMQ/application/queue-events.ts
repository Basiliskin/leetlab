// application/queue-events.ts
import { TypedEventEmitter } from "../infrastructure/events";
import { QueueEventsMap } from "../types";

export class QueueEvents extends TypedEventEmitter<QueueEventsMap> {
  constructor(public name: string) {
    super();
  }
}
