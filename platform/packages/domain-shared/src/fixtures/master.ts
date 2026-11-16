/**
 * Comprehensive, production-grade Barbershop Domain Fixtures, Factories, and Seeders.
 * Covers all entities, relationships, business scenarios, lifecycle states, and edge cases.
 */

export interface ShopLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  timezone: string;
  status: 'ACTIVE' | 'RENOVATION' | 'CLOSED';
  chairCount: number;
  operatingHours: {
    dayOfWeek: number; // 0-6
    openTime: string;
    closeTime: string;
  }[];
  managerId?: string;
  phone: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  amenities: string[];
}

export interface BarberProfile {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialties: string[];
  tier: 'MASTER' | 'SENIOR' | 'JUNIOR' | 'APPRENTICE';
  commissionRate: number; // e.g. 0.60
  rentalFeeWeekly: number;
  rating: number;
  reviewCount: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  bio: string;
  workingDays: number[];
  certifications: string[];
  languagesSpoken: string[];
  joinedDate: string;
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tier: 'VIP' | 'LOYAL' | 'REGULAR' | 'NEW' | 'AT_RISK';
  totalVisits: number;
  totalSpentCents: number;
  noShowCount: number;
  cancellationCount: number;
  preferredBarberId?: string;
  notes: string;
  birthday?: string;
  createdAt: Date;
  loyaltyPoints: number;
  preferredPaymentMethod?: 'APPLE_PAY' | 'GOOGLE_PAY' | 'CREDIT_CARD' | 'CASH';
  marketingOptIn: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'HAIRCUT' | 'BEARD' | 'COMBO' | 'CHEMICAL' | 'ADDON';
  durationMinutes: number;
  priceCents: number;
  description: string;
  isPopular: boolean;
  requiresPatchTest: boolean;
  commissionEligible: boolean;
  allowedTiers: ('MASTER' | 'SENIOR' | 'JUNIOR' | 'APPRENTICE')[];
}

export interface AppointmentRecord {
  id: string;
  shopId: string;
  clientId: string;
  barberId: string;
  serviceIds: string[];
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  startTime: Date;
  endTime: Date;
  subtotalCents: number;
  discountCents: number;
  tipCents: number;
  taxCents: number;
  totalCents: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  paymentMethod?: 'APPLE_PAY' | 'GOOGLE_PAY' | 'CREDIT_CARD' | 'CASH' | 'GIFT_CARD';
  notes?: string;
  cancellationReason?: string;
  checkedInAt?: Date;
}

export interface ReviewRecord {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  shopId: string;
  rating: number; // 1-5
  comment: string;
  category: 'HAIR_QUALITY' | 'PUNCTUALITY' | 'CLEANLINESS' | 'VIBE' | 'PRICE';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  adminReply?: string;
  createdAt: Date;
  verifiedVisit: boolean;
}

