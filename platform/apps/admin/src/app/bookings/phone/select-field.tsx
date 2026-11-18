'use client';

// Селект форми візиту (T-4409): лейбл, плейсхолдер і стан довідників однакові
// для локації/барбера/дати — спільна презентаційна обгортка замість копіпасти.
import type { ChangeEventHandler, ReactNode } from 'react';
import type { RefsState } from './useVisitRefs';

export function SelectField({
  id,
  label,
  empty,
  refsState,
  value,
  onChange,
  disabled = false,
  children,
}: {
  id: string;
  label: string;
  /** Плейсхолдер, коли довідники завантажені («Оберіть локацію»). */
  empty: string;
  refsState: RefsState;
  /** Лише дата контрольована; локація/барбер — неконтрольовані (undefined). */
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  /** Послуга заблокована, доки не обрано локацію (T-4738b). */
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <label className="block mb-2" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        className="border rounded px-3 py-2 w-full mb-3"
        disabled={refsState !== 'ready' || disabled}
        required
        value={value}
        onChange={onChange}
      >
        <option value="">{refsState === 'loading' ? 'Завантаження…' : empty}</option>
        {children}
      </select>
    </>
  );
}
