// ClientProfile — картка гостя (crm, Core). Інваріанти простих мутацій — тут:
// кожна зміна торкається updatedAt через Clock; підбірки — копіями. VO-типи —
// client-profile.types.ts, порт — client-profile.repository.ts.
import type { Clock, IdGenerator } from './ports';
import type {
  AddNoteInput,
  Birthday,
  ClientProfileProps,
  ClientId,
  Note,
  Preference,
} from './client-profile.types';
import { isValidBirthday, InvalidBirthdayError } from './birthday';

export type { AddNoteInput, ClientId, Note, Preference } from './client-profile.types';

export class ClientProfile {
  private constructor(private readonly props: ClientProfileProps) {}

  static reconstitute(props: ClientProfileProps): ClientProfile {
    return new ClientProfile(props);
  }

  // prettier-ignore
  get id(): ClientId { return this.props.id; }
  // prettier-ignore
  get userId(): string { return this.props.userId; }
  // prettier-ignore
  get name(): string | null { return this.props.name; }
  // prettier-ignore
  get phone(): string { return this.props.phone; }
  // prettier-ignore
  get birthday(): Birthday | null { return this.props.birthday ?? null; }
  // prettier-ignore
  get preferences(): Preference[] { return [...this.props.preferences]; }
  // prettier-ignore
  get notes(): Note[] { return [...this.props.notes]; }
  // prettier-ignore
  get inviteCode(): string { return this.props.inviteCode ?? ''; }
  // prettier-ignore
  get referredBy(): string | null { return this.props.referredBy ?? null; }
  // prettier-ignore
  get vipDiscountPercent(): number | null { return this.props.vipDiscountPercent; }
  // prettier-ignore
  get loyaltyVisitsCount(): number { return this.props.loyaltyVisitsCount; }
  // prettier-ignore
  get createdAt(): Date { return this.props.createdAt; }
  // prettier-ignore
  get updatedAt(): Date { return this.props.updatedAt; }
  // prettier-ignore
  get propsData(): ClientProfileProps { return { ...this.props }; }

  // prettier-ignore
  updateName(name: string | null, clock: Clock): void { this.props.name = name; this.touch(clock); }
  // prettier-ignore
  updatePhone(phone: string, clock: Clock): void { this.props.phone = phone; this.touch(clock); }

  /** Зберігає день і місяць народження; null очищає поле (T-4730). */
  setBirthday(birthday: Birthday | null, clock: Clock): void {
    if (birthday !== null && !isValidBirthday(birthday)) {
      throw new InvalidBirthdayError(birthday);
    }
    this.props.birthday = birthday;
    this.touch(clock);
  }

  setReferredBy(referrerId: string, clock: Clock): void {
    if (this.props.referredBy) {
      return; // immutable once set
    }
    if (this.props.id === referrerId) {
      return; // self-referral prevention
    }
    this.props.referredBy = referrerId;
    this.touch(clock);
  }

  // prettier-ignore
  addPreference(text: string, clock: Clock, ids: IdGenerator): Preference {
    const preference: Preference = { id: ids.id(), text, createdAt: clock.now() };
    this.props.preferences.push(preference);
    this.touch(clock);
    return preference;
  }

  removePreference(preferenceId: string, clock: Clock): boolean {
    return this.removeById(this.props.preferences, preferenceId, clock);
  }

  // prettier-ignore
  updatePreferences(preferences: string[], clock: Clock, ids: IdGenerator): void {
    this.props.preferences = preferences.map((text) => ({ id: ids.id(), text, createdAt: clock.now() }));
    this.touch(clock);
  }

  // prettier-ignore
  addNote(input: AddNoteInput, clock: Clock, ids: IdGenerator): Note {
    const note: Note = { id: ids.id(), text: input.text, authorId: input.authorId, authorRole: input.authorRole, visibleToClient: input.visibleToClient ?? false, createdAt: clock.now() };
    this.props.notes.push(note);
    this.touch(clock);
    return note;
  }

  removeNote(noteId: string, clock: Clock): boolean {
    return this.removeById(this.props.notes, noteId, clock);
  }

  // prettier-ignore
  setVipDiscount(percent: number | null, clock: Clock): void { this.props.vipDiscountPercent = percent; this.touch(clock); }
  // prettier-ignore
  incrementLoyaltyVisits(clock: Clock): void { this.props.loyaltyVisitsCount += 1; this.touch(clock); }
  // prettier-ignore
  setLoyaltyVisits(count: number, clock: Clock): void { this.props.loyaltyVisitsCount = count; this.touch(clock); }

  // prettier-ignore
  private touch(clock: Clock): void { this.props.updatedAt = clock.now(); }

  /** Видаляє елемент підбірки за id; true — знайдено й видалено (DRY). */
  // prettier-ignore
  private removeById(items: { id: string }[], id: string, clock: Clock): boolean {
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    this.touch(clock);
    return true;
  }
}
