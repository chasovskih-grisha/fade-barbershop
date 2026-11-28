/** Каталог інструментів, з якими копілот виходить «з коробки» (T-5019). */
import type { CopilotTool } from './copilot.types';

/** Tools shipped with the copilot; operators can extend the registry per deployment. */
export const DEFAULT_COPILOT_TOOLS: readonly CopilotTool[] = [
  {
    name: 'analytics.query',
    description: 'Read aggregated revenue, utilization and retention metrics.',
    requiredRoles: ['owner', 'manager'],
    mutating: false,
    requiresConfirmation: false,
    parameters: ['metric', 'period'],
  },
  {
    name: 'appointments.reschedule',
    description: 'Move one appointment to a new start time.',
    requiredRoles: ['owner', 'manager', 'receptionist'],
    mutating: true,
    requiresConfirmation: true,
    parameters: ['appointmentId', 'start'],
  },
  {
    name: 'inventory.lookup',
    description: 'Read stock levels for a SKU.',
    requiredRoles: ['owner', 'manager', 'receptionist', 'barber'],
    mutating: false,
    requiresConfirmation: false,
    parameters: ['sku'],
  },
  {
    name: 'clients.export',
    description: 'Export client records for the operator organisation.',
    requiredRoles: ['owner'],
    mutating: false,
    requiresConfirmation: false,
    parameters: [],
  },
];
