import fs from 'fs';
import path from 'path';

function getKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], key: string) => {
    const val = obj[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      res.push(...getKeys(val, prefixedKey));
    } else {
      res.push(prefixedKey);
    }
    return res;
  }, []);
}

describe('i18n Message Catalog Parity', () => {
  const domains = ['common', 'shell', 'locations', 'services', 'barbers', 'blog', 'booking', 'account', 'login', 'states', 'errors', 'shop', 'support'];
  const locales = ['en', 'es'] as const;

  for (const domain of domains) {
    it(`has matching translation keys in ${domain}.json for en and es compared to uk`, () => {
      const ukPath = path.join(__dirname, `../../../messages/uk/${domain}.json`);
      const ukContent = JSON.parse(fs.readFileSync(ukPath, 'utf8'));
      const ukKeys = getKeys(ukContent).sort();

      for (const locale of locales) {
        const localePath = path.join(__dirname, `../../../messages/${locale}/${domain}.json`);
        const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf8'));
        const localeKeys = getKeys(localeContent).sort();

        expect(localeKeys).toEqual(ukKeys);
      }
    });
  }
});
