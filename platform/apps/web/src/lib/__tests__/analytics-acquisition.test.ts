import { publicPageAnalytics, giftCertificatesAnalytics, referralAnalytics } from '../analytics';

describe('Analytics — acquisition, gifts and referrals', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = { track: jest.fn(), setUserId: jest.fn() };
    localStorage.clear();
  });

  it('tracks public website and acquisition funnel events correctly', () => {
    publicPageAnalytics.pageView('Home', '/', 'kiev-center');
    publicPageAnalytics.ctaBookingClick('hero', 'kiev-center');
    publicPageAnalytics.locationSelect('kiev-center', 'Kyiv Center');
    publicPageAnalytics.serviceView({
      serviceId: 'svc-1',
      serviceName: 'Fade Cut',
      price: 800,
      durationMinutes: 30,
      locationCode: 'kiev-center',
    });
    publicPageAnalytics.barberView('barber-1', 'Alex', 'kiev-center');
    publicPageAnalytics.articleView('trend-2026', 'style');
    publicPageAnalytics.phoneClick('+380441112233', '/contacts');

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('page_view');
    expect(events).toContain('cta_booking_click');
    expect(events).toContain('location_select');
    expect(events).toContain('service_view');
    expect(events).toContain('barber_view');
    expect(events).toContain('article_view');
    expect(events).toContain('phone_click');
  });

  it('tracks gift certificates and referral events correctly', () => {
    giftCertificatesAnalytics.viewed('kiev-center');
    giftCertificatesAnalytics.selected(1000, 'design-gold');
    giftCertificatesAnalytics.purchased('cert-123', 1000, 'hash_abc');
    giftCertificatesAnalytics.redeemed('cert-123', 1000, 'book-456');

    referralAnalytics.codeCopied('FADE2026');
    referralAnalytics.shared('telegram');
    referralAnalytics.rewardClaimed('rew-789', 200);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('gift_certificate_viewed');
    expect(events).toContain('gift_certificate_selected');
    expect(events).toContain('gift_certificate_purchased');
    expect(events).toContain('gift_certificate_redeemed');
    expect(events).toContain('referral_code_copied');
    expect(events).toContain('referral_shared');
    expect(events).toContain('referral_reward_claimed');
  });
});
