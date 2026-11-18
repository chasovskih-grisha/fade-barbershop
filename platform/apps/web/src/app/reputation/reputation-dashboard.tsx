'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DistrictBenchmark {
  district: string;
  fadeRating: number;
  marketAverage: number;
  reviewsCount: number;
  sentimentScore: string;
  badge: string;
}

const DISTRICT_BENCHMARKS: DistrictBenchmark[] = [
  { district: 'Печерськ (Флагман)', fadeRating: 4.98, marketAverage: 4.62, reviewsCount: 1420, sentimentScore: '99% Positive', badge: 'Лідер району 🥇' },
  { district: 'Поділ', fadeRating: 4.95, marketAverage: 4.58, reviewsCount: 980, sentimentScore: '98% Positive', badge: 'Топ-рейтинг 🌟' },
  { district: 'Шевченківський', fadeRating: 4.97, marketAverage: 4.60, reviewsCount: 1150, sentimentScore: '99% Positive', badge: 'Еталон якості ✨' },
  { district: 'Оболонь', fadeRating: 4.94, marketAverage: 4.55, reviewsCount: 840, sentimentScore: '97% Positive', badge: 'Вибір гостей 🏆' },
];

const RECENT_VERIFIED_REVIEWS = [
  {
    id: '1',
    author: 'Олександр М.',
    service: 'Стрижка + Небезпечне бритвество',
    rating: 5,
    date: 'Вчора, студія на Печерську',
    text: 'Неймовірний рівень сервісу та уваги до деталей. Майстер Андрій врахував усі побажання щодо геометрії та форми.',
    verified: true,
  },
  {
    id: '2',
    author: 'Дмитро К.',
    service: 'Моделювання бороди & Hot Towel',
    rating: 5,
    date: ' 2 дні тому, студія на Подолі',
    text: 'Фірмовий ритуал гарячого рушника та догляд за бородою — найкращі в Києві. Атмосфера та кава на висоті.',
    verified: true,
  },
  {
    id: '3',
    author: 'Максим В.',
    service: 'Комплекс "Батько + Син"',
    rating: 5,
    date: '3 дні тому, Шевченківський',
    text: 'Ходимо разом із сином уже пів року. Завжди бездоганно, швидко та у надзвичайно затишній атмосфері.',
    verified: true,
  },
];

