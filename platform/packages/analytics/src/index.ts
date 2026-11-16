export * from './telemetry';
export * from './funnel';
export * from './cohort';

export interface ConversionEvent {
  eventName: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: number;
}

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private queue: ConversionEvent[] = [];

  private constructor() {}

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  public track(eventName: string, properties?: Record<string, any>, userId?: string): void {
    const event: ConversionEvent = {
      eventName,
      userId,
      properties,
      timestamp: Date.now(),
    };
    this.queue.push(event);
    console.log(`[FADE Analytics] Event Tracked:`, JSON.stringify(event));
  }

  public getQueue(): ConversionEvent[] {
    return [...this.queue];
  }

  public flush(): ConversionEvent[] {
    const flushed = [...this.queue];
    this.queue = [];
    return flushed;
  }
}

export const tracker = AnalyticsTracker.getInstance();
