import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';
import { Field } from './Field';
import { messageIds } from './fieldUtils';
import { formatPhoneInput, toE164 } from './phone';

export interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  label: string;
  value: string;
  onValueChange: (e164: string) => void;
  help?: string;
  error?: string;
}

export function PhoneInput({
  id,
  label,
  value,
  onValueChange,
  help,
  error,
  className,
  ...input
}: PhoneInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const { describedBy } = messageIds(inputId, help, error);
  return (
    <Field
      id={inputId}
      label={label}
      help={help}
      error={error}
      required={input.required}
      className={className}
    >
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+38 (0__) ___-__-__"
        value={formatPhoneInput(value)}
        onChange={(event) => onValueChange(toE164(event.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 w-full rounded-input border bg-surface-sunken px-3 text-body text-fg transition-colors',
          'placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
          error ? 'border-semantic-danger' : 'border-line'
        )}
        {...input}
      />
    </Field>
  );
}
