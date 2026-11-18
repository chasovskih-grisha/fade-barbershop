// REF-WEB-03: референс у «Моїх візитах» показаний зменшеною картинкою.
// API віддає лише referenceId, а бакет приватний (ADR 0008 §2) — отже потрібен
// окремий запит за підписаним URL. Раніше read-модель віддавала порожній
// referenceUrl, тож мініатюра не могла з'явитися ніколи.
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentReference } from './AppointmentReference';
import { getReferencePhotoUrl } from '../../booking/referencePhotoApi';
import { makeVisit } from './test-fixtures';

jest.mock('../../booking/referencePhotoApi', () => ({
  getReferencePhotoUrl: jest.fn(),
}));

const signed = 'https://minio.local/p.png?X-Amz-Signature=abc';

beforeEach(() => {
  jest.mocked(getReferencePhotoUrl).mockReset();
  jest.mocked(getReferencePhotoUrl).mockResolvedValue(null);
});

describe('мініатюра референсу (REF-WEB-03)', () => {
  it('бере підписаний URL за referenceId і показує картинку', async () => {
    jest.mocked(getReferencePhotoUrl).mockResolvedValue(signed);
    render(
      <AppointmentReference
        app={makeVisit({ referenceId: 'photo-1' })}
        onEditReference={jest.fn()}
      />
    );
    expect(await screen.findByAltText('Референс зачіски')).toHaveAttribute('src', signed);
    expect(getReferencePhotoUrl).toHaveBeenCalledWith('photo-1');
  });

  it('фото є, але підписаний URL недоступний — чесний стан, не порожній img', async () => {
    render(
      <AppointmentReference
        app={makeVisit({ referenceId: 'photo-1' })}
        onEditReference={jest.fn()}
      />
    );
    expect(await screen.findByText('Фото недоступне')).toBeTruthy();
    expect(screen.queryByAltText('Референс зачіски')).toBeNull();
  });

  it('запит підписаного URL падає без екрана помилки (без unhandled rejection)', async () => {
    jest.mocked(getReferencePhotoUrl).mockRejectedValue(new Error('network down'));
    render(
      <AppointmentReference
        app={makeVisit({ referenceId: 'photo-1' })}
        onEditReference={jest.fn()}
      />
    );
    await waitFor(() => expect(getReferencePhotoUrl).toHaveBeenCalled());
    expect(await screen.findByText('Фото недоступне')).toBeTruthy();
  });

  it('без фото показує «не прикріплене» і не робить зайвого запиту', () => {
    render(<AppointmentReference app={makeVisit()} onEditReference={jest.fn()} />);
    expect(screen.getByText('Фото не прикріплене')).toBeTruthy();
    expect(getReferencePhotoUrl).not.toHaveBeenCalled();
  });

  // Регресія REF-WEB-04: блок рендерився лише під referenceUrl, тож кнопка
  // «Редагувати» не з'являлася ніколи і редагування було недоступне.
  it('блок рендериться без фото — інакше кнопка редагування зникла б', () => {
    render(
      <AppointmentReference
        app={makeVisit({ referenceId: null, referenceComment: 'чубчик' })}
        onEditReference={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Редагувати референс і коментар' })).toBeTruthy();
  });

  it('без фото, коментаря й права редагування блок не рендериться', () => {
    render(
      <AppointmentReference
        app={makeVisit({ referenceId: null, referenceComment: '', canEditReference: false })}
        onEditReference={jest.fn()}
      />
    );
    expect(screen.queryByText('Референс зачіски')).toBeNull();
  });
});
