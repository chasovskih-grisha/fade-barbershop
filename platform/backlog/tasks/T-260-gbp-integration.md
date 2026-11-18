# T-260 · Google Business Profile (конфігураційна)

- **Stage**: M5 (phase 24; можлива ще до запуску) · **Tags**: integration · **Complexity**: junior · **Depends on**: T-021, T-080, T-4532
- **StoryPoints**: 3

## What

GBP-001…008: посилання запису `https://fade.com.ua/booking/{location-code}` з UTM `google/gbp` на профілі кожної локації; push після візиту — **дві рівноцінні кнопки** (приватний відгук / «Оцінити в Google» — `ReviewChannelChoice`, без гейтингу GBP-004); поля `GbpProfileUrl`/`GbpReviewUrl` на локації; QR для залу; статистика каналу. Без API Google — платформа тримає посилання.

## Sources

- `GBP-001…008`, `GBP-ADM-01…04`; `20-gbp-integration.md`; notifications README (`ReviewChannelChoice`)

## Done

- [ ] Профілі ведуть у запис; кнопка вибору каналу в push

## Risks

- [ ] **Без API Google**: конфігураційна задача — NAP-консистентність по мережі

