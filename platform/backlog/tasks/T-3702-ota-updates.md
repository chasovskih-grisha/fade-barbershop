# T-3702 · OTA-оновлення

- **Stage**: M6 (phase 40) · **Tags**: frontend, devops, mobile · **Complexity**: middle · **Depends on**: T-3700
- **StoryPoints**: 10

## What
OTA-оновлення через CodePush / Expo Updates / Shorebird для React Native: миттєві оновлення JS-бандла без store review, обов'язкові/опціональні оновлення, rollback, таргетинг (версія/регіон/роль), метрики adoption, підписані бандли, A/B-тестування фіч через OTA.

## Why
Швидкі фікси без 24–48 год store review. Фіч-флаги в продакшені. Експерименти без релізу.

## Sources
- docs/ota-updates.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- CodePush / Expo / Shorebird

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
