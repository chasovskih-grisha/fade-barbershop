export interface FunnelStep {
    stepName: string;
    timestamp: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export declare class ConversionFunnelTracker {
    private funnelName;
    private steps;
    constructor(funnelName: string);
    trackStep(stepName: string, userId?: string, metadata?: Record<string, any>): void;
    getSteps(): FunnelStep[];
    getCompletionRate(): number;
}
