import { render, screen, within } from '@testing-library/react';
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

// Web-shell (T-4508): навігація, CTA, мобільне меню, футер. Навігація — одне джерело,
// тому тест звіряє саме NAV_ITEMS, а не продубльований список.
// Мобільне меню й CTA каталогу — PublicShell.mobile-menu.test.tsx.

describe('PublicShell', () => {
  it('рендерить контент між шапкою і футером', () => {
    render(
      <PublicShell>
        <p>Вміст сторінки</p>
      </PublicShell>
    );
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main').textContent).toContain('Вміст сторінки');
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('містить посилання пропуску блоків (skip link) на #main', () => {
    render(
      <PublicShell>
        <p>Вміст сторінки</p>
      </PublicShell>
    );
    const skipLink = screen.getByRole('link', { name: 'Перейти до основного вмісту' });
    expect(skipLink.getAttribute('href')).toBe('#main');
  });

  it('показує всі пункти навігації в шапці', () => {
    render(
      <PublicShell>
        <p />
      </PublicShell>
    );
    const nav = screen.getByRole('navigation', { name: 'Основна навігація' });
    for (const item of NAV_ITEMS) {
      const link = within(nav).getByRole('link', { name: item.label });
      expect(link.getAttribute('href')).toBe(item.href);
    }
  });

  it('вести в кабінет і на запис', () => {
    render(
      <PublicShell>
        <p />
      </PublicShell>
    );
    const cta = screen.getAllByRole('link', { name: 'Записатися' })[0];
    expect(cta?.getAttribute('href')).toBe('/booking');
    // Логіку next перевіряє account-href.test.ts; тут — сама наявність контролю.
    expect(screen.getByRole('link', { name: 'Увійти' }).getAttribute('href')).toBe('/login');
  });

  it('футер дублює навігацію і не показує порожніх секцій', () => {
    render(
      <PublicShell>
        <p />
      </PublicShell>
    );
    const footer = screen.getByRole('contentinfo');
    const footerNav = within(footer).getByRole('navigation', { name: 'Навігація у футері' });
    for (const item of NAV_ITEMS) {
      expect(within(footerNav).getByRole('link', { name: item.label }).getAttribute('href')).toBe(
        item.href
      );
    }
    // Контакти/соцмережі не задані в env — порожніх блоків бути не повинно.
    expect(within(footer).queryByRole('heading', { name: 'Контакти' })).toBeNull();
    expect(within(footer).queryByRole('list', { name: 'Соціальні мережі' })).toBeNull();
  });
});
