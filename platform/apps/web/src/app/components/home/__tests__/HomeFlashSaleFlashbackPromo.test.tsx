import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeFlashSaleFlashbackPromo } from '../HomeFlashSaleFlashbackPromo';

describe('HomeFlashSaleFlashbackPromo', () => {
  it('renders flash sale heading and CTA buttons', () => {
    render(<HomeFlashSaleFlashbackPromo />);
    expect(screen.getByText(/Midnight Flash Sale/i)).toBeInTheDocument();
    expect(screen.getByText(/Забронювати зі знижкою/i)).toBeInTheDocument();
    expect(screen.getByText(/Переглянути графік/i)).toBeInTheDocument();
  });
});
