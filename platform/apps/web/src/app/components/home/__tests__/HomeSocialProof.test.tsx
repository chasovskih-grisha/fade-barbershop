import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeSocialProof } from '../HomeSocialProof';

describe('HomeSocialProof', () => {
  it('renders social proof metrics and testimonials', () => {
    render(<HomeSocialProof />);
    
    expect(screen.getByText(/4\.98 \/ 5\.0/i)).toBeInTheDocument();
    expect(screen.getByText(/Максим Коваленко/i)).toBeInTheDocument();
    expect(screen.getByText(/Денис Шевченко/i)).toBeInTheDocument();
    expect(screen.getByText(/Олександр Романенко/i)).toBeInTheDocument();
  });
});
