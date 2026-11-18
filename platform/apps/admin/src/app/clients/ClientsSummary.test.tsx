// Стрічка підсумків списку клієнтів (T-4606b, admin-screens §6.1): KPI-картки
// + розподіли, період у селекті. Значення звіряємо на нормалізованому тексті
// (форматування ₴ містить нерозривний пробіл), формулу — у title картки.
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientsSummary, PERIOD_OPTIONS } from './ClientsSummary';
import { summaryFixture } from './client-list.fixtures';
import type { ClientListSummary } from './client-list-types';

function renderSummary(summary: ClientListSummary = summaryFixture, onPeriod = jest.fn()) {
  render(
    <ClientsSummary
      summary={summary}
      period="30d"
      onPeriod={onPeriod}
      locationName={(id) => (id === 'loc-1' ? 'Поділ' : id)}
    />
  );
  return { onPeriod };
}

/** textContent без нерозривних пробілів: форматування ₴ інакше не порівняти. */
const card = (key: string) =>
  (screen.getByTestId(`summary-${key}`).textContent ?? '').replace(/\u00a0/g, ' ');

describe('ClientsSummary', () => {
  it('показує KPI-картки §6.1 із значеннями з DTO', () => {
    renderSummary();
    expect(
      screen.getByRole('region', { name: 'Підсумки по фільтру клієнтів' })
    ).toBeInTheDocument();
    expect(card('total')).toContain('2');
    expect(card('visits')).toContain('5');
    expect(card('avgTicket')).toContain('900 ₴');
    expect(card('noShowRate')).toContain('20%');
  });

  it('формула показника лежить у title картки (без Tooltip-примітива)', () => {
    renderSummary();
    expect(screen.getByTestId('summary-avgTicket')).toHaveAttribute(
      'title',
      'AvgTicket = виручка / завершені візити'
    );
  });

  it('підписує вікно підсумків, щоб було видно, за що цифри', () => {
    renderSummary();
    expect(screen.getByText('10.09 – 10.10')).toBeInTheDocument();
  });

  it('період — контракт API: 7d/30d/90d, поточне значення в селекті', () => {
    renderSummary();
    expect(PERIOD_OPTIONS.map((option) => option.value)).toEqual(['7d', '30d', '90d']);
    expect(screen.getByLabelText('Період')).toHaveValue('30d');
  });

  it('зміна періоду віддає нове значення наверх (стан живе в URL)', () => {
    const { onPeriod } = renderSummary();
    fireEvent.change(screen.getByLabelText('Період'), { target: { value: '7d' } });
    expect(onPeriod).toHaveBeenCalledWith('7d');
    expect(onPeriod).toHaveBeenCalledTimes(1);
  });

  it('розподіли: лояльність і локація останнього візиту', () => {
    renderSummary();
    expect(screen.getByText('За лояльністю')).toBeInTheDocument();
    expect(screen.getByText('6 — безкоштовний')).toBeInTheDocument();
    expect(screen.getByText('За локацією останнього візиту')).toBeInTheDocument();
    expect(screen.getByText('Поділ')).toBeInTheDocument();
    // «Без візитів» є в обох розподілах — по одному рядку на кожен.
    expect(screen.getAllByText('Без візитів')).toHaveLength(2);
  });

  it('порожній фільтр показує нулі, а не порожню стрічку', () => {
    renderSummary({
      ...summaryFixture,
      total: 0,
      visits: 0,
      revenue: 0,
      avgTicket: 0,
      loyalty: { none: 0, progress: 0, freeVisit: 0, cycle: 0 },
      locations: { byLocation: [], noVisit: 0 },
    });
    expect(card('total')).toContain('0');
    expect(card('visits')).toContain('0');
    // Виручка й середній чек обидві нульові — це дві картки з тим самим «0 ₴».
    expect(screen.getAllByText('0 ₴')).toHaveLength(2);
    expect(screen.getAllByText('Без візитів')).toHaveLength(2);
  });
});
