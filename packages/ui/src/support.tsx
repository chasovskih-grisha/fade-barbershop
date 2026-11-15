import React, { useState } from 'react';

export interface SupportWidgetProps {
  initialOpen?: boolean;
  onClose?: () => void;
}

export const CustomerSupportWidget: React.FC<SupportWidgetProps> = ({ initialOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    { q: 'How do I reschedule my appointment?', a: 'You can reschedule up to 2 hours before your slot via your Booking Confirmation link or by visiting My Appointments.' },
    { q: 'What is our cancellation & no-show policy?', a: 'Cancellations made within 2 hours of booking may incur a small fee. We offer automated error recovery and support if issues arise.' },
    { q: 'How do I contact my barber directly?', a: 'Use the in-app chat or reply directly to your booking confirmation SMS/email to reach your barber.' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-full shadow-lg hover:bg-zinc-800 transition flex items-center gap-2 z-50 text-sm font-medium"
        aria-label="Open Customer Support & FAQ"
      >
        <span>💬 Support & FAQ</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden text-zinc-900">
      <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">FADE Customer Support & FAQ</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}
          className="text-zinc-400 hover:text-white text-sm"
          aria-label="Close Support Window"
        >
          ✕
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-96 space-y-4 text-sm">
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs">
          ⚡ <strong>Autonomous Assistance Active:</strong> Instant answers for booking, rescheduling, and error recovery.
        </div>

        <div>
          <h4 className="font-medium text-xs text-zinc-500 uppercase tracking-wider mb-2">Frequently Asked Questions</h4>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 cursor-pointer">
                <summary className="font-medium text-xs text-zinc-800">{faq.q}</summary>
                <p className="mt-2 text-xs text-zinc-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3">
          <h4 className="font-medium text-xs text-zinc-500 uppercase tracking-wider mb-2">Still need help? Send us a message</h4>
          {submitted ? (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs text-center font-medium">
              ✓ Support request received! Our team will get back to you within 15 minutes.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) setSubmitted(true);
              }}
              className="space-y-2"
            >
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your issue or question..."
                className="w-full p-2 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
                rows={3}
                required
              />
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white py-2 rounded-lg text-xs font-medium hover:bg-zinc-800 transition"
              >
                Send to Support Team
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
