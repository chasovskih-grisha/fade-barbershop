import Image from 'next/image';
import markDark from '@fade/brand-assets/assets/mark-fa-on-dark.svg';
import { assetUrl } from '@/lib/asset-url';
import type { LocationLogo as LocationLogoDto } from '@/lib/api/locations';

// Знак локації (T-4609). Фолбек один: локація без логотипа показує нічний
// мережевий `mark-fa-on-dark.svg`, а не порожню діру. `alt` з моделі —
// логотип несе зміст, тож не `aria-hidden`; порожній `alt` замінюємо на назву.

const FALLBACK_SRC = typeof markDark === 'string' ? markDark : assetUrl(markDark);

interface Props {
  logo: LocationLogoDto | null;
  /** Назва локації — фолбек для `alt` і `aria-label`. */
  name: string;
  /** Розмір логотипа: `card` для списку, `hero` для детальної сторінки. */
  size?: 'card' | 'hero';
}

/** Висота і ширина фіксовані (без CLS). Файли локацій — довільні пропорції,
 * тому `object-contain` зберігає силует у межах заданого боксу. */
const BOX = {
  card: { width: 96, height: 40, className: 'h-10 w-24' },
  hero: { width: 160, height: 64, className: 'h-16 w-40' },
} as const;

export function LocationLogo({ logo, name, size = 'card' }: Props) {
  const box = BOX[size];
  const alt = logo?.alt?.trim() ? logo.alt : `Логотип ${name}`;

  if (!logo) {
    return (
      <Image
        src={FALLBACK_SRC}
        alt={alt}
        width={box.width}
        height={box.height}
        className={`${box.className} object-contain`}
      />
    );
  }

  // Темна тема — `darkUrl`, інакше світлий файл. `<picture>` дає вибір джерела
  // без клієнтського JS і без залежності від prefers-color-scheme у JS.
  return (
    <picture>
      {logo.darkUrl && <source srcSet={logo.darkUrl} media="(prefers-color-scheme: dark)" />}
      <img
        src={logo.lightUrl}
        alt={alt}
        width={box.width}
        height={box.height}
        loading="lazy"
        className={`${box.className} object-contain`}
      />
    </picture>
  );
}
