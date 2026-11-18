import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SlotPolicySection from './SlotPolicySection';

// T-4522: політика слотів локації — number-поля, валідація діапазонів
// (дзеркало API), confirm-banner «зміна лише до нових записів».
const policy = {
  locationId: 'loc-1',
  stepMinutes: 30,
  bufferMinutes: 5,
  horizonDays: 30,
  lastMinuteMinutes: 90,
  usingDefaults: false,
};

const url = '/admin/barber-service/locations/loc-1/slot-policy';

describe('SlotPolicySection (T-4522)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('loads the policy into the fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => policy });
    render(<SlotPolicySection locationId="loc-1" />);
    await waitFor(() => expect(screen.getByLabelText('Крок сітки, хв')).toHaveValue(30));
    expect(screen.getByLabelText('Буфер між записами, хв')).toHaveValue(5);
    expect(screen.getByLabelText('Горизонт запису, днів')).toHaveValue(30);
    expect(global.fetch).toHaveBeenCalledWith(url, { credentials: 'include' });
  });

  it('blocks an out-of-range value before the confirm step', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => policy });
    render(<SlotPolicySection locationId="loc-1" />);
    fireEvent.change(await screen.findByLabelText('Крок сітки, хв'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти політику' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('кратно 15');
    expect(screen.queryByText('Підтвердіть зміну')).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1); // лише GET
  });

  it('saves after the confirm banner and warns about new bookings only', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => policy })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...policy, bufferMinutes: 10 }) });
    render(<SlotPolicySection locationId="loc-1" />);
    fireEvent.change(await screen.findByLabelText('Буфер між записами, хв'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти політику' }));
    expect(await screen.findByText('Підтвердіть зміну')).toBeInTheDocument();
    expect(screen.getByText(/лише до нових записів/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        url,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            stepMinutes: 30,
            bufferMinutes: 10,
            horizonDays: 30,
            lastMinuteMinutes: 90,
          }),
        })
      )
    );
    expect(await screen.findByText(/Політику збережено/)).toHaveTextContent(
      'застосується лише до нових записів'
    );
    expect(screen.queryByText('Підтвердіть зміну')).not.toBeInTheDocument();
  });
});
