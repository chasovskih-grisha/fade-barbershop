import Link from 'next/link';
import { Card } from '@fade/ui';
import { BarberPortrait } from './BarberPortrait';

// T-4851a: картка майстра каже лише те, що знає запис. Немає ні дефолтних
// спеціалізацій, ні «6+ років досвіду», ні бейджів «Вільні вікна сьогодні» /
// «Експерт Fade»: однакова обіцянка на кожній картці — не вибір. Картка з
// самим лише ім'ям — валідна картка.

const cleanText = (value: string | null | undefined): string => (value ?? '').trim();

// Одна спеціалізація — один чип: пробіли й дублі в записі не мають виглядати
// як друга навичка, а порожній рядок — як факт.
const uniqueTexts = (values: Array<string | null | undefined>): string[] => [
  ...new Set(values.map(cleanText).filter(Boolean)),
];

interface BarberCardProps {
  id: string;
  slug: string;
  name: string;
  role?: string | null | undefined;
  photoUrl?: string | null | undefined;
  specialties?: string[] | null | undefined;
  experience?: string | null | undefined;
  portfolioThumbUrl?: string | null | undefined;
  /** Студії людини (T-4852a). Одна студія — заголовок групи вже її називає. */
  studios?: string[] | undefined;
}

export function BarberCard({
  id: _id,
  slug,
  name,
  role,
  photoUrl,
  specialties,
  experience,
  portfolioThumbUrl,
  studios,
}: BarberCardProps) {
  const facts = uniqueTexts([role, experience]);
  const chips = uniqueTexts(specialties ?? []);

  return (
    <Link href={`/barbers/${slug}`} aria-label={name} className="group block">
      <Card className="flex flex-col h-full overflow-hidden transition-colors group-hover:border-accent border-line bg-surface">
        <BarberPortrait name={name} photoUrl={photoUrl} />

        <div className="p-7 flex flex-col flex-1 justify-between gap-6">
          <div className="space-y-3">
            <h2 className="font-display text-h4 font-bold text-fg group-hover:text-accent transition-colors">
              {name}
            </h2>

            {facts.length > 0 && (
              <p className="text-body font-medium text-fg-secondary">{facts.join(' • ')}</p>
            )}

            {(studios?.length ?? 0) > 1 && (
              <p className="text-caption text-fg-secondary">{studios?.join(' · ')}</p>
            )}

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {chips.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-md bg-surface-sunken border border-line px-2.5 py-1 text-caption text-fg-secondary font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}

            {portfolioThumbUrl && (
              <div className="pt-2">
                <img
                  src={portfolioThumbUrl}
                  alt="Portfolio thumbnail"
                  className="w-16 h-16 rounded-md object-cover mx-auto"
                />
              </div>
            )}
          </div>

          {/* T-4859: картка веде в одне місце, тож і підпис один — профіль. */}
          <div className="pt-4 border-t border-line text-body">
            <span className="text-accent font-semibold group-hover:translate-x-1.5 transition-transform">
              Профіль майстра &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
