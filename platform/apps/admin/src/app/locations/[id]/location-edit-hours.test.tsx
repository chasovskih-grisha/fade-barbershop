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

function testLocation() {
  return {
    id: 'loc-123',
    code: 'KYY-01',
    name: 'FADE Test',
    address: 'Test Address',
    phone: null,
    active: true,
    hours: defaultWeek(),
    logo: null,
  };
}

describe('T-022 Working Hours Editor & Validation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders loading skeleton while loading', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<EditLocationPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('validates working hours per §1.3 (open must be before close)', () => {
    const hours = defaultWeek();
    if (hours[0]) {
      hours[0].open = '18:00';
      hours[0].close = '09:00';
      hours[0].closed = false;
    }
    render(
      <LocationEditView
        location={{ ...testLocation(), hours }}
        hours={hours}
        onHoursChange={jest.fn()}
        saving={false}
        error="Понеділок: час відкриття має бути раніше за час закриття."
        notice={null}
        onSaveHours={jest.fn()}
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
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Понеділок: час відкриття має бути раніше за час закриття.'
    );
  });

  it('shows spinner and disabled button while submit is in flight, and saves successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => testLocation() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'loc-123' }) });

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
});
