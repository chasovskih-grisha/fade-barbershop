export interface UserBehaviorEvent {
  eventType: 'scroll_depth' | 'element_view' | 'rage_click' | 'form_abandonment' | 'feature_interaction';
  targetId: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  elementId: string;
}

export class UserBehaviorTracker {
  private static instance: UserBehaviorTracker;
  private events: UserBehaviorEvent[] = [];
  private clicks: HeatmapPoint[] = [];

  private constructor() {}

  public static getInstance(): UserBehaviorTracker {
    if (!UserBehaviorTracker.instance) {
      UserBehaviorTracker.instance = new UserBehaviorTracker();
    }
    return UserBehaviorTracker.instance;
  }

  public recordBehavior(
    eventType: UserBehaviorEvent['eventType'],
    targetId: string,
    userId?: string,
    properties?: Record<string, any>
  ): UserBehaviorEvent {
    const event: UserBehaviorEvent = {
      eventType,
      targetId,
      userId,
      properties,
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }

  public recordClick(x: number, y: number, elementId: string): HeatmapPoint {
    const point: HeatmapPoint = { x, y, intensity: 1, elementId };
    this.clicks.push(point);
    return point;
  }

  public getBehaviorSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    heatmapHotspots: Record<string, number>;
  } {
    const eventsByType: Record<string, number> = {};
    this.events.forEach((e) => {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    });

    const heatmapHotspots: Record<string, number> = {};
    this.clicks.forEach((c) => {
      heatmapHotspots[c.elementId] = (heatmapHotspots[c.elementId] || 0) + c.intensity;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      heatmapHotspots,
    };
  }

  public clear(): void {
    this.events = [];
    this.clicks = [];
  }
}

export const behaviorTracker = UserBehaviorTracker.getInstance();
