// T-4404: картка «Гроші дня» показує те, що порахував сервер, і мовчить,
// коли даних немає — жодних вигаданих нулів.
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DayMoneySummary, kyivToday } from '../DayMoneySummary';
import * as api from '@/lib/api/barber-day-money';

jest.mock('@/lib/api/barber-day-money', () => ({
  fetchBarberDayMoney: jest.fn(),
}));

const money = (over: Partial<api.BarberDayMoney> = {}): api.BarberDayMoney => ({
  date: '2026-11-26',
  visits: 2,
  completed: 1,
  expected: 500,
  collected: 450,
  outstanding: 50,
  byForm: { cash: 300, pos: 0, card: 150, certificate: 0 },
  ...over,
});

beforeEach(() => jest.clearAllMocks());

describe('DayMoneySummary', () => {
  it('показує прийняте, розбивку за формами і залишок', async () => {
    jest.spyOn(api, 'fetchBarberDayMoney').mockResolvedValue(money());

    render(<DayMoneySummary />);

    await waitFor(() => expect(screen.getByText('Гроші дня')).toBeInTheDocument());
    expect(screen.getByText('Лишилось отримати')).toBeInTheDocument();
    expect(screen.getByText('Завершених візитів: 1 із 2')).toBeInTheDocument();
  });

  it('мовчить, коли сервер не віддав зведення', async () => {
    jest.spyOn(api, 'fetchBarberDayMoney').mockResolvedValue(null);

    render(<DayMoneySummary />);

    await waitFor(() => expect(api.fetchBarberDayMoney).toHaveBeenCalled());
    expect(screen.queryByText('Гроші дня')).not.toBeInTheDocument();
  });

  it('питає саме київську добу', async () => {
    jest.spyOn(api, 'fetchBarberDayMoney').mockResolvedValue(null);

    render(<DayMoneySummary />);

    await waitFor(() => expect(api.fetchBarberDayMoney).toHaveBeenCalledWith(kyivToday()));
  });
});
