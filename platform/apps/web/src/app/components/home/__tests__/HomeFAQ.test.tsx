import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeFAQ } from '../HomeFAQ';

describe('HomeFAQ & Support Automation', () => {
  it('renders FAQ section with search and categories', () => {
    render(<HomeFAQ />);

    expect(screen.getByText(/Часті запитання та Підтримка/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Пошук по запитаннях/i)).toBeInTheDocument();
    expect(screen.getByText(/Як записатися на стрижку\?/i)).toBeInTheDocument();
  });

  it('filters FAQs by search query', () => {
    render(<HomeFAQ />);

    const searchInput = screen.getByPlaceholderText(/Пошук по запитаннях/i);
    fireEvent.change(searchInput, { target: { value: 'кешбек' } });

    expect(screen.getByText(/Як працює кешбек та бонусна програма\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/Як записатися на стрижку\?/i)).not.toBeInTheDocument();
  });

  it('opens live concierge chat and responds to messages', async () => {
    render(<HomeFAQ />);

    const chatButton = screen.getByText(/Живий консьєрж/i);
    fireEvent.click(chatButton);

    expect(screen.getByText(/Онлайн-підтримка FADE/i)).toBeInTheDocument();

    const chatInput = screen.getByPlaceholderText(/Напишіть ваше запитання/i);
    const sendButton = screen.getByText(/Надіслати/i);

    fireEvent.change(chatInput, { target: { value: 'яка знижка для новачків?' } });
    fireEvent.click(sendButton);

    expect(screen.getByText(/яка знижка для новачків\?/i)).toBeInTheDocument();
  });

  it('allows voting on FAQ helpfulness', () => {
    render(<HomeFAQ />);

    const yesButtons = screen.getAllByText(/👍 Так/i);
    const yesButton = yesButtons[0];
    expect(yesButton).toBeDefined();
    if (!yesButton) return;

    fireEvent.click(yesButton);

    expect(screen.getByText(/Дякуємо за відгук! ✦/i)).toBeInTheDocument();
  });
});
