// Стани сторінки «Клієнти» (T-4516): Skeleton під час першого завантаження,
// «Клієнти ще немає», «За фільтрами нічого не знайдено» + «Скинути фільтри»,
// помилка + «Спробувати ще раз». Робочі стани — page.test.tsx.
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ClientsPage from './page';
import { emptyClientList } from './client-list.fixtures';
import {
  installClientListFetch,
  installFailingClientListFetch,
  installPendingClientListFetch,
} from './client-list.http.fixtures';

const mockPush = jest.fn();
let mockQuery = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/clients',
  useSearchParams: () => new URLSearchParams(mockQuery),
}));

describe('ClientsPage — порожні стани й помилка', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockQuery = '';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('під час першого завантаження — Skeleton, не «порожній список»', () => {
    installPendingClientListFetch();
    const { container } = render(<ClientsPage />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Клієнтів ще немає')).not.toBeInTheDocument();
  });

  it('нікого немає і фільтрів немає — «Клієнти ще немає» без кнопки скидання', async () => {
    installClientListFetch(emptyClientList());
    render(<ClientsPage />);
    expect(await screen.findByText('Клієнтів ще немає')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Скинути фільтри' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('порожньо за фільтрами — «За фільтрами нічого не знайдено» і скидання', async () => {
    mockQuery = 'search=ivan';
    installClientListFetch(emptyClientList());
    render(<ClientsPage />);
    const title = await screen.findByText('За фільтрами нічого не знайдено');
    // «Скинути фільтри» є і в фільтр-барі — беремо кнопку саме порожнього стану.
    const empty = title.closest('div') as HTMLElement;
    fireEvent.click(within(empty).getByRole('button', { name: 'Скинути фільтри' }));
    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('помилка показує банер із повторною спробою, яка реально перезапитує список', async () => {
    const log = installFailingClientListFetch();
    render(<ClientsPage />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Список клієнтів')).toBeInTheDocument();
    const before = log.clientCalls().length;
    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    await waitFor(() => expect(log.clientCalls().length).toBe(before + 1));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('у помилці стрічка підсумків не показує нулі замість даних', async () => {
    installFailingClientListFetch();
    render(<ClientsPage />);
    await screen.findByRole('alert');
    expect(screen.queryByTestId('summary-total')).not.toBeInTheDocument();
    expect(screen.queryByText('За фільтрами нічого не знайдено')).not.toBeInTheDocument();
    expect(screen.queryByText('Клієнтів ще немає')).not.toBeInTheDocument();
  });
});
