import {
  shopAnalytics,
  loyaltyAnalytics,
  waitlistAnalytics,
  cancellationAnalytics,
} from '../analytics';

describe('Analytics — commerce, waitlist and cancellation', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = { track: jest.fn(), setUserId: jest.fn() };
    localStorage.clear();
  });

  it('tracks shop and loyalty e-commerce events correctly', () => {
    shopAnalytics.productViewed({
      productId: 'prod-1',
      productName: 'Matte Clay',
      price: 450,
      category: 'styling',
    });
    shopAnalytics.cartAdded({
      productId: 'prod-1',
      productName: 'Matte Clay',
      price: 450,
      quantity: 1,
    });
    shopAnalytics.cartRemoved('prod-1', 'Matte Clay');
    shopAnalytics.checkoutStarted(450, 1);
    shopAnalytics.orderCompleted('ord-999', 450, 1);

    loyaltyAnalytics.pointsEarned(50, 'haircut_visit', 350);
    loyaltyAnalytics.tierUpgraded('Gold VIP', 5000);
    loyaltyAnalytics.rewardUnlocked('rew-1', 'Free Beard Trim', 300);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('shop_product_viewed');
    expect(events).toContain('shop_cart_added');
    expect(events).toContain('shop_cart_removed');
    expect(events).toContain('shop_checkout_started');
    expect(events).toContain('shop_order_completed');
    expect(events).toContain('loyalty_points_earned');
    expect(events).toContain('loyalty_tier_upgraded');
    expect(events).toContain('loyalty_reward_unlocked');
  });

  it('tracks waitlist and cancellation conversion analytics correctly', () => {
    waitlistAnalytics.joined({
      locationCode: 'kiev-center',
      serviceId: 'svc-1',
      barberId: 'barber-1',
      preferredDate: '2026-11-20',
    });
    waitlistAnalytics.notified('wl-1', '10:00');
    waitlistAnalytics.converted('wl-1', 'book-999', 15);
    waitlistAnalytics.dropped('wl-1', 'no_longer_needed');

    cancellationAnalytics.reasonSelected('book-123', 'schedule_change', 'Urgent work meeting');
    cancellationAnalytics.rescheduleAlternativeChosen('book-123', '10:00', '14:00');
    cancellationAnalytics.penaltyAcknowledged('book-123', 200);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('waitlist_joined');
    expect(events).toContain('waitlist_notified');
    expect(events).toContain('waitlist_converted');
    expect(events).toContain('waitlist_dropped');
    expect(events).toContain('cancellation_reason_selected');
    expect(events).toContain('cancellation_reschedule_alternative_chosen');
    expect(events).toContain('cancellation_penalty_acknowledged');
  });
});
