import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceStep from '../steps/ServiceStep';
import BarberStep from '../steps/BarberStep';
import SlotStep from '../steps/SlotStep';

const DAYS = [{ date: '2026-11-09', label: 'Сьогодні', isMondayFirst: 0 }];

describe('Quick Booking Empty States (T-053at)', () => {
  it('ServiceStep shows empty state when services array is empty', () => {
    render(<ServiceStep services={[]} loading={false} onBack={() => {}} onSelect={() => {}} />);
    expect(screen.getByText('У цій локації послуг поки немає.')).toBeInTheDocument();
  });

  it('BarberStep shows empty state when barbers array is empty or only contains any-barber', () => {
    render(<BarberStep barbers={[]} loading={false} onBack={() => {}} onSelect={() => {}} />);
    expect(screen.getByText('У цій локації барберів ще немає.')).toBeInTheDocument();
  });

  it('SlotStep shows empty state when slots array is empty', () => {
    render(
      <SlotStep
        slots={[]}
        days={DAYS}
        date="2026-11-09"
        loading={false}
        selectedSlot={null}
        onDate={() => {}}
        onSelect={() => {}}
        onBack={() => {}}
        onNext={() => {}}
      />
    );
    expect(screen.getByText('На цю дату слотів немає')).toBeInTheDocument();
    expect(screen.getByText('Спробуйте іншу дату або іншого барбера.')).toBeInTheDocument();
  });
});

describe('Quick Booking Empty State CTAs (T-053at)', () => {
  it('порожні послуги ведуть назад до вибору локації', () => {
    const onBack = jest.fn();
    render(<ServiceStep services={[]} loading={false} onBack={onBack} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Обрати іншу локацію' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('порожні барбери ведуть назад до вибору послуги', () => {
    const onBack = jest.fn();
    render(<BarberStep barbers={[]} loading={false} onBack={onBack} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Повернутись до послуг' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('порожні слоти дають CTA змінити барбера', () => {
    const onBack = jest.fn();
    render(
      <SlotStep
        slots={[]}
        days={DAYS}
        date="2026-11-09"
        loading={false}
        selectedSlot={null}
        onDate={() => {}}
        onSelect={() => {}}
        onBack={onBack}
        onNext={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Обрати іншого барбера' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
