# T-4567 · Mobile experience: responsive/PWA for Admin, Barber, Client

- **Stage**: M2-M3 (phase 6-7, 14) · **Tags**: frontend · **Complexity**: senior · **Depends on**: T-070, T-071, T-072, T-082, T-083, T-084, T-4509, T-4515, T-4510
- **StoryPoints**: 21

## What

Responsive/PWA-ready архітектура для всіх ролей (одна Expo кодова база, T-070/082):
- **Admin mobile** (responsive web + PWA):
  - Schedule: календар (T-4539) адаптивний, drag&drop на touch, 필три
  - Clients: список, пошук, картка клієнта, quick actions (call, SMS, book)
  - Appointments: список за сьогодні/тиждень, статус, нотатки, перенесення
  - Payments: статус депозиту/решти, чек, рефанд
  - Notifications: push-центр, алерти (T-4505)
  - Reports: KPI картки (T-110), свайп між періодами
- **Barber mobile** (T-082/083/084 + T-4546):
  - Schedule: день/тиждень, drag&drop власних вікон (phase 22), конфлікти
  - Appointments: сьогодні/майбутні, картка клієнта з референсом (T-043), нотатки
  - Status actions: arrived, started, completed, no-show — великі кнопки
  - Add-on services: під час візиту (T-4546)
  - Performance: мої KPI (T-4546), чайові, комісії
  - Chat: T-081 (realtime) оптимізований для mobile
- **Client mobile** (T-070/071/072 + T-4543):
  - Booking: quick-booking (T-053) + full flow (T-041), deep links (T-4541)
  - Appointments: upcoming/past, reschedule, cancel, repeat, "book same barber/service"
  - Loyalty: баланс, прогрес, історія (T-4551)
  - Memberships: активні, залишок, автопродовження (T-4550)
  - Gift cards: баланс, історія, передача (T-4552)
  - Notifications: In-app center (T-3100), push, preferences (T-4218)
  - Profile: редагування, зв'язані пристрої (T-4422)
- **PWA features**: service worker (offline cache T-4429), install prompt, push notifications (Web Push API), background sync

## Why

Мобільний перш — клієнти і барбери живуть в телефонах. PWA = без сторів, швидкі оновлення.

## Sources

- T-070/071/072 (mobile client), T-082/083/084 (barber mobile), T-4509 (NativeWind), T-4515 (dark-first), T-4510 (a11y)
- Altegio: aplikacja mobilna klienta, fryzjera, admina — PWA/responsive

## Done

- [ ] Responsive breakpoints: mobile (<640), tablet (640-1024), desktop (>1024) — дизайн-токени (T-004)
- [ ] Touch-first UI: min tap target 48dp, свайп-жести, pull-to-refresh, skeleton loaders
- [ ] PWA: manifest, service worker (Workbox), offline fallback (кеш останніх даних), push subscription (VAPID)
- [ ] NativeWind (T-4509): Tailwind для React Native Web + Expo — спільні стилі
- [ ] Dark-first theme (T-4515): CSS variables, автоматичне перемикання по system preference
- [ ] A11y (T-4510): axe-core в CI, focus-visible, skip-links, ARIA labels
- [ ] Biometrics login (T-4426): FaceID/TouchID для повторного входу (після OTP)
- [ ] Deep links (T-4427): `fade://booking?...`, `fade://appointment/{id}`, Universal Links / App Links

## Risks

- [ ] **Expo vs Web parity**: деякі API (push, biometrics, contacts) — platform-specific, потребує abstraction layer
- [ ] **Bundle size**: один bundle для всіх ролей — code splitting по role (lazy load admin/barber/client screens)