export interface InventoryItem {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  category: 'POMADE' | 'BEARD_OIL' | 'SHAMPOO' | 'MERCH' | 'TOOL' | 'FRAGRANCE';
  priceCents: number;
  costCents: number;
  stockQuantity: number;
  reorderThreshold: number;
  supplier: string;
  locationInStore: string;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_CENTS';
  discountValue: number; // e.g. 15 for 15% or 1000 for $10
  minSpendCents: number;
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

export interface MasterSeedDataset {
  locations: ShopLocation[];
  barbers: BarberProfile[];
  clients: ClientProfile[];
  services: ServiceItem[];
  appointments: AppointmentRecord[];
  reviews: ReviewRecord[];
  inventory: InventoryItem[];
  promoCodes: PromoCodeRecord[];
}

// ==========================================
// SEED DATASETS
// ==========================================

export const SHOPS_FIXTURE: ShopLocation[] = [
  {
    id: 'shop-dt-01',
    name: 'Downtown Apex Flagship',
    code: 'DT01',
    address: '100 Broadway St',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10005',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 8,
    phone: '+1-555-0100',
    email: 'downtown@apexbarbers.com',
    coordinates: { lat: 40.7090, lng: -74.0110 },
    amenities: ['Espresso Bar', 'Whiskey Lounge', 'Valet Parking', 'Wi-Fi'],
    operatingHours: [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 5, openTime: '08:30', closeTime: '20:00' },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 0, openTime: '10:00', closeTime: '16:00' },
    ],
  },
  {
    id: 'shop-soho-02',
    name: 'SoHo Craft Studio',
    code: 'SOHO2',
    address: '452 Prince St',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10012',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 6,
    phone: '+1-555-0200',
    email: 'soho@apexbarbers.com',
    coordinates: { lat: 40.7250, lng: -74.0000 },
    amenities: ['Craft Beer Bar', 'Vinyl DJ Booth', 'Wi-Fi'],
    operatingHours: [
      { dayOfWeek: 1, openTime: '10:00', closeTime: '19:00' },
      { dayOfWeek: 2, openTime: '10:00', closeTime: '19:00' },
      { dayOfWeek: 3, openTime: '10:00', closeTime: '19:00' },
      { dayOfWeek: 4, openTime: '10:00', closeTime: '20:00' },
      { dayOfWeek: 5, openTime: '10:00', closeTime: '20:00' },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 0, openTime: '11:00', closeTime: '17:00' },
    ],
  },
  {
    id: 'shop-bk-03',
    name: 'Brooklyn Heritage Barbershop',
    code: 'BK03',
    address: '78 Bedford Ave',
    city: 'Brooklyn',
    state: 'NY',
    postalCode: '11211',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 5,
    phone: '+1-555-0300',
    email: 'brooklyn@apexbarbers.com',
    coordinates: { lat: 40.7180, lng: -73.9570 },
    amenities: ['Cold Brew Tap', 'Arcade Machine', 'Patio Seating'],
    operatingHours: [
      { dayOfWeek: 2, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 0, openTime: '10:00', closeTime: '16:00' },
    ],
  },
  {
    id: 'shop-midtown-04',
    name: 'Midtown Executive Club',
    code: 'MID4',
    address: '550 5th Ave',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10036',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 10,
    phone: '+1-555-0400',
    email: 'midtown@apexbarbers.com',
    coordinates: { lat: 40.7580, lng: -73.9855 },
    amenities: ['Cigar Lounge', 'Private VIP Booths', 'Shoeshine Service', 'Boardroom'],
    operatingHours: [
      { dayOfWeek: 1, openTime: '08:00', closeTime: '20:00' },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '20:00' },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '20:00' },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '21:00' },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '21:00' },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '17:00' },
    ],
  },
  {
    id: 'shop-renov-05',
    name: 'Westside Modern (Renovation)',
    code: 'WEST5',
    address: '120 West End Ave',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10023',
    timezone: 'America/New_York',
    status: 'RENOVATION',
    chairCount: 6,
    phone: '+1-555-0500',
    email: 'westside@apexbarbers.com',
    coordinates: { lat: 40.7760, lng: -73.9870 },
    amenities: ['Future Spa Suite', 'Smart Mirrors'],
    operatingHours: [],
  },
];

export const SERVICES_FIXTURE: ServiceItem[] = [
  {
    id: 'srv-classic-cut',
    name: 'Classic Gentleman Haircut',
    category: 'HAIRCUT',
    durationMinutes: 30,
    priceCents: 4500,
    description: 'Precision scissor or clipper haircut, hot lather neck shave, and style finish.',
    isPopular: true,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR', 'JUNIOR', 'APPRENTICE'],
  },
  {
    id: 'srv-fade-sculpt',
    name: 'Skin Fade & Beard Sculpt',
    category: 'COMBO',
    durationMinutes: 55,
    priceCents: 7500,
    description: 'Immaculate zero fade, beard trim with straight razor lineup, hot towel, and organic beard oil.',
    isPopular: true,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR', 'JUNIOR'],
  },
  {
    id: 'srv-hot-towel-shave',
    name: 'Royal Hot Towel Straight Razor Shave',
    category: 'BEARD',
    durationMinutes: 35,
    priceCents: 5000,
    description: 'Traditional multi-step hot towel treatment with pre-shave oil, warm lather, and soothing balm.',
    isPopular: false,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR'],
  },
  {
    id: 'srv-beard-trim',
    name: 'Beard Trim & Shape-Up',
    category: 'BEARD',
    durationMinutes: 25,
    priceCents: 3500,
    description: 'Detailed beard sculpting, neckline cleanup, and conditioning balm application.',
    isPopular: true,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR', 'JUNIOR', 'APPRENTICE'],
  },
  {
    id: 'srv-grey-blend',
    name: 'Express Grey Blending Color',
    category: 'CHEMICAL',
    durationMinutes: 30,
    priceCents: 5500,
    description: 'Subtle 10-minute professional grey camouflage treatment for a youthful, natural look.',
    isPopular: false,
    requiresPatchTest: true,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR'],
  },
  {
    id: 'srv-father-son',
    name: 'Father & Son Duo Cut',
    category: 'COMBO',
    durationMinutes: 60,
    priceCents: 8000,
    description: 'Side-by-side classic haircuts for dad and son (under 12).',
    isPopular: true,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR', 'JUNIOR'],
  },
  {
    id: 'srv-scalp-treatment',
    name: 'Exfoliating Scalp Massage Treatment',
    category: 'ADDON',
    durationMinutes: 15,
    priceCents: 2500,
    description: 'Deep cleansing tea tree scalp scrub to stimulate follicles and relieve tension.',
    isPopular: false,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR', 'JUNIOR', 'APPRENTICE'],
  },
  {
    id: 'srv-executive-package',
    name: 'The Executive Ultimate Spa Package',
    category: 'COMBO',
    durationMinutes: 90,
    priceCents: 14000,
    description: 'Includes haircut, beard sculpt, hot towel shave, facial massage, and premium styling products.',
    isPopular: true,
    requiresPatchTest: false,
    commissionEligible: true,
    allowedTiers: ['MASTER', 'SENIOR'],
  },
  {
    id: 'srv-chemical-straighten',
    name: 'Keratin Hair Smoothing Treatment',
    category: 'CHEMICAL',
    durationMinutes: 75,
    priceCents: 15000,
    description: 'Professional smoothing and frizz reduction treatment.',
    isPopular: false,
    requiresPatchTest: true,
    commissionEligible: true,
    allowedTiers: ['MASTER'],
  },
];

