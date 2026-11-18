import React from 'react';
import { render } from '@testing-library/react-native';
import { BarberPortrait } from './BarberPortrait';

// T-4871b: фото з payload рендериться в кадрі, null — ініціали. Жодного
// градієнта поверх обличчя.

const photo = {
  url: 'https://media.test/alex.jpg',
  alt: 'Олександр',
  width: 300,
  height: 375,
};

describe('BarberPortrait (T-4871b)', () => {
  it('renders the payload photo inside the card frame', () => {
    const { getByTestId, queryByTestId } = render(
      <BarberPortrait name="Олександр" photo={photo} />
    );

    const image = getByTestId('barber-portrait-photo');
    expect(image.props.source).toEqual({ uri: 'https://media.test/alex.jpg' });
    expect(image.props.accessibilityLabel).toBe('Олександр');
    expect(queryByTestId('barber-portrait-initials')).toBeNull();
    expect(getByTestId('barber-portrait-card')).toBeTruthy();
  });

  it('renders initials when the payload has no photo', () => {
    const { getByTestId, queryByTestId } = render(<BarberPortrait name="Олександр" photo={null} />);

    expect(getByTestId('barber-portrait-initials').props.children).toBe('О');
    expect(queryByTestId('barber-portrait-photo')).toBeNull();
  });

  it('uses the same portrait on the barber screen', () => {
    const { getByTestId } = render(
      <BarberPortrait name="Максим" photo={photo} variant="screen" />
    );

    expect(getByTestId('barber-portrait-screen')).toBeTruthy();
    expect(getByTestId('barber-portrait-photo').props.source.uri).toBe(
      'https://media.test/alex.jpg'
    );
  });
});
