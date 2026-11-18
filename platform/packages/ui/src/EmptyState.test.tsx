import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('рендерить заголовок, опис і дію', () => {
    render(
      <EmptyState
        title="Немає слотів"
        description="Спробуйте іншу дату"
        action={<button type="button">У лист очікування</button>}
      />
    );
    expect(screen.getByText('Немає слотів')).toBeTruthy();
    expect(screen.getByText('Спробуйте іншу дату')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'У лист очікування' })).toBeTruthy();
  });

  it('рендерить лише заголовок без опису та дії', () => {
    render(<EmptyState title="Порожньо" />);
    expect(screen.getByText('Порожньо')).toBeTruthy();
  });

  it('рендерить з іконкою через iconName', () => {
    render(<EmptyState title="Порожньо" iconName="calendar" />);
    expect(screen.getByText('Порожньо')).toBeTruthy();
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('рендерить з кастомною іконкою через icon', () => {
    render(<EmptyState title="Порожньо" icon={<span data-testid="custom-icon">✨</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('прокидує HTML атрибути', () => {
    render(<EmptyState title="Тест" data-testid="empty-test" />);
    expect(screen.getByTestId('empty-test')).toBeTruthy();
  });

  it('підтримує розміри (sm, md, lg)', () => {
    const { rerender } = render(<EmptyState title="Розмір" size="sm" data-testid="empty-size" />);
    expect(screen.getByTestId('empty-size').className).toContain('p-6');

    rerender(<EmptyState title="Розмір" size="lg" data-testid="empty-size" />);
    expect(screen.getByTestId('empty-size').className).toContain('p-12');
  });
});
