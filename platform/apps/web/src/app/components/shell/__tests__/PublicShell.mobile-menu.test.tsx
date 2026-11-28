import { render, screen, within, fireEvent } from '@testing-library/react';
import { PublicShell } from '../PublicShell';
import { NAV_ITEMS } from '../nav-items';

// next/link у jsdom робить prefetch і оновлює стан поза act() — підменюємо на звичайний
// <a>: для перевірки навігації цього достатньо, консоль тестів лишається чистою.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Мобільне меню і CTA каталогу в ньому (T-4508, T-4614e).
// Каркас, шапка й футер — PublicShell.test.tsx.

describe('PublicShell — мобільне меню', () => {
  it('порожній каталог: шапка й мобільне меню без CTA запису (T-4614e)', () => {
    render(
      <PublicShell bookingOpen={false}>
        <p />
      </PublicShell>
    );

    expect(screen.queryByRole('link', { name: 'Записатися' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Відкрити меню' }));
    const mobileNav = screen.getByRole('navigation', { name: 'Мобільна навігація' });
    expect(within(mobileNav).queryByRole('link', { name: 'Записатися' })).toBeNull();
  });

  it('активний каталог: CTA запису лишається у шапці й мобільному меню', () => {
    render(
      <PublicShell bookingOpen>
        <p />
      </PublicShell>
    );

    expect(screen.getAllByRole('link', { name: 'Записатися' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Відкрити меню' }));
    const mobileNav = screen.getByRole('navigation', { name: 'Мобільна навігація' });
    expect(within(mobileNav).getByRole('link', { name: 'Записатися' }).getAttribute('href')).toBe(
      '/booking'
    );
  });

  it('мобільне меню розкривається і закривається по Escape', () => {
    render(
      <PublicShell>
        <p />
      </PublicShell>
    );

    const toggle = screen.getByRole('button', { name: 'Відкрити меню' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    const mobileNav = screen.getByRole('navigation', { name: 'Мобільна навігація' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    for (const item of NAV_ITEMS) {
      expect(within(mobileNav).getByRole('link', { name: item.label }).getAttribute('href')).toBe(
        item.href
      );
    }

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Мобільна навігація' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Відкрити меню' }).getAttribute('aria-expanded')
    ).toBe('false');
  });
});
