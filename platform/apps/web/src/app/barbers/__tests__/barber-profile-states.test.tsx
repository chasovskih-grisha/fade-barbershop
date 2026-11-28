import { fireEvent, render, screen } from '@testing-library/react';
import BarbersErrorBoundary from '../error';
import ProfileLoading from '../[slug]/loading';

// T-4864: скелет профілю має ширину профілю, а помилка — одну мову, без слеша
// й без згадки телеметрії. Тест рендерить справжній loading сегмента й
// справжній error boundary.

describe('Barber profile states (T-4864)', () => {
  it('the skeleton uses the profile column and keeps the breadcrumb', () => {
    render(<ProfileLoading />);

    const root = screen.getByTestId('barber-profile-loading');
    expect(root.className).toContain('max-w-container');
    expect(root.className).toContain('flex-col');
    expect(screen.getByRole('navigation', { name: 'Навігаційний ланцюжок' })).toBeInTheDocument();
  });

  it('the error speaks Ukrainian only and offers a retry', () => {
    const reset = jest.fn();
    render(<BarbersErrorBoundary error={new Error('boom')} reset={reset} />);

    expect(
      screen.getByRole('heading', { name: 'Не вдалося завантажити майстрів' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not name telemetry or the raw error, and has no second language', () => {
    const { container } = render(
      <BarbersErrorBoundary error={new Error('raw failure detail')} reset={jest.fn()} />
    );

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/телеметрі/i);
    expect(text).not.toMatch(/raw failure detail/);
    expect(text).not.toContain('/');
    expect(text).not.toMatch(/Try again|Error/i);
  });
});
