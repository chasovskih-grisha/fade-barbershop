import { screen, fireEvent, waitFor } from '@testing-library/react';
import { rows, renderTable } from './visits-table.fixture';
import { visit } from './visit-card.fixture';

describe('перетягування візиту в сітці (T-4524a)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  it('джерело тягнеться, ціль того самого барбера — доступна', () => {
    const { container } = renderTable({});
    const [source, target] = rows(container);
    expect(source).toHaveAttribute('data-draggable', 'true');
    fireEvent.dragStart(source!);
    expect(source).toHaveAttribute('data-dragging', 'true');
    expect(target).toHaveAttribute('data-drop-target', 'true');
  });

  it('дроп на слот цілі переносить візит тією самою командою, що картка', async () => {
    const onRescheduled = jest.fn();
    const { container } = renderTable({ onRescheduled });
    const [source, target] = rows(container);
    fireEvent.dragStart(source!);
    fireEvent.dragOver(target!);
    fireEvent.drop(target!);
    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls.find(([u]) =>
        String(u).endsWith('/admin/appointments/apt-1/reschedule')
      ) as [string, { method: string; body: string }];
      expect(call).toBeTruthy();
      expect(call[1].method).toBe('POST');
      // Дата — з візиту, початок — ціль, кінець — початок + тривалість (1 год).
      expect(JSON.parse(call[1].body)).toEqual({
        date: '2026-09-28',
        start: '12:00',
        end: '13:00',
      });
    });
    expect(onRescheduled).toHaveBeenCalled();
  });

  it('чужий барбер не стає ціллю', () => {
    const { container } = renderTable({
      visits: [visit(), visit({ id: 'apt-2', bookingId: 'b-2', barberId: 'barber-2' })],
      barbers: [
        { id: 'barber-1', name: 'Іван' },
        { id: 'barber-2', name: 'Олег' },
      ],
    });
    const [source, target] = rows(container);
    fireEvent.dragStart(source!);
    expect(target).toHaveAttribute('data-drop-target', 'false');
    fireEvent.drop(target!);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('конфлікт слота (409) показує повідомлення, картка не оновлюється', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 409 });
    const onRescheduled = jest.fn();
    const { container } = renderTable({ onRescheduled });
    const [source, target] = rows(container);
    fireEvent.dragStart(source!);
    fireEvent.drop(target!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Слот зайнятий');
    expect(onRescheduled).not.toHaveBeenCalled();
  });

  it('термінальний візит не тягнеться', () => {
    const { container } = renderTable({ visits: [visit({ status: 'completed' })] });
    expect(rows(container)[0]).toHaveAttribute('data-draggable', 'false');
  });
});
