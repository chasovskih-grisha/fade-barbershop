// Попередження «зміна тривалості — лише для нових записів» видно до
// збереження: воно з'являється, щойно поле тривалості змінили (T-4618b).
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceDurationCell } from './ServiceDurationCell';
import type { CatalogService } from './service-types';

const service: CatalogService = {
  id: 's1',
  name: 'Стрижка',
  description: null,
  category: null,
  duration: 30,
  parallelDuration: null,
  active: true,
  prices: [],
  locations: [],
};

// Комірка — це <td>, тож у тесті її тримаємо в рядку таблиці (валідний DOM).
const renderCell = (onUpdate: (s: CatalogService, c: Partial<CatalogService>) => void) =>
  render(
    <table>
      <tbody>
        <tr>
          <ServiceDurationCell service={service} onUpdate={onUpdate} />
        </tr>
      </tbody>
    </table>
  );

describe('ServiceDurationCell — попередження про зміну тривалості', () => {
  it('не показує попередження, поки тривалість не змінили', () => {
    renderCell(() => {});
    expect(screen.queryByText(/лише до нових записів/)).not.toBeInTheDocument();
  });

  it('показує попередження, щойно тривалість змінили', () => {
    renderCell(() => {});
    fireEvent.change(screen.getByLabelText('Стрижка: тривалість'), { target: { value: '45' } });
    expect(screen.getByText(/лише до нових записів/)).toBeInTheDocument();
  });

  it('зберігає нову тривалість по blur', () => {
    const onUpdate = jest.fn();
    renderCell(onUpdate);
    const input = screen.getByLabelText('Стрижка: тривалість');
    fireEvent.change(input, { target: { value: '45' } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith(service, { duration: 45 });
  });
});
