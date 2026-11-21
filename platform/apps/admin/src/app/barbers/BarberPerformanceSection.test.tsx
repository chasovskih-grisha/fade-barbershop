import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BarberPerformanceSection from './BarberPerformanceSection';

describe('BarberPerformanceSection', () => {
  it('loads performance metrics and submits a vacation request', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          appointmentsCount: 25,
          revenue: 20000,
          avgCheck: 800,
          utilizationRate: 0.65,
          commissionTier: 'bronze',
          bonusMultiplier: 1.05,
          recommendedAction: 'Стабільний графік',
          idleGapsMinutes: [{ start: '14:00', end: '14:30', durationMinutes: 30 }],
          vacationRequests: [],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          appointmentsCount: 25,
          revenue: 20000,
          avgCheck: 800,
          utilizationRate: 0.65,
          commissionTier: 'bronze',
          bonusMultiplier: 1.05,
          recommendedAction: 'Стабільний графік',
          idleGapsMinutes: [],
          vacationRequests: [
            {
              id: 'v-2',
              startDate: '2026-12-10',
              endDate: '2026-12-15',
              reason: 'Відпустка',
              status: 'pending',
            },
          ],
        }),
      });

    render(<BarberPerformanceSection barberId="barber-1" />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('20000 ₴')).toBeInTheDocument();
      expect(screen.getByText(/14:00 — 14:30/)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ущільнити розклад/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Проміжні вікна успішно ущільнено/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Дата початку відпустки'), {
      target: { value: '2026-12-10' },
    });
    fireEvent.change(screen.getByLabelText('Дата закінчення відпустки'), {
      target: { value: '2026-12-15' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит на відпустку' }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/barbers/barber-1/vacation-requests',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            startDate: '2026-12-10',
            endDate: '2026-12-15',
            reason: 'Відпустка',
          }),
        })
      );
    });
  });
});
