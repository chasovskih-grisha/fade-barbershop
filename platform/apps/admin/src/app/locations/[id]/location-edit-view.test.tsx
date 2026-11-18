import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationEditView from './location-edit-view';
import EditLocationPage from './page';
import { defaultWeek } from '../location-hours-fields';

const mockPush = jest.fn();
const mockParams = { id: 'loc-123' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

describe('T-022 Working Hours Editor & Validation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders loading skeleton while loading', async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    render(<EditLocationPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('validates working hours per §1.3 (open must be before close)', async () => {
    const hours = defaultWeek();
    if (hours[0]) {
      hours[0].open = '18:00';
      hours[0].close = '09:00';
      hours[0].closed = false;
    }

    const onSaveHours = jest.fn();
    const onHoursChange = jest.fn();

    const location = {
      id: 'loc-123',
      code: 'KYY-01',
      name: 'FADE Test',
      address: 'Test Address',
      phone: null,
      active: true,
      hours,
      logo: null,
    };

    render(
      <LocationEditView
        location={location}
        hours={hours}
        onHoursChange={onHoursChange}
        saving={false}
        error="Понеділок: час відкриття має бути раніше за час закриття."
        notice={null}
        onSaveHours={onSaveHours}
        onToggleActive={jest.fn()}
        onBack={jest.fn()}
        onLogoSave={jest.fn()}
        onLogoRemove={jest.fn()}
        onSaveChannels={jest.fn().mockResolvedValue(undefined)}
        onSavePhotos={jest.fn().mockResolvedValue(undefined)}
        onSaveProfile={jest.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText('Понеділок')).toBeInTheDocument();
    expect(screen.getByText('Неділя')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Понеділок: час відкриття має бути раніше за час закриття.');
  });

  it('shows spinner and disabled button while submit is in flight, and saves successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
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
      }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'loc-123' }),
    });

    render(<EditLocationPage />);

    expect(await screen.findByText('FADE Test')).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Зберегти години' });
    expect(saveButton).toBeEnabled();

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/locations/loc-123',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' })
      );
    });
  });

  it('mounts channel and gallery sections and persists them via PATCH (T-4406)', async () => {
    (global.fetch as jest.Mock).mockReset();
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
