import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationMapPicker from './LocationMapPicker';

describe('LocationMapPicker', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('renders search field, map container and coordinates', () => {
    render(
      <LocationMapPicker
        lat={50.45}
        lng={30.52}
        onChange={jest.fn()}
        onAddressParts={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Пошук адреси')).toBeInTheDocument();
    expect(screen.getByTestId('location-map')).toBeInTheDocument();
    expect(screen.getByText(/50\.450000, 30\.520000/)).toBeInTheDocument();
  });

  it('searches and lets user pick a suggestion', async () => {
    const onChange = jest.fn();
    const onAddressParts = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          label: 'вул. Хрещатик, 1, Київ',
          lat: 50.45,
          lng: 30.52,
          addressParts: { street: 'Хрещатик', building: '1', city: 'Київ', country: 'UA' },
        },
      ],
    });

    render(
      <LocationMapPicker lat={50.45} lng={30.52} onChange={onChange} onAddressParts={onAddressParts} />
    );

    fireEvent.change(screen.getByLabelText('Пошук адреси'), { target: { value: 'Хрещатик' } });
    fireEvent.click(screen.getByRole('button', { name: /знайти/i }));

    await waitFor(() => expect(screen.getByText('вул. Хрещатик, 1, Київ')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'вул. Хрещатик, 1, Київ' }));
    expect(onChange).toHaveBeenCalledWith(50.45, 30.52);
    expect(onAddressParts).toHaveBeenCalledWith({
      street: 'Хрещатик',
      building: '1',
      city: 'Київ',
      country: 'UA',
    });
  });
});
