import { createElement as mockCreateElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LocationGallery from '../LocationGallery';

// T-4834a: фото відкривається в діалозі з повним підписом, сусідами й
// закриттям; порожня галерея не малює нічого.

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', {
      alt: String(props.alt),
      src: String(props.src),
      className: String(props.className ?? ''),
    }),
}));

const photo = (sortOrder: number, caption: string | null) => ({
  url: `https://cdn.example.com/${sortOrder}.jpg`,
  caption,
  sortOrder,
  width: 1200,
  height: 800,
});

const photos = [photo(1, 'Друге фото'), photo(0, 'Перше фото — довгий підпис краєвиду студії')];

describe('Галерея локації (T-4834a)', () => {
  it('порожній список не малює ні заголовка, ні сітки', () => {
    const { container } = render(<LocationGallery photos={[]} />);
    expect(container.textContent).toBe('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('клік відкриває кадр із повним підписом, а Escape закриває й повертає фокус', () => {
    render(<LocationGallery photos={photos} />);

    const opener = screen.getByRole('button', { name: 'Відкрити фото: Перше фото — довгий підпис краєвиду студії' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Фото 1 з 2' });
    expect(dialog.textContent).toContain('Перше фото — довгий підпис краєвиду студії');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('наступне й попереднє гортаються по колу в порядку sortOrder', () => {
    render(<LocationGallery photos={photos} />);
    fireEvent.click(screen.getByRole('button', { name: /Відкрити фото: Перше фото/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Наступне' }));
    expect(screen.getByRole('dialog', { name: 'Фото 2 з 2' }).textContent).toContain('Друге фото');

    fireEvent.click(screen.getByRole('button', { name: 'Наступне' }));
    expect(screen.getByRole('dialog', { name: 'Фото 1 з 2' }).textContent).toContain('Перше фото');

    fireEvent.click(screen.getByRole('button', { name: 'Попереднє' }));
    expect(screen.getByRole('dialog', { name: 'Фото 2 з 2' }).textContent).toContain('Друге фото');
  });

  it('клік по фону закриває діалог, а зменшений рух не масштабує мініатюру', () => {
    render(<LocationGallery photos={photos} />);
    const opener = screen.getByRole('button', { name: /Відкрити фото: Перше фото/ });
    fireEvent.click(opener);

    fireEvent.click(screen.getByTestId('gallery-backdrop'));
    expect(screen.queryByRole('dialog')).toBeNull();

    const thumb = screen.getByRole('button', { name: /Відкрити фото: Перше фото/ });
    const image = thumb.querySelector('img');
    expect(image?.className).toContain('motion-reduce:transition-none');
  });
});
