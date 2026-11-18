// Сторінка «Клієнти» (T-4606a/T-4606b): зв'язка URL ↔ запит ↔ UI. Тут робочі
// стани — таблиця, стрічка підсумків, період, сортування, фільтри, debounce
// пошуку, пагінація. Порожні стани й помилку див. page.states.test.tsx.
// Ключова перевірка: сторінка сама не тримає стан фільтрів — вона пише в URL
// канонічні параметри (дефолти не лишаються в адресі) і перечитує його.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientsPage from './page';
import { clientListResult } from './client-list.fixtures';
import { installClientListFetch } from './client-list.http.fixtures';

const mockPush = jest.fn();
let mockQuery = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/clients',
  useSearchParams: () => new URLSearchParams(mockQuery),
}));

/** Рендер із очікуванням першого завантаження (Skeleton → таблиця). */
async function renderPage(result = clientListResult()) {
  installClientListFetch(result);
  render(<ClientsPage />);
  await screen.findByRole('table');
}

describe('ClientsPage — робочі стани', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockQuery = '';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('рендерить таблицю §6.1 і стрічку підсумків того ж фільтра', async () => {
    await renderPage();
    expect(screen.getByText('Олександр')).toBeInTheDocument();
    expect(screen.getByText('4/7')).toBeInTheDocument();
    expect(screen.getByTestId('summary-total')).toBeInTheDocument();
    expect(screen.getByText('10.09 – 10.10')).toBeInTheDocument();
    expect(screen.getByLabelText('Період')).toHaveValue('30d');
    // Одна сторінка — панель пагінації не рендериться взагалі.
    expect(screen.queryByRole('button', { name: 'Далі' })).not.toBeInTheDocument();
  });

  it('період змінює лише параметр period — таблиця від нього не залежить', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('Період'), { target: { value: '7d' } });
    expect(mockPush).toHaveBeenCalledWith('/clients?period=7d');
  });

  it('дефолтний період прибирається з URL (короткі посилання)', async () => {
    mockQuery = 'period=7d';
    await renderPage();
    expect(screen.getByLabelText('Період')).toHaveValue('7d');
    fireEvent.change(screen.getByLabelText('Період'), { target: { value: '30d' } });
    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('клік по новій колонці пише sort і asc, дефолтний напрям не лишається', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Візитів/ }));
    expect(mockPush).toHaveBeenCalledWith('/clients?sort=visits');
  });

  it('повторний клік по тій самій колонці перемикає напрям (asc → desc)', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Ім’я/ }));
    expect(mockPush).toHaveBeenCalledWith('/clients?order=desc');
  });

  it('вибір колонки за замовчуванням вичищає sort/order із URL', async () => {
    mockQuery = 'sort=visits&order=asc';
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Ім’я/ }));
    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('фільтр локації йде в URL як locationId (довідник — з /admin/locations)', async () => {
    await renderPage();
    await screen.findByRole('option', { name: 'Поділ' });
    fireEvent.change(screen.getByLabelText('Локація'), { target: { value: 'loc-1' } });
    expect(mockPush).toHaveBeenCalledWith('/clients?locationId=loc-1');
  });

  it('статус лояльності «active» — у URL, «all» — прибирає параметр', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('Статус лояльності'), { target: { value: 'active' } });
    expect(mockPush).toHaveBeenCalledWith('/clients?loyaltyStatus=active');
    fireEvent.change(screen.getByLabelText('Статус лояльності'), { target: { value: 'all' } });
    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('пошук оновлює URL через debounce, а не на кожну літеру', async () => {
    await renderPage();
    const input = screen.getByLabelText(/Пошук клієнтів/);
    fireEvent.change(input, { target: { value: 'iva' } });
    fireEvent.change(input, { target: { value: 'ivan' } });
    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockPush).toHaveBeenCalledWith('/clients?search=ivan');
  });

  it('«Далі» пише ?page=2 у URL', async () => {
    await renderPage(clientListResult({ pages: 3, total: 45 }));
    expect(screen.getByText('Сторінка 1 з 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    expect(mockPush).toHaveBeenCalledWith('/clients?page=2');
  });
});
