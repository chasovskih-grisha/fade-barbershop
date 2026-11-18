import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogoSection from './LogoSection';
import type { LocationLogoDto } from './logo-fields';

const lightFile = new File(['light'], 'logo-light.png', { type: 'image/png' });
const darkFile = new File(['dark'], 'logo-dark.png', { type: 'image/png' });

const logo: LocationLogoDto = {
  variant: 'mark',
  lightUrl: 'https://cdn.example/locations/abc/light.png',
  darkUrl: 'https://cdn.example/locations/abc/dark.png',
  alt: 'Логотип «Імʼя локації» — лише знак',
};

const renderSection = (current: LocationLogoDto | null = null) => {
  const onSave = jest.fn();
  const onRemove = jest.fn();
  render(<LogoSection locationId="abc" logo={current} onSave={onSave} onRemove={onRemove} />);
  return { onSave, onRemove };
};

const upload = (label: string, file: File) => {
  fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });
};

describe('LogoSection', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = jest.fn(() => 'blob:preview');
    }
  });

  it('shows the empty state when there is no logo', () => {
    renderSection();
    expect(screen.getByRole('heading', { level: 2, name: 'Логотип' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зберегти логотип' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Видалити' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Lockup — знак і назва' })).toBeChecked();
    expect(screen.getByLabelText('Alt-текст')).toHaveValue('');
  });

  it('shows existing previews and a remove button', () => {
    renderSection(logo);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Видалити' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mark — лише знак' })).toBeChecked();
    expect(screen.getByLabelText('Alt-текст')).toHaveValue(logo.alt);
  });

  it('blocks saving until light and alt are filled', async () => {
    const { onSave } = renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти логотип' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Потрібне зображення для світлого поля (light).'
    );
    expect(onSave).not.toHaveBeenCalled();

    upload('Світле (light)', lightFile);
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти логотип' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Alt-текст обовʼязковий: лого несе зміст для скринрідера.'
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uploads the logo and tells the parent to reload', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        variant: 'mark',
        lightUrl: 'https://cdn.example/light.png',
        darkUrl: 'https://cdn.example/dark.png',
        alt: 'Логотип мережі',
      }),
    });
    const { onSave } = renderSection();

    upload('Світле (light)', lightFile);
    upload('Темне (dark, опціонально)', darkFile);
    await userEvent.click(screen.getByRole('radio', { name: 'Mark — лише знак' }));
    await userEvent.type(screen.getByLabelText('Alt-текст'), 'Логотип мережі');
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти логотип' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toHaveTextContent('Логотип збережено');
    expect(fetch).toHaveBeenCalledWith(
      '/admin/locations/abc/logo',
      expect.objectContaining({ method: 'PUT', credentials: 'include' })
    );
  });

  it('deletes the logo and tells the parent to reload', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true });
    const { onRemove } = renderSection(logo);

    await userEvent.click(screen.getByRole('button', { name: 'Видалити' }));

    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toHaveTextContent('Логотип видалено');
    expect(fetch).toHaveBeenCalledWith(
      '/admin/locations/abc/logo',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' })
    );
  });
});
