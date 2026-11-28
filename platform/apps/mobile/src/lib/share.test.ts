import { Share } from 'react-native';
import { barberProfileUrl, shareBarberProfile } from './share';

describe('shareBarberProfile (T-4862b)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('будує абсолютну адресу публічного профілю', () => {
    expect(barberProfileUrl('taras')).toBe('https://fade.com.ua/barbers/taras');
  });

  it('кодує slug, щоб адреса лишалася одного сегмента', () => {
    expect(barberProfileUrl('a b')).toBe('https://fade.com.ua/barbers/a%20b');
  });

  it('передає назву й адресу системному вікну поширення', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);

    await shareBarberProfile('Тарас', 'taras');

    expect(share).toHaveBeenCalledWith({
      title: 'Тарас',
      message: 'Тарас — Fade\nhttps://fade.com.ua/barbers/taras',
      url: 'https://fade.com.ua/barbers/taras',
    });
  });
});
