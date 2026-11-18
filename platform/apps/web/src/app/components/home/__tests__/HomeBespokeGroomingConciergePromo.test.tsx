import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeBespokeGroomingConciergePromo } from '../HomeBespokeGroomingConciergePromo';

describe('HomeBespokeGroomingConciergePromo', () => {
  it('renders promotional title and action links correctly', () => {
    render(<HomeBespokeGroomingConciergePromo />);
    
    expect(screen.getAllByText(/Bespoke Grooming Concierge/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Замовити Concierge/i)).toBeInTheDocument();
    expect(screen.getByText(/Усі послуги/i)).toBeInTheDocument();
    expect(screen.getByText(/Персональний імідж-консультант/i)).toBeInTheDocument();
  });
});
