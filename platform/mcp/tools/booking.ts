// Інструменти MCP: створення і перегляд бронювань.

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const getBooking = {
  name: 'getBooking',
  description: 'Get booking details by ID',
  inputSchema: {
    type: 'object',
    properties: {
      bookingId: {
        type: 'string',
        description: 'Booking ID',
      },
    },
  },
} satisfies Tool;

export const listBookings = {
  name: 'listBookings',
  description: 'List all bookings with filters',
  inputSchema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Date in YYYY-MM-DD format',
      },
      barberId: {
        type: 'string',
        description: 'Barber ID',
      },
    },
  },
} satisfies Tool;

export const createBooking = {
  name: 'createBooking',
  description: 'Create new booking',
  inputSchema: {
    type: 'object',
    properties: {
      serviceId: {
        type: 'string',
        description: 'Service ID',
      },
      barberId: {
        type: 'string',
        description: 'Barber ID',
      },
      date: {
        type: 'string',
        description: 'Date in YYYY-MM-DD',
      },
      time: {
        type: 'string',
        description: 'Time slot',
      },
    },
  },
} satisfies Tool;
