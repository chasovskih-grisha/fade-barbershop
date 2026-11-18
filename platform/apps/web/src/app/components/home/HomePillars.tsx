import { Card } from '@fade/ui';

const PILLARS = [
  {
    num: '01 / Простір & Приватність',
    title: 'Тільки 2 крісла в студії',
    desc: 'Жодного гучного конвеєра, натовпу чи сторонніх поглядів. Лише спокійна година вашого особистого часу.',
  },
  {
    num: '02 / Сусідський Преміум',
    title: 'Рівень центру біля дому',
    desc: 'Бездоганний сервіс найвищого гатунку поруч із вашим житловим комплексом. Без витрати часу на затори.',
  },
  {
    num: '03 / Ритуал Догляду',
    title: 'Традиції та розслаблення',
    desc: 'Гарячий компрес з аромамаслами, прохолодні напої, увагу до найменших деталей та пам’ять про ваші вподобання.',
  },
  {
    num: '04 / Техніка & Форма',
    title: 'Ювелірна геометрія',
    desc: 'Майстри вищої кваліфікації. Стрижки та борода, що ідеально пасують вашому стилю життя та формі обличчя.',
  },
];

export function HomePillars() {
  return (
    <section className="flex flex-col gap-8 py-6">
      <div className="flex flex-col gap-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4 py-1.5 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm">
          ✦ Філософія бренду
        </div>
        <h2 className="font-display text-h3 sm:text-h2 font-bold text-fg tracking-wider">
          Чому чоловіки обирають FADE
        </h2>
        <p className="text-bodyLg text-fg-secondary">
          Ми переосмислили концепцію чоловічого догляду, прибравши зайвий пафос і зосередившись на чистоті форми, особистому часі та бездоганному комфорті.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <Card key={p.num} className="flex flex-col gap-4 p-7 fade-card-gradient transition-all duration-300 hover:border-accent-blue/60 hover:shadow-2xl hover:-translate-y-1.5 group border-line-strong/60">
            <div className="flex items-center justify-between">
              <span className="text-caption font-bold uppercase text-accent-blue tracking-wider">{p.num}</span>
              <span className="h-2 w-2 rounded-full bg-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-bodyLg font-bold text-fg group-hover:text-accent-blue transition-colors">{p.title}</h3>
            <p className="text-body text-fg-secondary">{p.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}


