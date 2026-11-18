# SLO — перші SLI, error budget і burn rate (Google SRE Book)

> **Статус:** реалізовано в dev-стеку 2026-09-29 (T-4204, слайс «SLO/error budget» з outstanding-списку задачі).
> **Підхід:** Google SRE Book, гл. 4 (SLO) і гл. 5-alerting (multiwindow burn rate): SLI = співвідношення **подій**, а не середнє; SLO = ціль на **ковзне вікно**, а не «середнє за місяць»; budget = скільки невдач ми собі купили; алерти — на **швидкість спалення**, не на кожен збій.
> **Зв'язки:** [observability.md](observability.md) §1 (джерела метрик), ADR 0009 (outbox), T-4204a/b/c/d (метрики, Prometheus, алерти, Grafana).

## 1. SLI — як вимірюємо (джерело правди)

Лічильник подій — `fade_http_requests_total{route,code}` (спільний модуль `shared/metrics/`, HTTP-middleware обліковує кожен запит; `/metrics` і `/health` свідомо НЕ рахуються — інфра-проби інакше надували б SLI; `route` — бакет першого сегмента шляху, без id/телефонів).

| SLI | Подія | Good | Bad |
|---|---|---|---|
| **Availability** | HTTP-відповідь api | код < 500 (`code!~"5xx"`) | 5xx |
| **Booking latency** | HTTP-запит до `/booking` | швидше за 500мс | ≥ 500мс (`fade_http_booking_slow_total`) |

Валідні події = усі обліковані запити (без фільтрацій). In-process лічильники — Prometheus скрейпить кожен інстанс api окремо, multi-container агрегація — `sum()` у запитах.

## 2. SLO і error budget — що обіцяємо

| SLO | Ціль | Вікно | Бюджет |
|---|---|---|---|
| Availability | 99.5% good | rolling 28d | 0.5% запитів = 5xx (≈3.6 год/28д) |
| Booking latency | 95% good | rolling 28d | 5% запитів ≥500мс |

Чому так: v1 без слів про надійність — 99.5% на 28 днів дає реальний бюджет (не 99.9%, який вимагає залізної дисципліни і зупинок деплоїв); booking latency цілиться в «слоти бачимо одразу» (REF-WEB-03) — 500мс на бекенд-частина пошуку слотів; бюджет 5% (звідти й burn-пороги 0.72/0.3 вище). Вікно 28d — сума SRE Book: місячні «середні» ховають довгі провали.

## 3. Error budget і burn rate — як рахуємо і на що алертимо

Burn rate = швидкість спалення бюджету, нормована: `1.0` = бюджет закінчується рівно за 28 днів; `14.4` = весь бюджет за 2 дні; `6` = за ~4.7 днів. Алертимо **multiwindow** (пара вікон, щоб не кричати на 30-секундні шипки): швидке `1h + 5m` і повільне `6h + 30m`.

**Availability** (частка 5xx = `bad`, budget 0.5% → пороги 14.4×0.5%=7.2% і 6×0.5%=3%):

```promql
# fast: AvailabilityBurnRateFast (critical, for: 2m)
(1 - (sum(rate(fade_http_requests_total{code!~"5xx"}[1h])) / sum(rate(fade_http_requests_total[1h])))) > 0.072
and
(1 - (sum(rate(fade_http_requests_total{code!~"5xx"}[5m])) / sum(rate(fade_http_requests_total[5m])))) > 0.072

# slow: AvailabilityBurnRateSlow (warning, for: 15m) — ті самі частки на 6h/30m > 0.03
```

**Booking latency** (частка повільних = `slow_total / requests{route="booking"}`, budget 5% → 14.4×5%=72% і 6×5%=30%): ті самі пари вікон, алерти `BookingLatencyBurnRateFast/Slow`.

Правила живуть у `infra/prometheus/alerts.yml` (група `slo-burn-rate`). Поточна невідповідність SRE-книжці, свідомо зафіксована: **NFR-пропусків немає, тому пауза критичних алертів — ручна** (кожен критичний burn = людина вирішує, продовжувати деплой чи ні; автоматика — з появою NFR).

## 4. Дашборд — де дивитись

Grafana → папка Fade → **«Fade — SLO та error budget»** (uid `fade-slo`, provisioning `infra/grafana/dashboards/fade-slo.json`): stat «залишок бюджету 28d» + SLI-таймсерія з лінією цілі + burn rate (1h/6h, лінії 6×/14.4×) для обох SLO, внизу — трафік по route × статус-клас і повільні `/booking`-запити. Запит залишку бюджету:

```promql
1 - ((1 - good_ratio_28d) / budget)   # 100% = свіжий період, ≤0% = SLO зламано
```

## 5. Що цього достатньо, а що ні

- **Довіряти**: тренд budget і burn на дашборді, алерти як механізм «зайняти інженера».
- **Не довіряти ще**: абсолютним числам availability у dev (трафіку мало — один 5xx на 20 запитів = бюджет під нуль; тож SLO тут — рамка і практика, а числа стануть значущими з реальним трафіком).
- **Поза межами**: прод-пороги й вікна (перегляд після тижня реального трафіку), NFR-квоти (T-003), прод-доставка алертів (T-4204c), RUM-SLI клієнтського web (фаза 23+).
