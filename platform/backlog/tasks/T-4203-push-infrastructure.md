# T-4203 · infrastructure push-сповіщень

- **Stage**: M6 (phase 40) · **Tags**: backend, integration · **Complexity**: middle · **Depends on**: T-080, T-3100
- **StoryPoints**: 15

## What
infrastructure push: налаштування FCM (Android) / APNs (iOS), реєстрація/оновлення/ротація токенів, silent pushes (синхронізація даних у фоні), rich notifications (зображення, дії, категорії), керування бейджами, critical alerts (високий пріоритет), підписки на теми (per локація/барбер), інвалідація токенів при logout/видаленні додатка, delivery receipts, fallback на email/SMS.

## Why
Push = головний канал engagement. Silent pushes = real-time sync без polling. Rich = кращий UX.

## Sources
- docs/push-infrastructure.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- FCM / APNs docs
- iOS/Android guidelines

## dependencies
- T-080 (контекст `notifications` — push-канал)
- T-3100 (центр сповіщень — споживач інфраструктури)

> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
