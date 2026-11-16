import { UserBehaviorTracker } from '../src/behavior';

describe('UserBehaviorTracker', () => {
  let tracker: UserBehaviorTracker;

  beforeEach(() => {
    tracker = UserBehaviorTracker.getInstance();
    tracker.clear();
  });

  it('records user behavior events accurately', () => {
    tracker.recordBehavior('scroll_depth', 'booking_section', 'user_1', { depth: 75 });
    tracker.recordBehavior('rage_click', 'submit_btn', 'user_1', { clicks: 5 });

    const summary = tracker.getBehaviorSummary();
    expect(summary.totalEvents).toBe(2);
    expect(summary.eventsByType['scroll_depth']).toBe(1);
    expect(summary.eventsByType['rage_click']).toBe(1);
  });

  it('aggregates heatmap click hotspots', () => {
    tracker.recordClick(100, 200, 'cta_button');
    tracker.recordClick(105, 202, 'cta_button');
    tracker.recordClick(50, 80, 'nav_logo');

    const summary = tracker.getBehaviorSummary();
    expect(summary.heatmapHotspots['cta_button']).toBe(2);
    expect(summary.heatmapHotspots['nav_logo']).toBe(1);
  });
});
