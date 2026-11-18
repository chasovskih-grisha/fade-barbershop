import { render, screen, act } from '@testing-library/react';
import Sidebar from './Sidebar';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => (globalThis as { __adminPath?: string }).__adminPath ?? '/',
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockPush.mockReset();
    (globalThis as { __adminPath?: string }).__adminPath = '/';
  });

  it('веде кожен пункт на свій маршрут (href)', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Панель керування' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Локації' })).toHaveAttribute('href', '/locations');
    expect(screen.getByRole('link', { name: 'Мастера' })).toHaveAttribute('href', '/barbers');
    expect(screen.getByRole('link', { name: 'Послуги' })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: 'Клієнти' })).toHaveAttribute('href', '/clients');
    expect(screen.getByRole('link', { name: 'Телефонні записи' })).toHaveAttribute(
      'href',
      '/bookings/phone'
    );
    expect(screen.getByRole('link', { name: 'Блог' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Логіни' })).toHaveAttribute(
      'href',
      '/settings/logins'
    );
  });

  it('позначає активний пункт навігації aria-current (вкладений маршрут теж)', () => {
    (globalThis as { __adminPath?: string }).__adminPath = '/clients/abc';
    render(<Sidebar />);
    const clientsLink = screen.getByRole('link', { name: 'Клієнти' });
    expect(clientsLink).toHaveAttribute('aria-current', 'page');
    const locationsLink = screen.getByRole('link', { name: 'Локації' });
    expect(locationsLink).not.toHaveAttribute('aria-current');
  });

  it('«Логіни» активний замість «Панелі керування» на своєму маршруті', () => {
    (globalThis as { __adminPath?: string }).__adminPath = '/settings/logins';
    render(<Sidebar />);
    const loginsLink = screen.getByRole('link', { name: 'Логіни' });
    expect(loginsLink).toHaveAttribute('aria-current', 'page');
    expect(loginsLink).toHaveAttribute('href', '/settings/logins');
    const homeLink = screen.getByRole('link', { name: 'Панель керування' });
    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('закриває мобільний drawer сам, коли вікно переходить у lg і вище', () => {
    // Drawer відкритий на вузькому екрані.
    window.innerWidth = 900;
    window.dispatchEvent(new Event('resize'));

    render(<Sidebar open={true} />);

    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-panel')).toBeInTheDocument();

    // Widening the viewport past lg should close the drawer.
    window.innerWidth = 1100;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.queryByTestId('dialog-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dialog-panel')).not.toBeInTheDocument();
  });
});
