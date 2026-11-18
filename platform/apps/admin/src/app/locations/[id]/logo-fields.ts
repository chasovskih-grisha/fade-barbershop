// Типи й клієнтська валідація секції «Логотип» (T-4609a): дзеркалять доменні
// правила domain/location-logo.ts (alt обов'язковий ≤120, світле поле
// обов'язкове, variant лише mark|lockup) — інакше форма пропустить те, що
// сервер відкине (400).

export type LogoVariant = 'mark' | 'lockup';

/** DTO логотипа з API (admin-locations.dto.ts, LocationLogoDto). */
export interface LocationLogoDto {
  variant: LogoVariant;
  lightUrl: string;
  darkUrl: string | null;
  alt: string;
}

export const LOGO_VARIANTS: { value: LogoVariant; label: string }[] = [
  { value: 'mark', label: 'Mark — лише знак' },
  { value: 'lockup', label: 'Lockup — знак і назва' },
];

/** Перше порушення правил логотипа або null. */
export function validateLogo(input: {
  light: File | null;
  variant: string;
  alt: string;
}): string | null {
  if (!input.light) return 'Потрібне зображення для світлого поля (light).';
  const alt = input.alt.trim();
  if (alt.length === 0) return 'Alt-текст обовʼязковий: лого несе зміст для скринрідера.';
  if (alt.length > 120) return 'Alt-текст має бути не довшим за 120 символів.';
  if (!LOGO_VARIANTS.some((option) => option.value === input.variant)) {
    return 'Оберіть варіант логотипа.';
  }
  return null;
}
