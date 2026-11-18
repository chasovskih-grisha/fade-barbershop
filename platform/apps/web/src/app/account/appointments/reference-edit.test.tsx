import { fireEvent, render, screen } from '@testing-library/react';
import { AppointmentModals } from './AppointmentModals';
import { AppointmentReference } from './AppointmentReference';
import { makeVisit } from './test-fixtures';

const visit = makeVisit({ referenceComment: 'чубчик залишити' });

function openEditor(onReference = jest.fn(), error: string | null = null) {
  render(
    <AppointmentModals
      selected={visit}
      dialog="reference"
      busy={false}
      actionError={error}
      onClose={jest.fn()}
      onCancel={jest.fn()}
      onReschedule={jest.fn()}
      onReference={onReference}
    />
  );
  return onReference;
}

// REF-WEB-04: редагування референсу/коментаря в «Моїх візитах».
describe('редагування референсу (REF-WEB-04)', () => {
  it('кнопка «Редагувати» доступна, поки візит не підтверджено', () => {
    const onEditReference = jest.fn();
    render(<AppointmentReference app={visit} onEditReference={onEditReference} />);
    fireEvent.click(screen.getByRole('button', { name: 'Редагувати референс і коментар' }));
    expect(onEditReference).toHaveBeenCalledWith(visit);
  });

  it('після підтвердження кнопки редагування немає — лише перегляд', () => {
    render(
      <AppointmentReference
        app={makeVisit({ referenceComment: 'чубчик залишити', canEditReference: false })}
        onEditReference={jest.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'Редагувати референс і коментар' })).toBeNull();
    expect(screen.getByText('чубчик залишити')).toBeTruthy();
  });

  it('змінений коментар надсилається як comment', () => {
    const onReference = openEditor();
    fireEvent.change(screen.getByLabelText('Коментар майстру'), {
      target: { value: 'зняти на 2 мм' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(onReference).toHaveBeenCalledWith({ comment: 'зняти на 2 мм' });
  });

  it('незмінений коментар не надсилається — undefined, а не порожній рядок', () => {
    const onReference = openEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(onReference).toHaveBeenCalledWith({});
  });

  it('порожній коментар прибирає значення, а не лишає пробіл', () => {
    const onReference = openEditor();
    fireEvent.change(screen.getByLabelText('Коментар майстру'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(onReference).toHaveBeenCalledWith({ comment: '' });
  });

  it('ліміт 500 символів: лічильник показує перевищення, збереження заблоковано', () => {
    const onReference = openEditor();
    fireEvent.change(screen.getByLabelText('Коментар майстру'), {
      target: { value: 'я'.repeat(501) },
    });
    expect(screen.getByText(/501\/500/)).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Зберегти' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(onReference).not.toHaveBeenCalled();
  });

  it('галочка зняття фото надсилає referenceId: "" (прибрати)', () => {
    const onReference = openEditor();
    fireEvent.click(screen.getByLabelText('Прибрати фото референсу'));
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(onReference).toHaveBeenCalledWith({ referenceId: '' });
  });

  it('помилка замку (409 після підтвердження) показується, а не ковтається', () => {
    openEditor(jest.fn(), 'Reference is locked after confirmation (status: confirmed)');
    expect(screen.getByText(/Reference is locked/)).toBeTruthy();
  });
});
