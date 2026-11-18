import { cn } from './cn';

export interface ProgressBarProps {
  value: number;
  total?: number;
  label?: string;
  className?: string;
  /**
   * Optional custom aria-valuetext for screen readers (e.g. "4 з 7 відвідин")
   */
  ariaValueText?: string;
}

export function ProgressBar({
  value,
  total = 7,
  label = 'Прогрес лояльності',
  className,
  ariaValueText,
}: ProgressBarProps) {
  const filled = Math.max(0, Math.min(value, total));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuetext={ariaValueText ?? `${filled} з ${total}`}
      className={cn('flex items-center gap-1', className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const isFilled = index < filled;
        const isReward = index === total - 1;
        return (
          <span
            key={index}
            className={cn(
              'h-2 flex-1 rounded-pill transition-colors duration-200',
              isFilled
                ? isReward
                  ? 'bg-fg'
                  : 'bg-fg-secondary'
                : isReward
                  ? 'border border-line-strong'
                  : 'bg-interactive'
            )}
          />
        );
      })}
    </div>
  );
}
