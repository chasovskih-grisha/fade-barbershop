export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: number;
  payload: Record<string, any>;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    tenantId?: string;
  };
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface EventBusConfig {
  maxRetries?: number;
  retryBackoffMs?: number;
}

export class DistributedEventBus {
  private subscribers: Map<string, EventHandler[]> = new Map();
  private deadLetterQueue: DomainEvent[] = [];
  private maxRetries: number;
  private retryBackoffMs: number;

  constructor(config?: EventBusConfig) {
    this.maxRetries = config?.maxRetries ?? 3;
    this.retryBackoffMs = config?.retryBackoffMs ?? 100;
  }

  public subscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.subscribers.get(eventType) ?? [];
    handlers.push(handler);
    this.subscribers.set(eventType, handlers);
  }

  public async publish(event: DomainEvent): Promise<void> {
    const handlers = this.subscribers.get(event.eventType) ?? [];
    if (handlers.length === 0) {
      return;
    }

    for (const handler of handlers) {
      let attempt = 0;
      let success = false;
      while (attempt < this.maxRetries && !success) {
        try {
          await handler(event);
          success = true;
        } catch (error) {
          attempt++;
          if (attempt >= this.maxRetries) {
            this.deadLetterQueue.push({
              ...event,
              metadata: {
                ...event.metadata,
                error: (error as Error).message,
                failedAt: Date.now()
              } as any
            });
          } else {
            await new Promise((resolve) => setTimeout(resolve, this.retryBackoffMs * Math.pow(2, attempt - 1)));
          }
        }
      }
    }
  }

  public getDeadLetterQueue(): DomainEvent[] {
    return [...this.deadLetterQueue];
  }

  public clearDLQ(): void {
    this.deadLetterQueue = [];
  }
}

export class EventSourcedAggregate {
  private events: DomainEvent[] = [];
  private version: number = 0;

  constructor(public readonly aggregateId: string) {}

  public applyEvent(event: DomainEvent): void {
    this.events.push(event);
    this.version++;
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.events];
  }

  public getVersion(): number {
    return this.version;
  }
}
