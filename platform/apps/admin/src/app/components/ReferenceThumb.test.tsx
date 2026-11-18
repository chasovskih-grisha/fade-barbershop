// Мініатюра референсу (REF-ADM-01): підпис із сітки календаря не викликає
// запиту, а прострочений підпис (TTL 15 хв) падає на фолбек-запит за ID —
// один раз, без циклу. Без референсу — ні рендера, ні запиту.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReferenceThumb } from './ReferenceThumb';

describe('ReferenceThumb: підпис із сітки і фолбек', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('малює фото за підписом із сітки без жодного запиту', async () => {
    const fromGrid = 'https://signed.test/from-grid.jpg?ttl=900';
    render(<ReferenceThumb referenceId="ref-1" presignedUrl={fromGrid} />);

    expect(await screen.findByAltText('Референс зачіски')).toHaveAttribute('src', fromGrid);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('прострочений підпис: помилка зображення → один фолбек-запит за ID', async () => {
    const fresh = 'https://signed.test/fresh.jpg?ttl=900';
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ url: fresh }) });
    render(<ReferenceThumb referenceId="ref-1" presignedUrl="https://signed.test/expired.jpg" />);

    fireEvent.error(await screen.findByAltText('Референс зачіски'));

    await waitFor(() =>
      expect(screen.getByAltText('Референс зачіски')).toHaveAttribute('src', fresh)
    );
    expect(global.fetch).toHaveBeenCalledWith('/admin/reference-photos/ref-1', {
      credentials: 'include',
    });
  });

  it('без підпису із сітки — власний підписаний URL (шлях картки візиту)', async () => {
    const own = 'https://signed.test/own.jpg?ttl=900';
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ url: own }) });
    render(<ReferenceThumb referenceId="ref-1" />);

    expect(await screen.findByAltText('Референс зачіски')).toHaveAttribute('src', own);
    expect(global.fetch).toHaveBeenCalledWith('/admin/reference-photos/ref-1', {
      credentials: 'include',
    });
  });

  it('без референсу — нічого не рендерить і не запитує', () => {
    const { container } = render(
      <ReferenceThumb referenceId={null} presignedUrl="https://signed.test/x.jpg" />
    );

    expect(container).toBeEmptyDOMElement();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