export const BARBERS_FIXTURE: BarberProfile[] = [
  {
    id: 'barber-alex',
    shopId: 'shop-dt-01',
    firstName: 'Alexander',
    lastName: 'Vance',
    email: 'alex.vance@apexbarbers.com',
    phone: '+1-555-0101',
    specialties: ['Skin Fades', 'Razor Work', 'Pompadours'],
    tier: 'MASTER',
    commissionRate: 0.60,
    rentalFeeWeekly: 350,
    rating: 4.96,
    reviewCount: 412,
    status: 'ACTIVE',
    bio: 'Award-winning master barber with 12 years of craftsmanship in London and New York.',
    workingDays: [1, 2, 3, 4, 5],
    certifications: ['Master Barber State License', 'Advanced Razor Safety Certified'],
    languagesSpoken: ['English', 'French'],
    joinedDate: '2021-03-15',
  },
  {
    id: 'barber-marcus',
    shopId: 'shop-dt-01',
    firstName: 'Marcus',
    lastName: 'Sterling',
    email: 'marcus.sterling@apexbarbers.com',
    phone: '+1-555-0102',
    specialties: ['Beard Sculpting', 'Traditional Tapers', 'Hot Towel Shaves'],
    tier: 'SENIOR',
    commissionRate: 0.55,
    rentalFeeWeekly: 300,
    rating: 4.88,
    reviewCount: 284,
    status: 'ACTIVE',
    bio: 'Master of hot towel shaves and bespoke beard architecture.',
    workingDays: [2, 3, 4, 5, 6],
    certifications: ['Senior Barber License', 'Beard Styling Specialist'],
    languagesSpoken: ['English', 'Spanish'],
    joinedDate: '2022-06-10',
  },
  {
    id: 'barber-elena',
    shopId: 'shop-soho-02',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@apexbarbers.com',
    phone: '+1-555-0103',
    specialties: ['Textured Crops', 'Scissor Work', 'Grey Blending'],
    tier: 'MASTER',
    commissionRate: 0.60,
    rentalFeeWeekly: 350,
    rating: 4.94,
    reviewCount: 350,
    status: 'ACTIVE',
    bio: 'Precision stylist specialising in modern textured crops and scissor styling.',
    workingDays: [1, 2, 4, 5, 6],
    certifications: ['Master Stylist', 'Advanced Colorist Diploma'],
    languagesSpoken: ['English', 'Russian'],
    joinedDate: '2021-11-01',
  },
  {
    id: 'barber-jordan',
    shopId: 'shop-soho-02',
    firstName: 'Jordan',
    lastName: 'Blake',
    email: 'jordan.blake@apexbarbers.com',
    phone: '+1-555-0104',
    specialties: ['Burst Fades', 'Designs', 'Fast Cuts'],
    tier: 'JUNIOR',
    commissionRate: 0.50,
    rentalFeeWeekly: 250,
    rating: 4.75,
    reviewCount: 96,
    status: 'ACTIVE',
    bio: 'High-energy rising star known for razor-sharp fades and contemporary freestyle designs.',
    workingDays: [3, 4, 5, 6, 0],
    certifications: ['Junior Barber License'],
    languagesSpoken: ['English'],
    joinedDate: '2024-01-15',
  },
  {
    id: 'barber-dante',
    shopId: 'shop-bk-03',
    firstName: 'Dante',
    lastName: 'Moretti',
    email: 'dante.moretti@apexbarbers.com',
    phone: '+1-555-0105',
    specialties: ['Classic Italian Taper', 'Mustache Styling', 'Hot Lather'],
    tier: 'SENIOR',
    commissionRate: 0.55,
    rentalFeeWeekly: 300,
    rating: 4.91,
    reviewCount: 215,
    status: 'ACTIVE',
    bio: 'Third-generation barber bringing old-school Italian technique to Brooklyn.',
    workingDays: [2, 3, 4, 5, 6],
    certifications: ['Master Barber License', 'Italian Shaving Masterclass'],
    languagesSpoken: ['English', 'Italian'],
    joinedDate: '2022-09-12',
  },
  {
    id: 'barber-chloe',
    shopId: 'shop-bk-03',
    firstName: 'Chloe',
    lastName: 'St-Pierre',
    email: 'chloe.stpierre@apexbarbers.com',
    phone: '+1-555-0106',
    specialties: ['Long Hair Styling', 'Layered Cuts', 'Beard Trims'],
    tier: 'APPRENTICE',
    commissionRate: 0.45,
    rentalFeeWeekly: 200,
    rating: 4.65,
    reviewCount: 42,
    status: 'ACTIVE',
    bio: 'Talented apprentice under master supervision with exceptional attention to detail.',
    workingDays: [3, 4, 5, 6, 0],
    certifications: ['Apprentice License'],
    languagesSpoken: ['English'],
    joinedDate: '2025-04-01',
  },
  {
    id: 'barber-victoria',
    shopId: 'shop-midtown-04',
    firstName: 'Victoria',
    lastName: 'Sinclair',
    email: 'victoria.sinclair@apexbarbers.com',
    phone: '+1-555-0107',
    specialties: ['Executive Styling', 'Hot Towel Rituals', 'Scalp Care'],
    tier: 'MASTER',
    commissionRate: 0.62,
    rentalFeeWeekly: 400,
    rating: 4.98,
    reviewCount: 512,
    status: 'ACTIVE',
    bio: 'Renowned executive stylist serving Fortune 500 leaders and celebrities in Midtown.',
    workingDays: [1, 2, 3, 4, 5],
    certifications: ['Master Groomer Certification', 'Trichology Scalp Specialist'],
    languagesSpoken: ['English', 'German'],
    joinedDate: '2020-01-10',
  },
  {
    id: 'barber-liam',
    shopId: 'shop-midtown-04',
    firstName: 'Liam',
    lastName: 'O’Neill',
    email: 'liam.oneill@apexbarbers.com',
    phone: '+1-555-0108',
    specialties: ['Modern Pompadours', 'Scissor Crops', 'Beard Grooming'],
    tier: 'SENIOR',
    commissionRate: 0.58,
    rentalFeeWeekly: 320,
    rating: 4.89,
    reviewCount: 190,
    status: 'ACTIVE',
    bio: 'Sharp dresser and meticulous craftsman specialising in timeless gentleman cuts.',
    workingDays: [2, 3, 4, 5, 6],
    certifications: ['Senior Barber License'],
    languagesSpoken: ['English', 'Irish'],
    joinedDate: '2023-05-18',
  },
];

