"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracker = exports.AnalyticsTracker = void 0;
__exportStar(require("./telemetry"), exports);
__exportStar(require("./funnel"), exports);
class AnalyticsTracker {
    static instance;
    queue = [];
    constructor() { }
    static getInstance() {
        if (!AnalyticsTracker.instance) {
            AnalyticsTracker.instance = new AnalyticsTracker();
        }
        return AnalyticsTracker.instance;
    }
    track(eventName, properties, userId) {
        const event = {
            eventName,
            userId,
            properties,
            timestamp: Date.now(),
        };
        this.queue.push(event);
        console.log(`[FADE Analytics] Event Tracked:`, JSON.stringify(event));
    }
    getQueue() {
        return [...this.queue];
    }
    flush() {
        const flushed = [...this.queue];
        this.queue = [];
        return flushed;
    }
}
exports.AnalyticsTracker = AnalyticsTracker;
exports.tracker = AnalyticsTracker.getInstance();
