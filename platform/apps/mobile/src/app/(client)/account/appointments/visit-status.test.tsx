// T-4739b: рядок візиту показує слово кабінету сайту, а не збережений enum, і
// не має hex-літералів; порожній стан не показує шлях `/booking`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { tokens } from '@fade/design-tokens';
import { AppointmentRow } from './list-item';
import { VisitsBody } from './visits-body';
import { makeVisit } from './fixtures';
import { visitStatusBadge } from './visit-status';

jest.mock('../../../../lib/api/reference-photo', () => ({
  getReferencePhotoUrl: jest.fn(async () => null),
  uploadReferencePhoto: jest.fn(),
}));

const rowProps = {
  editing: false,
  busy: false,
  error: null,
  onEditReference: jest.fn(),
  onCancelEdit: jest.fn(),
  onSaveReference: jest.fn(),
};

describe('visit-status (T-4739b)', () => {
  it('дає українські слова кабінету сайту для чотирьох статусів', () => {
    expect(visitStatusBadge('upcoming').label).toBe('Очікується');
    expect(visitStatusBadge('confirmed').label).toBe('Підтверджено');
    expect(visitStatusBadge('completed').label).toBe('Завершено');
    expect(visitStatusBadge('cancelled').label).toBe('Скасовано');
  });

  it('колір бейджа — токен теми, не hex', () => {
    expect(visitStatusBadge('confirmed').color).toBe(tokens.color.semantic.success.value);
    expect(visitStatusBadge('cancelled').color).toBe(tokens.color.text.dangerText.value);
  });
});

describe('рядок візиту (T-4739b)', () => {
  it('підтверджений візит показує «Підтверджено», а не `confirmed`', () => {
    render(<AppointmentRow app={makeVisit({ status: 'confirmed' })} {...rowProps} />);
    expect(screen.getByText('Підтверджено')).toBeTruthy();
    expect(screen.queryByText('confirmed')).toBeNull();
  });

  it('скасований візит показує «Скасовано», а не `cancelled`', () => {
    render(<AppointmentRow app={makeVisit({ status: 'cancelled' })} {...rowProps} />);
    expect(screen.getByText('Скасовано')).toBeTruthy();
    expect(screen.queryByText('cancelled')).toBeNull();
  });

  it('файли рядка не містять hex-літералів', () => {
    for (const file of ['list-item.tsx', 'list-item-styles.ts', 'visit-status.ts']) {
      const source = readFileSync(join(__dirname, file), 'utf8');
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});

describe('порожній стан і заголовок (T-4739b)', () => {
  const emptyProps = {
    error: null,
    loading: false,
    statusFilter: 'all' as const,
    onFilter: jest.fn(),
    onRetry: jest.fn(),
    onBook: jest.fn(),
    upcoming: [],
    past: [],
    total: 0,
    row: () => null,
  };

  it('порожній стан каже «Записатися» без шляху `/booking`', () => {
    render(<VisitsBody {...emptyProps} />);
    expect(screen.getByText('Записатися')).toBeTruthy();
    expect(screen.queryByText(/\/booking/)).toBeNull();
  });

  it('заголовок не обіцяє переносу, поки дії немає', () => {
    render(<VisitsBody {...emptyProps} />);
    expect(screen.queryByText(/перенос/)).toBeNull();
  });
});
