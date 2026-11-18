import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CashDrawerPage from './page';

describe('CashDrawerPage (T-4530)', () => {
  it('renders cash drawer KPI cards and movements table', () => {
    render(<CashDrawerPage />);

    expect(screen.getByText(/Каса та розрахунки/i)).toBeInTheDocument();
    expect(screen.getByText(/Розмінний фонд/i)).toBeInTheDocument();
    expect(screen.getByText(/Поточний баланс готівки/i)).toBeInTheDocument();
    expect(screen.getByText(/Стрижка \+ борода \(готівка\)/i)).toBeInTheDocument();
  });

  it('allows adding a new cash movement', () => {
    render(<CashDrawerPage />);

    const amountInput = screen.getByPlaceholderText(/напр. 500/i);
    const reasonInput = screen.getByPlaceholderText(/напр. Оплата за стрижку/i);

    fireEvent.change(amountInput, { target: { value: '450' } });
    fireEvent.change(reasonInput, { target: { value: 'Додатковий розмін' } });

    const submitBtn = screen.getByRole('button', { name: /Додати рух/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Рух готівки успішно зареєстровано в касі/i)).toBeInTheDocument();
    expect(screen.getByText(/Додатковий розмін/i)).toBeInTheDocument();
  });

  it('performs shift closing and reconciliation with discrepancy', () => {
    render(<CashDrawerPage />);

    const actualInput = screen.getByPlaceholderText(/напр. 2850/i);
    fireEvent.change(actualInput, { target: { value: '2900' } });

    const closeBtn = screen.getByRole('button', { name: /Закрити зміну та звірити касу/i });
    fireEvent.click(closeBtn);

    expect(screen.getByText(/Результат звірки:/i)).toBeInTheDocument();
    expect(screen.getByText(/Зміну закрито з розбіжністю/i)).toBeInTheDocument();
  });
});
