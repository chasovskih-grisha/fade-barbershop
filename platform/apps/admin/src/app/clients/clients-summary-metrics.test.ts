// Презентація стрічки підсумків (T-4606b): підписи, значення, формули й
// розподіли — чиста функція від DTO. Тест читає цифри без рендера DOM, тож
// помилка «показали не те поле» видна як зламана пара label/value.
import { summaryFixture } from './client-list.fixtures';
import {
  locationRows,
  loyaltyRows,
  percent,
  summaryMetrics,
  windowLabel,
} from './clients-summary-metrics';

describe('percent', () => {
  it('частка 0..1 → відсотки без дробів', () => {
    expect(percent(0)).toBe('0%');
    expect(percent(0.3333)).toBe('33%');
    expect(percent(0.5)).toBe('50%');
    expect(percent(1)).toBe('100%');
  });
});

describe('windowLabel', () => {
  it('ISO-межі вікна → «10.09 – 10.10» без таймзон', () => {
    expect(windowLabel(summaryFixture)).toBe('10.09 – 10.10');
  });
});

describe('summaryMetrics', () => {
  it('ключі — контракт стрічки §6.1 у порядку «скільки клієнтів → як часто вертаються»', () => {
    expect(summaryMetrics(summaryFixture).map((metric) => metric.key)).toEqual([
      'total',
      'newClients',
      'visits',
      'revenue',
      'avgTicket',
      'noShowRate',
      'quiet',
      'repeatShare',
    ]);
  });

  const value = (key: string) =>
    summaryMetrics(summaryFixture).find((metric) => metric.key === key)?.value;

  it('total у стрічці — те саме число, що в таблиці (summary.total === total)', () => {
    expect(value('total')).toBe('2');
  });

  it('значення беруться з відповідних полів DTO', () => {
    expect(value('newClients')).toBe('1');
    expect(value('visits')).toBe('5');
    expect(value('noShowRate')).toBe('20%');
    expect(value('repeatShare')).toBe('50%');
    // «Тихі 90+» показують і кількість, і частку: абсолютне число важливіше.
    expect(value('quiet')).toBe('1 · 50%');
  });

  it('кожна картка має формулу для tooltip (T-111, ANL-ADM-02)', () => {
    for (const metric of summaryMetrics(summaryFixture)) {
      expect(metric.formula.length).toBeGreaterThan(0);
      expect(metric.label.length).toBeGreaterThan(0);
    }
    const formulas = summaryMetrics(summaryFixture)
      .map((metric) => metric.formula)
      .join(' ');
    expect(formulas).toContain('AvgTicket = виручка / завершені візити');
    expect(formulas).toContain('NoShowRate');
  });
});

describe('розподіли', () => {
  it('лояльність — 4 кошики LYL-004…007 (безкоштовний на 6)', () => {
    expect(loyaltyRows(summaryFixture)).toEqual([
      { label: 'Без візитів', count: 1 },
      { label: '1–5', count: 1 },
      { label: '6 — безкоштовний', count: 0 },
      { label: '7+', count: 0 },
    ]);
  });

  it('локації — назви з довідника, невідомий id лишається id', () => {
    const rows = locationRows(summaryFixture, (id) => (id === 'loc-1' ? 'Поділ' : id));
    expect(rows).toEqual([
      { label: 'Поділ', count: 1 },
      { label: 'Без візитів', count: 1 },
    ]);
  });

  it('ід локації без назви лишається як є — цифри важливіші за підпис', () => {
    expect(locationRows(summaryFixture, (id) => id)).toEqual([
      { label: 'loc-1', count: 1 },
      { label: 'Без візитів', count: 1 },
    ]);
  });
});
