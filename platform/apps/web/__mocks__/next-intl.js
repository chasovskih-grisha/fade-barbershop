// Jest-заглушка ESM-пакета next-intl. Сторінки рендеряться напряму в тестах,
// без кореневого layout і NextIntlClientProvider, тому useTranslations reading
// бере текст із uk-каталогу (мова за замовчуванням згідно з src/i18n.ts).
const fs = require('fs');
const path = require('path');

// src/i18n.ts збирає повідомлення з кореневого каталогу + доменних файлів
// (uk/states.json тощо) — заглушка повторює цю саму форму messages.
const messagesDir = path.join(__dirname, '../messages/uk');
const uk = require('../messages/uk.json');
for (const file of fs.readdirSync(messagesDir)) {
  if (!file.endsWith('.json')) continue;
  uk[path.basename(file, '.json')] = require(path.join(messagesDir, file));
}

function lookup(namespace, key) {
  const path = namespace ? `${namespace}.${key}` : key;
  return path.split('.').reduce((value, part) => (value == null ? undefined : value[part]), uk);
}

function interpolate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    values && values[name] !== undefined ? String(values[name]) : match
  );
}

module.exports = {
  useTranslations: (namespace) => (key, values) => {
    const template = lookup(namespace, key);
    return typeof template === 'string' ? interpolate(template, values) : key;
  },
  useLocale: () => 'uk',
  NextIntlClientProvider: ({ children }) => children,
};
