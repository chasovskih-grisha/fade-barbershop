import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountUsualChairCard } from './AccountUsualChairCard';
import { EMPTY_CHOICE_LABEL, UNAVAILABLE_CHOICE_LABEL } from './usual-chair';
import {
  BARBER_A,
  BARBER_GONE,
  EMPTY_REPLY,
  LOCATION_A,
  LOCATION_B,
  barberSelect,
  loaded,
  locationSelect,
  mockApi,
  saveButton,
} from './usual-chair.fixture';

// T-4725b: звична локація і барбер у профілі. «Не обрано» — реальний вибір,
// а збереження не чіпає візити.

describe('AccountUsualChairCard (T-4725b)', () => {
  afterEach(() => jest.clearAllMocks());

  it('порожній вибір показує «Не обрано» і нічого не зберігає без дії', async () => {
    const { patches } = mockApi(EMPTY_REPLY);
    render(<AccountUsualChairCard token="t" />);
    await loaded();

    expect(locationSelect()).toHaveValue('');
    const emptyOptions = within(locationSelect()).getAllByRole('option', {
      name: EMPTY_CHOICE_LABEL,
    });
    expect(emptyOptions).toHaveLength(1);
    expect(saveButton()).toBeDisabled();
    expect(patches).toHaveLength(0);
  });

  it('вибір «Не обрано» зберігається порожнім, без підстановки першої локації', async () => {
    const { patches } = mockApi({
      choice: { locationId: LOCATION_A, barberId: BARBER_A },
      options: { locations: [{ id: LOCATION_A, name: 'Поділ' }], barbers: [] },
    });
    render(<AccountUsualChairCard token="t" />);
    await loaded();

    fireEvent.change(locationSelect(), { target: { value: '' } });
    fireEvent.change(barberSelect(), { target: { value: '' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(patches).toEqual([{ locationId: null, barberId: null }]));
  });

  it('зберігає локацію і барбера парою', async () => {
    const { patches } = mockApi(EMPTY_REPLY);
    render(<AccountUsualChairCard token="t" />);
    await loaded();

    fireEvent.change(locationSelect(), { target: { value: LOCATION_A } });
    await waitFor(() => expect(barberSelect()).toBeEnabled());
    await waitFor(() => expect(within(barberSelect()).getByRole('option', { name: 'Ігор' })));
    fireEvent.change(barberSelect(), { target: { value: BARBER_A } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(patches).toEqual([{ locationId: LOCATION_A, barberId: BARBER_A }]));
  });

  it('збереження не викликає жодного оновлення запису', async () => {
    const { patches } = mockApi(EMPTY_REPLY);
    render(<AccountUsualChairCard token="t" />);
    await loaded();

    fireEvent.change(locationSelect(), { target: { value: LOCATION_B } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(patches).toHaveLength(1));
    const urls = (global.fetch as jest.Mock).mock.calls.map((call) => String(call[0]));
    expect(urls.every((url) => url.startsWith('/api/account/usual-chair'))).toBe(true);
    expect(urls.some((url) => url.includes('appointments'))).toBe(false);
  });

  it('«Більше не доступно» описує саме зникле поле, а не всю пару', async () => {
    mockApi({
      choice: { locationId: LOCATION_A, barberId: BARBER_GONE },
      options: EMPTY_REPLY.options,
    });
    render(<AccountUsualChairCard token="t" />);
    await loaded();

    expect(screen.queryByTestId('usual-location-unavailable')).toBeNull();
    expect(screen.getByTestId('usual-barber-unavailable')).toHaveTextContent(
      UNAVAILABLE_CHOICE_LABEL
    );
  });
});
