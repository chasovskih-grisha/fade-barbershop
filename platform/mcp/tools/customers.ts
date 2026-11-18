// Інструменти MCP: клієнти та лояльність.

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const getCustomer = {
  name: 'getCustomer',
  description: 'Get customer details by ID or email',
  inputSchema: {
    type: 'object',
    properties: {
      customerId: {
        type: 'string',
        description: 'Customer ID or email',
      },
    },
  },
} satisfies Tool;

export const listCustomers = {
  name: 'listCustomers',
  description: 'List all customers with filters',
  inputSchema: {
    type: 'object',
    properties: {
      barberId: {
        type: 'string',
        description: 'Barber ID (optional)',
      },
      locationId: {
        type: 'string',
        description: 'Location ID (optional)',
      },
    },
  },
} satisfies Tool;

export const getLoyalty = {
  name: 'getLoyalty',
  description: 'Get customer loyalty status and points',
  inputSchema: {
    type: 'object',
    properties: {
      customerId: {
        type: 'string',
        description: 'Customer ID',
      },
    },
  },
} satisfies Tool;

export const updateLoyalty = {
  name: 'updateLoyalty',
  description: 'Update loyalty points for customer',
  inputSchema: {
    type: 'object',
    properties: {
      customerId: {
        type: 'string',
        description: 'Customer ID',
      },
      points: {
        type: 'number',
        description: 'Points to add/subtract',
      },
      reason: {
        type: 'string',
        description: 'Reason for update',
      },
    },
  },
} satisfies Tool;
