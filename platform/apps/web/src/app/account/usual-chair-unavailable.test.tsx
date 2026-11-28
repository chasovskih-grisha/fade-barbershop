import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountUsualChairCard } from './AccountUsualChairCard';
import { UNAVAILABLE_CHOICE_LABEL } from './usual-chair';
import { BARBER_GONE, CLOSED, mockApi } from './usual-chair.fixture';

// T-4725b: збережений id, якого більше немає в довіднику, не зникає мовчки —
// картка називає його «Більше не доступно» і дає очистити.

describe('AccountUsualChairCard — зниклий вибір (T-4725b)', () => {
  afterEach(() => jest.clearAllMocks());

  it('показує «Більше не доступно» для обох полів і очищає разом', async () => {
    const { patches } = mockApi({
      choice: { locationId: CLOSED, barberId: BARBER_GONE },
      options: { locations: [], barbers: [] },
    });
    render(<AccountUsualChairCard token="t" />);

    await waitFor(() =>
      expect(screen.getByTestId('usual-location-unavailable')).toHaveTextContent(
        UNAVAILABLE_CHOICE_LABEL
      )
    );
    expect(screen.getByTestId('usual-barber-unavailable')).toHaveTextContent(
      UNAVAILABLE_CHOICE_LABEL
    );

    fireEvent.click(screen.getByRole('button', { name: 'Очистити' }));
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти звичне місце' }));

    await waitFor(() => expect(patches).toEqual([{ locationId: null, barberId: null }]));
  });
});
