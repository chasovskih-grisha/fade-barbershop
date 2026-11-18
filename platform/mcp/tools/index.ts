// Реєстр інструментів MCP у порядку, в якому їх бачить клієнт
// (порядок збережено 1:1 від початкового монолітного файлу).
//
// `satisfies Tool[]` робить контракт перевірним: помилка в імені інструмента
// або у його inputSchema тепер падає на typecheck, а не на клієнта в рантаймі.

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { getBooking, listBookings, createBooking } from './booking.ts';
import { cancelBooking, updateBooking } from './booking-manage.ts';
import { getCustomer, listCustomers, getLoyalty, updateLoyalty } from './customers.ts';
import { getBarber, listBarbers, getServiceByCategory } from './catalog.ts';

export const TOOLS = [
  getBooking,
  listBookings,
  createBooking,
  getCustomer,
  listCustomers,
  getBarber,
  listBarbers,
  getLoyalty,
  updateLoyalty,
  getServiceByCategory,
  cancelBooking,
  updateBooking,
] satisfies Tool[];
