// Логотип локації (T-4609a): варіант mark|lockup, пара полів milk/dark, alt.
// Правило пари (design-system §Типографіка): on-dark без on-milk непридатний —
// darkKey без lightKey → помилка. `alt` обов'язковий: лого несе зміст для
// скринрідера, це не декорація (WCAG). Зберігаються об'єктні ключі бакета;
// публічні URL рахуються з них на межі (порт PublicMediaStorage.publicUrl).

export const LOCATION_LOGO_VARIANTS = ['mark', 'lockup'] as const;
export type LocationLogoVariant = (typeof LOCATION_LOGO_VARIANTS)[number];

export interface LocationLogo {
  locationId: string;
  variant: LocationLogoVariant;
  /** Об'єкт світлого (milk) поля; обов'язковий. */
  lightKey: string;
  /** Об'єкт темного (ink) поля; опціональний — без нього темна тема бере light. */
  darkKey: string | null;
  alt: string;
  updatedAt: Date;
}

export class InvalidLocationLogoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLocationLogoError';
  }
}

/** Будує модель логотипа; кидає InvalidLocationLogoError на порушеннях правил. */
export function buildLocationLogo(props: {
  locationId: string;
  variant: string;
  lightKey: string;
  darkKey: string | null;
  alt: string;
  updatedAt: Date;
}): LocationLogo {
  const alt = props.alt.trim();
  if (alt.length === 0) throw new InvalidLocationLogoError('Alt text is required');
  if (alt.length > 120) throw new InvalidLocationLogoError('Alt text must be ≤ 120 characters');
  if (!(LOCATION_LOGO_VARIANTS as readonly string[]).includes(props.variant)) {
    throw new InvalidLocationLogoError(`Unknown logo variant: ${props.variant}`);
  }
  const lightKey = props.lightKey.trim();
  // On-dark без on-milk непридатний: темне поле може існувати лише зі світлим.
  if (lightKey.length === 0 && props.darkKey) {
    throw new InvalidLocationLogoError('Dark logo cannot exist without the light one');
  }
  if (lightKey.length === 0) throw new InvalidLocationLogoError('Light logo is required');
  return {
    locationId: props.locationId,
    variant: props.variant as LocationLogoVariant,
    lightKey,
    darkKey: props.darkKey?.trim() || null,
    alt,
    updatedAt: props.updatedAt,
  };
}
