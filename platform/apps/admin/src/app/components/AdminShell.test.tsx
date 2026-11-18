import { render, screen, waitFor } from '@testing-library/react';
import AdminShell from './AdminShell';

// Cookie-сесія адмінки: AdminShell у root layout перевіряє /admin/auth/me
// і редіректить на /login (T-013/ADR 0005). Раніше цю перевірку дублювала
// кожна сторінка — тепер гейт один, тут його покриття.

const mockReplace = jest.fn();
// Стабільний об'єкт роутера: ефект AdminShell залежить від [router],
// новий об'єкт на кожен рендер запускав би перевірку повторно.
const mockRouter = { replace: mockReplace };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => (globalThis as { __adminPath?: string }).__adminPath ?? '/',
}));

// prettier-ignore
jest.mock('./Sidebar', () => function SidebarMock() {
  return (
    <>
      <div data-testid="sidebar" />
      <SidebarButtonWrapper>
        <button
          type="button"
          data-testid="mock:admin-shell:sidebar-toggle"
          onClick={() => {}}
        >
          menu
        </button>
      </SidebarButtonWrapper>
    </>
  );
});
// prettier-ignore
// eslint-disable-next-line react/display-name
const SidebarButtonWrapper = ({ children }: { children: React.ReactNode }) => children;

// prettier-ignore
jest.mock('./Header', () => function HeaderMock() { return <header data-testid="header" />; });

describe('AdminShell', () => {
  beforeEach(() => {
    (globalThis as { __adminPath?: string }).__adminPath = '/';
    mockReplace.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  /** Сід fetch-відповіді /admin/auth/me + рендер AdminShell. */
  const renderShell = async (ok: boolean, content = 'Вміст сторінки') => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok, json: async () => ({ phone: 'admin' }) })
      .mockResolvedValue({ ok, json: async () => ({ phone: 'admin' }) });
    const rendered = render(
      <AdminShell>
        <main>{content}</main>
      </AdminShell>
    );
    return rendered;
  };

  it('рендерить каркас (Sidebar + Header) для авторизованого адміна', async () => {
    await renderShell(true);

    expect(await screen.findByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Вміст сторінки')).toBeInTheDocument();
    expect(screen.getByTestId('mock:admin-shell:sidebar-toggle')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/admin/auth/me', { credentials: 'include' });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('тримає сайдбар і хедер поза скрол-колоною: скролиться лише контент', async () => {
    const { container } = await renderShell(true);

    const sidebar = await screen.findByTestId('sidebar');
    // Контейнер каркасу фіксованої висоти, скрол — лише у внутрішній колонці.
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.className).toContain('h-screen');
    expect(frame.className).toContain('overflow-hidden');
    // Sidebar тепер містить два елементи: фіксований сайдбар і мобільний drawer
    // (Sheet). Видно звідте, що мобільний сайдбар існує, але не відкритий
    // (open=false за замовчуванням).
    expect(sidebar.querySelectorAll('[role="dialog"]')).toHaveLength(0);
  });

  it('показує бургер меню Header (адаптивний сайдбар)', async () => {
    await renderShell(true);

    expect(await screen.findByTestId('mock:admin-shell:sidebar-toggle')).toBeInTheDocument();
  });

  it('редіректить на /login без сесії і не рендерить вміст', async () => {
    await renderShell(false, 'Приватний вміст');

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    await waitFor(() => expect(screen.queryByText('Приватний вміст')).not.toBeInTheDocument());
  });

  it('редіректить на /login при помилці мережі (fail-closed)', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue({ ok: false });

    render(
      <AdminShell>
        <main>Приватний вміст</main>
      </AdminShell>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });

  it('на /login без сесії показує форму, а не порожній екран', async () => {
    (globalThis as { __adminPath?: string }).__adminPath = '/login';
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    render(
      <AdminShell>
        <main>Форма входу</main>
      </AdminShell>
    );

    expect(await screen.findByText('Форма входу')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
});
