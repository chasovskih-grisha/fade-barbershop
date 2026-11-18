// Інструменти MCP: каталог — барбери та послуги.

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const getBarber = {
  name: 'getBarber',
  description: 'Get barber details by ID',
  inputSchema: {
    type: 'object',
    properties: {
      barberId: {
        type: 'string',
        description: 'Barber ID',
      },
    },
  },
} satisfies Tool;

export const listBarbers = {
  name: 'listBarbers',
  description: 'List all barbers with filters',
  inputSchema: {
    type: 'object',
    properties: {
      locationId: {
        type: 'string',
        description: 'Location ID (optional)',
      },
    },
  },
} satisfies Tool;

export const getServiceByCategory = {
  name: 'getServiceByCategory',
  description: 'Get services by category',
  inputSchema: {
    type: 'object',
    properties: {
      categoryId: {
        type: 'string',
        description: 'Category ID',
      },
      locationId: {
        type: 'string',
        description: 'Location ID (optional)',
      },
    },
  },
} satisfies Tool;
