import Image from 'next/image';

// T-4871a: один портрет для картки майстра й профілю. Кадр 4/5 тримає
// пропорцію навіть без фото (ініціали — фолбек T-4610b), фото видно повністю:
// без градієнтної вуалі, без синього світіння й без збільшення на hover, тож
// рух не потрібен узагалі (prefers-reduced-motion задоволене за побудовою).

interface BarberPortraitProps {
  name: string;
  photoUrl?: string | null | undefined;
  /** Розміри для next/image: картка й профіль мають різну ширину. */
  sizes?: string;
  className?: string;
}

export function BarberPortrait({
  name,
  photoUrl,
  sizes = '(max-width: 768px) 100vw, 300px',
  className = '',
}: BarberPortraitProps) {
  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden bg-interactive flex items-center justify-center ${className}`.trim()}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={sizes} className="object-cover" />
      ) : (
        <span
          role="img"
          aria-label={`Портрет ${name}`}
          className="text-h1 text-fg-muted font-display"
        >
          {name[0]}
        </span>
      )}
    </div>
  );
}
