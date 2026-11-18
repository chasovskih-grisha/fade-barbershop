import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeVisualBanner } from '../HomeVisualBanner';

describe('HomeVisualBanner', () => {
  it('renders visual banner title, badges, and action links', () => {
    render(<HomeVisualBanner />);

    expect(screen.getByText(/Сучасна естетика FADE/i)).toBeInTheDocument();
    expect(screen.getByText(/Форма, яка говорить за вас/i)).toBeInTheDocument();
    expect(screen.getByText(/Чиста геометрія/i)).toBeInTheDocument();
    expect(screen.getByText(/Тиха година/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Забронювати візит/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Наші майстри/i })).toBeInTheDocument();
  });
});
