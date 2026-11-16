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
  commissionRate: number; // e.g. 0.55
  rentalFeeWeekly: number;
  rating: number;
  reviewCount: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  bio: string;
  workingDays: number[];
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
}

export interface InventoryItem {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  category: 'POMADE' | 'BEARD_OIL' | 'SHAMPOO' | 'MERCH' | 'TOOL';
  priceCents: number;
  costCents: number;
  stockQuantity: number;
  reorderThreshold: number;
  supplier: string;
}

export interface MasterSeedDataset {
  locations: ShopLocation[];
  barbers: BarberProfile[];
  clients: ClientProfile[];
  services: ServiceItem[];
  appointments: AppointmentRecord[];
  reviews: ReviewRecord[];
  inventory: InventoryItem[];
}

// ==========================================
// SEED DATASETS
// ==========================================

export const SHOPS_FIXTURE: ShopLocation[] = [
  {
    id: 'shop-dt-01',
    name: 'Downtown Apex Barbershop',
    code: 'DT01',
    address: '100 Broadway St',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10005',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 8,
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
    name: 'SoHo Craft Barbershop',
    code: 'SOHO2',
    address: '452 Prince St',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10012',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 6,
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
    name: 'Brooklyn Heritage Cuts',
    code: 'BK03',
    address: '78 Bedford Ave',
    city: 'Brooklyn',
    state: 'NY',
    postalCode: '11211',
    timezone: 'America/New_York',
    status: 'ACTIVE',
    chairCount: 5,
    operatingHours: [
      { dayOfWeek: 2, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '19:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 0, openTime: '10:00', closeTime: '16:00' },
    ],
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
  },
];

// ==========================================
// FACTORIES & SEEDER ENGINE
// ==========================================

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
  } {
    return {
      shopsCount: this.dataset.locations.length,
      barbersCount: this.dataset.barbers.length,
      clientsCount: this.dataset.clients.length,
      servicesCount: this.dataset.services.length,
      appointmentsCount: this.dataset.appointments.length,
      reviewsCount: this.dataset.reviews.length,
      inventoryCount: this.dataset.inventory.length,
    };
  }
}
