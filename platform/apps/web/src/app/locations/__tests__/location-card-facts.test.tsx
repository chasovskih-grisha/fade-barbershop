import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { LocationCard } from '../LocationCard';
import type { Location } from '@/lib/api/locations';

// T-4820: картка локації каже лише те, що знає запис. «Сьогодні» — рядок із
// `hours` у доменному індексі LocationHours (0 = понеділок … 6 = неділя);
// 18 листопада 2026 — середа, тобто індекс 2.

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

const WEDNESDAY = new Date(2026, 10, 18, 12, 0, 0);

const base: Location = {
  id: 'loc-1',
  code: 'LVI-01',
  name: 'Fade на Липській',
  address: 'вул. Липська, 1',
  lat: 50.44,
  lng: 30.49,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

const hours = (open: string, close: string) => [
  { dayOfWeek: 2, open, close, closed: false },
  { dayOfWeek: 3, open: '11:00', close: '19:00', closed: false },
];

describe('LocationCard — факты, которые знает запись (T-4820)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(WEDNESDAY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders today’s interval from hours, so two studios differ', () => {
    const early = render(<LocationCard location={{ ...base, hours: hours('09:00', '18:00') }} />);
    const earlyText = early.container.textContent;
    early.unmount();

    const late = render(<LocationCard location={{ ...base, hours: hours('12:00', '22:00') }} />);
    const lateText = late.container.textContent;

    expect(earlyText).toContain('Сьогодні: 09:00–18:00');
    expect(lateText).toContain('Сьогодні: 12:00–22:00');
    expect(earlyText).not.toBe(lateText);
  });

  it('says «Вихідний» when today is closed in the record', () => {
    render(
      <LocationCard
        location={{ ...base, hours: [{ dayOfWeek: 2, open: null, close: null, closed: true }] }}
      />
    );
    expect(screen.getByText('Сьогодні: Вихідний')).toBeTruthy();
  });

  it('omits the row when the record has no hours at all', () => {
    const { container } = render(<LocationCard location={base} />);
    expect(container.textContent).not.toContain('Сьогодні');
  });

  it('prints the stored phone as a tel: link and invents amenities or rank', () => {
    const { container } = render(
      <LocationCard location={{ ...base, phone: '+380501234567', hours: hours('09:00', '18:00') }} />
    );
    const link = screen.getByRole('link', { name: '+380501234567' });
    expect(link.getAttribute('href')).toBe('tel:+380501234567');
    expect(container.textContent).not.toContain('Флагманська студія');
    expect(container.textContent).not.toContain('Парковка');
    expect(container.textContent).not.toContain('Wi-Fi');
    expect(container.textContent).not.toContain('09:00 — 21:00');
  });
});
