"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionFunnelTracker = void 0;
const telemetry_1 = require("./telemetry");
class ConversionFunnelTracker {
    funnelName;
    steps = [];
    constructor(funnelName) {
        this.funnelName = funnelName;
    }
    trackStep(stepName, userId, metadata) {
        const step = {
            stepName,
            timestamp: new Date().toISOString(),
            userId,
            metadata,
        };
        this.steps.push(step);
        telemetry_1.telemetry.recordMetric(`funnel_${this.funnelName}_step`, 1, { stepName, userId: userId || 'anonymous' });
        telemetry_1.Logger.info(`Funnel [${this.funnelName}] stepped to: ${stepName}`, { step });
    }
    getSteps() {
        return [...this.steps];
    }
    getCompletionRate() {
        if (this.steps.length === 0)
            return 0;
        // Simple heuristic completion rate based on recorded steps
        return (this.steps.length / 5) * 100; // assuming a standard 5-step conversion funnel
    }
}
exports.ConversionFunnelTracker = ConversionFunnelTracker;
