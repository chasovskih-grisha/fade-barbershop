/* eslint-disable complexity, max-lines */
import { useId, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from './cn';
import { Field } from './Field';
import { messageIds } from './fieldUtils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps {
  id?: string;
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  className?: string;
}

export function Select({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Виберіть...',
  help,
  error,
  disabled,
  loading,
  required,
  className,
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const listboxId = `${selectId}-listbox`;
  const { describedBy } = messageIds(selectId, help, error);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIdx = options.findIndex((opt) => opt.value === value);
          setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
        } else if (activeIndex >= 0 && options[activeIndex] && !options[activeIndex].disabled) {
          onChange?.(options[activeIndex].value);
          setIsOpen(false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        if (isOpen) setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (isOpen) setActiveIndex(options.length - 1);
        break;
    }
  };

  return (
    <Field
      id={selectId}
      label={label}
      help={help}
      error={error}
      required={required}
      className={className}
    >
      <div ref={containerRef} className="relative">
        <button
          id={selectId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled || loading}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-input border bg-surface-sunken px-3 text-body text-fg transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
            error ? 'border-semantic-danger' : 'border-line',
            (disabled || loading) && 'cursor-not-allowed opacity-50'
          )}
        >
          <span className={cn(!selectedOption && 'text-fg-muted')}>
            {loading ? 'Завантаження...' : selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none text-fg-muted">▼</span>
        </button>

        {isOpen && !disabled && !loading && (
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-input border border-line bg-surface-base shadow-lg"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              const optionId = `${selectId}-option-${index}`;
              return (
                <li
                  key={option.value}
                  id={optionId}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange?.(option.value);
                      setIsOpen(false);
                    }
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-body text-fg transition-colors',
                    isSelected && 'bg-accent/10 font-medium text-accent',
                    isActive && 'bg-surface-sunken',
                    option.disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Field>
  );
}
