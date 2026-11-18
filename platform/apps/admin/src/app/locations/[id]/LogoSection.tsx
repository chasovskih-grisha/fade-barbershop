'use client';

// Секція «Логотип» локації (T-4609a): збереження партнерського лого — світлий
// (light) і опціонально темний (dark) ключі в публічний бакет location-brand,
// код variant (mark/lockup) і alt для скринрідера. alt обов'язковий — лого несе
// зміст, це не декорація (WCAG), тому і портативні клієнти бачать опис.

import { useId, useState } from 'react';
import type { LogoVariant, LocationLogoDto } from './logo-fields';
import { validateLogo } from './logo-fields';
import { LogoSectionForm } from './logo-section-form';
import { useLogo } from './use-logo';

interface Props {
  locationId: string;
  logo: LocationLogoDto | null;
  onSave: () => void;
  onRemove: () => void;
}

export default function LogoSection({ locationId, logo, onSave, onRemove }: Props) {
  const [variant, setVariant] = useState<LogoVariant>(logo?.variant ?? 'lockup');
  const [light, setLight] = useState<File | null>(null);
  const [dark, setDark] = useState<File | null>(null);
  const [lightPreview, setLightPreview] = useState<string | undefined>(logo?.lightUrl);
  const [darkPreview, setDarkPreview] = useState<string | undefined>(logo?.darkUrl ?? undefined);
  const [alt, setAlt] = useState(logo?.alt ?? '');
  const [clientError, setClientError] = useState<string | null>(null);
  const { upload, remove, saving, deleting, error, notice } = useLogo(locationId, logo);
  const altId = useId();
  const busy = saving || deleting;

  const reset = () => {
    setVariant(logo?.variant ?? 'lockup');
    setLight(null);
    setDark(null);
    setLightPreview(logo?.lightUrl);
    setDarkPreview(logo?.darkUrl ?? undefined);
    setAlt(logo?.alt ?? '');
    setClientError(null);
  };

  const handleRemove = () => {
    void remove().then(() => {
      reset();
      onRemove();
    });
  };

  const handleSave = () => {
    const violation = validateLogo({ light, variant, alt });
    if (violation) {
      setClientError(violation);
      return;
    }
    setClientError(null);
    void upload({ light: light as File, dark, variant, alt }).then((ok) => {
      if (!ok) return;
      setLight(null);
      setDark(null);
      onSave();
    });
  };

  return (
    <LogoSectionForm
      logo={Boolean(logo)}
      busy={busy}
      variant={variant}
      lightPreview={lightPreview}
      darkPreview={darkPreview}
      alt={alt}
      altId={altId}
      error={error}
      clientError={clientError}
      notice={notice}
      onVariant={setVariant}
      onLight={(file) => {
        setLight(file);
        setLightPreview(URL.createObjectURL(file));
      }}
      onDark={(file) => {
        setDark(file);
        setDarkPreview(URL.createObjectURL(file));
      }}
      onAlt={setAlt}
      onRemove={handleRemove}
      onSave={handleSave}
      onReset={reset}
    />
  );
}