export function ReputationDashboard() {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'reviews' | 'competitive' | 'topics'>('benchmarks');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', service: 'Комплексна стрижка', rating: 5, comment: '' });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.comment) return;
    setSubmittedReview(true);
    setTimeout(() => {
      setTestimonialModalOpen(false);
      setSubmittedReview(false);
      setReviewForm({ name: '', service: 'Комплексна стрижка', rating: 5, comment: '' });
    }, 2500);
  };

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      {/* Header Banner */}
      <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
        <Link href="/" className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10">
          &larr; На головну
        </Link>
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
          ✦ Бренд-репутація та ринковий лідерство у Києві
        </div>
        <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
          Репутаційний індекс & Конкурентна розвідка
        </h1>
        <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
          Ми пишаємося кожним відгуком. Моніторинг ринкових показників, оцінок у Google Maps & Apple Maps та задоволеності гостей у режимі реального часу.
        </p>

        {/* High-Impact Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 relative z-10">
          <div className="p-6 rounded-card bg-surface-sunken/90 border border-line backdrop-blur-md flex flex-col gap-1.5 shadow-md">
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">Середній рейтинг мережі</span>
            <span className="font-display text-[2.25rem] font-bold text-fg flex items-center gap-2">
              4.96 <span className="text-semantic-warning text-xl">★★★★★</span>
            </span>
            <span className="text-caption text-fg-secondary">На основі 4,400+ верифікованих відгуків</span>
          </div>
          <div className="p-6 rounded-card bg-surface-sunken/90 border border-line backdrop-blur-md flex flex-col gap-1.5 shadow-md">
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">Індекс лояльності NPS</span>
            <span className="font-display text-[2.25rem] font-bold text-fg">94%</span>
            <span className="text-caption text-fg-secondary">Рекомендують FADE друзям та колегам</span>
          </div>
          <div className="p-6 rounded-card bg-surface-sunken/90 border border-line backdrop-blur-md flex flex-col gap-1.5 shadow-md">
            <span className="text-caption font-bold text-accent-blue uppercase tracking-wider">Повторні візити</span>
            <span className="font-display text-[2.25rem] font-bold text-fg">86.5%</span>
            <span className="text-caption text-fg-secondary">Обирають свого майстра регулярно</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('benchmarks')}
          className={`px-5 py-2.5 rounded-pill text-body font-semibold transition-all ${
            activeTab === 'benchmarks'
              ? 'bg-accent text-accent-fg shadow-md'
              : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
          }`}
        >
          🏙️ Порівняння по районах
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-2.5 rounded-pill text-body font-semibold transition-all ${
            activeTab === 'reviews'
              ? 'bg-accent text-accent-fg shadow-md'
              : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
          }`}
        >
          💬 Відгуки гостей (4.4k+)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('competitive')}
          className={`px-5 py-2.5 rounded-pill text-body font-semibold transition-all ${
            activeTab === 'competitive'
              ? 'bg-accent text-accent-fg shadow-md'
              : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
          }`}
        >
          📊 Ринковий Бенчмаркінг
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('topics')}
          className={`px-5 py-2.5 rounded-pill text-body font-semibold transition-all ${
            activeTab === 'topics'
              ? 'bg-accent text-accent-fg shadow-md'
              : 'bg-surface-sunken border border-line text-fg-secondary hover:text-fg'
          }`}
        >
          🎯 Тематичний аналіз & Тональність
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setTestimonialModalOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-input bg-accent-blue text-white px-6 text-body font-semibold shadow-lg hover:opacity-95 transition-all"
          >
            + Залишити відгук
          </button>
        </div>
      </div>

      {/* Tab Content: Benchmarks */}
      {activeTab === 'benchmarks' && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DISTRICT_BENCHMARKS.map((b) => (
              <div key={b.district} className="p-8 rounded-card border border-line bg-surface shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-accent transition-all">
                <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-accent-blue/10 blur-2xl group-hover:bg-accent-blue/20 transition-all pointer-events-none" />
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">{b.badge}</span>
                    <span className="text-caption font-semibold text-fg-secondary">Відгуків: {b.reviewsCount}</span>
                  </div>
                  <h3 className="font-display text-h4 font-bold text-fg">{b.district}</h3>
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex flex-col">
                      <span className="text-caption text-fg-secondary">Рейтинг FADE</span>
                      <span className="font-display text-2xl font-bold text-fg">{b.fadeRating} ★</span>
                    </div>
                    <div className="h-10 w-[1px] bg-line" />
                    <div className="flex flex-col">
                      <span className="text-caption text-fg-secondary">Середнє по району</span>
                      <span className="font-display text-2xl font-bold text-fg-muted">{b.marketAverage} ★</span>
                    </div>
                    <div className="h-10 w-[1px] bg-line" />
                    <div className="flex flex-col">
                      <span className="text-caption text-fg-secondary">Тональність</span>
                      <span className="font-display text-2xl font-bold text-accent-blue">{b.sentimentScore}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-line flex items-center justify-between relative z-10">
                  <span className="text-caption text-fg-secondary">Перевищує ринковий стандарт на <strong className="text-fg">+0.36★</strong></span>
                  <Link href="/booking" className="text-body font-semibold text-accent-blue hover:underline">
                    Записатися тут &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Reviews */}
      {activeTab === 'reviews' && (
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="text-caption text-fg-secondary font-medium">Фільтрувати оцінку:</span>
            <button onClick={() => setFilterRating('all')} className={`px-3 py-1 rounded-pill text-caption font-semibold ${filterRating === 'all' ? 'bg-accent text-accent-fg' : 'bg-surface-sunken text-fg-secondary'}`}>Усі</button>
            <button onClick={() => setFilterRating(5)} className={`px-3 py-1 rounded-pill text-caption font-semibold ${filterRating === 5 ? 'bg-accent text-accent-fg' : 'bg-surface-sunken text-fg-secondary'}`}>5 зірок ★★★★★</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RECENT_VERIFIED_REVIEWS.map((rev) => (
              <div key={rev.id} className="p-6 rounded-card border border-line bg-surface shadow-md flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-bold text-fg">{rev.author}</span>
                    <span className="text-semantic-warning text-sm">★★★★★</span>
                  </div>
                  <span className="text-caption font-semibold text-accent-blue">{rev.service}</span>
                  <p className="text-body text-fg-secondary italic">&ldquo;{rev.text}&rdquo;</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-line text-caption text-fg-muted">
                  <span>{rev.date}</span>
                  <span className="inline-flex items-center gap-1 text-accent-blue font-semibold">✓ Верифікований візит</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Competitive Intelligence */}
      {activeTab === 'competitive' && (
        <div className="p-8 rounded-card border border-line bg-surface shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">Аудит ринкового середовища Києва</span>
            <h3 className="font-display text-h3 font-bold text-fg">Чому гості обирають FADE замість класичних барбершопів</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-2">
              <span className="text-h4 font-display font-bold text-fg">0% Очікування</span>
              <p className="text-caption text-fg-secondary">Точний таймінг запису та автоматичне сповіщення у Telegram.</p>
            </div>
            <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-2">
              <span className="text-h4 font-display font-bold text-fg">Преміум-косметика</span>
              <p className="text-caption text-fg-secondary">Ексклюзивні британські та американські бренди у кожній процедурі.</p>
            </div>
            <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-2">
              <span className="text-h4 font-display font-bold text-fg">Кешбек до 10%</span>
              <p className="text-caption text-fg-secondary">Накопичувальна бонусна програма FADE CLUB з першого візиту.</p>
            </div>
            <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-2">
              <span className="text-h4 font-display font-bold text-fg">Геометрія та гарантія</span>
              <p className="text-caption text-fg-secondary">Індивідуальний підбір форми черепа з цифровим архівом образів.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Topics & Sentiment Extraction */}
      {activeTab === 'topics' && (
        <div className="p-8 rounded-card border border-line bg-surface shadow-xl flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-caption font-bold uppercase tracking-wider text-accent-blue">Аналіз ключових тем & Розподіл тональності</span>
            <h3 className="font-display text-h3 font-bold text-fg">Тематичний зріз відгуків гостей</h3>
            <p className="text-body text-fg-secondary">Автоматична NLP-класифікація відгуків у реальному часі за ключовими аспектами сервісу.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-card bg-surface-sunken border border-line flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-fg">✂️ Якість стрижки та геометрія</span>
                <span className="text-caption font-bold text-accent-blue">99.4% POS</span>
              </div>
              <div className="w-full bg-line h-2 rounded-full overflow-hidden">
                <div className="bg-accent-blue h-full w-[99.4%]" />
              </div>
              <span className="text-caption text-fg-secondary">1,840 згадок • Висока точність роботи майстрів згідно з протоколами FADE.</span>
            </div>
            <div className="p-6 rounded-card bg-surface-sunken border border-line flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-fg">☕ Атмосфера та напої</span>
                <span className="text-caption font-bold text-accent-blue">98.8% POS</span>
              </div>
              <div className="w-full bg-line h-2 rounded-full overflow-hidden">
                <div className="bg-accent-blue h-full w-[98.8%]" />
              </div>
              <span className="text-caption text-fg-secondary">1,210 згадок • Фірмова кава, музичний супровід та лаунж-зона.</span>
            </div>
            <div className="p-6 rounded-card bg-surface-sunken border border-line flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-fg">⏱️ Пунктуальність і таймінг</span>
                <span className="text-caption font-bold text-accent-blue">99.1% POS</span>
              </div>
              <div className="w-full bg-line h-2 rounded-full overflow-hidden">
                <div className="bg-accent-blue h-full w-[99.1%]" />
              </div>
              <span className="text-caption text-fg-secondary">950 згадок • Початок процедури чітко у заброньований час.</span>
            </div>
            <div className="p-6 rounded-card bg-surface-sunken border border-line flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-fg">💰 Ціноутворення та кешбек</span>
                <span className="text-caption font-bold text-accent-blue">97.9% POS</span>
              </div>
              <div className="w-full bg-line h-2 rounded-full overflow-hidden">
                <div className="bg-accent-blue h-full w-[97.9%]" />
              </div>
              <span className="text-caption text-fg-secondary">680 згадок • Прозора вартість і приємні бонуси FADE CLUB.</span>
            </div>
            <div className="p-6 rounded-card bg-surface-sunken border border-line flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-fg">🧴 Косметика та догляд</span>
                <span className="text-caption font-bold text-accent-blue">98.5% POS</span>
              </div>
              <div className="w-full bg-line h-2 rounded-full overflow-hidden">
                <div className="bg-accent-blue h-full w-[98.5%]" />
              </div>
              <span className="text-caption text-fg-secondary">520 згадок • Преміальні засоби для бороди та стайлінгу.</span>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-card bg-surface border border-line p-8 shadow-2xl relative flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-h4 font-bold text-fg">Залишити відгук про візит</h3>
              <button
                type="button"
                onClick={() => setTestimonialModalOpen(false)}
                className="text-fg-secondary hover:text-fg text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {submittedReview ? (
              <div className="p-6 rounded-card bg-accent-blue/15 border border-accent-blue text-center flex flex-col gap-3">
                <span className="text-h4 font-display font-bold text-fg">Дякуємо за ваш відгук! 🎉</span>
                <p className="text-body text-fg-secondary">Ваш відгук успішно опубліковано в системі верифікованих оцінок FADE.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption font-semibold text-fg">Ваше ім’я</label>
                  <input
                    type="text"
                    required
                    placeholder="Наприклад, Володимир"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    className="h-12 rounded-input border border-line bg-surface-sunken px-4 text-body text-fg focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption font-semibold text-fg">Ошатна послуга / Студія</label>
                  <select
                    value={reviewForm.service}
                    onChange={(e) => setReviewForm({ ...reviewForm, service: e.target.value })}
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
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
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
      )}
    </div>
  );
}
