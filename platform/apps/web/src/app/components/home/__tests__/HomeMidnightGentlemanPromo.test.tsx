import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeMidnightGentlemanPromo } from '../HomeMidnightGentlemanPromo';

describe('HomeMidnightGentlemanPromo', () => {
  it('renders promotional title and action links correctly', () => {
    render(<HomeMidnightGentlemanPromo />);
    
    expect(screen.getAllByText(/Midnight Gentleman/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Забронювати Midnight/i)).toBeInTheDocument();
    expect(screen.getByText(/Усі послуги/i)).toBeInTheDocument();
    expect(screen.getByText(/Повна приватність студії/i)).toBeInTheDocument();
  });
});
