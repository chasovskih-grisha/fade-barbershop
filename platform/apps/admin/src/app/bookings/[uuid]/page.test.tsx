import { render, screen, waitFor } from '@testing-library/react';
import BookingDetailPage from './page';
import { PARTY, detailFixture } from './booking-test-helpers';
import type { BookingDetail } from './booking-types';

const mockUuid = { value: '74cf0038-619c-4f04-addf-e42abcc6f966' };

jest.mock('next/navigation', () => ({
  useParams: () => ({ uuid: mockUuid.value }),
}));

const respond = (payload: BookingDetail, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(payload) } as Response);

describe('BookingDetailPage (/bookings/[uuid])', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('показує зведення, людей і журнал змін завантаженого візиту', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond(detailFixture()));
    render(<BookingDetailPage />);
    expect(await screen.findByText('Стрижка')).toBeInTheDocument();
    expect(screen.getByText('600 ₴')).toBeInTheDocument();
    expect(screen.getByText('Без машинки')).toBeInTheDocument();
    expect(screen.getByText('74cf0038-619c-4f04-addf-e42abcc6f966')).toBeInTheDocument();
    expect(screen.getByText('Підтверджено')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Марко' })).toHaveAttribute('href', '/clients/cp-1');
    expect(screen.getByRole('link', { name: 'Сіті Лейк' })).toHaveAttribute(
      'href',
      '/locations/loc-1'
    );
    expect(screen.getByText('Перенесено')).toBeInTheDocument();
    expect(screen.getByText('09:00–09:30 → 10:00–10:30')).toBeInTheDocument();
    expect(screen.getByText(/email → a@b\.c/)).toBeInTheDocument();
    expect(screen.getByText('Візит перенесено')).toBeInTheDocument();
  });

  it('без клієнта, картки CRM і подій — сторінка лишається читабельною', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      respond(detailFixture({ client: null, events: [], notifications: [], comment: null }))
    );
    render(<BookingDetailPage />);
    expect(await screen.findByText('Без клієнта')).toBeInTheDocument();
    expect(screen.getByText('Подій ще не було')).toBeInTheDocument();
  });

  it('партія father-son показує роль, режим, барберів і ціну', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      respond(detailFixture({ party: PARTY, partyRole: 'father' }))
    );
    render(<BookingDetailPage />);
    expect(await screen.findByText('Партія «father-son», режим parallel')).toBeInTheDocument();
    expect(screen.getByText('Барбери: barber-1, barber-2')).toBeInTheDocument();
    expect(screen.getByText('Ціна партії: 1 200 ₴')).toBeInTheDocument();
  });

  it('статус поза словником не роняє картку', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      respond(detailFixture({ status: 'legacy_status' }))
    );
    render(<BookingDetailPage />);
    expect(await screen.findByText('legacy_status')).toBeInTheDocument();
    expect(screen.getByText('Стрижка')).toBeInTheDocument();
  });

  it('діапазон часу не дублює дату в межах одного дня', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond(detailFixture()));
    render(<BookingDetailPage />);
    expect(await screen.findByText(/· 30 хв/)).toBeInTheDocument();
    const range = screen.getByText(/· 30 хв/).textContent ?? '';
    expect(range.match(/2026/g)).toHaveLength(1);
  });

  it('404 від API — банер помилки замість картки', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond(detailFixture(), 404));
    render(<BookingDetailPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Візит не знайдено');
  });

  it('запит іде за uuid з параметра маршруту', async () => {
    mockUuid.value = 'bk-42';
    (global.fetch as jest.Mock).mockReturnValue(respond(detailFixture()));
    render(<BookingDetailPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/admin/bookings/bk-42', { credentials: 'include' })
    );
  });
});
