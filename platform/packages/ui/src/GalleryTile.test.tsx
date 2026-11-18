import { render, screen } from '@testing-library/react';
import { GalleryTile } from './GalleryTile';

const before = { src: 'before.jpg', alt: 'До' };
const after = { src: 'after.jpg', alt: 'Після' };

describe('GalleryTile', () => {
  it('рендерить пару before/after', () => {
    render(<GalleryTile before={before} after={after} />);
    expect(screen.getByAltText('До')).toBeTruthy();
    expect(screen.getByAltText('Після')).toBeTruthy();
  });

  it('показує AI-бейдж і підпис', () => {
    render(<GalleryTile before={before} after={after} ai caption="Стрижка" />);
    expect(screen.getByText('AI')).toBeTruthy();
    expect(screen.getByText('Стрижка')).toBeTruthy();
  });

  it('прокидує HTML атрибути', () => {
    render(<GalleryTile before={before} after={after} data-testid="gallery-tile" />);
    expect(screen.getByTestId('gallery-tile')).toBeTruthy();
  });
});
