import { render } from '@testing-library/react';
import { AnalyticsTracker } from '../AnalyticsTracker';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/services',
}));

describe('AnalyticsTracker', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = {
      track: jest.fn(),
      setUserId: jest.fn(),
    };
    // Mock window.location.search
    delete (window as any).location;
    window.location = {
      ...window.location,
      search: '?utm_source=google&utm_medium=cpc',
    } as any;
    localStorage.clear();
  });

  it('renders nothing and triggers page_view analytics on mount', () => {
    const { container } = render(<AnalyticsTracker />);
    expect(container.firstChild).toBeNull();

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('page_view');
  });
});
