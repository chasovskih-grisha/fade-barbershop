// Role — ролі користувача мережі (identity README, ADR 0005).

export const ROLES = ['client', 'barber', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
