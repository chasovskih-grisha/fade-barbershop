/**
 * T-6006: узгоджені тексти запиту згоди на публікацію роботи (PRT-002, PRT-ADM-03).
 * Варіанти адресуються доменним `ConsentOpinion`, а не порядком кнопок.
 */
import type { ConsentOpinion, PublicationStatus } from '../domain/portfolio-item';

export interface ConsentOption {
  opinion: ConsentOpinion;
  label: string;
  detail: string;
}

export interface Copy {
  title: string;
  body: string;
}

/** Push після `AppointmentCompleted`; без відповіді нагадування не повторюється. */
export const CONSENT_PUSH: Copy = {
  title: 'Опублікувати фото вашої нової зачіски?',
  body: 'Допоможіть іншим обрати стиль. Оберіть формат публікації: публічно з ім’ям або анонімно.',
};

export interface ConsentScreen {
  title: string;
  lead: string;
  options: ConsentOption[];
}

export const CONSENT_SCREEN: ConsentScreen = {
  title: 'Портфоліо майстра: згода на публікацію',
  lead: 'Ми хочемо поділитися результатом роботи нашого майстра у відкритій галереї. Публікація можлива лише за вашою згодою.',
  options: [
    {
      opinion: 'yes',
      label: 'Надати згоду (публічно)',
      detail: 'Фото «до» та «після» з указанням імені або анонімним профілем.',
    },
    {
      opinion: 'anonymous',
      label: 'Надати згоду (анонімно)',
      detail: 'Обличчя буде закадровано або приховано, без прив’язки до особистих даних.',
    },
    {
      opinion: 'no',
      label: 'Відмовитися',
      detail: 'Фото залишиться приватним в історіях майстра і не з’явиться в публічній галереї.',
    },
  ],
};

/** Кнопка для доменного варіанта; `undefined` — варіант ще не описаний. */
export function consentOption(opinion: ConsentOpinion): ConsentOption | undefined {
  return CONSENT_SCREEN.options.find((option) => option.opinion === opinion);
}

const MODERATION: Record<'published' | 'hidden', Copy> = {
  published: {
    title: 'Фото опубліковано',
    body: 'Ваше фото успішно опубліковано в галереї майстра. Дякуємо!',
  },
  hidden: {
    title: 'Фото не опубліковано',
    body: 'Публікацію відхилено адміністратором. Ваше фото залишається приватним.',
  },
};

/** Повідомлення після модерації; проміжні статуси клієнту не пишуть. */
export function publicationNotice(status: PublicationStatus): Copy | undefined {
  if (status === 'published') return MODERATION.published;
  if (status === 'hidden') return MODERATION.hidden;
  return undefined;
}
