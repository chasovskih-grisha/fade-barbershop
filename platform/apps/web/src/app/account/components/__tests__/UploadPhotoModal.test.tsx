import { render, screen, fireEvent } from '@testing-library/react';
import { UploadPhotoModal } from '../UploadPhotoModal';

describe('UploadPhotoModal Accessibility & Behavior', () => {
  it('renders modal with correct WCAG dialog attributes when open', () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();

    render(<UploadPhotoModal open={true} onClose={onClose} onComplete={onComplete} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');

    const heading = screen.getByText('Завантажити фото');
    expect(heading).toBeInTheDocument();

    const fileInput = screen.getByLabelText('Виберіть фото для завантаження');
    expect(fileInput).toBeInTheDocument();
  });

  it('closes when Escape key is pressed', () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();

    render(<UploadPhotoModal open={true} onClose={onClose} onComplete={onComplete} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();

    render(<UploadPhotoModal open={false} onClose={onClose} onComplete={onComplete} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
