import { render, screen, fireEvent } from '@testing-library/react';
import AdminControlCenterWidget from './AdminControlCenterWidget';
import { offlineOutbox } from '../../lib/offline/outbox';

describe('AdminControlCenterWidget', () => {
  beforeEach(() => {
    localStorage.clear();
    offlineOutbox.clear();
  });

  test('renders control center widget with stable network status when queue is empty', () => {
    render(<AdminControlCenterWidget />);
    expect(screen.getByText('Центр управління та мережі')).toBeDefined();
    expect(screen.getByText('Мережа стабільна')).toBeDefined();
    expect(screen.getByText('Усі локальні мутації синхронізовано з сервером.')).toBeDefined();
  });

  test('allows toggling maintenance mode', () => {
    render(<AdminControlCenterWidget />);
    const toggleBtn = screen.getByRole('button', { name: 'Увімкнути техобслуговування' });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: 'Вимкнути техобслуговування' })).toBeDefined();
    expect(
      screen.getByText('Увага: увімкнено технічний режим для клієнтського сайту.')
    ).toBeDefined();
  });

  test('shows pending outbox count and allows sync', async () => {
    offlineOutbox.enqueue({
      endpoint: '/api/test',
      method: 'POST',
      payload: {},
      idempotencyKey: 'test_1',
    });

    render(<AdminControlCenterWidget />);
    expect(screen.getByText(/Черга: 1 незбережених/)).toBeDefined();

    const syncBtn = screen.getByRole('button', { name: 'Синхронізувати зараз' });
    fireEvent.click(syncBtn);

    await screen.findByText('Успішно синхронізовано мутацій: 1');
    expect(screen.getByText('Мережа стабільна')).toBeDefined();
  });
});
