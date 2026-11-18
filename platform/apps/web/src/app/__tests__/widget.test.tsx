import React from 'react';
import { render, screen } from '@testing-library/react';
import EmbeddableWidgetPage from '../widget/page';

describe('EmbeddableWidgetPage', () => {
  it('renders widget correctly', () => {
    render(<EmbeddableWidgetPage />);
    expect(screen.getByText('FADE Quick Booking')).toBeDefined();
    expect(screen.getByText('Classic Fade & Beard Trim')).toBeDefined();
  });
});
