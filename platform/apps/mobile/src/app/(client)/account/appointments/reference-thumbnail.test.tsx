// REF-MOB-02 + REF-WEB-03: референс у картці візиту й доступність редагування.
// Фото лежить у приватному бакеті (ADR 0008 §2), тож мініатюра бере підписаний
// URL окремим запитом; право редагування приходить із сервера
// (`canEditReference`), а не вигадується клієнтом.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getReferencePhotoUrl } from '../../../../lib/api/reference-photo';
import { makeVisit } from './fixtures';
import { AppointmentRow } from './list-item';
import { ReferenceThumbnail } from './reference-thumbnail';

jest.mock('../../../../lib/api/reference-photo', () => ({ getReferencePhotoUrl: jest.fn() }));
jest.mock('../../../../lib/reference-picker', () => ({ pickReferencePhoto: jest.fn() }));

const mockedUrl = getReferencePhotoUrl as jest.MockedFunction<typeof getReferencePhotoUrl>;
const signed = 'https://minio.local/p.png?X-Amz-Signature=abc';
const EDIT_LABEL = 'Редагувати референс і коментар';
const editButton = () => screen.queryByRole('button', { name: EDIT_LABEL });

beforeEach(() => {
  mockedUrl.mockReset();
  mockedUrl.mockResolvedValue(null);
});

describe('референс у картці візиту (REF-MOB-02)', () => {
  it('кнопка «Редагувати» доступна, поки візит не підтверджено', async () => {
    const onEditReference = jest.fn();
    render(<ReferenceThumbnail app={makeVisit()} onEditReference={onEditReference} />);

    fireEvent.press(screen.getByRole('button', { name: EDIT_LABEL }));
    expect(onEditReference).toHaveBeenCalledWith(expect.objectContaining({ id: 'apt-1' }));
    // Без фото лишається чесний стан, а не порожня діра — інакше кнопки не було б.
    expect(screen.getByText('Фото не прикріплене')).toBeTruthy();
    await waitFor(() => expect(mockedUrl).not.toHaveBeenCalled());
  });

  it('після підтвердження барбером — лише перегляд, кнопки немає', () => {
    render(
      <ReferenceThumbnail
        app={makeVisit({ referenceComment: 'чубчик залишити', canEditReference: false })}
        onEditReference={jest.fn()}
      />
    );

    expect(editButton()).toBeNull();
    expect(screen.getByText('чубчик залишити')).toBeTruthy();
  });

  it('коли форму вже відкрито, повторної кнопки немає', () => {
    render(<ReferenceThumbnail app={makeVisit()} editing onEditReference={jest.fn()} />);
    expect(editButton()).toBeNull();
  });

  it('показує мініатюру за підписаним URL окремим запитом', async () => {
    mockedUrl.mockResolvedValue(signed);
    render(
      <ReferenceThumbnail
        app={makeVisit({ referenceId: 'photo-1', canEditReference: false })}
        onEditReference={jest.fn()}
      />
    );

    await waitFor(() => expect(mockedUrl).toHaveBeenCalledWith('photo-1'));
    expect(screen.getByLabelText('Референс зачіски').props.source).toEqual({ uri: signed });
  });

  it('фото є, але підписаний URL недоступний — «Фото недоступне», без помилки', async () => {
    mockedUrl.mockRejectedValue(new Error('network down'));
    render(
      <ReferenceThumbnail app={makeVisit({ referenceId: 'photo-1' })} onEditReference={jest.fn()} />
    );

    expect(await screen.findByText('Фото недоступне')).toBeTruthy();
    expect(screen.queryByLabelText('Референс зачіски')).toBeNull();
  });

  it('без фото, коментаря й права редагування блок не рендериться', () => {
    render(
      <ReferenceThumbnail
        app={makeVisit({ referenceId: null, referenceComment: '', canEditReference: false })}
        onEditReference={jest.fn()}
      />
    );
    expect(screen.queryByText('Фото не прикріплене')).toBeNull();
    expect(editButton()).toBeNull();
  });

  it('форма показується лише для відкритого візиту, і тоді кнопки немає', () => {
    render(
      <AppointmentRow
        app={makeVisit()}
        editing
        busy={false}
        error={null}
        onEditReference={jest.fn()}
        onCancelEdit={jest.fn()}
        onSaveReference={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Коментар майстру')).toBeTruthy();
    expect(editButton()).toBeNull();
  });
});
