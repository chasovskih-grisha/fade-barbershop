// Послуги з цінами за місто (kyy/lvi) і барбери для seed-dev.ts.

import { id } from './db';

export const SERVICES = [
  {
    id: id('svc_haircut'),
    name: 'Haircut',
    duration: 30,
    parallelDuration: null,
    description: 'Класична чоловіча стрижка з консультацією та укладкою',
    category: 'Hair',
    prices: { kyy: 500, lvi: 450, ods: 480, hrk: 420 },
  },
  {
    id: id('svc_beard'),
    name: 'Beard trim',
    duration: 20,
    parallelDuration: null,
    description: 'Моделювання та корекція бороди і вусів',
    category: 'Beard',
    prices: { kyy: 350, lvi: 320, ods: 330, hrk: 300 },
  },
  {
    id: id('svc_father_son'),
    name: 'Father + son',
    duration: 90,
    parallelDuration: 50,
    description: 'Спільна стрижка татку і сину в два паралельні крісла',
    category: 'Combo',
    prices: { kyy: 900, lvi: 850, ods: 870, hrk: 800 },
  },
  {
    id: id('svc_royal_shave'),
    name: 'Royal Shave',
    duration: 45,
    parallelDuration: null,
    description: 'Традиційне гоління небезпечною бритвою з гарячими компресами',
    category: 'Shave',
    prices: { kyy: 600, lvi: 550, ods: 580, hrk: 500 },
  },
  {
    id: id('svc_hair_coloring'),
    name: 'Gray Camouflage / Coloring',
    duration: 40,
    parallelDuration: null,
    description: 'Камуфляж сивини або професійне фарбування волосся',
    category: 'Care',
    prices: { kyy: 700, lvi: 650, ods: 670, hrk: 600 },
  },
  {
    id: id('svc_facial_mask'),
    name: 'Black Mask & Facial Care',
    duration: 25,
    parallelDuration: null,
    description: 'Очищувальна маска та догляд за шкірою обличчя',
    category: 'Care',
    prices: { kyy: 400, lvi: 380, ods: 390, hrk: 350 },
  },
];

export const BARBERS = [
  { id: id('barber_Oleh'), phone: '+380671110001', name: 'Oleh' },
  { id: id('barber_Taras'), phone: '+380671110002', name: 'Taras' },
  { id: id('barber_Andriy'), phone: '+380671110003', name: 'Andriy' },
  { id: id('barber_Maksym'), phone: '+380671110004', name: 'Maksym' },
  { id: id('barber_Denys'), phone: '+380671110005', name: 'Denys' },
];
