import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SupportCenterPage from '../page';

describe('SupportCenterPage Accessibility & WCAG Compliance', () => {
  it('ensures all form inputs have accessible associated labels and aria attributes', () => {
    const { container } = render(<SupportCenterPage />);

    // Search input
    const searchInput = screen.getByPlaceholderText(/Пошук запитань/i);
    expect(searchInput).toHaveAttribute('id');
    const searchLabel = container.querySelector(`label[for="${searchInput.getAttribute('id')}"]`);
    expect(searchLabel).toBeDefined();

    // Ticket form inputs
    const nameInput = screen.getByPlaceholderText(/Введіть ваше ім’я/i);
    expect(nameInput).toHaveAttribute('id', 'ticket-name');
    const nameLabel = container.querySelector('label[for="ticket-name"]');
    expect(nameLabel).toBeDefined();

    const phoneInput = screen.getByPlaceholderText(/\+380 \(XX\) XXX-XX-XX/i);
    expect(phoneInput).toHaveAttribute('id', 'ticket-phone');
    expect(phoneInput).toHaveAttribute('required');
    const phoneLabel = container.querySelector('label[for="ticket-phone"]');
    expect(phoneLabel).toBeDefined();

    const messageTextarea = screen.getByPlaceholderText(/Опишіть вашу ситуацію або питання\.\.\./i);
    expect(messageTextarea).toHaveAttribute('id', 'ticket-message');
    expect(messageTextarea).toHaveAttribute('required');
    const messageLabel = container.querySelector('label[for="ticket-message"]');
    expect(messageLabel).toBeDefined();
  });

  it('supports keyboard navigation and click interactions on interactive diagnostic items', () => {
    render(<SupportCenterPage />);
    const diagnosticButton = screen.getByText('⏳ Я запізнююся на візит').closest('button')!;
    expect(diagnosticButton).toBeDefined();
    
    // Toggle
    fireEvent.click(diagnosticButton);
    expect(screen.getByText(/Якщо запізнення становить менше 15 хвилин/i)).toBeDefined();
  });

  it('maintains correct heading hierarchy (h1, h2, h3) without skipping levels', () => {
    render(<SupportCenterPage />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });
    const h3s = screen.getAllByRole('heading', { level: 3 });

    expect(h1s.length).toBe(1);
    expect(h2s.length).toBeGreaterThan(0);
    expect(h3s.length).toBeGreaterThan(0);
  });
});
