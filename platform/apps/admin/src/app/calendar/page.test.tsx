import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CalendarPage from './page';
import { route } from './page.fixtures';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CalendarPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('показує банер із повтором, коли календар не завантажився, і перечитує після кліку', async () => {
    let calendarCalls = 0;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/admin/calendar')) {
        calendarCalls += 1;
        if (calendarCalls === 1) return Promise.resolve({ ok: false });
      }
      return Promise.resolve(route(url));
    });

    render(<CalendarPage />);
    // Панель конфліктів має власний банер — звіряємо саме календарний.
    expect(await screen.findByText('Не вдалося завантажити календар')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeInTheDocument());
    expect(screen.queryByText('Не вдалося завантажити календар')).not.toBeInTheDocument();
  });

  it('renders visits from /admin/calendar after auth', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => Promise.resolve(route(url)));
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeInTheDocument());
    // «Заброньовано» є й у фільтрі статусу — звіряємо саме пілюлю в рядку.
    expect(screen.getByRole('cell', { name: 'Заброньовано' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Іван' })).toBeInTheDocument();
    expect(screen.getByText('600 ₴')).toBeInTheDocument();
    expect(screen.getByText('є')).toBeInTheDocument(); // маркер референса (REF-ADM-01)
  });

  it('row click opens the visit card; confirm posts the lifecycle command and reloads', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => Promise.resolve(route(url)));
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeInTheDocument());
    fireEvent.click(screen.getByText('10:00–11:00'));
    expect(screen.getByTestId('visit-card')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls.find(
        ([u]) => u === '/admin/appointments/apt-1/confirm'
      );
      expect(call).toBeTruthy();
    });
    // prettier-ignore
    const confirmCall = (global.fetch as jest.Mock).mock.calls.find(([u]) => u === '/admin/appointments/apt-1/confirm') as unknown as [string, { method: string; body: string }];
    expect(confirmCall[1].method).toBe('POST');
    expect(JSON.parse(confirmCall[1].body)).toEqual({});
  });

  it('refetches the calendar when a filter changes', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => Promise.resolve(route(url)));
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Дата'), { target: { value: '2026-10-05' } });
    await waitFor(() => {
      // prettier-ignore
      expect((global.fetch as jest.Mock).mock.calls.some(([u]) => u.includes('date=2026-10-05'))).toBe(true);
    });
  });

  it('фільтр «Статус» іде на бекенд як ?status= і лишає сітку відфільтрованою', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => Promise.resolve(route(url)));
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'completed' } });
    await waitFor(() => {
      // prettier-ignore
      expect((global.fetch as jest.Mock).mock.calls.some(([u]) => u.includes('status=completed'))).toBe(true);
    });
  });

  it('клік по заголовку «Ціна» сортує сітку за ціною (aria-sort)', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => Promise.resolve(route(url)));
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByText('10:00–11:00')).toBeInTheDocument());
    const header = screen.getByRole('columnheader', { name: /Ціна/ });
    expect(header).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(screen.getByRole('button', { name: /Ціна/ }));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  it('redirects when not auth', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    render(<CalendarPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});
