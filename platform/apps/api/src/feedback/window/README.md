# Вікно відгуку (`feedback-window`)

> T-150, ADR 0016. Матеріалізоване вікно відгуку на **завершений** візит.

`scheduling.AppointmentCompleted` (outbox, at-least-once) відкриває рядок
`FeedbackRequestWindow` — один на `appointmentId` (унікальний індекс — ключ
дедуплікації). Повторна доставка події повертає наявне вікно, а не створює
друге.

## Правила

- **30 днів** на відгук: `windowEndsAt = completedAt + 30 днів` (снепшот на
  момент створення, зміна конфігурації не рухає вже відкриті вікна).
- **Один відгук на візит**: перше подання → `submitted`; повторне редагує той
  самий відгук, поки вікно відкрите (`FDB-002`).
- **Одне нагадування** через 2 години (`FDB-MOB-02`): `remindedAt` ставиться
  один раз, другий тик повертає `due: false`.
- **Прострочене** вікно показується як `expired` і відгук не приймає; окремий
  тик `expire-overdue` переводить `open` → `expired` у сховищі.
- Валідація подання: оцінка 1–5, текст ≤ 1000, до 3 фото (`{id, sortOrder}` —
  посилання на вже завантажені об'єкти, див. «Фото»).

## HTTP

Клієнтські маршрути (сесія клієнта, користувач лише з сесії):

- `GET /feedback/window/:appointmentId` — своє вікно (404 немає, 403 не своє).
- `POST /feedback/window/:appointmentId` — `{rating, text, photoIds?}` (409
  якщо вікно прострочене/закрите, 400 на некоректний відгук). `photoIds`
  лише відбирають серед уже завантажених фото: id, якого немає у вікні,
  відкидається, тож у відгуку не буває посилань на чужий об'єкт.
- `POST /feedback/window/:appointmentId/photos` — `{contentType, base64}`:
  завантаження фото у приватний бакет, відповідь `{photo: {id, sortOrder}, url}`.
- `GET /feedback/window/:appointmentId/photos/:photoId` — короткоживучий
  підписаний URL (`{url, expiresInSeconds}`).
- `DELETE /feedback/window/:appointmentId/photos/:photoId` — прибрати одне
  фото (решта зберігає порядок, місце під нове звільняється).
- `DELETE /feedback/window/:appointmentId/review` — видалення відгуку разом із
  фото, поки вікно відкрите.

Внутрішні маршрути (`/admin/` — закриті глобальним `AdminSessionGuard`):

- `POST /admin/feedback-windows/open` — відкрити вікно (ідемпотентно).
- `POST /admin/feedback-windows/:appointmentId/reminder-due` — чи час слати
  нагадування (позначає `remindedAt`, коли час настав).
- `POST /admin/feedback-windows/expire-overdue` — прибирання прострочених.

`FeedbackRequestWindow` навмисно окремий від `FeedbackWindow` (T-4451/T-4463):
там опублікований відгук для показу, тут — стан вікна й право на відгук.

## Фото (T-150a)

- Бакет **`feedback-photos`** — приватний: жодного публічного URL, показ лише
  через підписане посилання на 900 с (`PHOTO_URL_TTL_SECONDS`). Порт
  `FeedbackPhotoStorage` (`put` / `signedUrl` / `remove`), S3-адаптер
  `S3FeedbackPhotoStorage`; у тестах — `InMemoryFeedbackPhotoStorage`.
- Приймаються `image/jpeg`, `image/png`, `image/webp`, до **5 МБ**
  (`MAX_FEEDBACK_PHOTO_BYTES`) і до **3** фото на відгук
  (`MAX_FEEDBACK_PHOTOS`); тип, розмір і **підпис файлу** (магічні байти
  jpeg/png/webp) перевіряються **до** запису в бакет, тому невдала спроба не
  лишає сміття, а файл не може видати себе за інший тип.
- У рядку вікна лежать лише посилання `{id: <objectKey>, sortOrder}`; сам
  вміст — в об'єктному сховищі.
- Видалення відгуку (`DELETE .../review`) прибирає об'єкти з бакета й очищає
  оцінку/текст/фото у рядку до кінця вікна (`FDB-003`). Після кінця вікна і
  завантаження, і видалення відповідають 409: життєвий цикл закритий.
- Повторне видалення не падає: об'єктів уже немає, відповідь
  `{removedPhotos: 0}`. Окреме фото прибирається тим самим шляхом
  (`FeedbackPhotoRemovalService`), решта перенумеровується `0..n-1`.
- Коди помилок: 415 — тип не з jpg/png/webp, 413 — файл понад 5 МБ, 400 —
  понад 3 фото, 404 — фото немає у вікні, 403 — вікно чуже.
