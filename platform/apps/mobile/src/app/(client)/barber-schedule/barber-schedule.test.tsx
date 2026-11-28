import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import BarberScheduleScreen from './page';
import * as api from '../../../lib/api/barber-self-schedule';
import { writeSession } from '../../../lib/session-store';

jest.mock('../../../lib/api/barber-self-schedule');

const mocked = api as jest.Mocked<typeof api>;

const LOCATIONS = { barberId: 'barber-1', locations: [{ id: 'loc-1', name: 'FADE Central' }] };
const VIEW = {
  barberId: 'barber-1',
  locationId: 'loc-1',
  windows: [],
  version: 0,
  canEdit: true,
  history: [],
};

async function ready() {
  render(<BarberScheduleScreen />);
  await waitFor(() => expect(mocked.getBarberSchedule).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByTestId('barber-unavailability-submit')).toBeTruthy());
}

describe('Barber «не вийду» (T-4616b)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getBarberScheduleLocations.mockResolvedValue(LOCATIONS);
    mocked.getBarberSchedule.mockResolvedValue(VIEW);
    mocked.markBarberUnavailable.mockResolvedValue({ conflictsCreated: 2 });
    writeSession({ accessToken: 'barber-token' });
  });

  afterEach(() => {
    act(() => writeSession(null));
  });

  it('просить увійти, коли сесії немає', () => {
    writeSession(null);
    render(<BarberScheduleScreen />);
    expect(screen.getByTestId('barber-schedule-signed-out')).toBeTruthy();
    expect(mocked.markBarberUnavailable).not.toHaveBeenCalled();
  });

  it('позначає добу тим самим маршрутом, що й адмінка, і показує рішення засновника', async () => {
    await ready();

    fireEvent.press(screen.getByTestId('barber-day-1'));
    fireEvent.changeText(screen.getByTestId('barber-unavailability-reason'), 'лікар');
    fireEvent.press(screen.getByTestId('barber-unavailability-submit'));

    await waitFor(() => expect(mocked.markBarberUnavailable).toHaveBeenCalledTimes(1));
    const call = mocked.markBarberUnavailable.mock.calls[0];
    if (!call) throw new Error('markBarberUnavailable was not called');
    const [locationId, interval, token] = call;
    expect(locationId).toBe('loc-1');
    expect(token).toBe('barber-token');
    expect(interval.reason).toBe('лікар');
    expect(new Date(String(interval.end)).getTime() - new Date(String(interval.start)).getTime()).toBe(
      24 * 60 * 60 * 1000
    );
    expect((await screen.findByTestId('barber-unavailability-notice')).props.children).toBeDefined();
    expect(screen.getAllByText(/2 візити чекають рішення засновника/).length).toBeGreaterThan(0);
  });

  it('без права адміна лише пояснює і не шле позначку', async () => {
    mocked.getBarberSchedule.mockResolvedValue({ ...VIEW, canEdit: false });

    await ready();

    expect(screen.getByTestId('barber-schedule-read-only')).toBeTruthy();
    fireEvent.press(screen.getByTestId('barber-unavailability-submit'));
    expect(mocked.markBarberUnavailable).not.toHaveBeenCalled();
  });

  it('не пропонує барберу переносити чи скасовувати чужі візити (SCH-004)', async () => {
    await ready();

    expect(screen.queryByText('Перенести')).toBeNull();
    expect(screen.queryByText('Скасувати')).toBeNull();
  });

  it('позначений день лишається видимим і не шле другу позначку (T-4616b)', async () => {
    await ready();

    fireEvent.press(screen.getByTestId('barber-unavailability-submit'));
    await waitFor(() => expect(mocked.markBarberUnavailable).toHaveBeenCalledTimes(1));

    const marked = await screen.findByTestId('barber-day-marked');
    expect(marked.props.children).toBeDefined();
    expect(screen.getByText(/Цей день закритий. 2 візити чекають рішення засновника/)).toBeTruthy();

    const submit = screen.getByTestId('barber-unavailability-submit');
    expect(submit.props.accessibilityState?.disabled || submit.props.disabled).toBeTruthy();
    fireEvent.press(submit);
    expect(mocked.markBarberUnavailable).toHaveBeenCalledTimes(1);
  });

  it('інший день знову доступний для позначки', async () => {
    await ready();

    fireEvent.press(screen.getByTestId('barber-unavailability-submit'));
    await waitFor(() => expect(screen.getByTestId('barber-day-marked')).toBeTruthy());

    fireEvent.press(screen.getByTestId('barber-day-1'));

    expect(screen.queryByTestId('barber-day-marked')).toBeNull();
    const submit = screen.getByTestId('barber-unavailability-submit');
    expect(submit.props.accessibilityState?.disabled || submit.props.disabled).toBeFalsy();
  });

  it('показує помилку відправки, не вдаючи успіх', async () => {
    mocked.markBarberUnavailable.mockRejectedValue(new Error('boom'));

    await ready();

    fireEvent.press(screen.getByTestId('barber-unavailability-submit'));

    expect(await screen.findByText(/Не вдалося позначити день/)).toBeTruthy();
  });
});
