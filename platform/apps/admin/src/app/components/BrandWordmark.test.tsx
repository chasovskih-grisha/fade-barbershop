import { render, screen } from '@testing-library/react';
import { Wordmark } from './BrandWordmark';

describe('BrandWordmark', () => {
  it('виводить марк «Fade · Admin» і текст «· Admin»', () => {
    render(<Wordmark title="Fade · Admin" />);

    // Декоративна іконка «Fade» — svg без label, а не role=img.
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('· Admin')).toBeInTheDocument();
  });

  it('дозволяє додати додатковий клас і пропускає решту пропсів', () => {
    const { container } = render(<Wordmark className="test-selector" data-testid="wordmark" />);

    expect(container.firstChild).toHaveClass('test-selector');
    expect(container.firstChild).toHaveAttribute('data-testid', 'wordmark');
  });

  it('рендерить марк без явного title', () => {
    render(<Wordmark />);

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('· Admin')).toBeInTheDocument();
  });
});
