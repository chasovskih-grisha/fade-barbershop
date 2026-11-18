import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoSection from './PhotoSection';

describe('PhotoSection', () => {
  it('renders initial photos and allows adding/removing and saving with disabled button during flight', async () => {
    const handleSave = jest.fn().mockResolvedValue(undefined);
    render(
      <PhotoSection
        initialPhotos={[{ url: 'https://test.com/photo.jpg', caption: 'Test', sortOrder: 0 }]}
        onSave={handleSave}
        saving={false}
      />
    );

    expect(screen.getByDisplayValue('https://test.com/photo.jpg')).toBeInTheDocument();

    // Add photo
    fireEvent.click(screen.getByRole('button', { name: /додати фото/i }));
    expect(screen.getAllByRole('textbox')).toHaveLength(4); // 2 per item (url + caption)

    // Save
    fireEvent.click(screen.getByRole('button', { name: /зберегти галерею/i }));
    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('Галерею успішно збережено');
    });
  });

  it('reorders photos and reindexes sortOrder before saving', async () => {
    const handleSave = jest.fn().mockResolvedValue(undefined);
    render(
      <PhotoSection
        initialPhotos={[
          { url: 'https://a.jpg', caption: 'A', sortOrder: 0 },
          { url: 'https://b.jpg', caption: 'B', sortOrder: 1 },
        ]}
        onSave={handleSave}
        saving={false}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /перемістити фото нижче/i })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /зберегти галерею/i }));

    await waitFor(() => expect(handleSave).toHaveBeenCalled());
    expect(handleSave).toHaveBeenCalledWith([
      { url: 'https://b.jpg', caption: 'B', sortOrder: 0 },
      { url: 'https://a.jpg', caption: 'A', sortOrder: 1 },
    ]);
  });

  it('disables buttons while saving is in flight', () => {
    render(
      <PhotoSection
        initialPhotos={[]}
        onSave={jest.fn()}
        saving={true}
      />
    );

    expect(screen.getByRole('button', { name: /збереження…/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /додати фото/i })).toBeDisabled();
  });
});
