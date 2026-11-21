import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from './page';
import { defaultWeek } from '../location-hours-fields';

const mockPush = jest.fn();
const mockParams = { id: 'loc-123' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

describe('T-4406 Location channels and gallery', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('mounts channel and gallery sections and persists them via PATCH', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'loc-123',
          code: 'KYY-01',
          name: 'FADE Test',
          address: 'Test Address',
          phone: null,
          active: true,
          hours: defaultWeek(),
          logo: null,
          channels: [{ channel: 'phone', value: '+380501234567', sortOrder: 0 }],
          photos: [{ url: 'https://cdn.fade.ua/a.jpg', caption: 'Зала', sortOrder: 0 }],
        }),
      })
      .mockResolvedValue({ ok: true, json: async () => ({ id: 'loc-123' }) });

    render(<EditLocationPage />);

    expect(await screen.findByDisplayValue('+380501234567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://cdn.fade.ua/a.jpg')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /зберегти канали/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/locations/loc-123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            channels: [{ channel: 'phone', value: '+380501234567', sortOrder: 0 }],
          }),
        })
      )
    );
  });
});
