import { render, screen } from '@testing-library/react';
import { Skeleton, type SkeletonVariant } from './Skeleton';

describe('Skeleton', () => {
  it('прихований від скрін-рідерів за замовчуванням', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton').getAttribute('aria-hidden')).toBe('true');
  });

  it('підтримує aria-label та role status, якщо передано', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Завантаження профілю" />);
    const el = screen.getByTestId('skeleton');
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('Завантаження профілю');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('застосовує клас кожного варіанта', () => {
    const expected: Record<SkeletonVariant, string> = {
      text: 'rounded-micro',
      circle: 'rounded-pill',
      rect: 'rounded-card',
    };
    for (const [variant, className] of Object.entries(expected)) {
      const { unmount } = render(
        <Skeleton variant={variant as SkeletonVariant} data-testid="skeleton" />
      );
      expect(screen.getByTestId('skeleton').className).toContain(className);
      unmount();
    }
  });

  it('підтримує параметр animate=false', () => {
    render(<Skeleton data-testid="skeleton" animate={false} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.className).not.toContain('animate-pulse');
  });

  it('прокидає className', () => {
    render(<Skeleton data-testid="skeleton" className="w-32" />);
    expect(screen.getByTestId('skeleton').className).toContain('w-32');
  });
});
