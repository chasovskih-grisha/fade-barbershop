'use client';

import { useState, type FormEvent } from 'react';

interface TestimonialModalProps {
  onClose: () => void;
}

const EMPTY_FORM = { name: '', service: 'Комплексна стрижка', rating: 5, comment: '' };

export function TestimonialModal({ onClose }: TestimonialModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.comment) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY_FORM);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-card bg-surface border border-line p-8 shadow-2xl relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-h4 font-bold text-fg">Залишити відгук про візит</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-secondary hover:text-fg text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {submitted ? (
          <div className="p-6 rounded-card bg-accent-blue/15 border border-accent-blue text-center flex flex-col gap-3">
            <span className="text-h4 font-display font-bold text-fg">
              Дякуємо за ваш відгук! 🎉
            </span>
            <p className="text-body text-fg-secondary">
              Ваш відгук успішно опубліковано в системі верифікованих оцінок FADE.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-fg">Ваше ім’я</label>
              <input
                type="text"
                required
                placeholder="Наприклад, Володимир"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="h-12 rounded-input border border-line bg-surface-sunken px-4 text-body text-fg focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-fg">Ошатна послуга / Студія</label>
              <select
                value={form.service}
                onChange={(event) => setForm({ ...form, service: event.target.value })}
                className="h-12 rounded-input border border-line bg-surface-sunken px-4 text-body text-fg focus:outline-none focus:border-accent"
              >
                <option value="Комплексна стрижка">Комплексна стрижка • Печерськ</option>
                <option value="Моделювання бороди">Моделювання бороди • Поділ</option>
                <option value="Батько + Син">Комплекс «Батько + Син» • Шевченківський</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-fg">Ваш відгук та враження</label>
              <textarea
                required
                rows={4}
                placeholder="Розкажіть про якість стрижки та атмосферу..."
                value={form.comment}
                onChange={(event) => setForm({ ...form, comment: event.target.value })}
                className="rounded-input border border-line bg-surface-sunken p-4 text-body text-fg focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <button
              type="submit"
              className="mt-2 h-13 rounded-input bg-accent text-accent-fg font-semibold text-body shadow-lg hover:opacity-95 transition-all"
            >
              Опублікувати відгук &rarr;
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
