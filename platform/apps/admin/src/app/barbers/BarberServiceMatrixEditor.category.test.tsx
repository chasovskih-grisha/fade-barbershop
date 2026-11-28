import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BarberServiceMatrixEditor from './BarberServiceMatrixEditor';

// T-4521b: режим «за категоріями» — вибір категорії вимикає послуги поза нею,
// повернення категорії вмикає її послуги; послуги без категорії — «Без категорії».
const locations = [{ id: 'loc-1', name: 'Сіті Лейк' }];
const catalog = [
  {
    id: 'svc-1',
    name: 'Стрижка',
    category: 'Волосся',
    active: true,
    prices: [{ locationId: 'loc-1', active: true }],
  },
  {
    id: 'svc-2',
    name: 'Борода',
    category: 'Борода і гоління',
    active: true,
    prices: [{ locationId: 'loc-1', active: true }],
  },
  { id: 'svc-4', name: 'Дитяча', active: true, prices: [{ locationId: 'loc-1', active: true }] },
  { id: 'svc-3', name: 'Чужа', active: true, prices: [{ locationId: 'loc-2', active: true }] },
];

const io = '/admin/barber-service';
const response = (payload: object) => ({ ok: true, json: async () => payload });
const pickLocation = () =>
  fireEvent.change(screen.getByLabelText('Локація матриці барбера b1'), {
    target: { value: 'loc-1' },
  });

function mockLoad(rows: { serviceId: string }[]) {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(response(catalog))
    .mockResolvedValueOnce(response({ services: rows }))
    .mockResolvedValue(response({}));
}

describe('BarberServiceMatrixEditor — категорії (T-4521b)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('category mode deactivates services outside the chosen categories', async () => {
    mockLoad([]);
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);
    pickLocation();
    fireEvent.click(await screen.findByLabelText('За категоріями'));
    fireEvent.click(await screen.findByLabelText('Борода і гоління'));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${io}/assignments/b1/loc-1/svc-2/deactivate`,
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    expect(screen.getByLabelText('Стрижка')).toBeChecked();
  });

  it('turning a category back on activates its services', async () => {
    mockLoad([{ serviceId: 'svc-1' }]);
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);
    pickLocation();
    fireEvent.click(await screen.findByLabelText('За категоріями'));
    await waitFor(() => expect(screen.getByLabelText('Борода')).not.toBeChecked());
    fireEvent.click(screen.getByLabelText('Борода'));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${io}/assignments`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ barberId: 'b1', locationId: 'loc-1', serviceId: 'svc-2' }),
        })
      )
    );
  });

  it('services without a category are grouped as "Без категорії"', async () => {
    mockLoad([]);
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);
    pickLocation();
    fireEvent.click(await screen.findByLabelText('За категоріями'));
    fireEvent.click(await screen.findByLabelText('Без категорії'));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        `${io}/assignments/b1/loc-1/svc-4/deactivate`,
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });
});
