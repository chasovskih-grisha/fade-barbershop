import React from 'react';
import { render } from '@testing-library/react-native';
import { LocationChairLine } from './LocationChairLine';
import type { ChairDto } from '../lib/api/locations';

// T-4830b: лінія рахує лише активні крісла з payload, показує імʼя
// іменованого крісла, а при нулі активних не рендериться взагалі.

const chair = (number: number, name: string | null, active = true): ChairDto => ({
  number,
  name,
  active,
});

describe('LocationChairLine (T-4830b)', () => {
  it('shows the name of a named chair', () => {
    const { getByTestId } = render(
      <LocationChairLine chairs={[chair(1, 'Біля вікна'), chair(2, null)]} />
    );
    expect(getByTestId('location-chair-line').props.children).toBe('Крісла: Біля вікна');
  });

  it('counts only active chairs', () => {
    const { getByTestId } = render(
      <LocationChairLine chairs={[chair(1, null), chair(2, null), chair(3, null, false)]} />
    );
    expect(getByTestId('location-chair-line').props.children).toBe('2 крісла');
  });

  it('renders nothing when the chair list is empty or all chairs are inactive', () => {
    const empty = render(<LocationChairLine chairs={[]} />);
    expect(empty.queryByTestId('location-chair-line')).toBeNull();

    const inactive = render(<LocationChairLine chairs={[chair(1, null, false)]} />);
    expect(inactive.queryByTestId('location-chair-line')).toBeNull();
  });
});
