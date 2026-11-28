// T-083: діалог оплати візиту барбера — незалежно від списку.
// Вузька поверхня: сума до сплати і форма; депозит/фінальна ціна/чек — в адмінці.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { VisitPayDialog } from '../VisitPayDialog';
import * as api from '@/lib/api/barber-onsite';

jest.mock('@/lib/api/barber-onsite', () => ({
  getBarberOnsiteStatus: jest.fn(),
  payBarberOnsite: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

function status(over: Partial<api.BarberOnsiteStatus> = {}): api.BarberOnsiteStatus {
  return { bookingId: 'v1', amountDue: 420, paymentStatus: 'unpaid', ...over };
}

function renderWithStatus(value: api.BarberOnsiteStatus) {
  jest.spyOn(api, 'getBarberOnsiteStatus').mockResolvedValue(value);
  const onPay = jest.fn().mockResolvedValue(undefined);
  render(<VisitPayDialog bookingId="v1" open busy={false} onClose={jest.fn()} onPay={onPay} />);
  return { onPay };
}

describe('VisitPayDialog', () => {
  it('показує лише суму до сплати — без депозиту, фінальної ціни і чека', async () => {
    renderWithStatus(status());

    await waitFor(() => screen.getByText('Сума до сплати'));
    expect(screen.getByText(/420/)).toBeInTheDocument();
    expect(screen.queryByText('Депозит')).toBeNull();
    expect(screen.queryByText('Фінальна ціна')).toBeNull();
    expect(screen.queryByText('Чек')).toBeNull();
  });

  it('коли візит вже оплачено — немає кнопок оплати', async () => {
    renderWithStatus(status({ paymentStatus: 'captured' }));

    await waitFor(() => screen.getByText('Цей візит уже позначено оплаченим.'));
    expect(screen.queryByRole('button', { name: /позначити оплату/i })).toBeNull();
  });

  it('коли решти немає — каже, що додаткова оплата не потрібна', async () => {
    renderWithStatus(status({ amountDue: 0, paymentStatus: 'nothing_due' }));

    await waitFor(() => screen.getByText('Без оплати'));
    expect(screen.getByText('Додаткова оплата не потрібна.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /позначити оплату/i })).toBeNull();
  });

  it('коли послуга безкоштовна — каже, що оплата не потрібна', async () => {
    renderWithStatus(status({ amountDue: 0, paymentStatus: 'complimentary' }));

    await waitFor(() => screen.getByText('Без оплати'));
    expect(screen.getByText('Додаткова оплата не потрібна.')).toBeInTheDocument();
  });

  it('коли неоплачено — показує вибір форми і кнопку', async () => {
    const { onPay } = renderWithStatus(status());

    await waitFor(() => screen.getByText('Спосіб оплати'));
    expect(screen.getByRole('button', { name: 'Готівка' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Картка POS' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Картка POS' }));
    expect(screen.getByRole('button', { name: 'Позначити оплату' })).not.toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Позначити оплату' }));
    await waitFor(() => expect(onPay).toHaveBeenCalledWith('pos'));
  });

  it('обраний метод оплати зберігається між перемиканнями', async () => {
    renderWithStatus(status());

    await waitFor(() => screen.getByText('Спосіб оплати'));
    await userEvent.click(screen.getByRole('button', { name: 'Картка POS' }));
    expect(screen.getByRole('button', { name: 'Картка POS' })).toHaveClass(
      'border-semantic-success'
    );
    expect(screen.getByRole('button', { name: 'Готівка' })).not.toHaveClass(
      'border-semantic-success'
    );
  });

  it('помилка завантаження статусу показується у діалозі', async () => {
    jest.spyOn(api, 'getBarberOnsiteStatus').mockRejectedValueOnce(new Error('Мережа'));
    render(<VisitPayDialog bookingId="v1" open busy={false} onClose={jest.fn()} onPay={jest.fn()} />);

    await waitFor(() => screen.getByText('Мережа'));
  });

  it('закривається по кліку на оверлей', async () => {
    const onClose = jest.fn();
    render(<VisitPayDialog bookingId="v1" open busy={false} onClose={onClose} onPay={jest.fn()} />);

    await waitFor(() => screen.getByTestId('dialog-overlay'));
    await userEvent.click(screen.getByTestId('dialog-overlay'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
