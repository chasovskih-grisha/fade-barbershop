# T-3102 · Webhook-шлюз

- **Stage**: M6 (phase 40) · **Tags**: backend, integration, devops · **Complexity**: middle · **Depends on**: T-3100, T-3802
- **StoryPoints**: 15

## What
Webhook система для 3rd-party: календар (Google/Outlook), бухгалтерія (QuickBooks/Xero), CRM (HubSpot/Pipedrive), analytics (GA4/Mixpanel). HMAC підпис, retry policy, dead-letter queue, адмін UI для підписок/фільтрів, тестовий режим.

## Why
Інтеграції без polling. Реальний час для зовнішніх систем. Стандартизований контракт.

## Sources
- ADR 0002 (модульний моноліт: зовнішні інтеграції через порти; джерело: README notifications)

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
