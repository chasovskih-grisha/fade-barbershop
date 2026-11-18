// Референс зачіски в картці дня (REF-ADM-01): мініатюра береться підписаним
// URL, клік розгортає на повний розмір, поруч — коментар клієнта. Без
// референсу й без коментаря секція не рендериться (REF-BARBER-04-семантика).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VisitCard from './VisitCard';
import { visit } from './visit-card.fixture';

jest.spyOn(console, 'error').mockImplementation(() => {});

const signed = 'https://signed.test/photo.jpg?ttl=900';

const respond = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('VisitCard: референс зачіски й коментар', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('показує мініатюру за підписаним URL і коментар замість маркера', async () => {
    const signed = 'https://signed.test/ref.jpg?ttl=900';
    (global.fetch as jest.Mock).mockReturnValue(respond({ url: signed }));
    render(
      <VisitCard
        visit={visit({ haircutReferenceId: 'ref-1', comment: 'Зняти на 2 мм' })}
        onDone={jest.fn()}
      />
    );

    const img = await screen.findByAltText('Референс зачіски');
    expect(img).toHaveAttribute('src', signed);
    expect(screen.getByText('Зняти на 2 мм')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/admin/reference-photos/ref-1', {
      credentials: 'include',
    });
  });

  it('REF-ADM-01: URL із сітки календаря — мініатюра без окремого запиту на картку', async () => {
    const fromGrid = 'https://signed.test/from-grid.jpg?ttl=900';
    render(
      <VisitCard
        visit={visit({ haircutReferenceId: 'ref-1', referencePhotoUrl: fromGrid })}
        onDone={jest.fn()}
      />
    );

    expect(await screen.findByAltText('Референс зачіски')).toHaveAttribute('src', fromGrid);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('клік по мініатюрі розгортає фото на повний розмір', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond({ url: 'https://signed.test/ref.jpg' }));
    render(<VisitCard visit={visit({ haircutReferenceId: 'ref-1' })} onDone={jest.fn()} />);

    const button = await screen.findByRole('button', { name: 'Референс зачіски' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('підпис не вдався — чесний стан «Фото недоступне» з коментарем', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond({ message: 'Нема' }, 404));
    render(
      <VisitCard
        visit={visit({ haircutReferenceId: 'ref-1', comment: 'Класика' })}
        onDone={jest.fn()}
      />
    );

    expect(await screen.findByText('Фото недоступне')).toBeInTheDocument();
    expect(screen.getByText('Класика')).toBeInTheDocument();
    expect(screen.queryByAltText('Референс зачіски')).toBeNull();
  });

  it('без референсу й без коментаря — жодного запиту і жодної секції', () => {
    render(<VisitCard visit={visit()} onDone={jest.fn()} />);

    expect(screen.queryByAltText('Референс зачіски')).toBeNull();
    expect(screen.queryByText('Фото недоступне')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('REF-ADM-01: картка делегує мініатюру в ReferenceThumb — не власне <Image> (REF-ADM-01-делегація)', async () => {
    // Якщо картка перестане делегувати мініатюру і малюватиме власне фото,
    // або візуалізуватиме URL без ReferenceThumb, цей тест має провалитися:
    // ReferenceThumb з referenceId=null не рендерить нічого, тож кнопка
    // з alt=«Референс зачіски» зникне. Підтверджуємо delegation проти
    // копіпасти <Image> в картці.
    (global.fetch as jest.Mock).mockReturnValue(respond({ url: signed }));
    render(<VisitCard visit={visit({ haircutReferenceId: 'ref-1' })} onDone={jest.fn()} />);

    const thumb = await screen.findByRole('button', { name: 'Референс зачіски' });
    const img = thumb.querySelector('img');
    if (!img) throw new Error('VisitReference did not render an img inside ReferenceThumb');
    expect(img.getAttribute('alt')).toBe('Референс зачіски');
    expect(img.getAttribute('src')).toBe(signed);

    // Без референсу картка не рендерить свій <Image> — вона не має його.
    const withoutRef = render(<VisitCard visit={visit()} onDone={jest.fn()} />);
    expect(withoutRef.container.querySelector('img[alt="Референс зачіски"]')).toBeNull();
  });

  it('коментар без фото показується без запиту по референс', () => {
    render(
      <VisitCard visit={visit({ comment: 'Без фото, але з побажанням' })} onDone={jest.fn()} />
    );

    expect(screen.getByText('Без фото, але з побажанням')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('мережева помилка не лишає картку в стані завантаження', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error('network down')));
    render(<VisitCard visit={visit({ haircutReferenceId: 'ref-1' })} onDone={jest.fn()} />);

    await waitFor(() => expect(screen.queryByText('Завантаження…')).toBeNull());
    expect(screen.getByText('Фото недоступне')).toBeInTheDocument();
  });
});
