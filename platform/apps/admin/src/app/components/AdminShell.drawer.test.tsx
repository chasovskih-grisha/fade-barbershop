import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import AdminShell from './AdminShell';
import { openDrawer, renderShell } from './admin-shell.drawer.harness';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => (globalThis as { __adminPath?: string }).__adminPath ?? '/',
}));

describe('AdminShell: мобільний drawer', () => {
  beforeEach(() => {
    (globalThis as { __adminPath?: string }).__adminPath = '/';
    global.fetch = jest.fn();
    Object.keys(mockRouter).forEach((key) => {
      mockRouter[key as keyof typeof mockRouter].mockReset();
    });
  });

  afterEach(() => {
    // Інакше `480` протікає в сусідні файли jsdom-середовища.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    });
  });

  it('відкриває Sheet і показує мобільну навігацію бургером', async () => {
    const dialog = await openDrawer();

    expect(
      within(dialog).getByRole('navigation', { name: 'Адмін-навігація (мобільний)' })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Локації' })).toHaveAttribute(
      'href',
      '/locations'
    );
    expect(within(dialog).getByRole('link', { name: 'Клієнти' })).toHaveAttribute(
      'href',
      '/clients'
    );
    // Постійний сайдбар лишається на місці — drawer його не заміняє.
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('не рендерить Sheet, поки drawer закритий', async () => {
    await renderShell();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('закриває Sheet повторним кліком по бургеру', async () => {
    await openDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Відкрити меню навігації' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('закриває Sheet по Escape', async () => {
    await openDrawer();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('тап по пункту меню веде на його маршрут і закриває Sheet', async () => {
    const dialog = await openDrawer();
    const link = within(dialog).getByRole('link', { name: 'Локації' });
    expect(link).toHaveAttribute('href', '/locations');

    // У браузері клік по <Link> перехоплює клієнтський роутер Next; у jsdom
    // його немає, і якір пішов би в «Not implemented: navigation» — гасимо
    // дефолтну дію, лишаючи перевірку мети (href) і закриття drawer.
    const stopDefaultNavigation = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('click', stopDefaultNavigation, true);
    try {
      fireEvent.click(link);
    } finally {
      document.removeEventListener('click', stopDefaultNavigation, true);
    }

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('закриває Sheet, коли змінюється маршрут', async () => {
    const { burger, rerender } = await renderShell();
    fireEvent.click(burger);
    await screen.findByRole('dialog', { name: 'Навігація' });

    // Маршрут змінюється не з drawer (редірект auth-гейта, back() тощо) —
    // drawer не має лишитися відкритим поверх нової сторінки.
    (globalThis as { __adminPath?: string }).__adminPath = '/locations';
    rerender(
      <AdminShell>
        <main>Вміст сторінки</main>
      </AdminShell>
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
