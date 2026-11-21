// Позначення аватара для допоміжних технологій.

export function getAvatarA11y(name?: string, alt?: string) {
  const label = alt || name;
  return {
    role: label ? 'img' : undefined,
    ariaLabel: label ? `Avatar: ${label}` : undefined,
  };
}
