import { render, screen } from '@testing-library/react';
import { ChatBubble } from './ChatBubble';

describe('ChatBubble', () => {
  it('вирівнює повідомлення клієнта праворуч та має правильну доступність', () => {
    render(<ChatBubble author="client" text="Вітаю" />);
    const bubble = screen.getByRole('article', { name: 'Повідомлення клієнта' });
    expect(bubble).toBeDefined();
    expect(bubble.className).toContain('self-end');
  });

  it('вирівнює повідомлення майстра ліворуч та має правильну доступність', () => {
    render(<ChatBubble author="staff" text="Добрий день" />);
    const bubble = screen.getByRole('article', { name: 'Повідомлення майстра' });
    expect(bubble).toBeDefined();
    expect(bubble.className).toContain('self-start');
  });

  it('системне повідомлення по центру з часом та має правильну доступність', () => {
    render(<ChatBubble author="system" text="Запис підтверджено" time="10:00" />);
    const bubble = screen.getByRole('article', { name: 'Системне повідомлення' });
    expect(bubble).toBeDefined();
    expect(bubble.className).toContain('self-center');
    expect(screen.getByText('10:00')).toBeTruthy();
  });
});
