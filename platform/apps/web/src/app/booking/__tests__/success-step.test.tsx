// REF-WEB-03: екран підтвердження показує референс зменшеною картинкою.
// Фото у приватному бакеті (ADR 0008 §2), тому src приходить з
// getReferencePhotoUrl(); коли сесії/власності немає — локальне прев'ю.
// T-4735b: факти візиту видно завжди, а контролів, що вдають збереження,
// нагадування чи підтримку, на екрані немає.
import { render, screen, waitFor } from '@testing-library/react';
// jest-dom підключений у jest.setup.js, але типи матчерів не глобальні —
// без цього імпорту tsc не знає про toHaveAttribute/toBeInTheDocument.
import '@testing-library/jest-dom';
import SuccessStep from '../steps/SuccessStep';
import { getReferencePhotoUrl } from '../referencePhotoApi';

jest.mock('../referencePhotoApi', () => ({
  getReferencePhotoUrl: jest.fn(),
}));

const signed = 'https://minio.local/photo.png?X-Amz-Signature=abc';
const preview = 'data:image/jpeg;base64,ZZZ';

beforeEach(() => {
  jest.mocked(getReferencePhotoUrl).mockReset();
});

describe('SuccessStep', () => {
  it('показує референс із підписаного URL (short-lived)', async () => {
    jest.mocked(getReferencePhotoUrl).mockResolvedValue(signed);
    render(<SuccessStep bookingId="apt-9" referencePhotoId="photo-1" />);

    const img = await screen.findByAltText('Референс зачіски');
    expect(img).toHaveAttribute('src', signed);
    expect(getReferencePhotoUrl).toHaveBeenCalledWith('photo-1');
  });

  it('підставляє локальне прев’ю, коли підписаний URL недоступний (401/404)', async () => {
    jest.mocked(getReferencePhotoUrl).mockResolvedValue(null);
    render(<SuccessStep bookingId="apt-9" referencePhotoId="photo-1" referencePreview={preview} />);

    await waitFor(() => expect(getReferencePhotoUrl).toHaveBeenCalled());
    expect(await screen.findByAltText('Референс зачіски')).toHaveAttribute('src', preview);
  });

  it('не падає, коли запит підписаного URL відхилено', async () => {
    jest.mocked(getReferencePhotoUrl).mockRejectedValue(new Error('network down'));
    render(<SuccessStep bookingId="apt-9" referencePhotoId="photo-1" referencePreview={preview} />);

    expect(await screen.findByAltText('Референс зачіски')).toHaveAttribute('src', preview);
  });

  it('не робить запит, якщо photoId немає', () => {
    render(<SuccessStep bookingId="apt-9" referencePreview={preview} />);

    expect(screen.getByAltText('Референс зачіски')).toHaveAttribute('src', preview);
    expect(getReferencePhotoUrl).not.toHaveBeenCalled();
  });

  it('без референсу показує локацію, послугу, майстра і час, але не фото', () => {
    render(
      <SuccessStep
        bookingId="apt-9"
        locationName="Сіті Лейк"
        serviceName="Стрижка"
        barberName="Олексій"
        time="11:00–11:45"
      />
    );

    expect(screen.queryByAltText('Референс зачіски')).toBeNull();
    expect(screen.getByText('Локація:')).toBeInTheDocument();
    expect(screen.getByText('Сіті Лейк')).toBeInTheDocument();
    expect(screen.getByText('Послуга:')).toBeInTheDocument();
    expect(screen.getByText('Стрижка')).toBeInTheDocument();
    expect(screen.getByText('Майстер:')).toBeInTheDocument();
    expect(screen.getByText('Олексій')).toBeInTheDocument();
    expect(screen.getByText('Час:')).toBeInTheDocument();
    expect(screen.getByText('11:00–11:45')).toBeInTheDocument();
  });

  it('показує послугу, майстра, час і коментар разом із фото', async () => {
    jest.mocked(getReferencePhotoUrl).mockResolvedValue(signed);
    render(
      <SuccessStep
        bookingId="apt-9"
        referencePhotoId="photo-1"
        serviceName="Стрижка"
        barberName="Олексій"
        time="11:00"
        comment="Хочу чорне межування"
      />
    );

    expect(await screen.findByAltText('Референс зачіски')).toBeInTheDocument();
    expect(screen.getByText('Стрижка')).toBeInTheDocument();
    expect(screen.getByText('Олексій')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
    expect(screen.getByText('Хочу чорне межування')).toBeInTheDocument();
  });

  it('не показує контролів, які вдають збереження, нагадування чи підтримку', () => {
    render(<SuccessStep bookingId="apt-9" serviceName="Стрижка" />);

    expect(screen.queryByText('✨ Сервісні побажання')).toBeNull();
    expect(screen.queryByText('Збережено ✓')).toBeNull();
    expect(screen.queryByText('Нагадування активні')).toBeNull();
    expect(screen.queryByRole('button', { name: /Нагадування/i })).toBeNull();
    expect(screen.queryByText(/Telegram/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Календар/i })).toBeNull();
    expect(screen.queryByText(/з 5/)).toBeNull();
  });
});
