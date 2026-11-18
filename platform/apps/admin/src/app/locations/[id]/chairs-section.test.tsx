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

describe('T-4525a · location info blocks', () => {
  it('shows each chair with its number and active state (§1.4)', () => {
    renderView(
      baseLocation({
        chairs: [
          { number: 1, name: 'Біля вікна', active: true },
          { number: 2, name: null, active: false },
        ],
      })
    );

    expect(screen.getByText('Крісла')).toBeInTheDocument();
    expect(screen.getByText('Активні: 1/2')).toBeInTheDocument();
    expect(screen.getByText('№1 · Біля вікна')).toBeInTheDocument();
    expect(screen.getByText('№2')).toBeInTheDocument();
    expect(screen.getByText('Активне')).toBeInTheDocument();
    expect(screen.getByText('Неактивне')).toBeInTheDocument();
  });

  it('explains the empty chairs list instead of showing a bare block', () => {
    renderView(baseLocation({ chairs: [] }));
    expect(screen.getByText('Крісел ще немає.')).toBeInTheDocument();
  });

  it('warns with the reason when the location is disabled', () => {
    renderView(baseLocation({ active: false }));
    expect(screen.getByText('Локація вимкнена')).toBeInTheDocument();
  });

  it('does not warn about a disabled location when it is active', () => {
    renderView(baseLocation({ active: true }));
    expect(screen.queryByText('Локація вимкнена')).not.toBeInTheDocument();
  });
});
