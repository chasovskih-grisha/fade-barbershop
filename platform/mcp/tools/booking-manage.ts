// Інструменти MCP: керування бронюванням (скасування, оновлення).

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const cancelBooking = {
  name: 'cancelBooking',
  description: 'Cancel booking by ID',
  inputSchema: {
    type: 'object',
    properties: {
      bookingId: {
        type: 'string',
        description: 'Booking ID',
      },
      reason: {
        type: 'string',
        description: 'Cancellation reason',
      },
    },
  },
} satisfies Tool;

export const updateBooking = {
  name: 'updateBooking',
  description: 'Update booking details',
  inputSchema: {
    type: 'object',
    properties: {
      bookingId: {
        type: 'string',
        description: 'Booking ID',
      },
      date: {
        type: 'string',
        description: 'New date (optional)',
      },
      time: {
        type: 'string',
        description: 'New time slot (optional)',
      },
      status: {
        type: 'string',
        description: 'New status (optional)',
      },
    },
  },
} satisfies Tool;