export const CLIENTS_FIXTURE: ClientProfile[] = [
  {
    id: 'client-001',
    firstName: 'Harrison',
    lastName: 'Fordham',
    email: 'harrison.fordham@example.com',
    phone: '+1-555-2001',
    tier: 'VIP',
    totalVisits: 34,
    totalSpentCents: 272000,
    noShowCount: 0,
    cancellationCount: 1,
    preferredBarberId: 'barber-alex',
    notes: 'Prefers espresso with oat milk. High top skin fade every 2 weeks sharp.',
    birthday: '1985-04-12',
    createdAt: new Date('2023-01-15T10:00:00Z'),
    loyaltyPoints: 1420,
    preferredPaymentMethod: 'APPLE_PAY',
    marketingOptIn: true,
  },
  {
    id: 'client-002',
    firstName: 'Julian',
    lastName: 'Soto',
    email: 'julian.soto@example.com',
    phone: '+1-555-2002',
    tier: 'LOYAL',
    totalVisits: 18,
    totalSpentCents: 135000,
    noShowCount: 0,
    cancellationCount: 0,
    preferredBarberId: 'barber-marcus',
    notes: 'Sensitive skin. Uses alcohol-free post-shave balm only.',
    birthday: '1992-09-24',
    createdAt: new Date('2023-05-20T14:30:00Z'),
    loyaltyPoints: 680,
    preferredPaymentMethod: 'GOOGLE_PAY',
    marketingOptIn: true,
  },
  {
    id: 'client-003',
    firstName: 'Devon',
    lastName: 'Kaufman',
    email: 'devon.kaufman@example.com',
    phone: '+1-555-2003',
    tier: 'REGULAR',
    totalVisits: 7,
    totalSpentCents: 45000,
    noShowCount: 1,
    cancellationCount: 2,
    preferredBarberId: 'barber-elena',
    notes: 'Usually books last minute on Thursdays.',
    birthday: '1998-11-03',
    createdAt: new Date('2024-02-10T09:15:00Z'),
    loyaltyPoints: 210,
    preferredPaymentMethod: 'CREDIT_CARD',
    marketingOptIn: false,
  },
  {
    id: 'client-004',
    firstName: 'Liam',
    lastName: 'O’Connor',
    email: 'liam.oconnor@example.com',
    phone: '+1-555-2004',
    tier: 'NEW',
    totalVisits: 1,
    totalSpentCents: 7500,
    noShowCount: 0,
    cancellationCount: 0,
    preferredBarberId: 'barber-jordan',
    notes: 'First time visitor. Interested in low fade.',
    birthday: '2001-07-19',
    createdAt: new Date('2026-11-10T11:00:00Z'),
    loyaltyPoints: 75,
    preferredPaymentMethod: 'APPLE_PAY',
    marketingOptIn: true,
  },
  {
    id: 'client-005',
    firstName: 'Victor',
    lastName: 'Chen',
    email: 'victor.chen@example.com',
    phone: '+1-555-2005',
    tier: 'AT_RISK',
    totalVisits: 12,
    totalSpentCents: 96000,
    noShowCount: 2,
    cancellationCount: 3,
    preferredBarberId: 'barber-dante',
    notes: 'Has not visited in over 90 days. Send re-engagement promo.',
    birthday: '1988-12-30',
    createdAt: new Date('2023-08-05T16:00:00Z'),
    loyaltyPoints: 400,
    preferredPaymentMethod: 'CREDIT_CARD',
    marketingOptIn: false,
  },
  {
    id: 'client-006',
    firstName: 'Marcus',
    lastName: 'Aurelius',
    email: 'marcus.aurelius@example.com',
    phone: '+1-555-2006',
    tier: 'VIP',
    totalVisits: 45,
    totalSpentCents: 420000,
    noShowCount: 0,
    cancellationCount: 0,
    preferredBarberId: 'barber-victoria',
    notes: 'Executive client. Always requests complimentary scotch and scalp massage.',
    birthday: '1975-03-20',
    createdAt: new Date('2022-02-10T10:00:00Z'),
    loyaltyPoints: 2150,
    preferredPaymentMethod: 'CREDIT_CARD',
    marketingOptIn: true,
  },
  {
    id: 'client-007',
    firstName: 'Sophia',
    lastName: 'Martinez',
    email: 'sophia.martinez@example.com',
    phone: '+1-555-2007',
    tier: 'LOYAL',
    totalVisits: 14,
    totalSpentCents: 110000,
    noShowCount: 0,
    cancellationCount: 1,
    preferredBarberId: 'barber-elena',
    notes: 'Books father & son appointments regularly.',
    birthday: '1990-08-14',
    createdAt: new Date('2023-10-12T12:00:00Z'),
    loyaltyPoints: 550,
    preferredPaymentMethod: 'APPLE_PAY',
    marketingOptIn: true,
  },
  {
    id: 'client-008',
    firstName: 'Ethan',
    lastName: 'Hunt',
    email: 'ethan.hunt@example.com',
    phone: '+1-555-2008',
    tier: 'REGULAR',
    totalVisits: 6,
    totalSpentCents: 38000,
    noShowCount: 0,
    cancellationCount: 0,
    preferredBarberId: 'barber-liam',
    notes: 'Prefers quiet appointments.',
    birthday: '1982-11-30',
    createdAt: new Date('2025-01-05T09:00:00Z'),
    loyaltyPoints: 190,
    preferredPaymentMethod: 'GOOGLE_PAY',
    marketingOptIn: false,
  },
];

