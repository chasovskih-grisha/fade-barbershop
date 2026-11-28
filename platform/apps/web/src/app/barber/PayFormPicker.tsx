'use client';

import { Field } from '@fade/ui';
import type { BarberOnsiteForm } from '@/lib/api/barber-onsite';

interface PayFormPickerProps {
  form: BarberOnsiteForm;
  disabled: boolean;
  onChange: (form: BarberOnsiteForm) => void;
}

const FORMS: Array<{ value: BarberOnsiteForm; label: string }> = [
  { value: 'cash', label: 'Готівка' },
  { value: 'pos', label: 'Картка POS' },
];

/** Готівка / картка POS — єдина форма, яку барбер обирає на місці (PAY-ONS-01). */
export function PayFormPicker({ form, disabled, onChange }: PayFormPickerProps) {
  return (
    <Field id="onsite-form" label="Спосіб оплати" required>
      <div className="flex flex-col gap-2 mt-1">
        {FORMS.map((option) => {
          const selected = form === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex items-center gap-2 text-body w-fit rounded-lg px-3 py-2 border ${
                selected
                  ? 'border-semantic-success bg-semantic-success/10 text-semantic-success'
                  : 'border-outline text-fg-default hover:bg-fg-default/5'
              }`}
              onClick={() => onChange(option.value)}
              disabled={disabled}
            >
              <span
                className={`inline-block w-4 h-4 rounded-full border-2 ${
                  selected ? 'bg-semantic-success border-semantic-success' : 'border-amber-400'
                }`}
              />
              {option.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
