// REF-MOB-02: форма редагування референсу/коментаря на мобільному — той
// самий контракт, що на web (`reference-edit.test.tsx`): undefined ≠ ''
// (не чіпати vs прибрати), ліміт 500, замок після підтвердження → 409.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { makeVisit } from './fixtures';
import { ReferenceEditForm } from './reference-edit-form';

// Галерея — нативний модуль; форма тестує лише стан, тож вибір фото підмінено.
jest.mock('../../../../lib/reference-picker', () => ({ pickReferencePhoto: jest.fn() }));
jest.mock('../../../../lib/api/reference-photo', () => ({ uploadReferencePhoto: jest.fn() }));

function renderForm(comment: string, error: string | null = null): jest.Mock {
  const onSave = jest.fn();
  render(
    <ReferenceEditForm
      app={makeVisit({ referenceComment: comment })}
      busy={false}
      error={error}
      onCancel={jest.fn()}
      onSave={onSave}
    />
  );
  return onSave;
}

/** Стан кнопки беремо з accessibilityState — те, що бачить screen reader. */
const isDisabled = (label: string) =>
  screen.getByRole('button', { name: label }).props.accessibilityState?.disabled === true;

const saveButton = () => screen.getByRole('button', { name: 'Зберегти' });

describe('форма редагування референсу (REF-MOB-02)', () => {
  it('змінений коментар надсилається як comment', () => {
    const onSave = renderForm('чубчик залишити');
    fireEvent.changeText(screen.getByLabelText('Коментар майстру'), 'зняти на 2 мм');
    fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith({ comment: 'зняти на 2 мм' });
  });

  it('без змін збереження недоступне — запит лише шукав би помилку на сервері', () => {
    const onSave = renderForm('чубчик залишити');
    expect(isDisabled('Зберегти')).toBe(true);
    fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('порожній коментар прибирає значення, а не лишає пробіл', () => {
    const onSave = renderForm('чубчик залишити');
    fireEvent.changeText(screen.getByLabelText('Коментар майстру'), '   ');
    fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith({ comment: '' });
  });

  it('ліміт 500 символів: лічильник показує перевищення, збереження заблоковано', () => {
    const onSave = renderForm('');
    fireEvent.changeText(screen.getByLabelText('Коментар майстру'), 'я'.repeat(501));

    expect(screen.getByText(/501\/500/)).toBeTruthy();
    expect(isDisabled('Зберегти')).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('галочка зняття фото надсилає referenceId: "" (прибрати)', () => {
    const onSave = renderForm('');
    fireEvent.press(screen.getByLabelText('Прибрати фото референсу'));
    fireEvent.press(saveButton());
    expect(onSave).toHaveBeenCalledWith({ referenceId: '' });
  });

  it('помилка замку (409 після підтвердження) показується, а не ковтається', () => {
    renderForm('чубчик залишити', 'Майстер уже підтвердив запис — редагування недоступне');
    expect(screen.getByText(/уже підтвердив/)).toBeTruthy();
  });
});