export const INVENTORY_FIXTURE: InventoryItem[] = [
  {
    id: 'inv-pomade-01',
    shopId: 'shop-dt-01',
    sku: 'APEX-MATTE-01',
    name: 'Apex Imperial Matte Pomade (100ml)',
    category: 'POMADE',
    priceCents: 2400,
    costCents: 900,
    stockQuantity: 42,
    reorderThreshold: 10,
    supplier: 'Apex Grooming Labs',
    locationInStore: 'Shelf A1 - Front Display',
  },
  {
    id: 'inv-oil-02',
    shopId: 'shop-dt-01',
    sku: 'APEX-BEARD-02',
    name: 'Sandalwood & Cedarwood Beard Elixir (30ml)',
    category: 'BEARD_OIL',
    priceCents: 2800,
    costCents: 1100,
    stockQuantity: 18,
    reorderThreshold: 5,
    supplier: 'Apex Grooming Labs',
    locationInStore: 'Shelf A2 - Register Counter',
  },
  {
    id: 'inv-shampoo-03',
    shopId: 'shop-soho-02',
    sku: 'APEX-SHAMPOO-03',
    name: 'Tea Tree Refreshing Scalp Shampoo (250ml)',
    category: 'SHAMPOO',
    priceCents: 2200,
    costCents: 850,
    stockQuantity: 25,
    reorderThreshold: 8,
    supplier: 'Botanical Haircare Co',
    locationInStore: 'Station B - Backwall',
  },
  {
    id: 'inv-merch-04',
    shopId: 'shop-bk-03',
    sku: 'APEX-CAP-01',
    name: 'Apex Vintage Embroidered Dad Cap',
    category: 'MERCH',
    priceCents: 3000,
    costCents: 1200,
    stockQuantity: 14,
    reorderThreshold: 4,
    supplier: 'Brooklyn Threads',
    locationInStore: 'Merch Stand C',
  },
  {
    id: 'inv-tool-05',
    shopId: 'shop-midtown-04',
    sku: 'APEX-RAZOR-PRO',
    name: 'Apex Pro Straight Razor Holder',
    category: 'TOOL',
    priceCents: 4500,
    costCents: 1800,
    stockQuantity: 8,
    reorderThreshold: 3,
    supplier: 'Japanese Steelcraft',
    locationInStore: 'Back Cabinet Safe',
  },
  {
    id: 'inv-fragrance-06',
    shopId: 'shop-midtown-04',
    sku: 'APEX-COLOGNE-01',
    name: 'Eau de Cologne - Vetiver & Tobacco (50ml)',
    category: 'FRAGRANCE',
    priceCents: 6500,
    costCents: 2500,
    stockQuantity: 12,
    reorderThreshold: 4,
    supplier: 'Aromatics NYC',
    locationInStore: 'Display Case 1',
  },
];

