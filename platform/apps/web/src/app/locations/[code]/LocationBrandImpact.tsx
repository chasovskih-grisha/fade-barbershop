import { Card } from '@fade/ui';
import { ActionLink } from '@/app/components/ActionLink';

const PERKS = [
  {
    icon: '☕',
    title: 'Craft Bar',
    text: 'Крафтова кава, чай та преміум-напої',
  },
  {
    icon: '🔒',
    title: '100% Privacy',
    text: 'Тільки ви, ваш майстер та музика',
  },
  {
    icon: '✨',
    title: 'Hot Towel',
    text: 'Класичний ритуальний компрес гарячим рушником',
  },
];

export function LocationBrandImpact({ name }: { name: string }) {
  return (
    <Card className="p-7 flex flex-col gap-5 border-accent-blue/30 bg-gradient-to-br from-surface-raised via-surface to-accent-blue/5 relative overflow-hidden shadow-xl">
      <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-accent-blue/15 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-3 relative z-10">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue font-bold text-h4"
          aria-hidden="true"
        >
          ✦
        </span>
        <div>
          <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">
            Преміум-сервіс студії {name}
          </span>
          <h3 className="font-display text-h4 font-bold text-fg">Ваш винятковий візит у деталях</h3>
        </div>
      </div>
      <p className="text-body text-fg-secondary relative z-10 leading-relaxed">
        Кожен візит до нашої камерної студії створений за стандартом Fade Atelier: абсолютна
        приватність, відсутність сторонніх відвідувачів, авторські напої з бару та персональна
        підбірка доглядової косметики.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-line/80 relative z-10">
        {PERKS.map((perk) => (
          <div
            key={perk.title}
            className="p-4 rounded-[var(--radius-card)] bg-surface-sunken/90 border border-line flex flex-col gap-1 shadow-sm"
          >
            <span className="text-sm font-bold text-fg">
              {perk.icon} {perk.title}
            </span>
            <span className="text-caption text-fg-secondary">{perk.text}</span>
          </div>
        ))}
      </div>
      <div className="pt-2 flex items-center justify-between flex-wrap gap-4 relative z-10">
        <span className="text-caption text-fg-muted font-medium">
          Бажаєте обрати конкретне крісло чи майстра?
        </span>
        <ActionLink href="/booking" variant="secondary" className="text-sm font-semibold">
          Забронювати онлайн &rarr;
        </ActionLink>
      </div>
    </Card>
  );
}
