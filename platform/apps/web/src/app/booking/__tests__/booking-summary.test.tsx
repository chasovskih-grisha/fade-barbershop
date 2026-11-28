// Специфікація піна флоу (T-4711b): факти з'являються лише після рішення,
// барбер — з кроку барбера, порожній id на тому кроці = «Будь-який барбер»,
// чіп ранішого кроку веде тим самим сетером, що й «Назад».
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingSummary from '../BookingSummary';
import type { SummaryFlow } from '../BookingSummary';

const LOCATION = { id: 'loc-1', name: 'Сіті Лейк', address: 'вул. Тестова' };
const SERVICE = { id: 'svc-1', name: 'Чоловіча стрижка', duration: 50, price: 600 };
const BARBERS = [{ id: 'barber-1', name: 'Олексій' }];
const SLOT = { start: '14:00', end: '14:30', barbers: [] };

function flowOf(overrides: Partial<SummaryFlow> = {}): SummaryFlow {
  return {
    step: 1,
    location: LOCATION,
    service: SERVICE,
    barbers: BARBERS,
    barberId: '',
    slot: null,
    partyMode: null,
    setStep: jest.fn(),
    ...overrides,
  };
}

const pin = () => screen.queryByRole('region', { name: 'Ваш запис' });

it('не показує пін, поки локацію не обрано', () => {
  render(<BookingSummary flow={flowOf({ step: 0, location: null, service: null })} />);

  expect(pin()).not.toBeInTheDocument();
});

it('не показує пін на екрані успіху', () => {
  render(<BookingSummary flow={flowOf({ step: 7, slot: SLOT })} />);

  expect(pin()).not.toBeInTheDocument();
});

it('показує обрану локацію та послугу без підрахунку ціни в піні', () => {
  render(<BookingSummary flow={flowOf({ step: 2 })} />);

  expect(screen.getByText('Сіті Лейк')).toBeInTheDocument();
  expect(screen.getByText('Чоловіча стрижка, 50 хв, 600 ₴')).toBeInTheDocument();
});

it('чіп послуги веде на крок послуги тим самим сетером', () => {
  const setStep = jest.fn();
  render(<BookingSummary flow={flowOf({ step: 3, setStep })} />);

  fireEvent.click(
    screen.getByRole('button', { name: 'Змінити послугу, Чоловіча стрижка, 50 хв, 600 ₴' })
  );

  expect(setStep).toHaveBeenCalledWith(1);
});

it('порожній id барбера на кроці барбера = «Будь-який барбер»', () => {
  render(<BookingSummary flow={flowOf({ step: 3 })} />);

  expect(screen.getByText('Будь-який барбер')).toBeInTheDocument();
});

it('не показує барбера до кроку барбера', () => {
  render(<BookingSummary flow={flowOf({ step: 2, barberId: 'barber-1' })} />);

  expect(screen.queryByText('Олексій')).not.toBeInTheDocument();
});

it('обраний слот стає фактом часу і оголошується один раз', () => {
  render(<BookingSummary flow={flowOf({ step: 3, slot: SLOT })} />);

  expect(screen.getByText('14:00–14:30')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Обрано 14:00–14:30');
});