export const APPOINTMENTS_FIXTURE: AppointmentRecord[] = [
  {
    id: 'apt-1001',
    shopId: 'shop-dt-01',
    clientId: 'client-001',
    barberId: 'barber-alex',
    serviceIds: ['srv-classic-cut'],
    status: 'COMPLETED',
    startTime: new Date('2026-11-14T10:00:00Z'),
    endTime: new Date('2026-11-14T10:30:00Z'),
    subtotalCents: 4500,
    discountCents: 0,
    tipCents: 1000,
    taxCents: 405,
    totalCents: 5905,
    paymentStatus: 'PAID',
    paymentMethod: 'APPLE_PAY',
    notes: 'Regular fortnightly cut.',
    checkedInAt: new Date('2026-11-14T09:55:00Z'),
  },
  {
    id: 'apt-1002',
    shopId: 'shop-dt-01',
    clientId: 'client-002',
    barberId: 'barber-marcus',
    serviceIds: ['srv-fade-sculpt'],
    status: 'COMPLETED',
    startTime: new Date('2026-11-14T11:00:00Z'),
    endTime: new Date('2026-11-14T11:55:00Z'),
    subtotalCents: 7500,
    discountCents: 0,
    tipCents: 1500,
    taxCents: 675,
    totalCents: 9675,
    paymentStatus: 'PAID',
    paymentMethod: 'GOOGLE_PAY',
    notes: 'Skin fade and beard trim.',
    checkedInAt: new Date('2026-11-14T10:52:00Z'),
  },
  {
    id: 'apt-1003',
    shopId: 'shop-soho-02',
    clientId: 'client-003',
    barberId: 'barber-elena',
    serviceIds: ['srv-classic-cut', 'srv-scalp-treatment'],
    status: 'SCHEDULED',
    startTime: new Date('2026-11-18T14:00:00Z'),
    endTime: new Date('2026-11-18T14:45:00Z'),
    subtotalCents: 7000,
    discountCents: 0,
    tipCents: 0,
    taxCents: 630,
    totalCents: 7630,
    paymentStatus: 'PENDING',
    paymentMethod: 'CREDIT_CARD',
    notes: 'Adding scalp massage.',
  },
  {
    id: 'apt-1004',
    shopId: 'shop-midtown-04',
    clientId: 'client-006',
    barberId: 'barber-victoria',
    serviceIds: ['srv-executive-package'],
    status: 'CONFIRMED',
    startTime: new Date('2026-11-17T15:00:00Z'),
    endTime: new Date('2026-11-17T16:30:00Z'),
    subtotalCents: 14000,
    discountCents: 1400,
    tipCents: 3000,
    taxCents: 1134,
    totalCents: 16734,
    paymentStatus: 'PAID',
    paymentMethod: 'CREDIT_CARD',
    notes: 'VIP guest. Prepare single malt scotch.',
  },
  {
    id: 'apt-1005',
    shopId: 'shop-bk-03',
    clientId: 'client-007',
    barberId: 'barber-dante',
    serviceIds: ['srv-father-son'],
    status: 'IN_PROGRESS',
    startTime: new Date('2026-11-16T11:00:00Z'),
    endTime: new Date('2026-11-16T12:00:00Z'),
    subtotalCents: 8000,
    discountCents: 0,
    tipCents: 1500,
    taxCents: 720,
    totalCents: 10220,
    paymentStatus: 'PAID',
    paymentMethod: 'APPLE_PAY',
    notes: 'Father and 8-year-old son side by side.',
    checkedInAt: new Date('2026-11-16T10:50:00Z'),
  },
  {
    id: 'apt-1006',
    shopId: 'shop-dt-01',
    clientId: 'client-005',
    barberId: 'barber-alex',
    serviceIds: ['srv-classic-cut'],
    status: 'NO_SHOW',
    startTime: new Date('2026-11-10T16:00:00Z'),
    endTime: new Date('2026-11-10T16:30:00Z'),
    subtotalCents: 4500,
    discountCents: 0,
    tipCents: 0,
    taxCents: 405,
    totalCents: 4905,
    paymentStatus: 'FAILED',
    notes: 'Client failed to show up without prior notice.',
  },
  {
    id: 'apt-1007',
    shopId: 'shop-soho-02',
    clientId: 'client-003',
    barberId: 'barber-jordan',
    serviceIds: ['srv-fade-sculpt'],
    status: 'CANCELLED',
    startTime: new Date('2026-11-12T13:00:00Z'),
    endTime: new Date('2026-11-12T13:55:00Z'),
    subtotalCents: 7500,
    discountCents: 0,
    tipCents: 0,
    taxCents: 0,
    totalCents: 7500,
    paymentStatus: 'REFUNDED',
    cancellationReason: 'Client called in sick 4 hours prior.',
  },
];

