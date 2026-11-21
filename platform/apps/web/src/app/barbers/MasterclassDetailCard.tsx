import Link from 'next/link';
import type { Masterclass } from './masterclass-data';

interface MasterclassDetailCardProps {
  masterclass: Masterclass;
  bookedSuccess: boolean;
  onBook: () => void;
}

export function MasterclassDetailCard({
  masterclass,
  bookedSuccess,
  onBook,
}: MasterclassDetailCardProps) {
  return (
    <div className="p-8 rounded-card bg-surface border border-line-strong/80 shadow-xl flex flex-col lg:flex-row gap-8 items-start justify-between">
      <div className="flex flex-col gap-5 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 rounded-pill bg-accent/10 text-accent text-caption font-semibold">
            {masterclass.level}
          </span>
          <span className="px-3 py-1 rounded-pill bg-surface-sunken text-fg-secondary text-caption font-medium">
            ⏱ {masterclass.duration}
          </span>
          <span className="px-3 py-1 rounded-pill bg-semantic-warning/15 text-semantic-warning text-caption font-semibold">
            💳 {masterclass.price}
          </span>
        </div>

        <h3 className="font-display text-h3 font-bold text-fg">{masterclass.title}</h3>
        <p className="text-body text-fg-secondary">{masterclass.description}</p>

        <div className="flex flex-col gap-2 pt-2">
          <span className="text-caption font-semibold uppercase text-fg">
            Що входить до програми:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {masterclass.highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-caption text-fg-secondary">
                <span className="w-2 h-2 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full lg:w-80 p-6 rounded-card bg-surface-sunken border border-line justify-between shrink-0">
        <div className="flex flex-col gap-2">
          <span className="text-caption text-fg-secondary">Провідний експерт:</span>
          <span className="text-body font-bold text-fg">{masterclass.instructor}</span>
          <div className="h-px bg-line my-2" />
          <span className="text-caption text-fg-secondary">Формат:</span>
          <span className="text-caption font-semibold text-fg">
            Індивідуальна сесія або міні-група
          </span>
        </div>

        {bookedSuccess ? (
          <div className="p-4 rounded-card bg-semantic-success/15 border border-semantic-success/30 text-semantic-success text-center text-caption font-semibold">
            🎉 Заявку на бронь прийнято! Наш адміністратор зв&apos;яжеться з вами протягом 15
            хвилин.
          </div>
        ) : (
          <button
            type="button"
            onClick={onBook}
            className="w-full py-3.5 px-6 rounded-pill bg-accent text-accent-fg font-semibold hover:opacity-95 transition-all shadow-md text-center cursor-pointer"
          >
            Забронювати участь
          </button>
        )}

        <Link
          href="/booking"
          className="text-center text-caption text-fg-secondary hover:text-fg transition-colors"
        >
          Або перейдіть до звичайного запису &rarr;
        </Link>
      </div>
    </div>
  );
}
