# T-3602 · Комплаєнс платежів

- **Stage**: M5 (phase 30) · **Tags**: backend, integration, security, high-risk · **Complexity**: senior · **Depends on**: T-090, T-091, T-092
- **StoryPoints**: 15

## What
PCI DSS SAQ-A (еквайринг винесено), токенізація карт, 3D Secure 2.0, fraud detection (Stripe Radar / власні правила), chargeback management, reconciliation, PSP fallback, тестові карти, верифікація SAQ щороку.

## Why
Безпека платежів. Уникнення штрафів PCI. Довіра клієнтів. Стабільність еквайрингу.

## Sources
- PCI DSS v4.0
- docs/payment-compliance.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- PSP docs

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
