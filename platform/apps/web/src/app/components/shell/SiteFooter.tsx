import Link from 'next/link';
import { Icon } from '@fade/ui';
import { NAV_ITEMS } from './nav-items';
import { siteContacts, siteSocials } from '@/lib/site-config';
import { BrandLockup } from './BrandLockup';

// Футер (web-screens §0): контакти, канали, навігація, політика. Секції без даних
// (контакти/соцмережі ще не задані в env) не рендериться — пусток на сайті не показуємо.

const columnTitle = 'font-display text-h4 text-fg';

export function SiteFooter() {
  const contacts = siteContacts();
  const socials = siteSocials();

  return (
    <footer className="mt-16 border-t border-line-strong/80 bg-surface-base relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-32 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="mx-auto grid max-w-container gap-8 px-4 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center">
            <BrandLockup />
          </Link>
          <p className="text-body text-fg-secondary">Мережа барбершопів. Запис — за 10 секунд.</p>
          {socials.length > 0 && (
            <ul className="flex items-center gap-2" aria-label="Соціальні мережі">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-input text-fg-secondary transition-colors hover:bg-interactive hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                  >
                    <Icon name={social.icon} size={24} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className={columnTitle}>Контакти</h2>
            <ul className="flex flex-col gap-2">
              {contacts.map((contact) => (
                <li
                  key={contact.label}
                  className="flex items-start gap-2 text-body text-fg-secondary"
                >
                  <Icon name={contact.icon} size={24} className="mt-0.5 text-fg-muted" />
                  {contact.href ? (
                    <a
                      href={contact.href}
                      className="underline decoration-fg-muted underline-offset-4 transition-colors hover:text-fg"
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <span>{contact.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav aria-label="Навігація у футері" className="flex flex-col gap-3">
          <h2 className={columnTitle}>Сторінки</h2>
          <ul className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-body text-fg-secondary transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
