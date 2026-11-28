# T-150a · Фото відгуку: окремий бакет і життєвий цикл

- **Stage**: M4 (phase 12A) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-150
- **StoryPoints**: 2

## What

Фото відгуку живе в приватному бакеті `feedback-photos`, а не в тілі відгуку: завантаження (jpg/png/webp, ≤ 3 на відгук — `feedback-surfaces.policy.ts`), короткоживучий підписаний URL для показу, видалення об'єкта разом із відгуком до кінця вікна (FDB-003), і жодного публічного URL.

## Why

T-150 закриває вікно і подання, але фото лишаються лише посиланнями `{id, sortOrder}`: бакет `feedback-photos` створений інфраструктурою (ADR 0015), а коду, який у нього пише й прибирає за відгуком, немає. Через це «Photos in separate bucket with review lifecycle» з T-150 не виконано — винесено сюди, щоб T-150 закривався чесно.

## Sources

- T-150; `FDB-001…006`; ADR 0015 (buckets), ADR 0008
- `infra/docker-compose.yml` §buckets (`feedback-photos`)
- `apps/api/src/haircut-ai` — зразок `PhotoStorage` порту й S3-адаптера
- `apps/api/src/feedback-surfaces/feedback-surfaces.policy.ts` — ліміт 3 фото

## Implementation plan

Paths:
- apps/api/src/feedback/window/domain/feedback-photo.ts
- apps/api/src/feedback/window/application/photo-port.ts
- apps/api/src/feedback/window/application/feedback-photo.service.ts
- apps/api/src/feedback/window/application/feedback-photo-removal.service.ts
- apps/api/src/feedback/window/application/feedback-photo-removal.spec.ts
- apps/api/src/feedback/window/application/feedback-photo.spec.ts
- apps/api/src/feedback/window/application/feedback-photo-lifecycle.spec.ts
- apps/api/src/feedback/window/application/feedback-photo-window-end.spec.ts
- apps/api/src/feedback/window/application/in-memory-feedback-photo-storage.ts
- apps/api/src/feedback/window/application/ports.ts
- apps/api/src/feedback/window/application/feedback-window.memory-repo.ts
- apps/api/src/feedback/window/application/feedback-window.service.ts
- apps/api/src/feedback/window/application/feedback-window.submission.spec.ts
- apps/api/src/feedback/window/infrastructure/s3-feedback-photo-storage.ts
- apps/api/src/feedback/window/infrastructure/client-feedback-photo.controller.ts
- apps/api/src/feedback/window/infrastructure/feedback-photo-http.mapper.ts
- apps/api/src/feedback/window/infrastructure/prisma-feedback-window.repository.ts
- apps/api/src/feedback/window/infrastructure/feedback-window.row.ts
- apps/api/src/feedback/window/feedback-window.module.ts
- apps/api/src/feedback/window/README.md

Checks:
- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/feedback/window/application/feedback-photo.spec.ts apps/api/src/feedback/window/application/feedback-photo-lifecycle.spec.ts apps/api/src/feedback/window/application/feedback-photo-window-end.spec.ts apps/api/src/feedback/window/application/feedback-photo-removal.spec.ts`

## Done

- [x] Порт `FeedbackPhotoStorage` + S3-адаптер у бакеті `feedback-photos` (SSE як у haircut-ai)
- [x] Завантаження ≤ 3 фото на відгук, формат/розмір валідуються до запису в бакет
- [x] Показ через короткоживучий підписаний URL; публічного URL немає
- [x] Видалення відгуку до кінця вікна видаляє об'єкти; після вікна — відмова
- [x] Тести через реальний сервіс: чужий відгук, понад 3 фото, видалення після вікна

## Risks

- [x] **Приватність**: підписаний URL не має пережити сесію показу (ADR 0008 §2)
- [x] **Подвійне видалення**: повторне видалення не має падати на відсутньому об'єкті

## Implementation notes

- apps/api/src/feedback/window/application/feedback-photo-lifecycle.spec.ts
- apps/api/src/feedback/window/application/feedback-photo-removal.service.ts
- apps/api/src/feedback/window/application/feedback-photo-removal.spec.ts
- apps/api/src/feedback/window/application/feedback-photo-window-end.spec.ts
- apps/api/src/feedback/window/application/feedback-photo.spec.ts
- apps/api/src/feedback/window/domain/feedback-photo.ts
- apps/api/src/feedback/window/feedback-window.module.ts
- apps/api/src/feedback/window/infrastructure/client-feedback-photo.controller.ts

## QA

- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/feedback/window/application/feedback-photo.spec.ts apps/api/src/feedback/window/application/feedback-photo-lifecycle.spec.ts apps/api/src/feedback/window/application/feedback-photo-window-end.spec.ts apps/api/src/feedback/window/application/feedback-photo-removal.spec.ts` exit 0