export const REVIEWS_FIXTURE: ReviewRecord[] = [
  {
    id: 'rev-01',
    appointmentId: 'apt-1001',
    clientId: 'client-001',
    barberId: 'barber-alex',
    shopId: 'shop-dt-01',
    rating: 5,
    comment: 'Alex never misses. Best fade in Manhattan hands down!',
    category: 'HAIR_QUALITY',
    sentiment: 'POSITIVE',
    adminReply: 'Thanks Harrison! Always a pleasure having you in the chair.',
    createdAt: new Date('2026-11-14T11:00:00Z'),
    verifiedVisit: true,
  },
  {
    id: 'rev-02',
    appointmentId: 'apt-1002',
    clientId: 'client-002',
    barberId: 'barber-marcus',
    shopId: 'shop-dt-01',
    rating: 5,
    comment: 'Marcus gave me the cleanest hot towel shave of my life. Highly recommend.',
    category: 'VIBE',
    sentiment: 'POSITIVE',
    adminReply: 'Thank you Julian! Marcus takes immense pride in his craft.',
    createdAt: new Date('2026-11-14T12:30:00Z'),
    verifiedVisit: true,
  },
  {
    id: 'rev-03',
    appointmentId: 'apt-1004',
    clientId: 'client-006',
    barberId: 'barber-victoria',
    shopId: 'shop-midtown-04',
    rating: 5,
    comment: 'Victoria provides absolute world-class executive service. Immaculate lounge.',
    category: 'CLEANLINESS',
    sentiment: 'POSITIVE',
    adminReply: 'Thank you Mr. Aurelius. It is our utmost honor to serve you.',
    createdAt: new Date('2026-11-15T10:00:00Z'),
    verifiedVisit: true,
  },
];

