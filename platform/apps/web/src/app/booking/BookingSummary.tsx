'use client';
// Закріплений підсумок флоу (T-4711b, booking-flow.md): рішення, які клієнт уже
// ухвалив, лишаються видимими, поки він обирає слот. Пін читає стан флоу, а не
// власну копію, тож очищення сетерів діють і на нього.
import { summaryFacts } from './booking-summary-facts';
import type { SummaryFact, SummaryState } from './booking-summary-facts';

/** Підмножина стану `useBookingFlow`, яку читає пін. */
export interface SummaryFlow extends SummaryState {
  setStep: (step: number) => void;
}

const chip =
  'text-body min-h-11 min-w-11 rounded-[var(--radius-card)] px-2 text-fg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-blue';

function Fact({ fact, onEdit }: { fact: SummaryFact; onEdit: (step: number) => void }) {
  if (fact.target === undefined) return <li className="text-body text-fg">{fact.value}</li>;
  return (
    <li>
      <button
        type="button"
        className={chip}
        aria-label={`Змінити ${fact.name}, ${fact.value}`}
        onClick={() => onEdit(fact.target as number)}
      >
        {fact.value}
      </button>
    </li>
  );
}

export default function BookingSummary({ flow }: { flow: SummaryFlow }) {
  const facts = summaryFacts(flow);
  if (facts.length === 0 || flow.step >= 7) return null;
  const { slot, setStep } = flow;
  return (
    <section
      aria-label="Ваш запис"
      className="bg-surface-sunken border-line text-fg sticky top-0 z-10 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-card)] border p-2"
    >
      <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {facts.map((fact) => (
          <Fact key={fact.key} fact={fact} onEdit={setStep} />
        ))}
      </ul>
      <p role="status" aria-live="polite" className="sr-only">
        {slot ? `Обрано ${slot.start}–${slot.end}` : ''}
      </p>
    </section>
  );
}
