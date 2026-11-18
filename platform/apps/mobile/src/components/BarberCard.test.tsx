import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BarberCard } from './BarberCard';

// T-4851b: картка каже лише те, що є в payload. Запис без спеціалізацій не
// має чипів і не вигадує років; один запис із однією спеціалізацією показує
// рівно один чип.

describe('BarberCard (T-4851b)', () => {
  it('renders only the name for a bare payload', () => {
    const { getByText, queryByTestId, toJSON } = render(
      <BarberCard barber={{ id: 'alex', name: 'Олександр' }} onPress={jest.fn()} />
    );

    expect(getByText('Олександр')).toBeTruthy();
    expect(queryByTestId('barber-chip-Fade')).toBeNull();
    const serialized = JSON.stringify(toJSON());
    expect(serialized).not.toContain('Вільні вікна');
    expect(serialized).not.toContain('Експерт');
    expect(serialized).not.toContain('років досвіду');
  });

  it('renders one chip when the payload carries one specialty', () => {
    const { getByTestId, queryAllByTestId } = render(
      <BarberCard
        barber={{ id: 'maksym', name: 'Максим', specialties: ['Fade'] }}
        onPress={jest.fn()}
      />
    );

    expect(getByTestId('barber-chip-Fade')).toBeTruthy();
    expect(queryAllByTestId(/^barber-chip-/)).toHaveLength(1);
  });

  it('opens the barber screen when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <BarberCard barber={{ id: 'alex', name: 'Олександр' }} onPress={onPress} />
    );

    fireEvent.press(getByTestId('barber-card-alex'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
