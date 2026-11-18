// User — обліковий запис мережі (identity README). Барбер = User з роллю `barber`
// (MNG-ADM-05): адмін створює через «Персонал», клієнти — перший успішний OTP (ADR 0005).

import { newUserData, type CreateUserInput, type UserData } from './user.types';

export type { CreateUserInput, UserData } from './user.types';

export class User {
  private constructor(private readonly data: UserData) {}

  static create(input: CreateUserInput): User {
    return new User(newUserData(input));
  }

  static reconstitute(data: UserData): User {
    return new User(data);
  }
  get id(): string {
    return this.data.id;
  }
  get phone(): UserData['phone'] {
    return this.data.phone;
  }
  get role(): UserData['role'] {
    return this.data.role;
  }
  get name(): string | null {
    return this.data.name;
  }
  /** T-4422: адреса сповіщень безпеки; null — не задано. */
  get email(): string | null {
    return this.data.email;
  }
  get active(): boolean {
    return this.data.active;
  }
  get selfSchedule(): boolean {
    return this.data.selfSchedule;
  }
  get username(): string | undefined {
    return this.data.username ?? undefined;
  }
  get passwordHash(): string | undefined {
    return this.data.passwordHash ?? undefined;
  }
  get isAdmin(): boolean {
    return this.data.role === 'admin';
  }
  /** Змінює ім'я (барбер/адмін). Повертає true, якщо змінилось. */
  rename(name: string | null): boolean {
    const value = name?.trim() || null;
    if (this.data.name === value) return false;
    this.data.name = value;
    return true;
  }
  /** Вимикає/вмикає обліковий запис (MNG-ADM-05). Ідемпотентно. */
  setActive(active: boolean): boolean {
    if (this.data.active === active) return false;
    this.data.active = active;
    return true;
  }
  /** Делегує барберу управління графіком (фаза 22, SCH-001). */
  setSelfSchedule(allowed: boolean): boolean {
    if (this.data.selfSchedule === allowed) return false;
    this.data.selfSchedule = allowed;
    return true;
  }
  /** T-4422: email для сповіщень безпеки ('' або null — прибрати). Повертає true,
   *  якщо змінилось (нова/та сама адреса — без події). */
  changeEmail(email: string | null): boolean {
    const value = email?.trim() || null;
    if (this.data.email === value) return false;
    this.data.email = value;
    return true;
  }

  get phoneVerifiedAt(): Date | null {
    return this.data.phoneVerifiedAt;
  }
  /** Верифікація номера через OTP (T-4409). Ідемпотентно: перша дата фіксується. */
  markPhoneVerified(at: Date): boolean {
    if (this.data.phoneVerifiedAt) return false;
    this.data.phoneVerifiedAt = at;
    return true;
  }
  /** T-4620a: переносить верифікований номер на цей самий User. Той самий
   *  номер — no-op (false); інакше міняє PhoneNumber, позначає номер
   *  верифікованим зараз і повертає true. */
  changePhone(phone: UserData['phone'], at: Date): boolean {
    if (this.data.phone.value === phone.value) return false;
    this.data.phone = phone;
    this.data.phoneVerifiedAt = at;
    return true;
  }
  /** Новий scrypt-хеш пароля (T-4411: зміна власного або скидання адміном). */
  setPassword(hash: string): void {
    this.data.passwordHash = hash;
  }
  /** Підвищує роль клієнта до барбера через адмінку (ADR 0005). */
  promoteToBarber(name: string | null): boolean {
    if (this.data.role === 'barber') return false;
    this.data.role = 'barber';
    this.rename(name);
    return true;
  }
}
