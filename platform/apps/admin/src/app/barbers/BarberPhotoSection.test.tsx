// Секція «Фото барбера» (T-4610a): consent-чекбокс обов'язковий до публікації,
// alt обов'язковий, дата оновлення видима (ризик «застаріле фото», ADR 0015).
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarberPhotoSection from './BarberPhotoSection';
import type { BarberPhotoDto } from './use-barbers-directory';

// jsdom не має createObjectURL — компонент робить прев'ю локального файлу.
beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
});

const PHOTO: BarberPhotoDto = {
  url: 'https://media.test/barbers/b1.webp',
  alt: 'Іван, барбер',
  consentAt: '2026-11-12T10:00:00.000Z',
  consentBy: 'admin-1',
  updatedAt: '2026-11-12T10:00:00.000Z',
};

function renderSection(photo: BarberPhotoDto | null) {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onRemove = jest.fn().mockResolvedValue(undefined);
  render(
    <BarberPhotoSection
      barberId="b1"
      initialPhoto={photo}
      onSave={onSave}
      onRemove={onRemove}
      saving={false}
    />
  );
  return { onSave, onRemove };
}

function uploadFile() {
  const file = new File(['x'], 'photo.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Завантажити фото'), { target: { files: [file] } });
}

describe('BarberPhotoSection (T-4610a)', () => {
  it('показує дату оновлення для наявного фото', () => {
    renderSection(PHOTO);

    expect(screen.getByText(/Оновлено:/)).toBeInTheDocument();
  });

  it('без згоди збереження блокується (ADR 0015)', async () => {
    const { onSave } = renderSection({ ...PHOTO, consentAt: null });

    uploadFile();
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти фото' }));

    await waitFor(() => expect(screen.getByText(/Необхідна згода/i)).toBeInTheDocument());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('без alt збереження блокується', async () => {
    const { onSave } = renderSection(null);

    uploadFile();
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти фото' }));

    await waitFor(() =>
      expect(screen.getByText(/Вкажіть альтернативний текст/i)).toBeInTheDocument()
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it('кнопка «Видалити фото» показується лише за наявного фото', () => {
    renderSection(PHOTO);
    expect(screen.getByRole('button', { name: 'Видалити фото' })).toBeInTheDocument();
  });
});
