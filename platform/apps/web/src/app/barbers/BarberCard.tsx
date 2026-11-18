import Link from 'next/link';
import { Card } from '@fade/ui';
import { BarberPortrait } from './BarberPortrait';

// T-4851a: картка майстра каже лише те, що знає запис. Немає ні дефолтних
// спеціалізацій, ні «6+ років досвіду», ні бейджів «Вільні вікна сьогодні» /
// «Експерт Fade»: однакова обіцянка на кожній картці — не вибір. Картка з
// самим лише ім'ям — валідна картка.

interface BarberCardProps {
  id: string;
  slug: string;
  name: string;
  role?: string | null | undefined;
  photoUrl?: string | null | undefined;
  specialties?: string[] | null | undefined;
  experience?: string | null | undefined;
}

export function BarberCard({
  id: _id,
  slug,
  name,
  role,
  photoUrl,
  specialties,
  experience,
}: BarberCardProps) {
  const facts = [role, experience].filter((fact): fact is string => Boolean(fact));
  const chips = (specialties ?? []).filter((specialty) => specialty.length > 0);

  return (
    <Link href={`/barbers/${slug}`} className="group block">
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
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-between text-body">
            <span className="text-fg-secondary font-medium">Портфоліо майстра</span>
            <span className="text-accent font-semibold group-hover:translate-x-1.5 transition-transform">
              Вибрати майстра &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
