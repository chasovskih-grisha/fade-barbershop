// Довідники локацій і розкладів для seed-dev.ts.
// Канонічні коди локацій — ВЕРХНІМ регістром (доменний інваріант normalizeCode;
// деталі шукаються за trim().toUpperCase() — нижній регістр дає 404).
// telegram/instagram — голі хендли без «@» (location-channel.ts).

import { id } from './db';

const IMG = 'https://images.unsplash.com/';

// 0=Пн … 6=Нд (Monday-first, як у OpeningHours VO)
export const WEEK_MON_SAT_OPEN = Array.from({ length: 7 }, (_, d) =>
  d < 6
    ? { dayOfWeek: d, open: '09:00', close: '20:00', closed: false }
    : { dayOfWeek: d, open: null, close: null, closed: true }
);

export const BARBER_WEEK = Array.from({ length: 6 }, (_, d) => ({
  dayOfWeek: d,
  start: '09:00',
  end: '17:00',
}));

export const LOCATIONS = [
  {
    id: id('loc_KYY_01'),
    code: 'KYY-01',
    name: 'FADE Podil',
    address: 'вул. Верхній Вал 28, Київ',
    addressParts: { street: 'Верхній Вал', building: '28', city: 'Київ', country: 'UA' },
    lat: 50.4649,
    lng: 30.5171,
    phone: '+380441234501',
    email: 'podil@fade.dev',
    channels: [
      { channel: 'phone', value: '+380441234501', sortOrder: 0 },
      { channel: 'telegram', value: 'fade_podil', sortOrder: 1 },
      { channel: 'instagram', value: 'fade.podil', sortOrder: 2 },
    ],
    photos: [
      { url: `${IMG}photo-1585747860715-2ba37e788b70?w=1200`, caption: 'Зал Podil', sortOrder: 0 },
      { url: `${IMG}photo-1621605815971-fbc98d665033?w=1200`, caption: 'Робоче місце', sortOrder: 1 },
      { url: `${IMG}photo-1503951914875-452162b0f3f1?w=1200`, caption: 'Лаунж зона', sortOrder: 2 },
    ],
  },
  {
    id: id('loc_KYY_02'),
    code: 'KYY-02',
    name: 'FADE Obolon',
    address: 'Оболонський просп. 21, Київ',
    addressParts: { street: 'Оболонський проспект', building: '21', city: 'Київ', country: 'UA' },
    lat: 50.5008,
    lng: 30.5324,
    phone: '+380441234502',
    email: 'obolon@fade.dev',
    channels: [
      { channel: 'phone', value: '+380441234502', sortOrder: 0 },
      { channel: 'instagram', value: 'fade.obolon', sortOrder: 1 },
      { channel: 'telegram', value: 'fade_obolon', sortOrder: 2 },
    ],
    photos: [
      { url: `${IMG}photo-1503951914875-452162b0f3f1?w=1200`, caption: 'Зал Obolon', sortOrder: 0 },
      { url: `${IMG}photo-1585747860715-2ba37e788b70?w=1200`, caption: 'Барберзона', sortOrder: 1 },
    ],
  },
  {
    id: id('loc_LVI_01'),
    code: 'LVI-01',
    name: 'FADE Lviv',
    address: 'вул. Городоцька 174, Львів',
    addressParts: { street: 'Городоцька', building: '174', city: 'Львів', country: 'UA' },
    lat: 49.8397,
    lng: 24.0297,
    phone: '+380321234503',
    email: 'lviv@fade.dev',
    channels: [
      { channel: 'phone', value: '+380321234503', sortOrder: 0 },
      { channel: 'instagram', value: 'fade.lviv', sortOrder: 1 },
    ],
    photos: [
      { url: `${IMG}photo-1521490878406-4bcd2ba0f61b?w=1200`, caption: 'Зал Lviv', sortOrder: 0 },
      { url: `${IMG}photo-1621605815971-fbc98d665033?w=1200`, caption: 'Інтерʼєр', sortOrder: 1 },
    ],
  },
  {
    id: id('loc_ODS_01'),
    code: 'ODS-01',
    name: 'FADE Odesa',
    address: 'вул. Дерибасівська 12, Одеса',
    addressParts: { street: 'Дерибасівська', building: '12', city: 'Одеса', country: 'UA' },
    lat: 46.4845,
    lng: 30.7326,
    phone: '+380481234504',
    email: 'odesa@fade.dev',
    channels: [
      { channel: 'phone', value: '+380481234504', sortOrder: 0 },
      { channel: 'telegram', value: 'fade_odesa', sortOrder: 1 },
    ],
    photos: [
      { url: `${IMG}photo-1503951914875-452162b0f3f1?w=1200`, caption: 'Зал Odesa', sortOrder: 0 },
      { url: `${IMG}photo-1585747860715-2ba37e788b70?w=1200`, caption: 'Морський стиль', sortOrder: 1 },
    ],
  },
  {
    id: id('loc_HRK_01'),
    code: 'HRK-01',
    name: 'FADE Kharkiv',
    address: 'вул. Сумська 48, Харків',
    addressParts: { street: 'Сумська', building: '48', city: 'Харків', country: 'UA' },
    lat: 50.0058,
    lng: 36.2292,
    phone: '+380571234505',
    email: 'kharkiv@fade.dev',
    channels: [
      { channel: 'phone', value: '+380571234505', sortOrder: 0 },
      { channel: 'telegram', value: 'fade_kharkiv', sortOrder: 1 },
      { channel: 'instagram', value: 'fade.kharkiv', sortOrder: 2 },
    ],
    photos: [
      { url: `${IMG}photo-1621605815971-fbc98d665033?w=1200`, caption: 'Зал Kharkiv', sortOrder: 0 },
      { url: `${IMG}photo-1585747860715-2ba37e788b70?w=1200`, caption: 'Стиль і комфорт', sortOrder: 1 },
    ],
  },
  {
    id: id('loc_DNP_01'),
    code: 'DNP-01',
    name: 'FADE Dnipro',
    address: 'просп. Дмитра Яворницького 50, Дніпро',
    addressParts: { street: 'просп. Дмитра Яворницького', building: '50', city: 'Дніпро', country: 'UA' },
    lat: 48.4647,
    lng: 35.0462,
    phone: '+380561234506',
    email: 'dnipro@fade.dev',
    channels: [
      { channel: 'phone', value: '+380561234506', sortOrder: 0 },
      { channel: 'instagram', value: 'fade.dnipro', sortOrder: 1 },
    ],
    photos: [
      { url: `${IMG}photo-1503951914875-452162b0f3f1?w=1200`, caption: 'Зал Dnipro', sortOrder: 0 },
    ],
  },
  {
    id: id('loc_HRK_01'),
    code: 'HRK-01',
    name: 'FADE Kharkiv',
    address: 'вул. Сумська 45, Харків',
    addressParts: { street: 'Сумська', building: '45', city: 'Харків', country: 'UA' },
    lat: 50.0050,
    lng: 36.2300,
    phone: '+380571234505',
    email: 'kharkiv@fade.dev',
    channels: [
      { channel: 'phone', value: '+380571234505', sortOrder: 0 },
      { channel: 'telegram', value: 'fade_kharkiv', sortOrder: 1 },
    ],
    photos: [
      { url: `${IMG}photo-1585747860715-2ba37e788b70?w=1200`, caption: 'Зал Kharkiv', sortOrder: 0 },
    ],
  },
];
