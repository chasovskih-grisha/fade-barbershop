import { render, fireEvent } from '@testing-library/react';
import { ConversionIntelligenceTracker } from '../ConversionIntelligenceTracker';

jest.mock('next/navigation', () => ({
  usePathname: () => '/booking',
}));

describe('ConversionIntelligenceTracker', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = {
      track: jest.fn(),
      setUserId: jest.fn(),
    };
  });

  it('renders nothing', () => {
    const { container } = render(<ConversionIntelligenceTracker />);
    expect(container.firstChild).toBeNull();
  });

  it('tracks exit intent on mouseleave near top', () => {
    render(<ConversionIntelligenceTracker />);
    fireEvent.mouseLeave(document, { clientY: -10 });

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('conversion_exit_intent');
  });

  it('tracks rage clicks on rapid repeated clicks', () => {
    render(<ConversionIntelligenceTracker />);
    const btn = document.createElement('button');
    btn.textContent = 'Book Now';
    document.body.appendChild(btn);

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    const events = window.dataLayer!.map((e) => e.event);
    expect(events).toContain('conversion_rage_click');

    document.body.removeChild(btn);
  });
});
