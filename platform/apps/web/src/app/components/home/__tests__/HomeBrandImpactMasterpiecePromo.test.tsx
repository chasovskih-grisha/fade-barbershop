import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeBrandImpactMasterpiecePromo } from '../HomeBrandImpactMasterpiecePromo';

describe('HomeBrandImpactMasterpiecePromo', () => {
  it('renders correctly with title and action buttons', () => {
    render(<HomeBrandImpactMasterpiecePromo />);

    expect(
      screen.getByText(/Колекційна серія стрижок та королівського гоління/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Преміальний ритуал/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Забронювати досвід/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Переглянути послуги/i })).toHaveAttribute(
      'href',
      '/services'
    );
  });
});
