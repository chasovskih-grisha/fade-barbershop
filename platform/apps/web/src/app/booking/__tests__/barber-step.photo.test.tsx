// Картка барбера на екрані 2 (T-4610b): фото (опційно) + ім'я + чип локації;
// фолбек — Avatar з ініціалами, коли фото немає. Рейтинг/середній чек поруч не
// показуються (booking-flow.md:114 — лише після публічних відгуків).
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarberStep from '../steps/BarberStep';
import { type BarberDto } from '../types';

const NOOP = { onBack: () => {}, onSelect: () => {} };

const PHOTO_BARBER: BarberDto = {
  id: 'b1',
  name: 'Олексій',
  photo: {
    url: 'https://media.test/barbers/b1.webp',
    alt: 'Олексій, барбер',
    width: 96,
    height: 96,
  },
  locationName: 'Сіті Лейк',
};

const WITH_PHOTO: BarberDto[] = [{ id: '', name: 'Будь-який барбер', any: true }, PHOTO_BARBER];

const WITHOUT_PHOTO: BarberDto[] = [
  { id: '', name: 'Будь-який барбер', any: true },
  { id: 'b2', name: 'Іван', photo: null, locationName: 'Сіті Лейк' },
];

describe('BarberStep card (T-4610b)', () => {
  it('показує фото, ім`я і чип локації для барбера з фото', () => {
    render(<BarberStep barbers={WITH_PHOTO} {...NOOP} />);

    const img = screen.getByAltText('Олексій, барбер');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://media.test/barbers/b1.webp');
    expect(img).toHaveAttribute('width', '96');
    expect(img).toHaveAttribute('height', '96');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('Олексій')).toBeInTheDocument();
    expect(screen.getByText('Сіті Лейк')).toBeInTheDocument();
  });

  it('без фото фолбекається на Avatar з ініціалами, картка не ламається', () => {
    render(<BarberStep barbers={WITHOUT_PHOTO} {...NOOP} />);

    expect(screen.queryByRole('img', { name: /Іван, барбер/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Avatar: Іван' })).toBeInTheDocument();
    expect(screen.getByText('Іван')).toBeInTheDocument();
  });

  it('«Будь-який барбер» — перша опція без фото', () => {
    render(<BarberStep barbers={WITH_PHOTO} {...NOOP} />);

    expect(screen.getByText('Будь‑який барбер')).toBeInTheDocument();
  });

  it('обрана картка бере кістяну плитку слота, а не ring (T-4742b)', () => {
    render(<BarberStep barbers={WITH_PHOTO} {...NOOP} />);

    const card = screen.getByText('Олексій').closest('[role="button"]');
    const anyCard = screen.getByText('Будь‑який барбер').closest('[role="button"]');
    if (!card || !anyCard) throw new Error('Картки барберів не знайдено');

    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(anyCard.className).not.toContain('bg-accent');

    fireEvent.click(card);

    const selectedCard = screen.getByText('Олексій').closest('[role="button"]');
    if (!selectedCard) throw new Error('Обрану картку барбера не знайдено');
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true');
    expect(selectedCard.className).toContain('bg-accent');
    expect(selectedCard.className).toContain('text-accent-fg');
    expect(selectedCard.className).toContain('font-medium');
    expect(selectedCard.className).not.toContain('ring-fg');
    expect(selectedCard.className).not.toContain('bg-surface-raised');
    expect(anyCard.className).not.toContain('bg-accent');
  });

  it('не показує рейтинг чи середній чек поруч із фото', () => {
    render(<BarberStep barbers={WITH_PHOTO} {...NOOP} />);

    expect(screen.queryByText(/рейтинг/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/середн/i)).not.toBeInTheDocument();
  });

  it('картка барбера з фото — снапшот', () => {
    render(<BarberStep barbers={[PHOTO_BARBER]} {...NOOP} />);

    expect(screen.getByText('Олексій').closest('[role="button"]')).toMatchSnapshot();
  });
});
