'use client';

// Поля адреси локації: спільні для create (поки лише create). Типізовані
// props без any; label'и вбудовані, як в решті форм адмінки.
export interface LocationFormValues {
  code: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  phone: string;
}

export default function LocationFormFields({
  values,
  onChange,
}: {
  values: LocationFormValues;
  onChange: (patch: Partial<LocationFormValues>) => void;
}) {
  const field = (
    key: keyof LocationFormValues,
    label: string,
    extra?: Record<string, string | number | boolean>
  ) => (
    <label>
      {label}
      <input
        value={values[key]}
        onChange={(event) => onChange({ [key]: event.target.value })}
        className="mt-1 block rounded-input border border-line p-2"
        {...extra}
      />
    </label>
  );

  return (
    <>
      {field('code', 'Код', { placeholder: 'KYY-01', required: true })}
      {field('name', 'Назва', { placeholder: 'FADE Сіті Лейк', required: true })}
      {field('address', 'Адреса', { placeholder: 'пров. Ювілейний 2/1', required: true })}
      <div className="grid grid-cols-2 gap-4">
        {field('lat', 'Широта', { type: 'number', step: 'any', required: true })}
        {field('lng', 'Довгота', { type: 'number', step: 'any', required: true })}
      </div>
      {field('phone', 'Телефон (необов’язково)', { type: 'tel' })}
    </>
  );
}
