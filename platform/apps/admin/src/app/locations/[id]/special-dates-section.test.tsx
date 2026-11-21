import { render, screen } from '@testing-library/react';
import LocationEditView, { type LocationDto } from './location-edit-view';
import { defaultWeek } from '../location-hours-fields';

const baseLocation = (overrides: Partial<LocationDto> = {}): LocationDto => ({
  id: 'loc-1',
  code: 'CLT-01',
  name: 'FADE CLT-01',
  address: 'Київ, Хрещатик 1',
  phone: null,
  active: true,
  hours: defaultWeek(),
  logo: null,
  ...overrides,
});

function renderView(location: LocationDto) {
  return render(
    <LocationEditView
      location={location}
      hours={location.hours}
      onHoursChange={jest.fn()}
      saving={false}
      error={null}
      notice={null}
      onSaveHours={jest.fn()}
      onToggleActive={jest.fn()}
      onBack={jest.fn()}
      onLogoSave={jest.fn()}
      onLogoRemove={jest.fn()}
      onSaveChannels={jest.fn()}
      onSavePhotos={jest.fn()}
      onSaveProfile={jest.fn()}
    />
  );
}

describe('T-4525a · location special dates block', () => {
  it('lists each exception with its date, reason and state (§1.5)', () => {
    renderView(
      baseLocation({
        specialDates: [
          { date: '2026-12-25', closed: true, open: null, close: null, reason: 'Різдво' },
          {
            date: '2026-12-31',
            closed: false,
            open: '09:00',
            close: '15:00',
            reason: 'Короткий день',
          },
        ],
      })
    );

    expect(screen.getByText('Особливі дати')).toBeInTheDocument();
    expect(screen.getByText('2026-12-25 · Різдво')).toBeInTheDocument();
    expect(screen.getByText('Зачинено')).toBeInTheDocument();
    expect(screen.getByText('2026-12-31 · Короткий день')).toBeInTheDocument();
    expect(screen.getByText('09:00–15:00')).toBeInTheDocument();
  });

  it('explains the empty list instead of showing a bare block', () => {
    renderView(baseLocation({ specialDates: [] }));
    expect(screen.getByText('Особливих дат немає.')).toBeInTheDocument();
  });
});
