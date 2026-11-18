import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RetentionPage from './page';

describe('RetentionPage (Win-Back Automation)', () => {
  it('renders retention KPIs and inactive clients list', () => {
    render(<RetentionPage />);

    expect(screen.getByText(/Утримання клієнтів та Win-Back кампанії/i)).toBeInTheDocument();
    expect(screen.getByText(/Активна базова база/i)).toBeInTheDocument();
    expect(screen.getByText(/Maksym Velychko/i)).toBeInTheDocument();
  });

  it('allows calculating win-back campaign offer', () => {
    render(<RetentionPage />);

    const buttons = screen.getAllByRole('button', { name: /Розрахувати Win-Back/i });
    fireEvent.click(buttons[0]!);

    expect(screen.getByText(/Win-Back Кампанія/i)).toBeInTheDocument();
    expect(screen.getByText(/Промокод/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Надіслати пропозицію/i })).toBeInTheDocument();
  });
});
