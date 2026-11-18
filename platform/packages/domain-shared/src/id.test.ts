import { uuidv7, DomainId } from './id';

describe('UUID v7 and DomainId', () => {
  it('generates valid RFC 9562 UUID v7 format', () => {
    const id = uuidv7();
    const uuidV7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV7Regex);
  });

  it('ensures monotonicity for IDs generated in sequence', () => {
    const id1 = uuidv7();
    const id2 = uuidv7();
    expect(id1).not.toEqual(id2);
    // UUID v7 is time-ordered, id2 should be >= id1 lexicographically
    expect(id2 >= id1).toBe(true);
  });

  it('supports DomainId brand types', () => {
    type UserId = DomainId<'UserId'>;
    const userId: UserId = uuidv7() as UserId;
    expect(userId).toBeDefined();
  });
});
