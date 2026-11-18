// Довідник блог-постів із зображеннями для dev-сиду (seed-dev.ts).
// Патерн: id() (детерміновані id у FIXED_IDS-режимі) + IMG + наповнення
// (title, excerpt, body, coverUrl, tags, authorName). Статус — 'published'
// за замовчуванням; draft додається лише для тестів e2e.
import { id } from './db';

export const IMG = 'https://images.unsplash.com/';

export const BLOG_POSTS = [
  {
    id: id('blog_001'),
    title: 'Зачіска: як обирати стрижку для зими',
    slug: 'winter-haircut-guide',
    excerpt: 'Короткий гайд з тимчасовими та нормальними стрижками, коли мороз...',
    body: '<p>У зимовий період найважливіше — не пересушити шкірку і не...</p>',
    coverUrl: `${IMG}photo-1559598854-4c2997a58ed7?w=1200`,
    authorName: 'Аліса Фадєєва',
    tags: ['тривалина', 'зима', 'терапія'],
    status: 'published',
  },
  {
    id: id('blog_002'),
    title: 'Поради барбершопу: як підготуватися до замовлення',
    slug: 'how-to-prepare-for-booking',
    excerpt: 'Не знаєш, що взяти в цирка? Оберіть довгоде кошеня, якщо...',
    body: '<p>Багато клієнтів запитують: як замовити рядок, як...</p>',
    coverUrl: `${IMG}photo-1512423801036-8d224e999b2d?w=1200`,
    authorName: 'Сергій Крот',
    tags: ['замовлення', 'брідж', 'ціни'],
    status: 'published',
  },
  {
    id: id('blog_003'),
    title: 'Крісла та софістика: області для сімейного дня',
    slug: 'family-seats-guide',
    excerpt: 'Наша мережа має крісла для гостей за віком проходження...',
    body: '<p>Паралельна стрижка — це коли барер працює рядком...</p>',
    coverUrl: `${IMG}photo-1618351433044-8fb5dcede05c?w=1200`,
    authorName: 'Олена Чорнобаєва',
    tags: ['крісла', 'сім’я', 'паралельні рядки'],
    status: 'published',
  },
  {
    id: id('blog_004'),
    title: 'Клієнт без переривання: моніторинг і рівень комфорту',
    slug: 'no-waiting-guarantee',
    excerpt: 'Ми впроваджуємо антипару для клієнтів, які не хочуть...',
    body: '<p>Тривалість очікування — це не лише неприємне незадоволення;...</p>',
    coverUrl: `${IMG}photo-1519332881270-580127afe4ef?w=1200`,
    authorName: 'Максим Гордієнко',
    tags: ['моніторинг', 'комфорт', 'сервіс'],
    status: 'published',
  },
  {
    id: id('blog_005'),
    title: 'Догляд за бородою: топ-5 помилок щоденного догляду',
    slug: 'beard-care-top-mistakes',
    excerpt: 'Правильне миття, олійки та розчісування: як зберегти бороду ідеальною.',
    body: '<p>Борода потребує не менше уваги, ніж волосся на голові...</p>',
    coverUrl: `${IMG}photo-1503951914875-452162b0f3f1?w=1200`,
    authorName: 'Олег Барбер',
    tags: ['борода', 'догляд', 'поради'],
    status: 'published',
  },
  {
    id: id('blog_006'),
    title: 'Традиційне гоління небезпечною бритвою: ритуал для чоловіків',
    slug: 'royal-shave-ritual',
    excerpt: 'Чому гарячі компреси та бритва дарують відчуття абсолютного оновлення.',
    body: '<p>Гоління у барбершопі — це більше ніж просто видалення щетини...</p>',
    coverUrl: `${IMG}photo-1585747860715-2ba37e788b70?w=1200`,
    authorName: 'Тарас Майстер',
    tags: ['гоління', 'ритуал', 'сервіс'],
    status: 'published',
  },
];

// draft-пост для тестів (застарілий, не публікується в dev-даних)
export const DRAFT_BLOG_POST = {
  title: 'Тестова стаття',
  slug: 'test-draft',
  body: '<p>Draft content</p>',
  coverUrl: null,
  authorName: null,
  tags: ['dev'],
};
