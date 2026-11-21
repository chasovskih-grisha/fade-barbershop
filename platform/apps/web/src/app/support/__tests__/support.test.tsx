import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SupportCenterPage from '../page';

describe('SupportCenterPage', () => {
  it('renders support center header and concierge touchpoints', () => {
    render(<SupportCenterPage />);
    expect(screen.getByText('Центр підтримки FADE')).toBeDefined();
    expect(screen.getByText('Telegram-консьєрж')).toBeDefined();
    expect(screen.getByText('Телефон підтримки')).toBeDefined();
  });

  it('filters FAQ items based on search query', () => {
    render(<SupportCenterPage />);
    const searchInput = screen.getByPlaceholderText(/Пошук запитань/i);
    fireEvent.change(searchInput, { target: { value: 'кешбек' } });
    expect(screen.getByText(/Як працює кешбек та програма лояльності/i)).toBeDefined();
  });

  it('allows copying support phone number', () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<SupportCenterPage />);
    const copyButton = screen.getByRole('button', { name: /Копіювати/i });
    fireEvent.click(copyButton);
    expect(writeTextMock).toHaveBeenCalledWith('+380443334455');
    expect(screen.getByText(/Скопійовано ✓/i)).toBeDefined();
  });

  it('allows voting on FAQ helpfulness', () => {
    render(<SupportCenterPage />);
    const yesButtons = screen.getAllByRole('button', { name: /👍 Так/i });
    fireEvent.click(yesButtons[0]!);
    expect(screen.getByText(/Дякуємо за відгук!/i)).toBeDefined();
  });

  it('renders interactive diagnostic wizard and shows advice on scenario click', () => {
    render(<SupportCenterPage />);
    expect(screen.getByText('Експрес-діагностика та вирішення питань')).toBeDefined();
    const scenarioButton = screen.getByText('⏳ Я запізнююся на візит');
    fireEvent.click(scenarioButton);
    expect(screen.getByText(/Якщо запізнення становить менше 15 хвилин/i)).toBeDefined();
  });

  it('renders AI concierge chat simulator and allows sending messages', async () => {
    render(<SupportCenterPage />);
    expect(screen.getByText('Миттєвий чат підтримки FADE')).toBeDefined();
    const quickPrompt = screen.getByRole('button', { name: /Як скасувати запис\?/i });
    fireEvent.click(quickPrompt);
    expect(
      await screen.findByText(/Ви можете безкоштовно скасувати або перенести запис/i)
    ).toBeDefined();
  });

  it('allows requesting an instant callback', () => {
    render(<SupportCenterPage />);
    expect(screen.getByText('Експрес-дзвінок адміністратору')).toBeDefined();
    const phoneInput = screen.getByPlaceholderText(/Введіть ваш телефон/i);
    fireEvent.change(phoneInput, { target: { value: '+380501112233' } });
    const submitBtn = screen.getByRole('button', { name: /Передзвонити мені 📞/i });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Запит на зворотний дзвінок прийнято!/i)).toBeDefined();
  });

  it('allows tracking support ticket status', () => {
    render(<SupportCenterPage />);
    expect(screen.getByText('Перевірити статус звернення (Ticket Tracker)')).toBeDefined();
    const trackerInput = screen.getByPlaceholderText(/Номер звернення або телефон/i);
    fireEvent.change(trackerInput, { target: { value: 'TICK-1042' } });
    const trackBtn = screen.getByRole('button', { name: /Перевірити статус 🔍/i });
    fireEvent.click(trackBtn);
    expect(screen.getByText(/Звернення: TICK-1042/i)).toBeDefined();
    expect(screen.getByText(/В обробці консьєржем/i)).toBeDefined();
  });

  it('allows rating support satisfaction (CSAT)', () => {
    render(<SupportCenterPage />);
    expect(screen.getByText('Оцініть якість підтримки FADE')).toBeDefined();
    const starBtn = screen.getByRole('button', { name: /5★/i });
    fireEvent.click(starBtn);
    const submitCsatBtn = screen.getByRole('button', { name: /Надіслати відгук 🌟/i });
    fireEvent.click(submitCsatBtn);
    expect(screen.getByText(/Дякуємо за вашу оцінку!/i)).toBeDefined();
  });
});
