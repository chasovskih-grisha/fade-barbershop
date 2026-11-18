import Link from 'next/link';
import { Card } from '@fade/ui';

export function HomeServices() {
  return (
    <section className="flex flex-col gap-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 border border-accent-blue/30 px-3.5 py-1.5 text-caption font-semibold uppercase text-accent-blue shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse" aria-hidden="true" />
            Сервіс & Прайс
          </div>
          <h2 className="font-display text-h3 md:text-h2 font-bold text-fg">
            Послуги найвищого стандарту
          </h2>
          <p className="text-bodyLg text-fg-secondary">
            Прозорі фіксовані ціни. Кожна послуга включає індивідуальну консультацію, підбір форми та фірмовий ритуал.
          </p>
        </div>
        <Link 
          href="/services" 
          className="inline-flex items-center gap-1.5 text-body font-semibold text-fg hover:text-accent-blue transition-colors group py-1"
        >
          Дивитися увесь прайс <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex flex-col justify-between p-7 fade-card-gradient border border-line shadow-md hover:border-accent-blue/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-caption font-bold uppercase text-fg-muted">50 хв • Стрижка</span>
                <h3 className="text-bodyLg font-display font-bold text-fg mt-1.5 group-hover:text-accent-blue transition-colors">Чоловіча стрижка</h3>
              </div>
              <span className="text-h4 font-display font-extrabold text-fg">700 ₴</span>
            </div>
            <p className="text-body text-fg-secondary">
              Індивідуальна консультація стиліста, професійне миття, точна геометрія форми та гарячий компрес.
            </p>
          </div>
          <Link
            href="/booking"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-input border border-line bg-interactive px-5 text-body font-semibold text-fg hover:bg-accent hover:text-accent-fg hover:border-accent transition-all shadow-sm"
          >
            Записатися онлайн
          </Link>
        </Card>

        <Card className="flex flex-col justify-between p-7 fade-card-gradient border-2 border-accent-blue/60 shadow-xl relative hover:border-accent-blue hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 bg-accent-blue text-accent-fg text-[11px] font-bold uppercase px-3.5 py-1.5 rounded-bl-xl shadow-md">
            ✦ Хіт сезону
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between pr-8">
              <div>
                <span className="text-caption font-bold uppercase text-accent-blue">75 хв • Повний ритуал</span>
                <h3 className="text-bodyLg font-display font-bold text-fg mt-1.5 group-hover:text-accent-blue transition-colors">Комплекс FADE</h3>
              </div>
              <span className="text-h4 font-display font-extrabold text-accent-blue">1 000 ₴</span>
            </div>
            <p className="text-body text-fg-secondary">
              Ідеальний дует преміум-рівня: чоловіча стрижка + моделювання та догляд бороди з гарячим рушником.
            </p>
          </div>
          <Link
            href="/booking"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-input bg-accent px-5 text-body font-bold text-accent-fg hover:opacity-95 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          >
            Обрати комплекс &rarr;
          </Link>
        </Card>

        <Card className="flex flex-col justify-between p-7 fade-card-gradient border border-line shadow-md hover:border-accent-blue/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-caption font-bold uppercase text-fg-muted">30 хв • Догляд</span>
                <h3 className="text-bodyLg font-display font-bold text-fg mt-1.5 group-hover:text-accent-blue transition-colors">Стрижка бороди</h3>
              </div>
              <span className="text-h4 font-display font-extrabold text-fg">450 ₴</span>
            </div>
            <p className="text-body text-fg-secondary">
              Моделювання чітких симетричних контурів, професійна корекція бритвою та поживні олії.
            </p>
          </div>
          <Link
            href="/booking"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-input border border-line bg-interactive px-5 text-body font-semibold text-fg hover:bg-accent hover:text-accent-fg hover:border-accent transition-all shadow-sm"
          >
            Записатися
          </Link>
        </Card>
      </div>
    </section>
  );
}
