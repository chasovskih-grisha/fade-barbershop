import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomePortfolioGallery } from '../HomePortfolioGallery';

describe('HomePortfolioGallery', () => {
  it('renders portfolio gallery section and items correctly', () => {
    render(<HomePortfolioGallery />);
    expect(screen.getByText(/Портфоліо та Візуальна Галерея/i)).toBeDefined();
    expect(screen.getAllByText(/High Skin Fade & Texture Crop/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Executive Beard Sculpting & Hot Towel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Денис/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Артем/i).length).toBeGreaterThan(0);
  });
});
