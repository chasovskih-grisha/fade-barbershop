export * from './telemetry';
export * from './funnel';
export interface ConversionEvent {
    eventName: string;
    userId?: string;
    properties?: Record<string, any>;
    timestamp: number;
}
export declare class AnalyticsTracker {
    private static instance;
    private queue;
    private constructor();
    static getInstance(): AnalyticsTracker;
    track(eventName: string, properties?: Record<string, any>, userId?: string): void;
    getQueue(): ConversionEvent[];
    flush(): ConversionEvent[];
}
export declare const tracker: AnalyticsTracker;
