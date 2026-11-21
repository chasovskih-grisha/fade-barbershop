import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsPage from './page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('AnalyticsPage', () => {
  it('рендерить аналітику мережі та показники', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/admin/calendar')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            visits: [
              {
                id: 'v1',
                start: '2026-11-10T10:00:00Z',
                end: '2026-11-10T10:45:00Z',
                status: 'completed',
                barberId: 'b1',
                locationId: 'l1',
                agreedPrice: 500,
              },
            ],
          }),
        });
      }
      if (url.includes('/admin/barbers')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'b1', name: 'Олександр' }],
        });
      }
      if (url.includes('/admin/locations')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'l1', name: 'Центр' }],
        });
      }
      return Promise.reject(new Error('unknown url'));
    });

    render(<AnalyticsPage />);
    expect(await screen.findByRole('heading', { name: 'Аналітика мережі' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Всього записів')).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });
  });
});
