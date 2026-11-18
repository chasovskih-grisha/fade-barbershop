import { cn } from './cn';
import { OTP_LENGTH, useOtpInput } from './use-otp-input';

/** Класи комірки: базові + колір рамки (помилка/лінія). */
const CELL_CLASS = (error?: string) =>
  // prettier-ignore
  cn('h-12 w-10 rounded-input border bg-surface-sunken text-center text-h4 text-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-semantic-danger' : 'border-line');

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput(props: OtpInputProps) {
  // prettier-ignore
  const { value, onChange, onComplete, label = 'Код з SMS', error, disabled, autoFocus, className } = props;
  const { errorId, refs, handleChange, handleKeyDown, handlePaste } = useOtpInput(
    value,
    onChange,
    onComplete
  );

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-caption font-medium text-fg-secondary">{label}</span>
      <div role="group" aria-label={label} className="flex gap-2">
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={value[index] ?? ''}
            onChange={(event) => handleChange(index)(event.target.value)}
            onKeyDown={handleKeyDown(index)}
            onPaste={handlePaste(index)}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            aria-label={`Цифра ${index + 1} з ${OTP_LENGTH}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={CELL_CLASS(error)}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
