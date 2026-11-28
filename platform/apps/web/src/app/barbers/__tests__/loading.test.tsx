import { render, screen } from '@testing-library/react';
import Loading from '../loading';

// T-4856: `/barbers` отримує скелет своєї форми — сітка портретних карток у
// тій самій ширині, що й сторінка, без блоків статистики, яких на ній немає.

describe('Стан завантаження майстрів (T-4856)', () => {
  it('тримає ширину списку й показує щонайменше три портретні картки', () => {
    render(<Loading />);

    const page = screen.getByTestId('barbers-loading');
    expect(page.className).toContain('max-w-container');
    expect(screen.getByTestId('barbers-skeleton').className).toContain('sm:grid-cols-2');
    expect(screen.getAllByTestId('barbers-skeleton-card').length).toBeGreaterThanOrEqual(3);
  });

  it('не показує блоків статистики, яких на сторінці немає', () => {
    const { container } = render(<Loading />);

    expect(container.textContent).toBe('');
    expect(container.querySelector('[data-testid="barbers-highlights"]')).toBeNull();
  });
});
