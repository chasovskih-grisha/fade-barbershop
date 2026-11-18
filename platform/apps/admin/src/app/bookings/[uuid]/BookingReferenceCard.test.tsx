// Рендер делеговано спільному `ReferenceThumb`, тож поведінка мініатюри тут
// перевіряється наскрізь через картку — інакше делегування не мало б доказів.
// Тест REF-BARBER-01: якщо картка повернеться до власного <Image> замість
// делегування ReferenceThumb, цей тест провалиться.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BookingReferenceCard } from './BookingReferenceCard';
import { detailFixture } from './booking-test-helpers';
import { ReferenceThumb } from '../../components/ReferenceThumb';

const signed = 'https://signed.test/photo.jpg?ttl=900';

const respond = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('BookingReferenceCard (REF-BARBER)', () => {
  it('бере підписаний URL і показує мініатюру', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond({ url: signed }));
    render(<BookingReferenceCard detail={detailFixture({ haircutReferenceId: 'photo-1' })} />);

    const img = await screen.findByAltText('Референс зачіски');
    expect(img).toHaveAttribute('src', signed);
    expect(global.fetch).toHaveBeenCalledWith('/admin/reference-photos/photo-1', {
      credentials: 'include',
    });
  });

  it('клік розгортає фото на повний розмір', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond({ url: signed }));
    render(<BookingReferenceCard detail={detailFixture({ haircutReferenceId: 'photo-1' })} />);

    const button = await screen.findByRole('button', { name: 'Референс зачіски' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('рендерить через спільний ReferenceThumb — не власний <Image> (REF-BARBER-01)', async () => {
    // Якщо картка перестане делегувати мініатюру і малюватиме власне фото,
    // цей тест провалиться: ReferenceThumb з referenceId=null не рендерить
    // нічого, тож кнопка з alt=«Референс зачіски» зникне. Підтверджуємо delegation
    // проти копіпасти <Image> в картці.
    const { container } = render(
      <ReferenceThumb referenceId={null} presignedUrl="https://signed.test/коїве.jpg" />
    );
    expect(container).toBeEmptyDOMElement();

    (global.fetch as jest.Mock).mockReturnValue(respond({ url: signed }));
    render(<BookingReferenceCard detail={detailFixture({ haircutReferenceId: 'photo-1' })} />);

    // Картка передає referenceId в ReferenceThumb — той рендерить button+Image.
    const thumb = await screen.findByRole('button', { name: 'Референс зачіски' });
    // ReferenceThumb кладе Image всередину button, а не обертає card в свій Image.
    const img = thumb.querySelector('img');
    if (!img) throw new Error('ReferenceThumb did not render an img inside the card button');
    expect(img.getAttribute('alt')).toBe('Референс зачіски');
    expect(img.getAttribute('src')).toBe(signed);
  });

  it('без фото, але з коментарем — чесний стан і жодного запиту', () => {
    render(<BookingReferenceCard detail={detailFixture({ haircutReferenceId: null })} />);
    expect(screen.getByText('Фото не прикріплене')).toBeInTheDocument();
    expect(screen.getByText('Без машинки')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('без референсу й без коментаря секція не рендериться (REF-BARBER-04)', () => {
    const { container } = render(
      <BookingReferenceCard detail={detailFixture({ haircutReferenceId: null, comment: null })} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('недоступний підписаний URL — «Фото недоступне», без падіння', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond({ message: 'Фото не знайдено' }, 404));
    render(<BookingReferenceCard detail={detailFixture({ haircutReferenceId: 'photo-1' })} />);

    expect(await screen.findByText('Фото недоступне')).toBeInTheDocument();
    expect(screen.queryByAltText('Референс зачіски')).toBeNull();
  });

  it('мережева помилка не лишає екран у стані завантаження', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error('network down')));
    render(<BookingReferenceCard detail={detailFixture({ haircutReferenceId: 'photo-1' })} />);

    await waitFor(() => expect(screen.queryByText('Завантаження…')).toBeNull());
    expect(screen.getByText('Фото недоступне')).toBeInTheDocument();
  });
});
