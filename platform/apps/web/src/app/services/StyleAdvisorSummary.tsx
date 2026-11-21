import Link from 'next/link';
import type { HairType } from './style-advisor-calculations';

interface StyleAdvisorSummaryProps {
  hairType: HairType;
  includeBeard: boolean;
  totalPrice: number;
  totalDuration: number;
}

export function StyleAdvisorSummary({
  hairType,
  includeBeard,
  totalPrice,
  totalDuration,
}: StyleAdvisorSummaryProps) {
  return (
    <div className="lg:col-span-5 flex flex-col justify-between bg-surface-sunken p-6 rounded-card border-2 border-accent-blue/40 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="font-semibold text-body text-fg">Ваш персональний сет:</span>
          <span className="text-caption font-semibold uppercase tracking-wider text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-pill">
            Економія часу -20%
          </span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {hairType !== 'beard' && (
            <li className="flex items-center justify-between text-body">
              <span className="text-fg-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Чоловіча стрижка ({hairType === 'fade' ? 'Fade Atelier' : 'Класика'})
              </span>
              <span className="font-semibold text-fg">650 ₴</span>
            </li>
          )}
          {includeBeard && (
            <li className="flex items-center justify-between text-body">
              <span className="text-fg-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Моделювання бороди та догляд
              </span>
              <span className="font-semibold text-fg">450 ₴</span>
            </li>
          )}
          <li className="flex items-center justify-between text-body">
            <span className="text-fg-secondary flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
              Фірмовий ритуал гарячого рушника & стайлінг
            </span>
            <span className="text-accent-blue font-medium text-caption">Включено</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-4 pt-6 border-t border-line mt-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-caption text-fg-secondary">Загальна вартість</span>
            <span className="font-display text-2xl font-bold text-fg">{totalPrice} ₴</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-caption text-fg-secondary">Тривалість</span>
            <span className="font-semibold text-body text-fg">{totalDuration} хв</span>
          </div>
        </div>

        <Link
          href="/booking"
          className="inline-flex h-12 w-full items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.01]"
        >
          Записатися за цим сетом &rarr;
        </Link>
      </div>
    </div>
  );
}
