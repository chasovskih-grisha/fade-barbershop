import { ClientProfile } from '../../crm/domain/client-profile';

export class MemProfiles {
  store = new Map<string, ClientProfile>();
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findByUserId(userId: string) {
    return [...this.store.values()].find((profile) => profile.userId === userId) ?? null;
  }
  async findByPhone() {
    return null;
  }
  async save(profile: ClientProfile) {
    this.store.set(profile.id, profile);
  }
  async list() {
    return [...this.store.values()];
  }
}
