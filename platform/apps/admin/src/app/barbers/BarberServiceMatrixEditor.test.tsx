import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BarberServiceMatrixEditor from './BarberServiceMatrixEditor';

// T-4521: матриця «послуги барбера» — порожні рядки = «усі послуги»
// (fallback), перше зняття чекбокса створює рядки решти; далі — почергові POST/PATCH.
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

describe('BarberServiceMatrixEditor (T-4521)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('shows all location services checked when the matrix is empty (default "all")', async () => {
    mockLoad([]);
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);
    pickLocation();
    expect(await screen.findByLabelText('Стрижка')).toBeChecked();
    expect(screen.getByLabelText('Борода')).toBeChecked();
    expect(screen.queryByLabelText('Чужа')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Дитяча')).toBeChecked();
  });

  it('first uncheck materializes rows for the remaining services', async () => {
    mockLoad([]);
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);
    pickLocation();
    fireEvent.click(await screen.findByLabelText('Борода'));
    await waitFor(() => expect(screen.getByLabelText('Борода')).not.toBeChecked());
    expect(screen.getByLabelText('Стрижка')).toBeChecked();
    expect(global.fetch).toHaveBeenCalledWith(
      `${io}/assignments`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ barberId: 'b1', locationId: 'loc-1', serviceId: 'svc-1' }),
      })
    );
  });

  it('explicit mode toggles one row at a time (POST / PATCH)', async () => {
    mockLoad([{ serviceId: 'svc-1' }]);
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);
    pickLocation();
    expect(await screen.findByLabelText('Стрижка')).toBeChecked();
    expect(screen.getByLabelText('Борода')).not.toBeChecked();
    fireEvent.click(screen.getByLabelText('Борода'));
    await waitFor(() => expect(screen.getByLabelText('Борода')).toBeChecked());
    expect(global.fetch).toHaveBeenLastCalledWith(
      `${io}/assignments`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ barberId: 'b1', locationId: 'loc-1', serviceId: 'svc-2' }),
      })
    );
    fireEvent.click(screen.getByLabelText('Стрижка'));
    await waitFor(() => expect(screen.getByLabelText('Стрижка')).not.toBeChecked());
    expect(global.fetch).toHaveBeenLastCalledWith(
      `${io}/assignments/b1/loc-1/svc-1/deactivate`,
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('shows no matrix panels until a location is picked', async () => {
    render(<BarberServiceMatrixEditor barberId="b1" locations={locations} />);

    expect(screen.getByLabelText('Локація матриці барбера b1')).toHaveValue('');
    expect(screen.queryByLabelText('Режим матриці')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Послуги локації')).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
