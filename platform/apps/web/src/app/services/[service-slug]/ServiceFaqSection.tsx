import type { ServiceFaq } from './service-overview.types';

export function ServiceFaqSection({ faqs, name }: { faqs: ServiceFaq[]; name: string }) {
  return (
    <section className="rounded-card bg-surface-raised p-8 border border-line">
      <h2 className="font-display text-h3 text-fg mb-6">Часті питання про {name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-card bg-surface p-5 border border-line flex flex-col justify-between"
          >
            <h3 className="font-semibold text-fg mb-2 flex items-start gap-2">
              <span className="text-accent">Q.</span> {faq.question}
            </h3>
            <p className="text-sm text-fg-secondary">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
