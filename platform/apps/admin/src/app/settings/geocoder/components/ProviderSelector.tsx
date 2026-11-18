'use client';

interface Props {
  settings: {
    provider: 'nominatim' | 'google';
    googleConfigured: boolean;
  };
  saving: boolean;
  onChange: (provider: 'nominatim' | 'google') => void;
}

const PROVIDERS = [
  {
    value: 'nominatim' as const,
    label: 'Nominatim (OpenStreetMap)',
    hint: 'Безкоштовний, без ключа. Ліміт політики — 1 запит/сек; ліміти та кеш застосовуються автоматично.',
  },
  {
    value: 'google' as const,
    label: 'Google Geocoding',
    hint: 'Потребує GOOGLE_MAPS_API_KEY у середовищі API. Вища якість, платно за запит.',
  },
];

export function ProviderSelector({ settings, saving, onChange }: Props) {
  return (
    <section className="flex flex-col gap-3" aria-label="Провайдер геокодування">
      {PROVIDERS.map((p) => {
        const selected = settings.provider === p.value;
        const disabled = p.value === 'google' && !settings.googleConfigured;
        return (
          <label
            key={p.value}
            className={`flex cursor-pointer flex-col gap-1 rounded-card border p-4 transition-colors ${
              selected
                ? 'border-accent-blue bg-interactive'
                : 'border-line bg-surface-raised hover:bg-interactive'
            } ${disabled ? 'opacity-60' : ''}`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="geocoder-provider"
                value={p.value}
                checked={selected}
                disabled={disabled || saving}
                onChange={() => void onChange(p.value)}
                className="accent-accent-blue"
              />
              <span className="font-semibold text-h4">{p.label}</span>
              {p.value === 'google' && !settings.googleConfigured && (
                <span className="text-sm text-fg-secondary">ключ не задано в API</span>
              )}
              {selected && <span className="text-sm text-accent-blue">активний</span>}
            </span>
            <span className="pl-8 text-sm text-fg-secondary">{p.hint}</span>
          </label>
        );
      })}
    </section>
  );
}
