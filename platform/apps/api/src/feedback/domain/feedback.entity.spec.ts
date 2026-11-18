import { Feedback } from './feedback.entity';

describe('Feedback Entity & Sentiment', () => {
  const completedAt = new Date('2026-11-01T10:00:00Z');

  it('should create valid feedback and classify sentiment correctly', () => {
    const feedback = new Feedback({
      id: 'fb-1',
      appointmentId: 'apt-1',
      clientId: 'client-1',
      barberId: 'barber-1',
      locationId: 'loc-1',
      rating: 5,
      text: 'Amazing haircut and service!',
      completedAt,
    });

    expect(feedback.rating).toBe(5);
    expect(feedback.sentimentType).toBe('POSITIVE');
    expect(feedback.isEscalated).toBe(false);
    expect(feedback.canBeSubmitted(new Date('2026-11-15T10:00:00Z'))).toBe(true);
  });

  it('should escalate negative feedback (rating <= 2)', () => {
    const feedback = new Feedback({
      id: 'fb-2',
      appointmentId: 'apt-2',
      clientId: 'client-2',
      barberId: 'barber-2',
      locationId: 'loc-1',
      rating: 1,
      text: 'Bad experience, uneven fade.',
      completedAt,
    });

    expect(feedback.rating).toBe(1);
    expect(feedback.sentimentType).toBe('NEGATIVE');
    expect(feedback.isEscalated).toBe(true);
  });

  it('should validate text length <= 1000 and max 3 photos', () => {
    expect(() => {
      new Feedback({
        id: 'fb-3',
        appointmentId: 'apt-3',
        clientId: 'client-1',
        barberId: 'barber-1',
        locationId: 'loc-1',
        rating: 4,
        text: 'a'.repeat(1001),
        completedAt,
      });
    }).toThrow('Feedback text cannot exceed 1000 characters');

    expect(() => {
      new Feedback({
        id: 'fb-4',
        appointmentId: 'apt-4',
        clientId: 'client-1',
        barberId: 'barber-1',
        locationId: 'loc-1',
        rating: 4,
        photos: ['p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg'],
        completedAt,
      });
    }).toThrow('Maximum 3 photos allowed per feedback');
  });

  it('should reject feedback outside 30-day window', () => {
    const feedback = new Feedback({
      id: 'fb-5',
      appointmentId: 'apt-5',
      clientId: 'client-1',
      barberId: 'barber-1',
      locationId: 'loc-1',
      rating: 5,
      completedAt,
    });

    const outsideDate = new Date('2026-12-15T10:00:00Z'); // 44 days later
    expect(feedback.canBeSubmitted(outsideDate)).toBe(false);
  });
});
