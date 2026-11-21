const PAGE_NAME_PREFIXES: Array<[prefix: string, name: string]> = [
  ['/locations', 'Locations'],
  ['/services', 'Services'],
  ['/barbers', 'Barbers'],
  ['/blog', 'Blog'],
  ['/login', 'Login'],
  ['/booking', 'Booking'],
  ['/account', 'ClientCabinet'],
  ['/support', 'Support'],
];

/** Maps the current route to the readable page name used by page_view events. */
export function resolvePageName(pathname: string | null): string {
  if (!pathname || pathname === '/') return 'Home';
  const match = PAGE_NAME_PREFIXES.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : 'Home';
}
