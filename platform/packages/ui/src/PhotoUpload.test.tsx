import { fireEvent, render, screen } from '@testing-library/react';
import { PhotoUpload } from './PhotoUpload';

const file = new File(['x'], 'photo.png', { type: 'image/png' });

describe('PhotoUpload', () => {
  it('показує превʼю і передає вибраний файл', () => {
    const onSelect = jest.fn();
    render(<PhotoUpload label="Додати фото" onSelect={onSelect} previewUrl="blob:x" />);
    expect(screen.getByRole('img', { name: 'Додати фото' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Додати фото'), { target: { files: [file] } });
    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it('ігнорує зміну без файлу', () => {
    const onSelect = jest.fn();
    render(<PhotoUpload label="Додати фото" onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText('Додати фото'), { target: { files: [] } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('показує consent-чекбокс і прокидає зміну', () => {
    const onConsentChange = jest.fn();
    render(
      <PhotoUpload
        label="Фото"
        onSelect={jest.fn()}
        consent={false}
        onConsentChange={onConsentChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Дозволяю обробку фото'));
    expect(onConsentChange).toHaveBeenCalledWith(true);
  });

  it('показує помилку', () => {
    render(<PhotoUpload label="Фото" onSelect={jest.fn()} error="Потрібне фото" />);
    expect(screen.getByRole('alert').textContent).toBe('Потрібне фото');
  });

  it('вимикається через disabled', () => {
    render(<PhotoUpload label="Фото" onSelect={jest.fn()} disabled />);
    expect((screen.getByLabelText('Фото') as HTMLInputElement).disabled).toBe(true);
  });
});
