import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorState } from '../ErrorState';
import mockStates from '../../../../../messages/uk/states.json';

// Тексти стану помилки — з каталогу `states` (T-4612b), тому next-intl замокано.

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (mockStates as Record<string, string>)[key] ?? key,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

describe('ErrorState', () => {
  it('renders error message, retry action, and support concierge link', () => {
    render(<ErrorState message="Помилка з'єднання з базою даних" />);

    expect(screen.getByText('Не вдалося завантажити дані')).toBeDefined();
    expect(screen.getByText("Помилка з'єднання з базою даних")).toBeDefined();
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeDefined();

    const supportLink = screen.getByRole('link', { name: /Звернутися до підтримки в Telegram/i });
    expect(supportLink).toBeDefined();
    expect(supportLink.getAttribute('href')).toBe('https://t.me/fade_support_bot');
  });
});
