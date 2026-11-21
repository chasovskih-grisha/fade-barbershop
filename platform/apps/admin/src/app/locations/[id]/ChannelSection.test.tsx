import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChannelSection from './ChannelSection';

describe('ChannelSection', () => {
  it('renders initial channels and allows adding/removing and saving with disabled button during flight', async () => {
    const handleSave = jest.fn().mockResolvedValue(undefined);
    render(
      <ChannelSection
        initialChannels={[{ channel: 'phone', value: '+380501234567', sortOrder: 0 }]}
        onSave={handleSave}
        saving={false}
      />
    );

    expect(screen.getByDisplayValue('+380501234567')).toBeInTheDocument();

    // Add channel
    fireEvent.click(screen.getByRole('button', { name: /додати канал/i }));
    expect(screen.getAllByRole('combobox')).toHaveLength(2);

    // Save
    fireEvent.click(screen.getByRole('button', { name: /зберегти канали/i }));
    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('Канали успішно збережено');
    });
  });

  it('reorders channels and reindexes sortOrder before saving', async () => {
    const handleSave = jest.fn().mockResolvedValue(undefined);
    render(
      <ChannelSection
        initialChannels={[
          { channel: 'phone', value: '+380501234567', sortOrder: 0 },
          { channel: 'email', value: 'hi@fade.ua', sortOrder: 1 },
        ]}
        onSave={handleSave}
        saving={false}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /перемістити канал нижче/i })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /зберегти канали/i }));

    await waitFor(() => expect(handleSave).toHaveBeenCalled());
    expect(handleSave).toHaveBeenCalledWith([
      { channel: 'email', value: 'hi@fade.ua', sortOrder: 0 },
      { channel: 'phone', value: '+380501234567', sortOrder: 1 },
    ]);
  });

  it('disables buttons while saving is in flight', () => {
    render(<ChannelSection initialChannels={[]} onSave={jest.fn()} saving={true} />);

    expect(screen.getByRole('button', { name: /збереження…/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /додати канал/i })).toBeDisabled();
  });
});