export const PROMO_CODES_FIXTURE: PromoCodeRecord[] = [
  {
    id: 'promo-welcome15',
    code: 'WELCOME15',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minSpendCents: 4000,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validUntil: new Date('2026-12-31T23:59:59Z'),
    maxUses: 1000,
    currentUses: 342,
    isActive: true,
  },
  {
    id: 'promo-vip20',
    code: 'VIP20OFF',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minSpendCents: 8000,
    validFrom: new Date('2026-06-01T00:00:00Z'),
    validUntil: new Date('2026-12-31T23:59:59Z'),
    maxUses: 250,
    currentUses: 88,
    isActive: true,
  },
  {
    id: 'promo-summer10',
    code: 'SUMMER10',
    discountType: 'FIXED_CENTS',
    discountValue: 1000,
    minSpendCents: 5000,
    validFrom: new Date('2026-06-01T00:00:00Z'),
    validUntil: new Date('2026-09-01T00:00:00Z'),
    maxUses: 500,
    currentUses: 500,
    isActive: false,
  },
];

export class DatabaseSeederEngine {
  private dataset: MasterSeedDataset;

  constructor(customDataset?: Partial<MasterSeedDataset>) {
    this.dataset = {
      locations: [...SHOPS_FIXTURE],
      barbers: [...BARBERS_FIXTURE],
      clients: [...CLIENTS_FIXTURE],
      services: [...SERVICES_FIXTURE],
      appointments: [...APPOINTMENTS_FIXTURE],
      reviews: [...REVIEWS_FIXTURE],
      inventory: [...INVENTORY_FIXTURE],
      promoCodes: [...PROMO_CODES_FIXTURE],
      ...customDataset,
    };
  }

  public getDataset(): MasterSeedDataset {
    return this.dataset;
  }

  public validateReferentialIntegrity(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const shopIds = new Set(this.dataset.locations.map(s => s.id));
    const barberIds = new Set(this.dataset.barbers.map(b => b.id));
    const clientIds = new Set(this.dataset.clients.map(c => c.id));
    const serviceIds = new Set(this.dataset.services.map(s => s.id));
    const appointmentIds = new Set(this.dataset.appointments.map(a => a.id));

    // Validate Barbers shop link
    for (const barber of this.dataset.barbers) {
      if (!shopIds.has(barber.shopId)) {
        errors.push(`Barber ${barber.id} references invalid shopId ${barber.shopId}`);
      }
    }

    // Validate Inventory shop link
    for (const item of this.dataset.inventory) {
      if (!shopIds.has(item.shopId)) {
        errors.push(`Inventory item ${item.id} references invalid shopId ${item.shopId}`);
      }
    }

    // Validate Appointments
    for (const apt of this.dataset.appointments) {
      if (!shopIds.has(apt.shopId)) {
        errors.push(`Appointment ${apt.id} references invalid shopId ${apt.shopId}`);
      }
      if (!clientIds.has(apt.clientId)) {
        errors.push(`Appointment ${apt.id} references invalid clientId ${apt.clientId}`);
      }
      if (!barberIds.has(apt.barberId)) {
        errors.push(`Appointment ${apt.id} references invalid barberId ${apt.barberId}`);
      }
      for (const sId of apt.serviceIds) {
        if (!serviceIds.has(sId)) {
          errors.push(`Appointment ${apt.id} references invalid serviceId ${sId}`);
        }
      }
    }

    // Validate Reviews
    for (const rev of this.dataset.reviews) {
      if (!clientIds.has(rev.clientId)) {
        errors.push(`Review ${rev.id} references invalid clientId ${rev.clientId}`);
      }
      if (!barberIds.has(rev.barberId)) {
        errors.push(`Review ${rev.id} references invalid barberId ${rev.barberId}`);
      }
      if (!shopIds.has(rev.shopId)) {
        errors.push(`Review ${rev.id} references invalid shopId ${rev.shopId}`);
      }
      if (!appointmentIds.has(rev.appointmentId)) {
        errors.push(`Review ${rev.id} references invalid appointmentId ${rev.appointmentId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public generateSummary(): {
    shopsCount: number;
    barbersCount: number;
    clientsCount: number;
    servicesCount: number;
    appointmentsCount: number;
    reviewsCount: number;
    inventoryCount: number;
    promoCodesCount: number;
  } {
    return {
      shopsCount: this.dataset.locations.length,
      barbersCount: this.dataset.barbers.length,
      clientsCount: this.dataset.clients.length,
      servicesCount: this.dataset.services.length,
      appointmentsCount: this.dataset.appointments.length,
      reviewsCount: this.dataset.reviews.length,
      inventoryCount: this.dataset.inventory.length,
      promoCodesCount: this.dataset.promoCodes.length,
    };
  }
}
