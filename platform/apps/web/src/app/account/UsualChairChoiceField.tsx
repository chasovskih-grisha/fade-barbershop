'use client';

import { Field } from '@fade/ui';
import {
  EMPTY_CHOICE_LABEL,
  UNAVAILABLE_CHOICE_LABEL,
  selectedValue,
  type ChairOption,
} from './usual-chair';

const selectClass =
  'h-11 w-full rounded-input border border-line bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

/**
 * Одне поле звичного місця (T-4725b): «Не обрано» — справжній пункт списку, а
 * зниклий id не підмінюється першим — під полем стоїть «Більше не доступно».
 */
export function UsualChairChoiceField({
  id,
  label,
  options,
  value,
  unavailable,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  options: ChairOption[];
  value: string | null;
  unavailable: boolean;
  disabled?: boolean | undefined;
  onChange: (id: string | null) => void;
}) {
  return (
    <>
      <Field id={id} label={label}>
        <select
          id={id}
          className={selectClass}
          value={selectedValue(options, value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value || null)}
        >
          <option value="">{EMPTY_CHOICE_LABEL}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>
      {unavailable && (
        <p data-testid={`${id}-unavailable`} className="text-body-s text-fg-muted">
          {UNAVAILABLE_CHOICE_LABEL}
        </p>
      )}
    </>
  );
}
