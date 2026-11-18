// Фільтр результату й сортування журналу входів.
import { render, screen, fireEvent } from '@testing-library/react';
import LoginsTable from './LoginsTable';

// prettier-ignore
const entries = [
  { ts: '2026-09-29T12:00:00.000Z', username: 'support', ok: false },
  { ts: '2026-09-29T10:00:00.000Z', username: 'owner', ok: true },
];

const rows = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent ?? '');

describe('LoginsTable — фільтр результату', () => {
  it('«Невдалі» лишає лише невдалі входи', () => {
    render(<LoginsTable entries={entries} />);
    fireEvent.change(screen.getByLabelText('Результат'), { target: { value: 'fail' } });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toContain('support');
  });

  it('«Успішні» лишає успішні', () => {
    render(<LoginsTable entries={entries} />);
    fireEvent.change(screen.getByLabelText('Результат'), { target: { value: 'ok' } });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toContain('owner');
  });
});

describe('LoginsTable — сортування', () => {
  it('дефолт — час спадно (новіші зверху); клік по «Час» — висхідно', () => {
    render(<LoginsTable entries={entries} />);
    expect(rows()[0]).toContain('support'); // 12:00 перед 10:00
    fireEvent.click(screen.getByRole('button', { name: /Час/ }));
    expect(rows()[0]).toContain('owner');
  });
});
