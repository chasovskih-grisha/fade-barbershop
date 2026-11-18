import { useId } from 'react';
import { cn } from './cn';
import { Checkbox } from './Checkbox';

export interface PhotoUploadProps {
  label: string;
  onSelect: (file: File) => void;
  previewUrl?: string | undefined;
  consent?: boolean | undefined;
  onConsentChange?: ((checked: boolean) => void) | undefined;
  consentLabel?: string | undefined;
  error?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function PhotoUpload({
  label,
  onSelect,
  previewUrl,
  consent = false,
  onConsentChange,
  consentLabel = 'Дозволяю обробку фото',
  error,
  disabled,
  className,
}: PhotoUploadProps) {
  const inputId = useId();
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="h-32 w-32 rounded-card object-cover" />
      ) : null}
      <label
        htmlFor={inputId}
        className={cn(
          'flex h-11 items-center justify-center rounded-input border px-3 text-body text-fg',
          'bg-surface-sunken hover:bg-interactive focus-within:ring-2 focus-within:ring-accent-blue',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          error ? 'border-semantic-danger' : 'border-line'
        )}
      >
        {label}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          disabled={disabled}
          aria-describedby={errorId}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
          }}
        />
      </label>
      {onConsentChange ? (
        <Checkbox
          label={consentLabel}
          checked={consent}
          onChange={(event) => onConsentChange(event.target.checked)}
        />
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
