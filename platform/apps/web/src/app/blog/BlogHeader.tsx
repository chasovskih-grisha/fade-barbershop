import Link from 'next/link';
import { ActionLink } from '@/app/components/ActionLink';

const CATEGORIES = ['Тренди та стайлінг', 'Догляд за бородою', 'Поради експертів'];

export function BlogHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
      <Link
        href="/"
        className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10"
      >
        &larr; На головну
      </Link>
      <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
        ✦ Журнал про чоловічий стиль, догляд та естетику
      </div>
      <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
        Блог та експертні матеріали
      </h1>
      <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
        Історії, техніки стрижок, поради професійних барберів Fade та гайди з догляду за бородою і
        волоссям. Знання, що допомагають виглядати неперевершено щодня.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-2 relative z-10">
        <span className="inline-flex items-center rounded-pill bg-accent text-accent-fg px-4 py-2 text-caption font-semibold shadow-sm">
          Усі публікації
        </span>
        {CATEGORIES.map((category) => (
          <span
            key={category}
            className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer"
          >
            {category}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-card border-2 border-accent-blue/40 bg-surface-sunken p-8 shadow-xl backdrop-blur-md relative z-10">
        <div className="flex flex-col gap-2">
          <span className="text-bodyLg font-display font-bold text-fg">
            Бажаєте втілити поради на практиці?
          </span>
          <span className="text-body text-fg-secondary">
            Запишіться до топ-барберів Fade та отримайте персональну консультацію щодо догляду за
            вашим волоссям.
          </span>
        </div>
        <ActionLink
          href="/booking"
          className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 w-fit shrink-0 transition-all shadow-lg hover:scale-[1.02]"
        >
          Записатися на стрижку &rarr;
        </ActionLink>
      </div>
    </header>
  );
}
