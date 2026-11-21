import { cn } from './cn';

export interface StepIndicatorProps {
  steps: string[];
  current: number;
  className?: string;
  /**
   * Optional accessible label for the step indicator list.
   * Defaults to 'Booking steps' or Ukrainian equivalent if not provided.
   */
  'aria-label'?: string;
}

export function StepIndicator({
  steps,
  current,
  className,
  'aria-label': ariaLabel = 'Кроки запису',
}: StepIndicatorProps) {
  return (
    <ol aria-label={ariaLabel} className={cn('flex items-center gap-1.5', className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center">
            <span
              aria-current={active ? 'step' : undefined}
              role={active ? 'status' : undefined}
              aria-label={`${index + 1} з ${steps.length}: ${step}${done ? ' (виконано)' : active ? ' (поточний)' : ''}`}
              className={cn(
                'block h-1.5 rounded-full transition-all duration-200',
                active
                  ? 'w-8 bg-amber-500 shadow-sm'
                  : done
                    ? 'w-4 bg-zinc-400'
                    : 'w-4 bg-zinc-200 dark:bg-zinc-800'
              )}
            >
              <span className="sr-only">{step}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
