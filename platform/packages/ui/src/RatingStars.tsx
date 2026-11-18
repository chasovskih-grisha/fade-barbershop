import { Icon } from './Icon';
import { cn } from './cn';

const STARS = [1, 2, 3, 4, 5];

export interface RatingStarsProps {
  value: number;
  onChange?: ((value: number) => void) | undefined;
  label?: string | undefined;
  className?: string | undefined;
}

export function RatingStars({ value, onChange, label = 'Оцінка', className }: RatingStarsProps) {
  const readOnly = !onChange;
  return (
    <div
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${label}: ${value} з 5` : label}
      className={cn('flex items-center gap-1', className)}
    >
      {STARS.map((star) => {
        const filled = star <= value;
        const content = (
          <Icon name="star" size={24} className={filled ? 'text-fg' : 'text-fg-muted'} />
        );
        if (readOnly) {
          return (
            <span key={star} className={filled ? 'text-fg' : 'text-fg-muted'}>
              {content}
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} з 5`}
            onClick={() => onChange(star)}
            className={cn(
              'rounded-micro p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
              filled ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary'
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
