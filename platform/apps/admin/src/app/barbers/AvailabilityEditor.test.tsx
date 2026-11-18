import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AvailabilityEditor from './AvailabilityEditor';

describe('AvailabilityEditor', () => {
  it('loads weekly hours and saves them to the schedule API', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }] }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ version: 1 }) });
    render(
      <AvailabilityEditor barberId="barber-1" locations={[{ id: 'loc-1', name: 'FADE Поділ' }]} />
    );
    fireEvent.change(screen.getByLabelText('Локація графіка barber-1'), {
      target: { value: 'loc-1' },
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Понеділок, вікно 1, початок')).toHaveValue('09:00')
    );
    fireEvent.change(screen.getByLabelText('Понеділок, вікно 1, кінець'), {
      target: { value: '16:00' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Зберегти графік' }));
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/barbers/barber-1/availability',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            locationId: 'loc-1',
            windows: [{ dayOfWeek: 0, start: '09:00', end: '16:00' }],
          }),
        })
      )
    );
  });
});
